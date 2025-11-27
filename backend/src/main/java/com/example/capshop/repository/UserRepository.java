package com.example.capshop.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.capshop.domain.AuthProvider;
import com.example.capshop.domain.User;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findByOauthProviderAndProviderUserId(AuthProvider oauthProvider, String providerUserId);
}
