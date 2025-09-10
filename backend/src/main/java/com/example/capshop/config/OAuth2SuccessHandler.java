package com.example.capshop.config;
import com.example.capshop.domain.RefreshToken;
import com.example.capshop.domain.User;
import com.example.capshop.dto.UserProfile;
import com.example.capshop.repository.OAuth2AuthorizationRequestBasedOnCookieRepository;
import com.example.capshop.repository.RefreshTokenRepository;
import com.example.capshop.service.UserService;
import com.example.capshop.util.CookieUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import java.io.IOException;
import java.time.Duration;


@RequiredArgsConstructor
//@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    public static final Duration REFRESH_TOKEN_DURATION = Duration.ofDays(14);
    // 깨끗한 성공 페이지(토큰 없이)
    public static final String REDIRECT_PATH = "http://localhost:5173/login/success";

    // 로컬 개발용
    private static final boolean SECURE = false;   // 운영(HTTPS)에서는 true
    private static final String  SAME_SITE = "Lax"; // 운영(HTTPS)에서는 "None"

    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuth2AuthorizationRequestBasedOnCookieRepository authorizationRequestRepository;
    private final UserService userService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        UserProfile profile = new UserProfile(oAuth2User.getAttributes());
        User user = userService.findOrCreateUser(profile.getEmail(), profile.getName());

        // 1) RT 발급 + DB 저장
        String refreshToken = tokenProvider.generateToken(user, REFRESH_TOKEN_DURATION);
        saveRefreshToken(user.getId(), refreshToken);

        // 2) RT를 HttpOnly 쿠키로 심기
        int maxAge = (int) REFRESH_TOKEN_DURATION.toSeconds();
        CookieUtil.deleteCookie(response, REFRESH_TOKEN_COOKIE_NAME, SECURE, SAME_SITE);
        CookieUtil.addCookie(response, REFRESH_TOKEN_COOKIE_NAME, refreshToken, maxAge, SECURE, SAME_SITE);

        // 3) OAuth2 임시 쿠키 정리
        clearAuthenticationAttributes(request, response);

        // 4) 토큰을 URL에 싣지 않고, 깨끗한 성공 페이지로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, REDIRECT_PATH);
    }

    private void saveRefreshToken(Long userId, String newRefreshToken) {
        RefreshToken rt = refreshTokenRepository.findByUserId(userId)
                .map(entity -> entity.update(newRefreshToken))
                .orElse(new RefreshToken(userId, newRefreshToken));
        refreshTokenRepository.save(rt);
    }

    private void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}