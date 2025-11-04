import { useAuth } from "../../auth/useAuth";
import { clearAccessToken } from "../../lib/token";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

export default function AccountPage() {
  const { setUser} = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearAccessToken(); // 토큰 삭제
    setUser(null);      // user 상태 즉시 null로
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 배경 이미지 - fixed로 고정 */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('${SERVER}/images/accountBackground.png')`,
          zIndex: 0,
        }}
      />

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
            padding: '20px'
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
              className="absolute top-2 left-12 text-white font-bold text-3xl"
              style={{ fontFamily: "'Bangers', cursive", imageRendering: 'pixelated', zIndex: 10 }}
            >
              My Garage
            </div>
            
            {/* 가장 안쪽 컨텐츠 (#F5DEB3) */}
            <div 
              className="w-full px-26 py-16 bg-[#f2d4a7]"
              style={{
                imageRendering: 'pixelated',
                clipPath: `polygon(
                  0% 16px, 16px 16px, 16px 0%,
                  calc(100% - 16px) 0%, calc(100% - 16px) 16px, 100% 16px,
                  100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%,
                  16px 100%, 16px calc(100% - 16px), 0% calc(100% - 16px)
                )`
              }}
            >
        {/* 6가지 기능 그리드 */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          {/* Order */}
          <div 
            onClick={() => navigate("/order")}
            className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>Order</h2>
            <p className="text-sm text-gray-700">주문목록을 확인합니다.</p>
          </div>

          {/* LICENSE */}
          <div 
          onClick={() => navigate("/license")}
          className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>LICENSE</h2>
            <p className="text-sm text-gray-700">회원 개인정보를 관리합니다.</p>
          </div>

          {/* Address */}
          <div 
            onClick={() => navigate("/address")}
            className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>Address</h2>
            <p className="text-sm text-gray-700">배송지를 등록하거나 변경합니다.</p>
          </div>

          {/* Coupon & mileage */}
          <div className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>Coupon & mileage</h2>
            <p className="text-sm text-gray-700">보유중인 쿠폰과 적립금을 확인합니다.</p>
          </div>

          {/* Board */}
          <div className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>Board</h2>
            <p className="text-sm text-gray-700">작성한 게시물을 확인합니다.</p>
          </div>

          {/* ENGINE OFF */}
          <div
            onClick={handleLogout}
            className="bg-transparent p-6 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive" }}>ENGINE OFF</h2>
            <p className="text-sm text-gray-700">회원상태를 로그아웃 합니다.</p>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}