package com.example.capshop.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.capshop.domain.AuthProvider;
import com.example.capshop.domain.User;
import com.example.capshop.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserCouponService userCouponService;

    public User save(User user){
        User savedUser = userRepository.save(user);
        // new user saved; welcome coupon issuance attempted
        userCouponService.issueWelcomeCouponToNewUser(savedUser.getId());
        return savedUser;
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

    // 프로바이더 + providerUserId로 연결된 유저 조회 (소셜 연동 확인용)
    public User findByProviderAndProviderUserId(String provider, String providerUserId) {
        try {
            AuthProvider authProvider = AuthProvider.valueOf(provider.toUpperCase());
            return userRepository.findByOauthProviderAndProviderUserId(authProvider, providerUserId).orElse(null);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // 소셜 가입 완료 시 실제 User 생성 로직 (추가 필드 포함 가능)
    @Transactional
    public User createSocialUser(String email, String name, String provider, String providerUserId, String phone) {
        AuthProvider authProvider = AuthProvider.valueOf(provider.toUpperCase());

        // 이미 provider+id로 연결된 사용자가 있는지 확인
        if (userRepository.findByOauthProviderAndProviderUserId(authProvider, providerUserId).isPresent()) {
            throw new IllegalArgumentException("이미 해당 소셜 계정으로 가입된 사용자입니다.");
        }

        // 이메일이 이미 존재하면(로컬 계정 등) 분기 처리: 여기서는 에러로 처리하거나 병합하도록 요구
        if (email != null && userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("동일 이메일로 이미 가입된 계정이 존재합니다. 먼저 로그인 후 소셜 계정을 연결하세요.");
        }

        User newUser = User.builder()
                .email(email)
                .name(name)
                .phone(phone)
                .oauthProvider(authProvider)
                .providerUserId(providerUserId)
                .build();

        User savedUser = userRepository.save(newUser);

        // 웰컴 쿠폰 지급
        try {
            userCouponService.issueWelcomeCouponToNewUser(savedUser.getId());
        } catch (Exception ignore) {}

        return savedUser;
    }
    public boolean existsByPhone(String phone) {
    return userRepository.existsByPhone(phone);
}

    // 관리자 권한 토글 (승격/해제)
    public boolean toggleAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setAdmin(!user.isAdmin());
        userRepository.save(user);
        return user.isAdmin();
    }

    // 사용자 상태 토글 (활성화/비활성화)
    public boolean toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setDeleted(!user.isDeleted());
        userRepository.save(user);
        return user.isDeleted();
    }

   
    @Transactional
    public User findOrCreateUser(String email, String name, String provider, String providerUserId) {
        AuthProvider authProvider = AuthProvider.valueOf(provider.toUpperCase());
        return userRepository.findByEmail(email)
                .map(user -> {
                    // existing social user found; updating info
                    // 이미 존재하는 유저 → 정보만 업데이트
                    user.setName(name);
                    user.setOauthProvider(authProvider);
                    user.setProviderUserId(providerUserId);
                    return user; // 영속 상태라 save() 안 해도 flush 시점에 반영됨
                })
                .orElseGet(() -> {
                    // ✅ 여기서 "새로 가입" → 웰컴 쿠폰 지급 대상으로 삼기
                    // creating new social user
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .oauthProvider(authProvider)
                            .providerUserId(providerUserId)
                            .build();

                    User savedUser = userRepository.save(newUser);

                    // ✅ 소셜 로그인 가입자도 웰컴 쿠폰 지급
                    try {
                        // attempt to issue welcome coupon to social user
                        userCouponService.issueWelcomeCouponToNewUser(savedUser.getId());
                    } catch (Exception e) {
                        // 이미 쿠폰 있음 / 장애 등은 로그인 막지 않게만 처리
                        // welcome coupon issuance failed (suppressed)
                    }

                    return savedUser;
                });
    }

    // 로컬 회원가입 (전화번호 포함)
    public User createLocalUser(String email, String password, String name, String phone) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        if (phone != null && !phone.isBlank() && userRepository.existsByPhone(phone.trim())) {
            throw new IllegalArgumentException("이미 사용 중인 전화번호입니다.");
        }

        String encodedPassword = passwordEncoder.encode(password);
        User newUser = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .phone(phone != null && !phone.isBlank() ? phone.trim() : null)
                .oauthProvider(AuthProvider.LOCAL)
                .providerUserId(null)
                .build();
        User savedUser = userRepository.save(newUser);
        // local user created; issue welcome coupon
        userCouponService.issueWelcomeCouponToNewUser(savedUser.getId());
        return savedUser;
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
