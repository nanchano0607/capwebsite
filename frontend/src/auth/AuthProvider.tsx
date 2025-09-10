// AuthProvider.tsx (핵심만)
import { useEffect, useRef, useState, type ReactNode } from "react";
import api from "../lib/axios";
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

  useEffect(() => {
    if (called.current) return;
    called.current = true; // ✅ 개발모드 중복 호출 방지
    void load();
  }, []);

  return (
    // AuthProvider.tsx
    <AuthCtx.Provider value={{ user, loading, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
