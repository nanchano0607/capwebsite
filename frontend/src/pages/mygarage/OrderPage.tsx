import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

type Order = {
  id: number;
  orderId: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  orderDate: string;
  trackingNumber?: string | null;
  orderItems: OrderItem[];  // itemsJson 대신 orderItems 사용
};

type OrderItem = {
  id: number;
  capId: number;
  capName: string;
  quantity: number;
  orderPrice: number;
  subTotal: number;
  selectedSize: string;
};

export default function OrderPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [returnMethod, setReturnMethod] = useState<"SELF" | "PICKUP" | null>(null);
  const [returnReason, setReturnReason] = useState<"DEFECT" | "CHANGE_OF_MIND" | null>(null);

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        console.log("주문 데이터:", data); // 디버깅용
        setOrders(data);
      }
    } catch (error) {
      console.error("주문 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      ORDERED: "상품 준비중",
      SHIPPED: "배송중",
      RETURN_SHIPPING: "반품 배송중",
      DELIVERED: "배송 완료",
      CANCELLED: "주문 취소",
      RETURN_REQUESTED: "반품 요청",
      RETURNED: "반품 완료",
    };
    const key = status?.toUpperCase?.() ?? status;
    return statusMap[key] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      ORDERED: "text-yellow-600",
      SHIPPED: "text-indigo-600",
      RETURN_SHIPPING: "text-orange-600",
      DELIVERED: "text-green-600",
      CANCELLED: "text-red-600",
      RETURN_REQUESTED: "text-orange-600",
      RETURNED: "text-gray-600",
    };
    const key = status?.toUpperCase?.() ?? status;
    return colorMap[key] || "text-gray-600";
  };

  // 주문 취소
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("주문을 취소하시겠습니까?")) return;
    
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        alert("주문이 취소되었습니다.");
        fetchOrders(); // 목록 새로고침
      } else {
        const data = await response.json();
        alert(data.error || "주문 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("주문 취소 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  // 반품 요청 모달 열기
  const openReturnModal = (orderId: number) => {
    setPendingOrderId(orderId);
    setShowReturnModal(true);
    setReturnMethod(null);
    setReturnReason(null);
  };

  // 반품 요청 제출 (모달 확인 버튼)
  const submitReturnRequest = async () => {
    if (!pendingOrderId) return;
    if (!returnMethod) {
      setBanner({ type: "error", text: "반품 방법을 선택해주세요." });
      return;
    }
    if (!returnReason) {
      setBanner({ type: "error", text: "반품 사유를 선택해주세요." });
      return;
    }
    const orderId = pendingOrderId;
    setActionLoading(orderId);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setBanner({ type: "error", text: "로그인이 필요합니다." });
        navigate("/login");
        return;
      }

      // 사유에 따른 기본 반품 배송비 정책: 제품 하자 0원, 단순 변심 3,000원
      const returnShippingFee = returnReason === "DEFECT" ? 0 : 3000;

      const response = await fetch(`${SERVER}/api/orders/${orderId}/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnReason,         // "DEFECT" | "CHANGE_OF_MIND"
          returnMethod,         // "SELF" | "PICKUP"
          returnShippingFee,    // 0 | 3000
        }),
      });

      if (response.ok) {
        setBanner({ type: "success", text: "반품이 요청되었습니다." });
        fetchOrders();
      } else if (response.status === 404) {
        setBanner({ type: "error", text: "주문을 찾을 수 없습니다." });
      } else if (response.status === 401 || response.status === 403) {
        setBanner({ type: "error", text: "인증이 만료되었습니다. 다시 로그인해주세요." });
        navigate("/login");
      } else {
        const data = await response.json().catch(() => ({}));
        setBanner({ type: "error", text: data.error || "반품 요청에 실패했습니다." });
      }
    } catch (error) {
      console.error("반품 요청 실패:", error);
      setBanner({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
      setShowReturnModal(false);
      setPendingOrderId(null);
      setReturnMethod(null);
      setReturnReason(null);
    }
  };

  return (
    <>
    {/* 📦 최상위 컨테이너: fixed로 고정하여 스크롤 방지 (inset-0 = 화면 전체) */}
    <div className="fixed inset-0 overflow-hidden">
      {/* 📦 배경 레이어: 화면 전체를 덮는 고정 배경 (inset-0 = top:0, right:0, bottom:0, left:0) */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('${SERVER}/images/accountBackground.png')`,
          zIndex: 0,
        }}
      />

      {/* 📦 메인 컨텐츠 컨테이너: 최대 너비 2xl(42rem = 672px), 중앙 정렬, 화면 중앙 배치 */}
      {/* h-full = 전체 높이, flex items-center = 세로 중앙 정렬 */}
      <div className="relative h-full flex items-center justify-center" style={{ zIndex: 1 }}>
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 📝 제목: 텍스트 크기 3xl(30px), mt-2.5 = 상단 여백 10px */}
          <h1 className="text-3xl font-bold text-white mb-8 mt-8" style={{ fontFamily: "'Bangers', cursive" }}>
            Order History
          </h1>

          {/* 📦 주문 목록 컨테이너: 투명 배경(bg-transparent), 내부 패딩 24px(p-6), 고정 높이 */}
          <div className="bg-transparent p-6 rounded-lg">
            {loading ? (
              <p className="text-black text-base">로딩 중...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black text-base mb-4">주문 내역이 없습니다.</p>
                <button
                  onClick={() => navigate("/cap")}
                  className="px-6 py-2 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
                >
                  쇼핑하러 가기
                </button>
              </div>
            ) : (
              /* 📦 스크롤 컨테이너: h-96(384px) 고정 높이, overflow-y-auto로 세로 스크롤, 스크롤바 숨김 */
              <div className="h-96 overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* 📦 주문 아이템 리스트: space-y-4 = 각 아이템 간 세로 간격 16px */}
                <div className="space-y-4">
                  {orders.map((order) => {
                    return (
                      <div
                        key={order.id}
                        className="bg-white/10 rounded-lg border border-white/20 p-5 hover:bg-white/15 transition-colors"
                      >
                        {/* 주문 헤더 */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              주문번호: <span className="font-mono text-black">{order.orderId}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              주문일: {new Date(order.orderDate ?? order.createdAt).toLocaleString("ko-KR")}
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        {/* 주문 상품 정보 */}
                        {order.orderItems && order.orderItems.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {order.orderItems.map((item, idx) => (
                              <div key={idx} className="text-sm text-black bg-white/5 rounded p-3 border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                  <button
                                    onClick={() => navigate(`/cap/${item.capId}`)}
                                    className="font-medium text-left hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                                  >
                                    {item.capName} ({item.selectedSize})
                                  </button>
                                  <span>{item.quantity}개</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                  <span>개당 {item.orderPrice.toLocaleString()}원</span>
                                  <span className="font-medium">소계: {item.subTotal.toLocaleString()}원</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 주문 금액 */}
                        <div className="flex justify-between items-center pt-3 border-t border-white/20">
                          <span className="text-base font-bold text-black">결제 금액</span>
                          <span className="text-lg font-bold text-black">
                            {order.totalPrice.toLocaleString()}원
                          </span>
                        </div>

                        {/* 송장번호 */}
                        {order.trackingNumber && (
                          <div className="mt-2 text-sm text-black/80">
                            송장번호: <span className="font-mono">{order.trackingNumber}</span>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="mt-4 flex gap-2 justify-end">
                          {/* 주문 취소 버튼 (ORDERED 상태에만 표시) */}
                          {order.status === "ORDERED" && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={actionLoading === order.id}
                              className="px-4 py-2 bg-red-500/80 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === order.id ? "처리중..." : "주문 취소"}
                            </button>
                          )}
                          
                          {/* 반품 요청 버튼 (DELIVERED 상태에만 표시) */}
                          {order.status === "DELIVERED" && (
                            <button
                              onClick={() => openReturnModal(order.id)}
                              disabled={actionLoading === order.id}
                              className="px-4 py-2 bg-orange-500/80 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === order.id ? "처리중..." : "반품 요청"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 뒤로 가기 버튼 */}
          <div className=" text-center">
            <button
              onClick={() => navigate("/account")}
              className="px-6 py-2 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 안내 배너 */}
    {banner ? (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div
          className={`px-4 py-2 rounded shadow text-white ${
            banner.type === "success"
              ? "bg-green-600"
              : banner.type === "info"
              ? "bg-blue-600"
              : "bg-red-600"
          }`}
        >
          {banner.text}
          <button
            className="ml-3 underline text-white/90"
            onClick={() => setBanner(null)}
          >
            닫기
          </button>
        </div>
      </div>
    ) : null}

    {/* 반품 요청 모달 */}
    {showReturnModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowReturnModal(false)} />
        <div className="relative bg-white w-[480px] max-w-[90vw] rounded-lg p-6 shadow-lg z-10">
          <h3 className="text-lg font-bold mb-3">반품 요청</h3>

          {/* 반품 사유 선택 */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">반품 사유 선택</p>
            <label className="flex items-center gap-2 mb-2 text-sm p-3 border rounded hover:bg-gray-50">
              <input
                type="radio"
                name="returnReason"
                value="DEFECT"
                checked={returnReason === "DEFECT"}
                onChange={() => setReturnReason("DEFECT")}
              />
              <div>
                <div className="font-medium">제품 하자</div>
                <div className="text-xs text-gray-600">전액 환불 (배송비 무료)</div>
              </div>
            </label>
            <label className="flex items-center gap-2 text-sm p-3 border rounded hover:bg-gray-50">
              <input
                type="radio"
                name="returnReason"
                value="CHANGE_OF_MIND"
                checked={returnReason === "CHANGE_OF_MIND"}
                onChange={() => setReturnReason("CHANGE_OF_MIND")}
              />
              <div>
                <div className="font-medium">단순 변심</div>
                <div className="text-xs text-gray-600">배송비 3,000원 차감 후 환불</div>
              </div>
            </label>
          </div>

          {/* 반품 방법 선택 */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">반품 방법 선택</p>
            <label className="flex items-center gap-2 mb-2 text-sm p-3 border rounded hover:bg-gray-50">
              <input
                type="radio"
                name="returnMethod"
                value="SELF"
                checked={returnMethod === "SELF"}
                onChange={() => setReturnMethod("SELF")}
              />
              직접 반품 (고객이 직접 발송)
            </label>
            <label className="flex items-center gap-2 text-sm p-3 border rounded hover:bg-gray-50">
              <input
                type="radio"
                name="returnMethod"
                value="PICKUP"
                checked={returnMethod === "PICKUP"}
                onChange={() => setReturnMethod("PICKUP")}
              />
              회수 요청 (판매자 수거)
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={submitReturnRequest}
              disabled={!returnReason || !returnMethod || pendingOrderId == null || actionLoading === pendingOrderId}
              className="px-4 py-2 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {actionLoading === pendingOrderId ? "요청 중..." : "반품 요청"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
