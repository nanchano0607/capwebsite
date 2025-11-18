package com.example.capshop.service;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.example.capshop.domain.Cap;
import com.example.capshop.domain.CartItem;
import com.example.capshop.domain.Status;
import com.example.capshop.domain.User;
import com.example.capshop.domain.order.CheckOut;
import com.example.capshop.domain.order.Order;
import com.example.capshop.domain.order.OrderItem;
import com.example.capshop.domain.order.Payment;
import com.example.capshop.dto.PointsRequest;
import com.example.capshop.repository.CartItemRepository;
import com.example.capshop.repository.OrderRepository;
import com.example.capshop.repository.PaymentRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.capshop.service.UserCouponService;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final CheckOutService checkOutService;
    private final com.example.capshop.repository.CapRepository capRepository;
    private final PaymentRepository paymentRepository;
    private final PointsService pointsService;
    private final UserCouponService userCouponService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public OrderService(OrderRepository orderRepository, 
                       CartItemRepository cartItemRepository,
                       CheckOutService checkOutService,
                       com.example.capshop.repository.CapRepository capRepository,
                       PaymentRepository paymentRepository,
                       PointsService pointsService,
                       UserCouponService userCouponService) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.checkOutService = checkOutService;
        this.capRepository = capRepository;
        this.paymentRepository = paymentRepository;
        this.pointsService = pointsService;
        this.userCouponService = userCouponService;
        
        // RestTemplate UTF-8 설정
        this.restTemplate = new RestTemplate();
        this.restTemplate.getMessageConverters()
            .add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    public Order placeOrder(User user) {
        List<CartItem> cartItems = cartItemRepository.findByUser(user);

        if (cartItems.isEmpty()) {
            throw new IllegalStateException("장바구니가 비어있습니다.");
        }

        Order order = new Order(user);

        for (CartItem cartItem : cartItems) {
            Cap cap = cartItem.getCap();
            String size = cartItem.getSize();

            // 사이즈별 재고 확인 및 차감
            Long stockBySize = cap.getStockBySize(size);
            if (stockBySize == null || stockBySize < cartItem.getQuantity()) {
                throw new IllegalStateException("재고 부족: " + cap.getName() + " (사이즈: " + size + ", 재고: " + stockBySize + ")");
            }

            // CapStock 객체를 통해 재고 차감
            com.example.capshop.domain.CapStock capStock = cap.getCapStockBySize(size);
            if (capStock != null) {
                capStock.decreaseStock(cartItem.getQuantity());
            }

            OrderItem orderItem = new OrderItem(cap, cartItem.getQuantity(), cap.getPrice(), size);
            order.addOrderItem(orderItem);
        }

        order.calculateTotalPrice();

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }
    
    public Order findById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
    }
    
    // 관리자용: 전체 주문 목록
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    // 관리자용: 상태별 주문 필터
    public List<Order> getOrdersByStatus(Status status) {
        return orderRepository.findByStatus(status);
    }

    public Order getOrderDetail(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
    }

    public void cancelOrder(Long orderId) {
        logger.info("주문 취소 시작 - orderId: {}", orderId);
        Order order = getOrderDetail(orderId);

        if (!order.isCancellable()) {
            logger.warn("취소 불가능한 주문 - orderId: {}, status: {}", orderId, order.getStatus());
            throw new IllegalStateException("취소할 수 없는 주문입니다.");
        }

        order.cancel();
        logger.info("주문 상태 CANCELLED로 변경 - orderId: {}", orderId);

        // 재고 복구
        for (OrderItem item : order.getOrderItems()) {
            Cap cap = item.getCap();
            String size = item.getSelectedSize();
            
            // 사이즈별 재고 복구
            com.example.capshop.domain.CapStock capStock = cap.getCapStockBySize(size);
            if (capStock != null) {
                Long beforeStock = capStock.getStock();
                capStock.increaseStock(item.getQuantity());
                logger.info("재고 복구 - capId: {}, size: {}, 변경 전: {}, 변경 후: {}", 
                    cap.getId(), size, beforeStock, capStock.getStock());
            } else {
                logger.warn("재고 복구 실패 - CapStock을 찾을 수 없음: capId={}, size={}", cap.getId(), size);
            }
        }

        // 결제 취소 처리
        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다."));
        
        logger.info("토스 결제 취소 요청 - paymentKey: {}", payment.getPaymentKey());
        cancelPaymentToToss(payment);
        payment.cancel();
        paymentRepository.save(payment);
        logger.info("Payment 상태 CANCELED로 변경 - paymentId: {}", payment.getId());

        orderRepository.save(order);
        logger.info("주문 취소 완료 - orderId: {}", orderId);
    }
    
    // 반품 요청
    @Transactional
    public void requestReturn(Long orderId, User user, String returnReason, String returnMethod, Long returnShippingFee) {
        Order order = getOrderDetail(orderId);
        
        // 본인 주문인지 확인
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("본인의 주문만 반품 요청할 수 있습니다.");
        }
        
        // 반품 사유 유효성 검증
        if (returnReason == null || returnReason.isBlank()) {
            throw new IllegalStateException("반품 사유를 입력해주세요.");
        }
        
        // 반품 방법 유효성 검증
        if (returnMethod == null || returnMethod.isBlank()) {
            throw new IllegalStateException("반품 방법을 선택해주세요.");
        }
        if (!"PICKUP".equals(returnMethod) && !"SELF".equals(returnMethod)) {
            throw new IllegalStateException("유효하지 않은 반품 방법입니다. (PICKUP 또는 SELF)");
        }
        
        // 반품 사유에 따라 택배비 설정
        if ("DEFECT".equals(returnReason)) {
            // 제품 하자: 택배비 0원 (전액 환불)
            order.setReturnShippingFee(0L);
        } else if ("CHANGE_OF_MIND".equals(returnReason)) {
            // 단순 변심: 택배비 차감
            if (returnShippingFee == null || returnShippingFee < 0) {
                throw new IllegalStateException("유효한 반품 택배비를 입력해주세요.");
            }
            order.setReturnShippingFee(returnShippingFee);
        } else {
            throw new IllegalStateException("유효하지 않은 반품 사유입니다.");
        }
        
        order.setReturnReason(returnReason);
        order.setReturnMethod(returnMethod);
        order.requestReturn();
        orderRepository.save(order);
    }
    
    // 반품 승인 (관리자용) - 반품 배송 시작
    @Transactional
    public void approveReturn(Long orderId, String returnTrackingNumber) {
        logger.info("반품 승인 시작 - orderId: {}, returnTracking: {}", orderId, returnTrackingNumber);
        Order order = getOrderDetail(orderId);
        
        if (returnTrackingNumber == null || returnTrackingNumber.isBlank()) {
            throw new IllegalStateException("반품 송장번호가 필요합니다.");
        }
        
        order.setReturnTrackingNumber(returnTrackingNumber.trim());
        order.approveReturn(); // RETURN_SHIPPING으로 변경
        orderRepository.save(order);
        logger.info("주문 상태 RETURN_SHIPPING으로 변경 - orderId: {}", orderId);
    }
    
    // 반품 완료 (관리자용) - 상품 도착 확인 후 환불
    @Transactional
    public void completeReturn(Long orderId) {
        logger.info("반품 완료 처리 시작 - orderId: {}", orderId);
        Order order = getOrderDetail(orderId);
        
        order.completeReturn(); // RETURNED로 변경
        logger.info("주문 상태 RETURNED로 변경 - orderId: {}", orderId);
        
        // 재고 복구
        for (OrderItem item : order.getOrderItems()) {
            Cap cap = item.getCap();
            String size = item.getSelectedSize();
            
            // 사이즈별 재고 복구
            com.example.capshop.domain.CapStock capStock = cap.getCapStockBySize(size);
            if (capStock != null) {
                Long beforeStock = capStock.getStock();
                capStock.increaseStock(item.getQuantity());
                logger.info("반품 재고 복구 - capId: {}, size: {}, 변경 전: {}, 변경 후: {}", 
                    cap.getId(), size, beforeStock, capStock.getStock());
            } else {
                logger.warn("반품 재고 복구 실패 - CapStock을 찾을 수 없음: capId={}, size={}", cap.getId(), size);
            }
        }
        
        // 환불 처리
        Payment payment = paymentRepository.findByOrder(order)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다."));
        
        // 환불 금액 계산 (결제 금액 - 반품 택배비)
        Long refundAmount = payment.getAmount();
        Long shippingFee = order.getReturnShippingFee() != null ? order.getReturnShippingFee() : 0L;
        Long actualRefundAmount = refundAmount - shippingFee;
        
        if (actualRefundAmount < 0) {
            throw new IllegalStateException("환불 금액이 유효하지 않습니다.");
        }
        
        String refundReason = "반품 완료";
        if (shippingFee > 0) {
            refundReason += " (택배비 " + shippingFee + "원 차감)";
        }
        
        logger.info("토스 환불 요청 - paymentKey: {}, 원결제금액: {}, 택배비: {}, 실환불금액: {}", 
            payment.getPaymentKey(), payment.getAmount(), shippingFee, actualRefundAmount);
        
        if (actualRefundAmount > 0) {
            refundPaymentToToss(payment, actualRefundAmount, refundReason);
            if (shippingFee > 0) {
                payment.partialRefund(); // 부분 환불
            } else {
                payment.refund(); // 전액 환불
            }
        } else {
            logger.warn("환불 금액이 0원입니다. 환불 처리를 건너뜁니다.");
        }
        
        paymentRepository.save(payment);
        logger.info("Payment 상태 변경 완료 - paymentId: {}", payment.getId());
        
        orderRepository.save(order);
        logger.info("반품 완료 처리 완료 - orderId: {}", orderId);
    }
    
    // 구매확정 (사용자용)
    @Transactional
    public void confirmPurchase(Long orderId, Long userId) {
        logger.info("구매확정 처리 시작 - orderId: {}, userId: {}", orderId, userId);
        Order order = getOrderDetail(orderId);
        
        // 본인 주문인지 확인
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 주문만 구매확정할 수 있습니다.");
        }
        
        order.confirmPurchase();
        orderRepository.save(order);
        logger.info("구매확정 완료 - orderId: {}", orderId);
    }
    
    // 배송 시작 (관리자용)
    @Transactional
    public void shipOrder(Long orderId) {
        logger.info("배송 시작 - orderId: {}", orderId);
        Order order = getOrderDetail(orderId);
        
        order.ship();
        orderRepository.save(order);
        logger.info("주문 상태 SHIPPED로 변경 - orderId: {}", orderId);
    }
    
    // 배송 완료 (관리자용)
    @Transactional
    public void deliverOrder(Long orderId) {
        logger.info("배송 완료 처리 - orderId: {}", orderId);
        Order order = getOrderDetail(orderId);
        
        order.markAsDelivered();
        orderRepository.save(order);
        logger.info("주문 상태 DELIVERED로 변경 - orderId: {}, deliveredAt: {}", 
            orderId, order.getDeliveredAt());
    }

    // 송장번호 설정 (관리자용)
    @Transactional
    public void updateTrackingNumber(Long orderId, String trackingNumber) {
        logger.info("송장번호 설정 - orderId: {}, trackingNumber: {}", orderId, trackingNumber);
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw new IllegalStateException("유효한 송장번호가 필요합니다.");
        }
        Order order = getOrderDetail(orderId);
        // 취소/반품 완료 후에는 수정 불가
        switch (order.getStatus()) {
            case CANCELLED:
            case RETURNED:
                throw new IllegalStateException("해당 주문 상태에서는 송장번호를 설정할 수 없습니다.");
            default:
                break;
        }
        order.setTrackingNumber(trackingNumber.trim());
        orderRepository.save(order);
        logger.info("송장번호 설정 완료 - orderId: {}", orderId);
    }
    
    // 토스 결제 취소 API 호출
    private void cancelPaymentToToss(Payment payment) {
        try {
            String tossSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"; // TODO: 실제 시크릿키로 교체
            String url = "https://api.tosspayments.com/v1/payments/" + payment.getPaymentKey() + "/cancel";
            
            logger.info("토스 API 호출 - URL: {}, paymentKey: {}", url, payment.getPaymentKey());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(tossSecretKey, "");
            
            String body = String.format("{\"cancelReason\":\"%s\"}", "고객 주문 취소");
            
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("토스 결제 취소 실패 - status: {}, body: {}", 
                    response.getStatusCode(), response.getBody());
                throw new RuntimeException("토스 결제 취소 실패: " + response.getBody());
            }
            
            logger.info("토스 결제 취소 성공 - paymentKey: {}, response: {}", 
                payment.getPaymentKey(), response.getBody());
        } catch (Exception e) {
            logger.error("결제 취소 처리 중 오류 발생 - paymentKey: {}, error: {}", 
                payment.getPaymentKey(), e.getMessage(), e);
            throw new RuntimeException("결제 취소 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    // 토스 환불 API 호출
    private void refundPaymentToToss(Payment payment, Long refundAmount, String refundReason) {
        try {
            String tossSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"; // TODO: 실제 시크릿키로 교체
            String url = "https://api.tosspayments.com/v1/payments/" + payment.getPaymentKey() + "/cancel";
            
            logger.info("토스 환불 API 호출 - URL: {}, paymentKey: {}, amount: {}", 
                url, payment.getPaymentKey(), refundAmount);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(tossSecretKey, "");
            
            String body = String.format(
                "{\"cancelReason\":\"%s\",\"cancelAmount\":%d}",
                refundReason, refundAmount
            );
            
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("토스 환불 실패 - status: {}, body: {}", 
                    response.getStatusCode(), response.getBody());
                throw new RuntimeException("토스 환불 실패: " + response.getBody());
            }
            
            logger.info("토스 환불 성공 - paymentKey: {}, amount: {}, response: {}", 
                payment.getPaymentKey(), refundAmount, response.getBody());
        } catch (Exception e) {
            logger.error("환불 처리 중 오류 발생 - paymentKey: {}, error: {}", 
                payment.getPaymentKey(), e.getMessage(), e);
            throw new RuntimeException("환불 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public Order confirmPaymentAndCreateOrder(User user, String paymentKey, String orderId, Long amount) {
    try {
        // 1. 토스에 결제 최종 승인 요청
        String tossSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"; // TODO: 실제 시크릿키로 교체
        String url = "https://api.tosspayments.com/v1/payments/confirm";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(tossSecretKey, "");
        
        String body = String.format(
            "{\"paymentKey\":\"%s\",\"orderId\":\"%s\",\"amount\":%d}",
            paymentKey, orderId, amount
        );
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("토스 결제 승인 실패: " + response.getBody());
        }
        
        // 토스 응답 파싱
        JsonNode tossResponse = objectMapper.readTree(response.getBody());
        String tossStatus = tossResponse.get("status").asText(); // 토스 결제 상태
        String paymentMethod = tossResponse.has("method") ? tossResponse.get("method").asText() : "CARD";
        
        // 토스 결제 상태 검증
        if (!"DONE".equals(tossStatus)) {
            throw new RuntimeException("토스 결제가 완료되지 않았습니다. 상태: " + tossStatus);
        }
        
        // 2. CheckOut에서 orderId로 조회
        CheckOut checkOut = checkOutService.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("체크아웃 정보를 찾을 수 없습니다: " + orderId));
        
        // 3. CheckOut의 itemsJson 파싱하여 Order + OrderItem 생성
        JsonNode itemsNode = objectMapper.readTree(checkOut.getItemsJson());
        Order order = new Order(user);
        order.setStatus(Status.ORDERED);
        
        // CheckOut의 주문번호 및 배송 정보를 Order로 복사
        order.setOrderId(checkOut.getOrderId());
        order.setReceiverName(checkOut.getName());
        order.setAddress(checkOut.getAddress());
        order.setPhone(checkOut.getPhone());
        
        for (JsonNode item : itemsNode) {
            Long capId = item.get("capId").asLong();
            int quantity = item.get("quantity").asInt();
            String size = item.has("size") ? item.get("size").asText() : null;
            
            Cap cap = capRepository.findById(capId)
                    .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + capId));

            // ===== 재고 확인 및 차감 (사이즈별 기준) =====
            if (size != null && !size.isBlank()) {
                // 사이즈별 재고 체크
                Long stockBySize = cap.getStockBySize(size);
                if (stockBySize == null || stockBySize < quantity) {
                    throw new IllegalStateException("재고 부족: " + cap.getName() +
                            " (사이즈: " + size + ", 재고: " + stockBySize + ")");
                }

                com.example.capshop.domain.CapStock capStock = cap.getCapStockBySize(size);
                if (capStock == null) {
                    throw new IllegalStateException(
                            "CapStock 정보를 찾을 수 없습니다. capId=" + capId + ", size=" + size);
                }
                capStock.decreaseStock(quantity);

                // (선택) 총 재고 필드도 같이 관리한다면
                if (cap.getStock() != null) {
                    cap.setStock(cap.getStock() - quantity);
                }
            } else {
                // 사이즈가 없는 상품(ONE SIZE 등)이라면 기존 전체 재고 사용
                if (cap.getStock() == null || cap.getStock() < quantity) {
                    throw new IllegalStateException("재고 부족: " + cap.getName());
                }
                cap.setStock(cap.getStock() - quantity);
            }
            // ==========================================
            
            // OrderItem 생성 (가격 스냅샷 + 사이즈)
            OrderItem orderItem = new OrderItem(cap, quantity, cap.getPrice(), size);
            order.addOrderItem(orderItem);
        }
        
        order.calculateTotalPrice();
        
        // 4. 금액 검증 (토스 승인 금액 == 계산된 주문 금액)
        if (!order.getTotal_price().equals(amount)) {
            throw new RuntimeException("결제 금액 불일치");
        }
        
        // 5. Order 저장
        Order savedOrder = orderRepository.save(order);
        
        // 6. Payment 생성 및 저장
        Payment payment = new Payment(savedOrder, paymentKey, paymentMethod, amount);
        payment.approve(); // 결제 승인 완료 상태로 변경
        paymentRepository.save(payment);
        
        // 7. CheckOut 삭제
        checkOutService.deleteById(checkOut.getId());
        
        return savedOrder;
        
    } catch (Exception e) {
        throw new RuntimeException("결제 처리 중 오류 발생: " + e.getMessage(), e);
    }
}

    // 할인 정보를 포함한 결제 승인 + 주문 생성
    @Transactional
    public Order confirmPaymentAndCreateOrderWithDiscount(
        User user, String paymentKey, String orderId, Long amount, Map<String, Object> discountInfo) {
    try {
        // 1. 토스에 결제 최종 승인 요청
        String tossSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"; // TODO: 실제 시크릿키로 교체
        String url = "https://api.tosspayments.com/v1/payments/confirm";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(tossSecretKey, "");
        
        String body = String.format(
            "{\"paymentKey\":\"%s\",\"orderId\":\"%s\",\"amount\":%d}",
            paymentKey, orderId, amount
        );
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("토스 결제 승인 실패: " + response.getBody());
        }
        
        // 토스 응답 파싱
        JsonNode tossResponse = objectMapper.readTree(response.getBody());
        String tossStatus = tossResponse.get("status").asText();
        String paymentMethod = tossResponse.has("method") ? tossResponse.get("method").asText() : "CARD";
        
        // 토스 결제 상태 검증
        if (!"DONE".equals(tossStatus)) {
            throw new RuntimeException("토스 결제가 완료되지 않았습니다. 상태: " + tossStatus);
        }
        
        // 2. CheckOut에서 orderId로 조회
        CheckOut checkOut = checkOutService.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("체크아웃 정보를 찾을 수 없습니다: " + orderId));
        
        // 3. 할인 정보 파싱
        Long originalAmount = 0L;
        Long finalAmount = amount; // 결제된 최종 금액
        Long couponDiscount = 0L;
        Long pointsUsed = 0L;
        
        if (discountInfo != null) {
            if (discountInfo.get("originalAmount") != null) {
                originalAmount = ((Number) discountInfo.get("originalAmount")).longValue();
            }
            if (discountInfo.get("couponDiscount") != null) {
                couponDiscount = ((Number) discountInfo.get("couponDiscount")).longValue();
            }
            if (discountInfo.get("pointsUsed") != null) {
                pointsUsed = ((Number) discountInfo.get("pointsUsed")).longValue();
            }
            if (discountInfo.get("finalAmount") != null) {
                Long discountFinalAmount = ((Number) discountInfo.get("finalAmount")).longValue();
                // 최종 금액 검증
                if (!discountFinalAmount.equals(amount)) {
                    throw new RuntimeException("할인 정보와 결제 금액 불일치: 할인정보=" + discountFinalAmount + ", 결제금액=" + amount);
                }
            }
        }
        
        // 4. CheckOut의 itemsJson 파싱하여 Order + OrderItem 생성
        JsonNode itemsNode = objectMapper.readTree(checkOut.getItemsJson());
        Order order = new Order(user);
        order.setStatus(Status.ORDERED);
        
        // CheckOut의 주문번호 및 배송 정보를 Order로 복사
        order.setOrderId(checkOut.getOrderId());
        order.setReceiverName(checkOut.getName());
        order.setAddress(checkOut.getAddress());
        order.setPhone(checkOut.getPhone());
        
        // 원가 계산으로 할인 적용 전 금액 검증
        Long calculatedOriginalAmount = 0L;
        
        for (JsonNode item : itemsNode) {
            Long capId = item.get("capId").asLong();
            int quantity = item.get("quantity").asInt();
            String size = item.has("size") ? item.get("size").asText() : null;
            
            Cap cap = capRepository.findById(capId)
                    .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + capId));
            
            // ===== 재고 확인 및 차감 (사이즈별 기준) =====
            if (size != null && !size.isBlank()) {
                Long stockBySize = cap.getStockBySize(size);
                if (stockBySize == null || stockBySize < quantity) {
                    throw new IllegalStateException("재고 부족: " + cap.getName() +
                            " (사이즈: " + size + ", 재고: " + stockBySize + ")");
                }

                com.example.capshop.domain.CapStock capStock = cap.getCapStockBySize(size);
                if (capStock == null) {
                    throw new IllegalStateException(
                            "CapStock 정보를 찾을 수 없습니다. capId=" + capId + ", size=" + size);
                }
                capStock.decreaseStock(quantity);

                if (cap.getStock() != null) {
                    cap.setStock(cap.getStock() - quantity);
                }
            } else {
                if (cap.getStock() == null || cap.getStock() < quantity) {
                    throw new IllegalStateException("재고 부족: " + cap.getName());
                }
                cap.setStock(cap.getStock() - quantity);
            }
            // ==========================================

            // OrderItem 생성 (가격 스냅샷 + 사이즈)
            OrderItem orderItem = new OrderItem(cap, quantity, cap.getPrice(), size);
            order.addOrderItem(orderItem);
            
            calculatedOriginalAmount += cap.getPrice() * quantity;
        }
        
        // 주문의 total_price를 계산해서 UserCouponService가 할인을 정확히 계산할 수 있게 함
        order.calculateTotalPrice();

        // 할인 정보에 userCouponId가 전달되면 서버 측에서 안전하게 쿠폰 사용 처리
        if (discountInfo != null && discountInfo.get("userCouponId") != null) {
            try {
                Number idNum = (Number) discountInfo.get("userCouponId");
                Long userCouponId = idNum.longValue();
                Long usedDiscount = userCouponService.markCouponUsedOnSuccess(user.getId(), userCouponId, order);
                couponDiscount = usedDiscount != null ? usedDiscount : 0L;
            } catch (ClassCastException cce) {
                throw new RuntimeException("userCouponId 형식이 올바르지 않습니다.", cce);
            }
        }

        // 5. 할인 적용 전 금액 검증 (선택적)
        if (originalAmount > 0 && !calculatedOriginalAmount.equals(originalAmount)) {
            throw new RuntimeException("원가 계산 불일치: 계산된금액=" + calculatedOriginalAmount + ", 전달받은금액=" + originalAmount);
        }
        
        // 6. Order에 할인 정보 저장
        Long baseAmount = originalAmount > 0 ? originalAmount : calculatedOriginalAmount;
        Long totalDiscount = couponDiscount + pointsUsed;
        
        order.setOriginal_price(baseAmount);        // 할인 전 원가
        order.setCoupon_discount(couponDiscount);   // 쿠폰 할인액
        order.setPoints_discount(pointsUsed);       // 포인트 할인액  
        order.setTotal_discount(totalDiscount);     // 총 할인액
        order.setFinal_price(finalAmount);          // 최종 결제액
        order.setTotal_price(finalAmount);          // 기존 호환성 유지
        
        // 7. Order 저장
        Order savedOrder = orderRepository.save(order);
        
        // 8. Payment 생성 및 저장
        Payment payment = new Payment(savedOrder, paymentKey, paymentMethod, finalAmount);
        payment.approve();
        paymentRepository.save(payment);
        
        // 9. 할인 적용 처리 (포인트 차감)
        if (pointsUsed > 0) {
            PointsRequest pointsRequest = new PointsRequest();
            pointsRequest.setUserId(user.getId());
            pointsRequest.setAmount(pointsUsed);
            pointsRequest.setReason("주문 결제");
            pointsService.usePoints(pointsRequest);
        }
        
        // 10. 적립금 지급 (할인 전 원래 가격 기준으로)
        Long pointsBase = originalAmount > 0 ? originalAmount : calculatedOriginalAmount;
        pointsService.addOrderPoints(user.getId(), pointsBase);
        
        // 11. CheckOut 삭제
        checkOutService.deleteById(checkOut.getId());
        cartItemRepository.deleteByUser(user);
        return savedOrder;
        
    } catch (Exception e) {
        throw new RuntimeException("결제 처리 중 오류 발생: " + e.getMessage(), e);
    }
    }
}
