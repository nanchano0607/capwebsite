import { useAuth } from "../auth/useAuth";
import { clearAccessToken } from "../lib/token";
import { useNavigate } from "react-router-dom";

export default function AccountPage() {
  const { user, setUser, refresh } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearAccessToken(); // 토큰 삭제
    setUser(null);      // user 상태 즉시 null로
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">My Account</h1>
      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="mb-4">
            <p className="text-sm text-slate-500">Name</p>
            <p className="text-lg font-medium text-slate-800">{user.name || "No name provided"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="text-lg font-medium text-slate-800">{user.email || "No email provided"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div>Loading user information...</div>
      )}
    </div>
  );
}