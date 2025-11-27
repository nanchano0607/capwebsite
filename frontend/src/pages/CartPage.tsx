import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/useAuth";
import { CartContext } from "../auth/CartContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

type CartItem = {
  id: number;
  quantity: number;
  capId: number;
  capName: string;
  price: number;
  mainImageUrl: string;
  size: string;
};

export default function CartPage() {
  const { user } = useAuth();
  const { refreshCartCount } = useContext(CartContext);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const displayBg = `${API}/images/emptyload.png`;

  // 장바구니 목록 불러오기
  const fetchCart = () => {
    if (!user?.id) return;
    setLoading(true);
    axios
      .get(`${API}/cart/findAll?userId=${user.id}`)
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line
  }, [user]);

  // 수량 증가
  const handleIncrease = (capId: number, size: string) => {
    axios
      .post(`${API}/cart/increase`, {
        userId: user?.id,
        capId,
        size,
      })
      .then(() => {
        fetchCart();
        refreshCartCount();
      });
  };

  // 수량 감소
  const handleDecrease = (capId: number, size: string) => {
    axios
      .post(`${API}/cart/decrease`, {
        userId: user?.id,
        capId,
        size,
      })
      .then(() => {
        fetchCart();
        refreshCartCount();
      });
  };

  // 아이템 삭제
  const handleDelete = (capId: number, size: string) => {
    axios
      .post(`${API}/cart/delete`, {
        userId: user?.id,
        capId,
        size,
      })
      .then(() => fetchCart());
  };

  // 총 가격과 총 개수 계산
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-black/60 text-white px-6 py-4 rounded-xl">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =================== Desktop (md 이상) =================== */}
      <div className="hidden md:block min-h-screen relative">
        {/* 배경 이미지 (fixed) */}
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url('${displayBg}')`, zIndex: 0 }}
        />

        {/* 컨테이너는 화면 중앙에 고정 느낌으로 */}
        <main
          className="relative flex justify-center items-center px-4 py-24"
          style={{ zIndex: 1 }}
        >
          <div
            className="relative bg-[#01132c] ml-0"
            style={{
              imageRendering: "pixelated",
              clipPath: `polygon(
                0% 20px, 20px 20px, 20px 0%,
                calc(100% - 20px) 0%, calc(100% - 20px) 20px, 100% 20px,
                100% calc(100% - 20px), calc(100% - 20px) calc(100% - 20px), calc(100% - 20px) 100%,
                20px 100%, 20px calc(100% - 20px), 0% calc(100% - 20px)
              )`,
              padding: "20px",
              width: "min(1000px, 95vw)",
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
                padding: "32px",
              }}
            >
              {/* 왼쪽 위 글씨 */}
              <div
                className="absolute top-2 left-12 text-white font-bold text-3xl font-beaver"
                style={{ imageRendering: "pixelated", zIndex: 10 }}
              >
                Your Cart
              </div>

              {/* 가장 안쪽 컨텐츠: 고정 높이 + 내부 스크롤 */}
              <div
                className="w-full px-6 py-6 bg-[#f2d4a7] mt-2"
                style={{
                  imageRendering: "pixelated",
                  clipPath: `polygon(
                    0% 16px, 16px 16px, 16px 0%,
                    calc(100% - 16px) 0%, calc(100% - 16px) 16px, 100% 16px,
                    100% calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 100%,
                    16px 100%, 16px calc(100% - 16px), 0% calc(100% - 16px)
                  )`,
                  height: "60vh",
                  maxHeight: "70vh",
                }}
              >
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                  {/* 상단: 내용 영역 (스크롤) */}
                  <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                      <p>Loading...</p>
                    ) : items.length === 0 ? (
                      <p>Your cart is empty.</p>
                    ) : (
                      <ul>
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="mb-4 border-b pb-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={item.mainImageUrl}
                                alt={item.capName}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                              <div>
                                <strong>{item.capName}</strong>
                                <div className="text-sm text-gray-600">
                                  사이즈: {item.size}
                                </div>
                                <div>
                                  가격: {item.price.toLocaleString()} x{" "}
                                  {item.quantity} ={" "}
                                  <span className="font-bold">
                                    {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                  원
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDecrease(item.capId, item.size)}
                                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => handleIncrease(item.capId, item.size)}
                                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleDelete(item.capId, item.size)}
                                className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                              >
                                삭제
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 하단: 합계 영역 */}
                  <div className="mt-4 p-4 bg-slate-100 rounded-lg flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                      <span className="font-semibold">총 개수:</span> {totalCount}개
                    </div>
                    <div>
                      <span className="font-semibold">총 가격:</span>{" "}
                        {totalPrice.toLocaleString()}원
                    </div>
                    <div>
                      <button
                        className="ml-0 md:ml-4 px-6 py-2 bg-blue-700 text-white rounded font-semibold"
                        onClick={() =>
                          navigate("/buy", { state: { mode: "cart", items } })
                        }
                      >
                        구매하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =================== Mobile (md 미만) =================== */}
      <div
  className="block md:hidden min-h-screen text-white font-sans"
  style={{
    backgroundImage: `url('${displayBg}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  <div className="px-5 pb-10 pt-20">
    {/* 🔒 박스 크기 고정 + 내부 스크롤 + 넘치는 내용 클리핑 */}
    <div className="bg-black/50 rounded-xl p-4 mt-10 h-[70vh] flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold mb-2">Your Cart</h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/80">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white/80">
          <p className="mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate("/cap")}
            className="px-6 py-3 bg白/20 text-white rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
          >
            Go to shop
          </button>
        </div>
      ) : (
        // ✅ 박스 안에서만 스크롤되는 구조
        <div className="flex-1 flex flex-col min-h-0">
          {/* 스크롤되는 아이템 리스트 */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white/10 rounded-lg flex gap-3"
              >
                <img
                  src={item.mainImageUrl}
                  alt={item.capName}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-white/90 font-semibold">
                      {item.capName}
                    </div>
                    <div className="text-xs text-white/70">
                      Size: {item.size}
                    </div>
                    <div className="text-xs text-white/80 mt-1">
                      {item.price.toLocaleString()}원 × {item.quantity} ={" "}
                      <span className="font-bold">
                        {(item.price * item.quantity).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrease(item.capId, item.size)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white/20 text-white text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrease(item.capId, item.size)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white/20 text-white text-sm"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(item.capId, item.size)}
                      className="px-3 py-1 rounded bg-red-500/80 text-white text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 고정: 합계 + 버튼들 */}
          <div className="mt-3 p-3 bg-white/10 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Total items</span>
              <span className="font-bold">{totalCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Total price</span>
              <span className="font-bold">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
            <button
              className="mt-3 w-full h-11 rounded-md bg-white/90 text-black font-bold active:scale-[0.98] transition-transform"
              onClick={() =>
                navigate("/buy", { state: { mode: "cart", items } })
              }
            >
              Checkout
            </button>
          </div>

          <button
            onClick={() => navigate("/account")}
            className="mt-2 w-full h-10 rounded-md bg-white/10 text-white text-sm"
          >
            Back to My Garage
          </button>
        </div>
      )}
    </div>
  </div>
</div>
    </>
  );
}
