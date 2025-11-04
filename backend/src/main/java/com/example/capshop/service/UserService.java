package com.example.capshop.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.capshop.domain.AuthProvider;
import com.example.capshop.domain.User;
import com.example.capshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // 주입 추가
    
    public User save(User user){
        return userRepository.save(user);
    }
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // 관리자 권한 토글 (승격/해제)
    public boolean toggleAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setAdmin(!user.isAdmin());
        userRepository.save(user);
        return user.isAdmin();
    }

    public User findOrCreateUser(String email, String name, String provider, String providerUserId) {
    return userRepository.findByEmail(email)
            .map(user -> {
                // 이미 있으면 이름/공급자 정보 업데이트
                user.setName(name);
                user.setOauthProvider(AuthProvider.valueOf(provider.toUpperCase()));
                user.setProviderUserId(providerUserId);
                return user;
            })
            .orElseGet(() -> userRepository.save(User.builder()
                    .email(email)
                    .name(name)
                    .oauthProvider(AuthProvider.valueOf(provider.toUpperCase())) // 변환
                    .providerUserId(providerUserId)
                    .build()));

}

    // 로컬 회원가입
    public User createLocalUser(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        
        String encodedPassword = passwordEncoder.encode(password);
        
        return userRepository.save(User.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .oauthProvider(AuthProvider.LOCAL)
                .providerUserId(null)
                .build());
    }

    // 로컬 로그인 인증
    public Optional<User> authenticateLocalUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getOauthProvider() == AuthProvider.LOCAL) {
            if (passwordEncoder.matches(password, user.get().getPassword())) {
                return user;
            }
        }
        return Optional.empty();
    }
    
    // 주소 목록 조회
    public List<String> getAddresses(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        return user.getAddress() != null ? user.getAddress() : List.of();
    }
    
    // 주소 추가
    public void addAddress(Long userId, String address) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        if (user.getAddress() == null) {
            user.setAddress(new java.util.ArrayList<>());
        }
        
        if (!user.getAddress().contains(address)) {
            user.getAddress().add(address);
            userRepository.save(user);
        }
    }
    
    // 주소 삭제
    public void removeAddress(Long userId, String address) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        if (user.getAddress() != null) {
            user.getAddress().remove(address);
            userRepository.save(user);
        }
    }
    
    // 사용자 정보 수정
    public void updateUserProfile(Long userId, String name, String phone, Boolean emailMarketing, Boolean smsMarketing) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        
        user.setPhone(phone != null && !phone.isBlank() ? phone.trim() : null);
        
        // 마케팅 동의는 현재 User 엔티티에 필드가 없으므로 일단 무시
        // 필요시 User 엔티티에 emailMarketing, smsMarketing 필드 추가 후 구현
        
        userRepository.save(user);
    }
    
    // 계정 탈퇴 (소프트 삭제)
    public void deleteUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        user.setDeleted(true);
        userRepository.save(user);
    }
}
