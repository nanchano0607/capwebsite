// AuthProvider.tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
import api from "../lib/axios";
import { getAccessToken, clearAccessToken } from "../lib/token"; // 🔹 clearAccessToken 추가
import { AuthCtx, type User } from "./context";

const API = import.meta.env.DEV ? "http://localhost:8080" : "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const called = useRef(false); // StrictMode 가드

  const load = async () => {
    setLoading(true);
    try {
      const access = getAccessToken();
      const wasLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      // 🔹 토큰도 없고, 로그인한 적도 없는 완전 게스트면 그냥 비로그인으로 처리
      if (!access && !wasLoggedIn) {
        setUser(null);
        return;
      }

      // 🔹 여기서 /api/me 호출
      //  - access 토큰이 유효하면 그냥 성공
      //  - access 토큰이 만료돼서 401 나면, axios 응답 인터셉터가 /api/token 호출해서 재발급 후 재시도
      const res = await api.get(`${API}/api/me`);
      setUser(res.data);
    } catch (err) {
      // /api/me 실패(리프레시 실패 포함) 시 완전 로그아웃 처리
      clearAccessToken();
      localStorage.removeItem("isLoggedIn");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 여기 추가: context에서 넘겨줄 refresh 함수
  const refresh = async () => {
    await load();
  };

  const logout = async () => {
    try {
      console.log("[AuthProvider] logout() called");
      const token = getAccessToken();
      console.log("[AuthProvider] access token:", token ? "present" : "missing");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      console.log("[AuthProvider] logout response status:", res.status);
      try {
        const body = await res.json().catch(() => null);
        console.log("[AuthProvider] logout response body:", body);
      } catch (e) {
        console.log("[AuthProvider] logout response body parse error", e);
      }
    } catch (e) {
      console.warn("서버 로그아웃 호출 중 오류:", e);
    } finally {
      // 클라이언트 쪽 정리: 토큰 삭제, 유저 초기화
      clearAccessToken();
      localStorage.removeItem("isLoggedIn");
      setUser(null);
      console.log(
        "[AuthProvider] client cleanup: access_token removed, user set to null"
      );
    }
  };

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    void load();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, refresh, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
