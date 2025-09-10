package com.example.capshop.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.capshop.domain.Cap;
import com.example.capshop.domain.CartItem;
import com.example.capshop.domain.User;
import com.example.capshop.repository.CartItemRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CartItemService {
    private final CartItemRepository cartItemRepository;

    public CartItem addToCart(User user, Cap cap, int quantity) {
        Optional<CartItem> existingItem = cartItemRepository.findByUserAndCap(user, cap);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(user, cap, quantity);
            return cartItemRepository.save(newItem);
        }
    }

    public void deleteCartItem(User user, Cap cap) {
        Optional<CartItem> existingItem = cartItemRepository.findByUserAndCap(user, cap);
        
        if (existingItem.isPresent()) {
            cartItemRepository.delete(existingItem.get());
            System.out.println("장바구니에서 삭제 완료: " + cap.getName());
        } else {
            throw new IllegalArgumentException("장바구니에 해당 상품이 없습니다.");
        }
    }
    @Transactional
    public int increaseQuantity(User user, Cap cap) {
        // 장바구니에서 해당 유저 + 모자 찾기
        CartItem item = cartItemRepository.findByUserAndCap(user, cap)
                .orElseGet(() -> {
                    CartItem ci = new CartItem();
                    ci.setUser(user);
                    ci.setCap(cap);
                    ci.setQuantity(0);
                    return ci;
                });

        int next = item.getQuantity() + 1;

        // (선택) 재고 체크
        if (cap.getStock() != null && next > cap.getStock()) {
            throw new IllegalStateException("재고를 초과했습니다.");
        }

        item.setQuantity(next);
        cartItemRepository.save(item);
        return next;
    }

    @Transactional
    public int decreaseQuantity(User user, Cap cap) {
        CartItem item = cartItemRepository.findByUserAndCap(user, cap)
                .orElseThrow(() -> new IllegalArgumentException("장바구니에 해당 상품이 없습니다."));

        int current = item.getQuantity();
        if (current > 1) {
            item.setQuantity(current - 1);
            cartItemRepository.save(item);
            return item.getQuantity();
        } else {
            // current == 1 → 라인 아이템 제거
            cartItemRepository.delete(item);
            return 0; // 프런트에서 0이면 라인 제거
        }
    }


    public List<CartItem> allCartItem(User user){
        List<CartItem> cartItem = cartItemRepository.findByUser(user);
        return cartItem;
    }
    
}
