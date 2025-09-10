package com.example.capshop.domain;
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

    public OrderItem() {}

    public OrderItem(Cap cap, int quantity, Long orderPrice) {
        this.cap = cap;
        this.quantity = quantity;
        this.orderPrice = orderPrice;
    }

    public Long getSubTotal() {
        return orderPrice * quantity;
    }
}
