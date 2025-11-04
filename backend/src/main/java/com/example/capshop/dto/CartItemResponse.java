package com.example.capshop.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CartItemResponse {
    private Long id;
    private int quantity;
    private Long capId;
    private String capName;
    private Long price;
    private String mainImageUrl;
    private String size;  // 선택된 사이즈 추가

    public CartItemResponse(Long id, int quantity, Long capId, String capName, Long price, String mainImageUrl, String size) {
        this.id = id;
        this.quantity = quantity;
        this.capId = capId;
        this.capName = capName;
        this.price = price;
        this.mainImageUrl = mainImageUrl;
        this.size = size;
    }
    
    // 기존 생성자 유지 (하위 호환성)
    public CartItemResponse(Long id, int quantity, Long capId, String capName, Long price, String mainImageUrl) {
        this(id, quantity, capId, capName, price, mainImageUrl, null);
    }
}
