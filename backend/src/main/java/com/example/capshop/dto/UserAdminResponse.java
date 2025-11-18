package com.example.capshop.dto;

import java.time.LocalDateTime;

import com.example.capshop.domain.User;

import lombok.Getter;

@Getter
public class UserAdminResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private boolean admin;
    private boolean deleted;
    private LocalDateTime createdAt;
    private String oauthProvider;

    public UserAdminResponse(User u) {
        this.id = u.getId();
        this.email = u.getEmail();
        this.name = u.getName();
        this.phone = u.getPhone();
        this.admin = u.isAdmin();
        this.deleted = !u.isDeleted();
        this.createdAt = u.getCreatedAt();
        this.oauthProvider = u.getOauthProvider() != null ? u.getOauthProvider().name() : null;
    }
}
