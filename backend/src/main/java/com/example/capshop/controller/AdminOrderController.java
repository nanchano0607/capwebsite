package com.example.capshop.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.domain.Status;
import com.example.capshop.domain.order.Order;
import com.example.capshop.dto.OrderResponse;
import com.example.capshop.service.OrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    // 전체 주문 목록 조회
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
        @RequestParam(name = "status", required = false) String status) {
        
        List<Order> orders;
        
        if (status != null && !status.isEmpty()) {
            // 상태별 필터 (잘못된 값 방지)
            try {
                Status orderStatus = Status.valueOf(status.toUpperCase());
                orders = orderService.getOrdersByStatus(orderStatus);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        } else {
            // 전체 조회
            orders = orderService.getAllOrders();
        }
        
        List<OrderResponse> response = orders.stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    // 배송 시작
    @PostMapping("/{orderId}/ship")
    public ResponseEntity<Map<String, String>> shipOrder(@PathVariable("orderId") Long orderId) {
        try {
            orderService.shipOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "배송이 시작되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 배송 완료
    @PostMapping("/{orderId}/deliver")
    public ResponseEntity<Map<String, String>> deliverOrder(@PathVariable("orderId") Long orderId) {
        try {
            orderService.deliverOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "배송이 완료되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 반품 승인 - 반품 배송 시작 (수거 송장 등록)
    @PostMapping("/{orderId}/approve-return")
    public ResponseEntity<Map<String, String>> approveReturn(
        @PathVariable("orderId") Long orderId,
        @RequestParam(name = "returnTrackingNumber") String returnTrackingNumber) {
        try {
            orderService.approveReturn(orderId, returnTrackingNumber);
            return ResponseEntity.ok(Map.of("message", "반품이 승인되었습니다. 반품 배송이 시작됩니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 반품 완료 - 상품 도착 확인 후 환불
    @PostMapping("/{orderId}/complete-return")
    public ResponseEntity<Map<String, String>> completeReturn(@PathVariable("orderId") Long orderId) {
        try {
            orderService.completeReturn(orderId);
            return ResponseEntity.ok(Map.of("message", "반품이 완료되었습니다. 환불 처리되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 송장번호 설정
    @PostMapping("/{orderId}/tracking")
    public ResponseEntity<Map<String, String>> setTrackingNumber(
        @PathVariable("orderId") Long orderId,
        @RequestParam(name = "trackingNumber") String trackingNumber) {
        try {
            orderService.updateTrackingNumber(orderId, trackingNumber);
            return ResponseEntity.ok(Map.of("message", "송장번호가 설정되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
