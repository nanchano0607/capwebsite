package com.example.capshop.domain.order;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.capshop.domain.Status;
import com.example.capshop.domain.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "orders")
@Getter 
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderId;         // 주문번호 (예: ORD20250131-1)

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @jakarta.persistence.Column(length = 20)
    private Status status;

    // CheckOut에서 복사된 배송 정보
    private String receiverName;    // 수령인
    private String address;         // 배송지 주소
    private String phone;           // 연락처
    private String trackingNumber;  // 송장번호
    private String returnTrackingNumber;  // 반품 송장번호
    
    // 반품 관련 정보
    private String returnReason;    // 반품 사유 (DEFECT: 제품하자, CHANGE_OF_MIND: 단순변심)
    private String returnMethod;    // 반품 방법 (PICKUP: 회수요청, SELF: 직접배송)
    private Long returnShippingFee; // 반품 택배비 (고객 부담액)

    private Long total_price;

    private LocalDateTime orderDate = LocalDateTime.now();
    private LocalDateTime deliveredAt;  // 배송 완료 시각 (반품 기한 계산용)

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems = new ArrayList<>();

    public Order() {}

    public Order(User user) {
        this.user = user;
        this.status = Status.ORDERED;
        this.orderDate = LocalDateTime.now();
    }

    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }

    public void calculateTotalPrice() {
        this.total_price = orderItems.stream()
                .mapToLong(item -> item.getOrderPrice() * item.getQuantity())
                .sum();
    }

    public void cancel() {
        this.status = Status.CANCELLED;
    }

    public boolean isCancellable() {
        return this.status == Status.ORDERED;
    }

    public void deliver() {
        this.status = Status.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }

    public void requestReturn() {
        if (!isReturnable()) {
            throw new IllegalStateException("반품 가능 기간이 아닙니다.");
        }
        this.status = Status.RETURN_REQUESTED;
    }

    public boolean isReturnable() {
        if (this.status != Status.DELIVERED || this.deliveredAt == null) {
            return false;
        }
        // 배송 완료 후 7일 이내
        return LocalDateTime.now().isBefore(this.deliveredAt.plusDays(7));
    }

    public void approveReturn() {
        if (this.status != Status.RETURN_REQUESTED) {
            throw new IllegalStateException("반품 요청 상태가 아닙니다.");
        }
        this.status = Status.RETURN_SHIPPING;
    }

    public void completeReturn() {
        if (this.status != Status.RETURN_SHIPPING) {
            throw new IllegalStateException("반품 배송중 상태가 아닙니다.");
        }
        this.status = Status.RETURNED;
    }

    public void ship() {
        if (this.status != Status.ORDERED) {
            throw new IllegalStateException("상품 준비중 상태에서만 배송을 시작할 수 있습니다.");
        }
        this.status = Status.SHIPPED;
    }

    public void markAsDelivered() {
        if (this.status != Status.SHIPPED) {
            throw new IllegalStateException("배송중 상태에서만 배송 완료 처리할 수 있습니다.");
        }
        this.status = Status.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }
}
