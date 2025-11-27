import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
  const [idChecked, setIdChecked] = useState(false);
  const [idAvailable, setIdAvailable] = useState(false);
  const [idCheckLoading, setIdCheckLoading] = useState(false);

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

  const validateEmail = (e: string) => {
    if (!e) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  };

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
        // store current signup data in sessionStorage and navigate to phone verification
      // backend expects an `email` field, so save the entered email under `email`
        const draft = {
            email: email,
            password,
            name,
            agreements,
          };
      sessionStorage.setItem("signupDraft", JSON.stringify(draft));
      // navigate to phone verification step (SignupPhone)
      navigate(`/complete-signup`);
    } catch (err: any) {
      setError("다음 단계로 이동 중 오류가 발생했습니다.");
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
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIdChecked(false);
                setIdAvailable(false);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@domain.com"
              required
            />
            <button
              type="button"
              onClick={async () => {
                setError("");
                const raw = email || "";
                const candidate = raw.trim().toLowerCase();
                if (!candidate) {
                  setError("이메일을 입력하세요.");
                  return;
                }
                if (!validateEmail(candidate)) {
                  setError("유효한 이메일 주소를 입력하세요.");
                  return;
                }
                setIdCheckLoading(true);
                try {
                  const res = await fetch(`${API}/user/id/overlap`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: candidate }),
                  });
                  // API may return boolean or an object; handle both
                  const body = await res.json().catch(() => null);
                  if (!res.ok) {
                    // try to extract message
                    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
                    throw new Error(msg);
                  }
                  let exists = false;
                  if (typeof body === "boolean") exists = body;
                  else if (body && typeof body === "object") {
                    if (typeof body.exists === "boolean") exists = body.exists;
                    else if (typeof body.value === "boolean") exists = body.value;
                    else {
                      // fallback: if response has a truthy length or count, treat as exists
                      exists = !!(body.count || body.length);
                    }
                  }
                  setIdAvailable(!exists);
                  setIdChecked(true);
                  if (exists) setError("이미 사용 중인 이메일입니다.");
                } catch (err: any) {
                  setError(err?.message || "이메일 확인 중 오류가 발생했습니다.");
                } finally {
                  setIdCheckLoading(false);
                }
              }}
              className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
              disabled={idCheckLoading}
            >
              {idCheckLoading ? "확인중..." : "중복확인"}
            </button>
          </div>
          <div className={`text-sm mt-1 ${idAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {!validateEmail(email) ? (
              '유효한 이메일 주소를 입력하세요.'
            ) : idChecked ? (
              idAvailable ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
            ) : (
              ''
            )}
          </div>
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

        {error && !/이메일|유효한 이메일|이미 사용 중인 이메일|이메일을 입력하세요/i.test(error) && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isRequiredAgreed || !idChecked || !idAvailable}
          className="w-full h-11 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? "넘어가는 중..." : "다음"}
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