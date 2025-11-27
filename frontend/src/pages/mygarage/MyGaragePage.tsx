import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

export default function AccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (e) {
      console.warn("Logout failed:", e);
    } finally {
      navigate("/login");
    }
  };

  return (
    <>
      {/* ================= PC (md 이상) 버전: 기존 디자인 유지 ================= */}
      <div className="hidden md:block fixed inset-0 overflow-hidden">
        {/* 배경 이미지 - fixed로 고정 */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${SERVER}/images/emptyload.png')`,
            zIndex: 0,
          }}
        />

        <div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center"
          style={{ zIndex: 1, paddingTop: "10vh" }}
        >
          <div
            className="relative bg-[#01132c] ml-6"
            style={{
              imageRendering: "pixelated",
              clipPath: `polygon(
                0% 20px, 20px 20px, 20px 0%,
                calc(100% - 20px) 0%, calc(100% - 20px) 20px, 100% 20px,
                100% calc(100% - 20px), calc(100% - 20px) calc(100% - 20px), calc(100% - 20px) 100%,
                20px 100%, 20px calc(100% - 20px), 0% calc(100% - 20px)
              )`,
              padding: "20px",
              width: "80vw",
            }}
          >
            {/* 중간 테두리 */}
            <div
              className="relative bg-[#03526a]"
              style={{
                imageRendering: "pixelated",
                clipPath: `polygon(
                  0% 18px, 18px 18px, 18px 0%,
                  calc(100% - 18px) 0%, calc(100% - 18px) 18px, 100% 18px,
                  100% calc(100% - 18px), calc(100% - 18px) calc(100% - 18px), calc(100% - 18px) 100%,
                  18px 100%, 18px calc(100% - 18px), 0% calc(100% - 18px)
                )`,
                padding: "48px",
              }}
            >
              {/* 왼쪽 위 글씨 */}
              <div
                className="absolute top-2 left-12 text-white font-bold text-3xl font-beaver"
                style={{ imageRendering: "pixelated", zIndex: 10 }}
              >
                My Garage
              </div>

              {/* 가장 안쪽 컨텐츠 */}
              <div
                className="w-full px-26 py-10 bg-[#f2d4a7]"
                style={{
                  imageRendering: "pixelated",
                  clipPath: `polygon(
                    0% 16px, 16px 16px, 16px 0%,
                    calc(100% - 16px) 0%, calc(100% - 16px) 16px, 100% 16px,
                    100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%,
                    16px 100%, 16px calc(100% - 16px), 0% calc(100% - 16px)
                  )`,
                  height: "52vh",
                }}
              >
                {/* 6가지 기능 그리드 */}
                <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                  {/* Order */}
                  <div
                    onClick={() => navigate("/order")}
                    className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      Order
                    </h2>
                    <p className="text-sm text-gray-700">
                      주문목록을 확인합니다.
                    </p>
                  </div>

                  {/* LICENSE */}
                  <div
                    onClick={() => navigate("/license")}
                    className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      LICENSE
                    </h2>
                    <p className="text-sm text-gray-700">
                      회원 개인정보를 관리합니다.
                    </p>
                  </div>

                  {/* Address */}
                  <div
                    onClick={() => navigate("/address")}
                    className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      Address
                    </h2>
                    <p className="text-sm text-gray-700">
                      배송지를 등록하거나 변경합니다.
                    </p>
                  </div>

                  {/* Coupon & mileage */}
                  <div
                    onClick={() => navigate("/points")}
                    className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      Coupon & mileage
                    </h2>
                    <p className="text-sm text-gray-700">
                      보유중인 쿠폰과 적립금을 확인합니다.
                    </p>
                  </div>

                  {/* Board */}
                  <div className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      Board
                    </h2>
                    <p className="text-sm text-gray-700">
                      작성한 게시물을 확인합니다.
                    </p>
                  </div>

                  {/* ENGINE OFF */}
                  <div
                    onClick={handleLogout}
                    className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <h2 className="text-2xl font-bold mb-2 font-beaver">
                      ENGINE OFF
                    </h2>
                    <p className="text-sm text-gray-700">
                      회원상태를 로그아웃 합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 모바일 (md 미만) 버전: 테두리 제거 + 스크롤 리스트 ================= */}
      <div
          className="block md:hidden min-h-screen text-white"
          style={{
            backgroundImage: `url('${SERVER}/images/emptyload.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >

        {/* 내용: 스크롤 가능한 리스트 */}
        <div className="px-5 pb-10 space-y-3 overflow-y-auto">
          <div className="space-y-3 mt-30 bg-black/50 rounded-xl">
            {/* Order */}
              <button
                onClick={() => navigate("/order")}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">Order</span>
                  <span className="text-xs uppercase tracking-widest">
                    VIEW
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  주문목록을 확인합니다.
                </p>
              </button>

            {/* LICENSE */}
              <button
                onClick={() => navigate("/license")}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">LICENSE</span>
                  <span className="text-xs uppercase tracking-widest">
                    EDIT
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  회원 개인정보를 관리합니다.
                </p>
              </button>

            {/* Address */}
              <button
                onClick={() => navigate("/address")}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">Address</span>
                  <span className="text-xs uppercase tracking-widest">
                    CHANGE
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  배송지를 등록하거나 변경합니다.
                </p>
              </button>

            {/* Coupon & mileage */}
              <button
                onClick={() => navigate("/points")}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">Coupon & mileage</span>
                  <span className="text-xs uppercase tracking-widest">
                    CHECK
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  보유중인 쿠폰과 적립금을 확인합니다.
                </p>
              </button>

            {/* Board */}
              <button
                onClick={() => navigate("/board")}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">Board</span>
                  <span className="text-xs uppercase tracking-widest">
                    POSTS
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  작성한 게시물을 확인합니다.
                </p>
              </button>

            {/* ENGINE OFF */}
              <button
                onClick={handleLogout}
                className="w-full text-left bg-transparent text-white rounded-xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-beaver">ENGINE OFF</span>
                  <span className="text-xs uppercase tracking-widest">
                    LOGOUT
                  </span>
                </div>
                <p className="mt-1 text-xs text-white">
                  현재 계정에서 로그아웃합니다.
                </p>
              </button>
              </div>
        </div>
      </div>
    </>
  );
}
