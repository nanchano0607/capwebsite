package com.example.capshop.dto;

import java.util.Map;


public class UserProfile {
    private final Long id;
    private final String email;
    private final String name;

    public UserProfile(Map<String, Object> attributes) {
        this.id = attributes.get("id") == null ? null : ((Number) attributes.get("id")).longValue();
        this.email = (String) attributes.get("email");
        this.name = (String) attributes.get("name");
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
}

