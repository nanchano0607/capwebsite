import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import axios from "axios";
import { setAccessToken } from "../lib/token";

export default function LoginPage({ success }: { success?: boolean }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect") || "/";
  const navigate = useNavigate();
  const { refresh, user, loading } = useAuth();

  // access 토큰 교환 및 유저 정보 갱신
  useEffect(() => {
    if (!success) return;
    (async () => {
      try {
        const { data } = await axios.post("/api/token", {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        await refresh();
      } catch (e) {
        console.error(e);
      }
      // navigate는 user가 갱신된 후에 실행
    })();
  }, [success, refresh]);

  // user가 갱신되면 리다이렉트
  useEffect(() => {
      console.log("user정보", user);
    if (success && user && !loading) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, success, navigate, redirect]);

  const API = import.meta.env.DEV ? "http://localhost:8080" : "";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <div className="space-y-3">
        <a
          href={`${API}/oauth2/authorization/kakao`}
          className="block h-11 rounded-md bg-[#FEE500] text-black font-medium flex items-center justify-center"
        >
          Continue with Kakao
        </a>
        <a
          href={`${API}/oauth2/authorization/naver`}
          className="block h-11 rounded-md bg-[#03C75A] text-white font-medium flex items-center justify-center"
        >
          Continue with Naver
        </a>
        <a
          href={`${API}/oauth2/authorization/google`}
          className="block h-11 rounded-md bg-slate-900 text-white font-medium flex items-center justify-center"
        >
          Continue with Google
        </a>
      </div>
    </div>
  );
}