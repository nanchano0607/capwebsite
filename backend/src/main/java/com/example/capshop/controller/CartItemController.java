package com.example.capshop.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.domain.Cap;
import com.example.capshop.domain.CartItem;
import com.example.capshop.domain.User;
import com.example.capshop.dto.AddCartItemRequest;
import com.example.capshop.service.CapService;
import com.example.capshop.service.CartItemService;
import com.example.capshop.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cart")
public class CartItemController {
    private final UserService userService;
    private final CapService capService;
    private final CartItemService cartItemService;
    @PostMapping("/save")
    public void cartIn(@RequestBody AddCartItemRequest request){
        
        User user = userService.findById(request.getUserId());
        Cap cap = capService.findById(request.getCapId());
        int quantity = request.getQuantity();
        cartItemService.addToCart(user, cap, quantity);
    }
    @PostMapping("/increase")
    public ResponseEntity<Integer> increase(@RequestBody AddCartItemRequest request) {
        User user = userService.findById(request.getUserId());
        Cap  cap  = capService.findById(request.getCapId());
        int qty   = cartItemService.increaseQuantity(user, cap);
        return ResponseEntity.ok(qty);
    }

    // - 버튼: quantity 만큼 감소 (0 이하되면 삭제하고 0 반환)
    @PostMapping("/decrease")
    public ResponseEntity<Integer> decrease(@RequestBody AddCartItemRequest request) {
        User user = userService.findById(request.getUserId());
        Cap  cap  = capService.findById(request.getCapId());
        int qty   = cartItemService.decreaseQuantity(user, cap);
        return ResponseEntity.ok(qty);
    }

    // 휴지통: 해당 아이템 전체 삭제 (quantity는 무시)
    @PostMapping("/delete")
    public ResponseEntity<Void> delete(@RequestBody AddCartItemRequest request) {
        User user = userService.findById(request.getUserId());
        Cap  cap  = capService.findById(request.getCapId());
        cartItemService.deleteCartItem(user, cap);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/findAll")
    public List<CartItem> findAllCartItem(@RequestParam("userId") Long userId) {
        User user = userService.findById(userId);
        return cartItemService.allCartItem(user);
    }

    
}
