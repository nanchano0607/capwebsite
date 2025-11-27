import { useState, useEffect } from "react";
import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

type UserInfo = {
  id: number;
  email: string | null;
  name: string;
  phone?: string | null;
  createdAt: string;
  oauthProvider?: string;
  admin: boolean;
  enabled: boolean;
  emailMarketing?: boolean;
  smsMarketing?: boolean;
};

export default function License() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    emailMarketing: false,
    smsMarketing: false,
  });

  // 스크롤바 숨기기 위한 스타일 추가
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 사용자 정보 조회
  useEffect(() => {
    if (user?.id) {
      fetchUserInfo();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/user/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
        setEditForm({
          name: data.name || "",
          phone: data.phone || "",
          emailMarketing: data.emailMarketing || false,
          smsMarketing: data.smsMarketing || false,
        });
      } else {
        showMessage("error", "사용자 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      showMessage("error", "정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 수정
  const handleUpdateUserInfo = async () => {
    if (!user?.id || !editForm.name.trim()) {
      showMessage("error", "이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/user/${user.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            name: editForm.name.trim(),
            // phone: 전화번호는 주소와 동일하게 변경 불가 처리하여 전송에서 제외
            emailMarketing: editForm.emailMarketing,
            smsMarketing: editForm.smsMarketing,
          }),
      });

      const data = await response.json();
      if (response.ok) {
        showMessage("success", data.message || "정보가 수정되었습니다.");
        setIsEditing(false);
        fetchUserInfo(); // 최신 정보 다시 가져오기
      } else {
        showMessage("error", data.error || "정보 수정에 실패했습니다.");
      }
    } catch (error) {
      showMessage("error", "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (userInfo) {
      setEditForm({
        name: userInfo.name || "",
        phone: userInfo.phone || "",
        emailMarketing: userInfo.emailMarketing || false,
        smsMarketing: userInfo.smsMarketing || false,
      });
    }
  };

  // 계정 삭제
  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    const confirmDelete = window.confirm(
      "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
    );
    
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/user/${user.id}/delete`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (response.ok) {
        showMessage("success", data.message || "계정이 탈퇴되었습니다.");
        
        // 자동 로그아웃 처리: 서버 로그아웃 호출 후 로그인 페이지로 이동
        try {
          await logout?.();
        } catch (e) {
          console.warn("Logout after delete failed:", e);
        }

        // 2초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showMessage("error", data.error || "계정 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("계정 삭제 실패:", error);
      showMessage("error", "계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* Desktop: md 이상에서 표시 */}
    <div className="hidden md:block fixed inset-0 overflow-hidden">
      {/* 📦 배경 레이어: 화면 전체를 덮는 고정 배경 (inset-0 = top:0, right:0, bottom:0, left:0) */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('${SERVER}/images/emptyload.png')`,
          zIndex: 0,
        }}
      />

      {/* 📦 메인 컨텐츠 컨테이너: 최대 너비 2xl(42rem = 672px), 중앙 정렬, 화면 중앙 배치 */}
      {/* h-full = 전체 높이, flex items-center = 세로 중앙 정렬 */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center" style={{ zIndex: 1, paddingTop: "10vh" }}>
        {/* 가장 바깥 테두리 (#000) */}
        <div
          className="relative bg-[#01132c] ml-6"
          style={{
            imageRendering: 'pixelated',
            clipPath: `polygon(
              0% 20px, 20px 20px, 20px 0%,
              calc(100% - 20px) 0%, calc(100% - 20px) 20px, 100% 20px,
              100% calc(100% - 20px), calc(100% - 20px) calc(100% - 20px), calc(100% - 20px) 100%,
              20px 100%, 20px calc(100% - 20px), 0% calc(100% - 20px)
            )`,
            padding: '20px',
            width: '80vw'

          }}
        >
          {/* 중간 테두리 (#1a5f7a) */}
          <div
            className="relative bg-[#03526a]"
            style={{
              imageRendering: 'pixelated',
              clipPath: `polygon(
                0% 18px, 18px 18px, 18px 0%,
                calc(100% - 18px) 0%, calc(100% - 18px) 18px, 100% 18px,
                100% calc(100% - 18px), calc(100% - 18px) calc(100% - 18px), calc(100% - 18px) 100%,
                18px 100%, 18px calc(100% - 18px), 0% calc(100% - 18px)
              )`,
              padding: '48px'
            }}
          >
            {/* 왼쪽 위 글씨 */}
            <div 
              className="absolute top-2 left-12 text-white font-bold text-3xl font-beaver"
              style={{ imageRendering: 'pixelated', zIndex: 10 }}
            >
              License
            </div>
            
            {/* 가장 안쪽 컨텐츠 (#F5DEB3) */}
            <div 
              className="w-full px-8 py-2 bg-[#f2d4a7] scrollbar-hide overflow-y-auto"
              style={{
                imageRendering: 'pixelated',
                clipPath: `polygon(
                  0% 16px, 16px 16px, 16px 0%,
                  calc(100% - 16px) 0%, calc(100% - 16px) 16px, 100% 16px,
                  100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%,
                  16px 100%, 16px calc(100% - 16px), 0% calc(100% - 16px)
                )`,
                height: '52vh'
              }}
            >
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 메시지 알림 */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === "success" ? "bg-green-500/90" : "bg-red-500/90"
              } text-white`}
            >
              {message.text}
            </div>
          )}

          {/* 📦 사용자 정보 컨테이너: 투명 배경(bg-transparent), 내부 패딩 24px(p-6), 고정 높이 */}
          <div className="bg-transparent p-6 rounded-lg">
            {loading ? (
              <p className="text-black text-base">정보를 불러오는 중...</p>
            ) : userInfo ? (
              /* 📦 스크롤 컨테이너: h-96(384px) 고정 높이, overflow-y-auto로 세로 스크롤, 스크롤바 숨김 */
              <div className="h-96 overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* 사용자 정보 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black">User Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* 📦 사용자 정보 아이템 리스트: space-y-4 = 각 아이템 간 세로 간격 16px */}
                <div className="space-y-4">
                {/* 이메일 (수정 불가) */}
                <div className="p-4 bg-gray-400/20 rounded-lg border border-gray-400/30 opacity-80">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <span className="text-gray-700 font-sans" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                    {userInfo.email || "이메일 없음"}
                  </span>
                </div>

                {/* 이름 */}
                <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                  <label className="block text-sm font-medium text-black mb-1">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-2 border border-white/30 rounded bg-white/20 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="이름을 입력하세요"
                    />
                  ) : (
                    <span className="text-black font-sans" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>{userInfo.name}</span>
                  )}
                </div>

                {/* 전화번호 (수정 불가) */}
                <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                  <label className="block text-sm font-medium text-black mb-1">Phone</label>
                  <span className="text-black font-sans" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                    {userInfo.phone || "등록된 전화번호가 없습니다"}
                  </span>
                </div>

                {/* 가입일 */}
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Member Since</label>
                    <span className="text-black">
                      {new Date(userInfo.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                  </div>
                </div>

                {/* 주문 내역 (클릭시 주문 페이지로 이동) */}
                <div 
                  onClick={() => navigate("/order")}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-black mb-1">Orders & Delivery</label>
                    <span className="text-black">주문 내역 및 배송 정보 보기</span>
                  </div>
                  <div className="text-black">→</div>
                </div>

                {/* 주소 관리 (클릭시 주소 페이지로 이동) */}
                <div 
                  onClick={() => navigate("/address")}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-black mb-1">Address Management</label>
                    <span className="text-black">배송 주소 관리 및 설정</span>
                  </div>
                  <div className="text-black">→</div>
                </div>

                {/* 마케팅 수신 동의 */}
                <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                  <label className="block text-sm font-medium text-black mb-3">Marketing Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isEditing ? editForm.emailMarketing : userInfo.emailMarketing}
                        onChange={(e) => isEditing && setEditForm({ ...editForm, emailMarketing: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-white/30"
                      />
                      <span className="text-black text-sm">이메일 마케팅 수신 동의</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isEditing ? editForm.smsMarketing : userInfo.smsMarketing}
                        onChange={(e) => isEditing && setEditForm({ ...editForm, smsMarketing: e.target.checked })}
                        disabled={!isEditing}
                        className="rounded border-white/30"
                      />
                      <span className="text-black text-sm">SMS 마케팅 수신 동의</span>
                    </label>
                  </div>
                </div>

                {/* 계정 탈퇴 */}
                {!isEditing && (
                  <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                    <label className="block text-sm font-medium text-black mb-3">Account Management</label>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full text-left px-3 py-2 bg-red-500/20 text-red-800 rounded hover:bg-red-500/30 transition-colors text-sm font-medium"
                    >
                      ⚠️ 계정 탈퇴
                    </button>
                  </div>
                )}

                {/* 수정 모드 버튼들 */}
                {isEditing && (
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleUpdateUserInfo}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-transparent text-black rounded-lg font-bold border-2 border-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "저장 중..." : "Save"}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <p className="text-black text-base">사용자 정보를 불러올 수 없습니다.</p>
            )}
          </div>

          {/* 뒤로 가기 버튼 */}
          <div className="text-center">
            <button
              onClick={() => navigate("/mygarage")}
              className="px-6 py-2 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
            >
              Back to My Garage
            </button>
          </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile: md 미만에서 표시되는 간단한 사용자 정보 UI */}
    <div
      className="block md:hidden min-h-screen text-white font-sans"
      style={{
        backgroundImage: `url('${SERVER}/images/emptyload.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="px-5 pb-10 space-y-3 overflow-y-auto pt-20">
        <div className="bg-black/50 rounded-xl p-4 space-y-4 mt-30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">License</h2>
          </div>

          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>{message.text}</div>
          )}

          {loading ? (
            <div className="text-white/80">로딩 중...</div>
          ) : userInfo ? (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-white/80">Email</div>
                <div className="text-white font-sans">{userInfo.email || '이메일 없음'}</div>
              </div>

              <div>
                <div className="text-sm text-white/80">Name</div>
                {isEditing ? (
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 rounded bg-white/10 text-white"
                  />
                ) : (
                  <div className="text-white">{userInfo.name}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-white/80">Phone</div>
                <div className="text-white">{userInfo.phone || '등록된 전화번호가 없습니다'}</div>
              </div>

              <div className="space-y-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="w-full h-12 rounded-md bg-white/10 text-white">Edit</button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleUpdateUserInfo} disabled={loading} className="h-12 rounded-md bg-white/10 text-white">{loading ? '저장 중...' : 'Save'}</button>
                    <button onClick={handleEditCancel} disabled={loading} className="h-12 rounded-md bg-white/20 text-black">Cancel</button>
                  </div>
                )}
              </div>

              <div>
                <button onClick={handleDeleteAccount} className="w-full h-12 rounded-md bg-red-600 text-white">계정 탈퇴</button>
              </div>
            </div>
          ) : (
            <div className="text-white">사용자 정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
