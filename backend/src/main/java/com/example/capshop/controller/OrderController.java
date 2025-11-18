package com.example.capshop.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.domain.User;
import com.example.capshop.domain.order.Order;
import com.example.capshop.dto.OrderResponse;
import com.example.capshop.service.OrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    // 결제 승인 + 주문 생성 (토스 결제 성공 후 호출)
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request) {
        try {
            String paymentKey = (String) request.get("paymentKey");
            String orderId = (String) request.get("orderId");
            String amountStr = (String) request.get("amount");
            
            if (paymentKey == null || orderId == null || amountStr == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "필수 파라미터가 누락되었습니다."));
            }
            
            Long amount = Long.parseLong(amountStr);
            
            // 할인 정보 추출 (프론트에서 계산된 값 그대로 사용)
            @SuppressWarnings("unchecked")
            Map<String, Object> discountInfo = (Map<String, Object>) request.get("discountInfo");
            
            // 서버에서 토스에 최종 승인 요청 + Order 생성 (할인 정보 포함)
            Order order = orderService.confirmPaymentAndCreateOrderWithDiscount(user, paymentKey, orderId, amount, discountInfo);
            
            return ResponseEntity.ok(Map.of(
                "orderId", order.getId(),
                "status", order.getStatus(),
                "totalPrice", order.getTotal_price(),
                "message", "결제가 완료되었습니다."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 주문 생성 (장바구니 → 주문)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@AuthenticationPrincipal User user) {
        try {
            Order order = orderService.placeOrder(user);
            return ResponseEntity.ok(Map.of(
                "orderId", order.getId(),
                "totalPrice", order.getTotal_price(),
                "status", order.getStatus(),
                "message", "주문이 생성되었습니다."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 내 주문 목록 조회
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal User user) {
        List<Order> orders = orderService.getOrdersByUser(user);
        List<OrderResponse> response = orders.stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // 주문 상세 조회
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(@PathVariable("orderId") Long orderId) {
        try {
            Order order = orderService.getOrderDetail(orderId);
            return ResponseEntity.ok(new OrderResponse(order));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 주문 취소
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, String>> cancelOrder(@PathVariable("orderId") Long orderId) {
        try {
            orderService.cancelOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "주문이 취소되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 반품 요청
    @PostMapping("/{orderId}/return")
    public ResponseEntity<Map<String, String>> requestReturn(
            @PathVariable("orderId") Long orderId,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request) {
        System.out.println("=== 반품 요청 시작 - orderId: " + orderId + ", user: " + (user != null ? user.getId() : "null"));
        try {
            if (user == null) {
                System.out.println("=== 에러: 인증된 사용자가 없습니다");
                return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
            }
            
            String returnReason = (String) request.get("returnReason");
            String returnMethod = (String) request.get("returnMethod");
            Object shippingFeeObj = request.get("returnShippingFee");
            Long returnShippingFee = shippingFeeObj != null ? 
                (shippingFeeObj instanceof Integer ? ((Integer) shippingFeeObj).longValue() : (Long) shippingFeeObj) : 0L;
            
            orderService.requestReturn(orderId, user, returnReason, returnMethod, returnShippingFee);
            System.out.println("=== 반품 요청 성공");
            return ResponseEntity.ok(Map.of("message", "반품이 요청되었습니다."));
        } catch (IllegalStateException e) {
            System.out.println("=== 반품 요청 실패 (IllegalState): " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            System.out.println("=== 반품 요청 실패 (Runtime): " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
    
    // 구매확정 (사용자용)
    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<Map<String, String>> confirmPurchase(
            @PathVariable("orderId") Long orderId,
            @AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
            }
            
            orderService.confirmPurchase(orderId, user.getId());
            return ResponseEntity.ok(Map.of("message", "구매가 확정되었습니다."));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
