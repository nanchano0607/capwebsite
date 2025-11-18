// AuthProvider.tsx (핵심만)
import { useEffect, useRef, useState, type ReactNode } from "react";
import api from "../lib/axios";
import { getAccessToken } from "../lib/token";
import { AuthCtx, type User } from "./context";

const API = import.meta.env.DEV ? "http://localhost:8080" : ""; // 상단에 추가

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const called = useRef(false); // ✅ StrictMode 가드

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API}/api/me`); // 전체 주소로 변경
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const refresh = async () => {
    await load();
  };

  const logout = async () => {
    try {
      console.log('[AuthProvider] logout() called');
      // 서버에 로그아웃 요청 (쿠키 삭제 및 서버 세션 제거)
      const token = getAccessToken();
      console.log('[AuthProvider] access token:', token ? 'present' : 'missing');
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      console.log('[AuthProvider] logout response status:', res.status);
      try {
        const body = await res.json().catch(() => null);
        console.log('[AuthProvider] logout response body:', body);
      } catch (e) {
        console.log('[AuthProvider] logout response body parse error', e);
      }
    } catch (e) {
      console.warn("서버 로그아웃 호출 중 오류:", e);
    } finally {
      // 클라이언트 쪽 정리: 토큰 삭제, 유저 초기화
      localStorage.removeItem("access_token");
      setUser(null);
      console.log('[AuthProvider] client cleanup: access_token removed, user set to null');
    }
  };

  useEffect(() => {
    if (called.current) return;
    called.current = true; // ✅ 개발모드 중복 호출 방지
    void load();
  }, []);

  return (
    // AuthProvider.tsx
    <AuthCtx.Provider value={{ user, loading, refresh, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
