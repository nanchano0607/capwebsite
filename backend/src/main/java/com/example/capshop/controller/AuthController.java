package com.example.capshop.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.config.OAuth2SuccessHandler;
import com.example.capshop.config.TokenProvider;
import com.example.capshop.domain.RefreshToken;
import com.example.capshop.domain.User;
import com.example.capshop.repository.RefreshTokenRepository;
import com.example.capshop.service.SocialSignupTokenService;
import com.example.capshop.service.UserService;
import com.example.capshop.util.CookieUtil;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SocialSignupTokenService socialSignupTokenService;
    private final UserService userService;
    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @PostMapping("/complete-signup")
    public ResponseEntity<?> completeSignup(
            @RequestBody Map<String, Object> req,
            HttpServletResponse response
    ) {
        try {
            String token = (String) req.get("token");
            String phone = req.get("phone") != null ? (String) req.get("phone") : null;

            // 1) 기본 검증
            if (token == null || token.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "token is required"));
            }
            if (phone == null || phone.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "phone is required"));
            }

            // 2) 소셜 가입용 토큰 파싱
            Claims claims = socialSignupTokenService.parseToken(token);
            String provider = claims.get("provider", String.class);
            String providerUserId = claims.get("providerUserId", String.class);
            String email = claims.get("email", String.class);
            String name = claims.get("name", String.class);

            // 3) 전화번호 중복 여부 체크
            if (userService.existsByPhone(phone)) {
                // 이미 이 번호로 가입된 계정 있음
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "이미 가입된 전화번호입니다."));
            }

            // 4) 유저 생성 (소셜 전용 가입)
            User user = userService.createSocialUser(email, name, provider, providerUserId, phone);

            // 5) RT 발급 + 저장
            String refreshToken = tokenProvider.generateToken(user, OAuth2SuccessHandler.REFRESH_TOKEN_DURATION);
            RefreshToken rt = refreshTokenRepository.findByUserId(user.getId())
                    .map(entity -> entity.update(refreshToken))
                    .orElse(new RefreshToken(user.getId(), refreshToken));
            refreshTokenRepository.save(rt);

            // 6) RT 쿠키 심기
            int maxAge = (int) OAuth2SuccessHandler.REFRESH_TOKEN_DURATION.toSeconds();
            CookieUtil.deleteCookie(response, OAuth2SuccessHandler.REFRESH_TOKEN_COOKIE_NAME, false, "Lax");
            CookieUtil.addCookie(response, OAuth2SuccessHandler.REFRESH_TOKEN_COOKIE_NAME, refreshToken, maxAge, false, "Lax");

            return ResponseEntity.ok(Map.of(
                    "message", "signup_complete",
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
