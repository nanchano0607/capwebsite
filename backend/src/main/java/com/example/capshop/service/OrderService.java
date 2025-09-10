package com.example.capshop.service;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.capshop.domain.Cap;
import com.example.capshop.domain.CartItem;
import com.example.capshop.domain.Order;
import com.example.capshop.domain.OrderItem;
import com.example.capshop.domain.User;
import com.example.capshop.repository.CartItemRepository;
import com.example.capshop.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;

    public Order placeOrder(User user) {
        List<CartItem> cartItems = cartItemRepository.findByUser(user);

        if (cartItems.isEmpty()) {
            throw new IllegalStateException("장바구니가 비어있습니다.");
        }

        Order order = new Order(user);

        for (CartItem cartItem : cartItems) {
            Cap cap = cartItem.getCap();

            if (cap.getStock() < cartItem.getQuantity()) {
                throw new IllegalStateException("재고 부족: " + cap.getName());
            }

            cap.setStock(cap.getStock() - cartItem.getQuantity());

            OrderItem orderItem = new OrderItem(cap, cartItem.getQuantity(), cap.getPrice());
            order.addOrderItem(orderItem);
        }

        order.calculateTotalPrice();

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }

    public Order getOrderDetail(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
    }

    public void cancelOrder(Long orderId) {
        Order order = getOrderDetail(orderId);

        if (!order.isCancellable()) {
            throw new IllegalStateException("취소할 수 없는 주문입니다.");
        }

        order.cancel();

        for (OrderItem item : order.getOrderItems()) {
            Cap cap = item.getCap();
            cap.setStock(cap.getStock() + item.getQuantity());
        }

        orderRepository.save(order);
    }
}
