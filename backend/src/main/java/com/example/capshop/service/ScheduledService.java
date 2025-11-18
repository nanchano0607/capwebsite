package com.example.capshop.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.capshop.domain.order.CheckOut;
import com.example.capshop.domain.Status;
import com.example.capshop.domain.order.Order;
import com.example.capshop.repository.CheckOutRepository;
import com.example.capshop.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledService {
    
    private final OrderRepository orderRepository;
    private final CheckOutRepository checkOutRepository;
    private final UserCouponService userCouponService;
    
    /**
     * 자동 구매확정 처리
     * 배송 완료 후 7일이 지난 주문들을 자동으로 구매확정 처리
     * 매일 새벽 3시에 실행
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void autoConfirmPurchase() {
        log.info("=== 자동 구매확정 작업 시작 ===");
        
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        
        // 배송 완료 후 7일이 지난, 아직 구매확정되지 않은 주문들 조회
        List<Order> ordersToConfirm = orderRepository.findByStatusAndDeliveredAtBeforeAndConfirmedFalse(
            Status.DELIVERED, sevenDaysAgo);
        
        int confirmedCount = 0;
        for (Order order : ordersToConfirm) {
            try {
                order.confirmPurchase();
                orderRepository.save(order);
                confirmedCount++;
                log.info("자동 구매확정 처리: 주문번호={}, 사용자={}", 
                        order.getOrderId(), order.getUser().getName());
            } catch (Exception e) {
                log.error("자동 구매확정 처리 실패: 주문번호={}, 오류={}", 
                         order.getOrderId(), e.getMessage());
            }
        }
        
        log.info("=== 자동 구매확정 작업 완료: {}건 처리 ===", confirmedCount);
    }
    
    /**
     * 오래된 Checkout 데이터 자동 삭제
     * 생성 후 24시간이 지난 Checkout 데이터들을 삭제
     * 매일 새벽 2시에 실행
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldCheckouts() {
        log.info("=== Checkout 정리 작업 시작 ===");
        
        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
        
        // 24시간 전에 생성된 Checkout 데이터들 조회
        List<CheckOut> oldCheckouts = checkOutRepository.findByCreatedAtBefore(oneDayAgo);
        
        if (!oldCheckouts.isEmpty()) {
            checkOutRepository.deleteAll(oldCheckouts);
            log.info("=== Checkout 정리 작업 완료: {}건 삭제 ===", oldCheckouts.size());
        } else {
            log.info("=== Checkout 정리 작업 완료: 삭제할 데이터 없음 ===");
        }
    }
    
    /**
     * 만료된 쿠폰 자동 EXPIRED 처리
     * 1분마다 실행 (테스트용)
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoExpireCoupons() {
        log.info("=== 만료된 쿠폰 자동 EXPIRED 작업 시작 ===");
        int expiredCount = userCouponService.expireOldCoupons();
        log.info("만료 처리된 쿠폰 개수: {}", expiredCount);
    }
}