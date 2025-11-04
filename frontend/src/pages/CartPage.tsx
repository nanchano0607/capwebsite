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
    return <div className="max-w-4xl mx-auto px-4 py-12">로그인이 필요합니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>장바구니가 비어 있습니다.</p>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="mb-4 border-b pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={item.mainImageUrl}
                    alt={item.capName}
                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "12px" }}
                  />
                  <div>
                    <strong>{item.capName}</strong>
                    <div className="text-sm text-gray-600">사이즈: {item.size}</div>
                    <div>
                      가격: {item.price.toLocaleString()} x {item.quantity} ={" "}
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
          <div className="mt-8 p-4 bg-slate-100 rounded-lg flex justify-between items-center">
            <div>
              <span className="font-semibold">총 개수:</span> {totalCount}개
            </div>
            <div>
              <span className="font-semibold">총 가격:</span>{" "}
              {totalPrice.toLocaleString()}원
            </div>
            <button
              className="ml-4 px-6 py-2 bg-blue-700 text-white rounded font-semibold"
              onClick={() => navigate("/buy", { state: { mode: 'cart', items } })}
            >
              구매하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}