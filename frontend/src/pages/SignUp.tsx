import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.DEV ? "http://localhost:8080" : "";

export default function SignUp() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect") || "/";
  const navigate = useNavigate();

  // 회원가입 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 동의 항목 상태
  const [agreements, setAgreements] = useState({
    TERMS: false,
    PRIVACY: false,
    OVER14: false,
    MARKETING_EMAIL: false,
    MARKETING_SMS: false,
  });

  // 전체 동의 처리
  const handleAllAgree = (checked: boolean) => {
    setAgreements({
      TERMS: checked,
      PRIVACY: checked,
      OVER14: checked,
      MARKETING_EMAIL: checked,
      MARKETING_SMS: checked,
    });
  };

  // 개별 동의 처리
  const handleAgreementChange = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 필수 동의 확인
  const isRequiredAgreed =
    agreements.TERMS && agreements.PRIVACY && agreements.OVER14;

  // 회원가입 처리
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 필수 동의 확인
    if (!isRequiredAgreed) {
      setError("필수 동의 항목을 모두 체크해주세요.");
      return;
    }

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API}/auth/signup`, {
        email,
        password,
        name,
        agreements, // 동의 정보도 함께 전송
      });

      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-400">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-2xl font-semibold mb-2">회원가입</h1>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이름을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
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
            placeholder="최소 6자 이상"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>

        {/* 동의 항목 */}
        <div className="border-t pt-4 mt-6">
          <h3 className="text-sm font-medium mb-3">약관 동의</h3>

          {/* 전체 동의 */}
          <div className="mb-3 pb-3 border-b">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Object.values(agreements).every(Boolean)}
                onChange={(e) => handleAllAgree(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">전체 동의</span>
            </label>
          </div>

          {/* 필수 동의 */}
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-600 font-medium">[필수 동의]</p>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.TERMS}
                onChange={() => handleAgreementChange("TERMS")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">이용약관 동의</span>
              <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.PRIVACY}
                onChange={() => handleAgreementChange("PRIVACY")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">개인정보 수집·이용 동의</span>
              <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.OVER14}
                onChange={() => handleAgreementChange("OVER14")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">만 14세 이상</span>
              <span className="text-red-500">*</span>
            </label>
          </div>

          {/* 선택 동의 */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">[선택 동의]</p>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.MARKETING_EMAIL}
                onChange={() => handleAgreementChange("MARKETING_EMAIL")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">마케팅 이메일 수신 동의</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.MARKETING_SMS}
                onChange={() => handleAgreementChange("MARKETING_SMS")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">마케팅 SMS 수신 동의</span>
            </label>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading || !isRequiredAgreed}
          className="w-full h-11 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            로그인
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}