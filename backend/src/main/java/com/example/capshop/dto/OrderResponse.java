package com.example.capshop.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.example.capshop.domain.order.Order;

import lombok.Getter;

@Getter
public class OrderResponse {
    private Long id;
    private String orderId;         // 주문번호 (예: ORD20250131-1)
    private String status;
    private String receiverName;
    private String address;
    private String phone;
    private Long totalPrice;
    private LocalDateTime orderDate;
    private String trackingNumber;
    private String returnTrackingNumber;
    private String returnReason;
    private String returnMethod;
    private Long returnShippingFee;
    private List<OrderItemDto> orderItems;

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.orderId = order.getOrderId();
        this.status = order.getStatus().name();
        this.receiverName = order.getReceiverName();
        this.address = order.getAddress();
        this.phone = order.getPhone();
        this.totalPrice = order.getTotal_price();
        this.orderDate = order.getOrderDate();
        this.trackingNumber = order.getTrackingNumber();
        this.returnTrackingNumber = order.getReturnTrackingNumber();
        this.returnReason = order.getReturnReason();
        this.returnMethod = order.getReturnMethod();
        this.returnShippingFee = order.getReturnShippingFee();
        this.orderItems = order.getOrderItems().stream()
                .map(OrderItemDto::new)
                .collect(Collectors.toList());
    }

    @Getter
    public static class OrderItemDto {
        private Long id;
        private Long capId;
        private String capName;
        private int quantity;
        private Long orderPrice;
        private Long subTotal;
        private String selectedSize;

        public OrderItemDto(com.example.capshop.domain.order.OrderItem item) {
            this.id = item.getId();
            this.capId = item.getCap().getId();
            this.capName = item.getCap().getName();
            this.quantity = item.getQuantity();
            this.orderPrice = item.getOrderPrice();
            this.subTotal = item.getSubTotal();
            this.selectedSize = item.getSelectedSize();
        }
    }
}
