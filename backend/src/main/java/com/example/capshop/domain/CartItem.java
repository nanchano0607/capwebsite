package com.example.capshop.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // User 엔티티 참조

    @ManyToOne
    @JoinColumn(name = "cap_id")
    private Cap cap;    // Cap 엔티티 참조

    private int quantity;

    public CartItem() {
    }

    public CartItem(User user, Cap cap, int quantity) {
        this.user = user;
        this.cap = cap;
        this.quantity = quantity;
    }
}
