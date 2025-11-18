import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import axios from "axios";
import { setAccessToken } from "../lib/token";

const API = import.meta.env.DEV ? "http://localhost:8080" : "";
const SERVER = "http://localhost:8080";

export default function LoginPage({ success }: { success?: boolean }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect") || "/";
  const navigate = useNavigate();
  const { refresh, user, loading, setUser } = useAuth();

  // 로컬 로그인 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // OAuth access 토큰 교환 및 유저 정보 갱신
  useEffect(() => {
    if (!success) return;
    (async () => {
      try {
        const { data } = await axios.post(`${API}/api/token`, {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        await refresh();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [success, refresh]);

  // user가 갱신되면 리다이렉트 (OAuth 성공 시에만)
  useEffect(() => {
    console.log("user정보", user);
    if (success && user && !loading) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, success, navigate, redirect]);

  // 이미 로그인된 사용자는 리다이렉트 (일반 접근 시)
  useEffect(() => {
    if (!success && user && !loading) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, success, navigate, redirect]);

  // 로컬 로그인 처리
  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        
        // 백엔드에서 사용자 정보도 함께 받아서 직접 설정
        if (response.data.user) {
          setUser(response.data.user);
        }
        
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-[#FFFFF0] w-full relative">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 w-full h-screen bg-cover bg-center"
        style={{
          backgroundImage: `url('${SERVER}/images/emptyload.png')`,
          zIndex: 0,
        }}
      />
      
      {/* 콘텐츠 영역 */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4"
        style={{ zIndex: 5 }}
      >
        {/* 가장 바깥 테두리 (#000) */}
        <div
          className="relative bg-[#000] mt-12"
          style={{
            imageRendering: 'pixelated',
            clipPath: `polygon(
              0% 20px, 20px 20px, 20px 0%,
              calc(100% - 20px) 0%, calc(100% - 20px) 20px, 100% 20px,
              100% calc(100% - 20px), calc(100% - 20px) calc(100% - 20px), calc(100% - 20px) 100%,
              20px 100%, 20px calc(100% - 20px), 0% calc(100% - 20px)
            )`,
            padding: '12px'
          }}
        >
          {/* 중간 테두리 (#1a5f7a) */}
          <div
            className="relative bg-[#1a5f7a]"
            style={{
              imageRendering: 'pixelated',
              clipPath: `polygon(
                0% 18px, 18px 18px, 18px 0%,
                calc(100% - 18px) 0%, calc(100% - 18px) 18px, 100% 18px,
                100% calc(100% - 18px), calc(100% - 18px) calc(100% - 18px), calc(100% - 18px) 100%,
                18px 100%, 18px calc(100% - 18px), 0% calc(100% - 18px)
              )`,
              padding: '24px'
            }}
          >
            {/* 가장 안쪽 컨텐츠 (#F5DEB3) */}
            <div 
              className="w-full px-8 py-6 bg-[#F5DEB3]"
              style={{
                minWidth: '400px',
                imageRendering: 'pixelated',
                clipPath: `polygon(
                  0% 16px, 16px 16px, 16px 0%,
                  calc(100% - 16px) 0%, calc(100% - 16px) 16px, 100% 16px,
                  100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%,
                  16px 100%, 16px calc(100% - 16px), 0% calc(100% - 16px)
                )`
              }}
            >
          <h1 className="text-2xl font-semibold mb-8" style={{ imageRendering: 'pixelated' }}>Sign in</h1>
          
          {/* 로컬 로그인 폼 */}
          <form onSubmit={handleLocalLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="아이디를 입력하세요"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500">또는</span>
            </div>
          </div>

          {/* OAuth 로그인 */}
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

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link 
                to={`/signup?redirect=${encodeURIComponent(redirect)}`}
                replace={true}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                회원가입
              </Link>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 레이아웃 높이 확보 */}
      <div style={{ height: "100vh" }} />
    </section>
  );
}