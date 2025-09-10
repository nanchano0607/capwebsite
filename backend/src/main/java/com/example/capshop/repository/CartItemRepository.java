package com.example.capshop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.capshop.domain.Cap;
import com.example.capshop.domain.CartItem;
import com.example.capshop.domain.User;

public interface CartItemRepository extends JpaRepository<CartItem, Long>{
    List<CartItem> findByUser(User user);
    Optional<CartItem> findByUserAndCap(User user, Cap cap);
}
