package com.example.capshop.domain.order;
import com.example.capshop.domain.Cap;

import jakarta.persistence.Entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private Cap cap;

    private int quantity;

    private Long orderPrice;
    
    private String selectedSize; // 주문 당시 선택한 사이즈 (예: "M", "FREE")

    public OrderItem() {}

    public OrderItem(Cap cap, int quantity, Long orderPrice) {
        this.cap = cap;
        this.quantity = quantity;
        this.orderPrice = orderPrice;
    }
    
    public OrderItem(Cap cap, int quantity, Long orderPrice, String selectedSize) {
        this.cap = cap;
        this.quantity = quantity;
        this.orderPrice = orderPrice;
        this.selectedSize = selectedSize;
    }

    public Long getSubTotal() {
        return orderPrice * quantity;
    }
}
