import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/useAuth";

const API = "http://localhost:8080"; // 백엔드 서버 주소

type CartItem = {
  id: number;
  cap: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
};

export default function CartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  const handleIncrease = (capId: number) => {
    axios
      .post(`${API}/cart/increase`, {
        userId: user?.id,
        capId,
      })
      .then(() => fetchCart());
  };

  // 수량 감소
  const handleDecrease = (capId: number) => {
    axios
      .post(`${API}/cart/decrease`, {
        userId: user?.id,
        capId,
      })
      .then(() => fetchCart());
  };

  // 아이템 삭제
  const handleDelete = (capId: number) => {
    axios
      .post(`${API}/cart/delete`, {
        userId: user?.id,
        capId,
      })
      .then(() => fetchCart());
  };

  // 총 가격과 총 개수 계산
  const totalPrice = items.reduce((sum, item) => sum + item.cap.price * item.quantity, 0);
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
                <div>
                  <strong>{item.cap.name}</strong>
                  <div>
                    가격: {item.cap.price.toLocaleString()} x {item.quantity} ={" "}
                    <span className="font-bold">
                      {(item.cap.price * item.quantity).toLocaleString()}
                    </span>
                    원
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecrease(item.cap.id)}
                    className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item.cap.id)}
                    className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleDelete(item.cap.id)}
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
          </div>
        </>
      )}
    </div>
  );
}