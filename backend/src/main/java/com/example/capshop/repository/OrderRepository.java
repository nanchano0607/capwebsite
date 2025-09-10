package com.example.capshop.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.capshop.domain.Order;
import com.example.capshop.domain.User;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}

