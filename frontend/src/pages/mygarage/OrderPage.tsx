import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

type Order = {
  id: number;
  orderId: string;         // 주문번호 (예: ORD20250131-1)
  status: string;
  receiverName: string;
  address: string;
  phone: string;
  totalPrice: number;
  orderDate: string;
  trackingNumber?: string | null;
  returnTrackingNumber?: string | null;
  returnReason?: string | null;
  returnMethod?: string | null;
  returnShippingFee?: number | null;
  confirmed: boolean;           // 구매확정 여부
  confirmedAt?: string | null;  // 구매확정 시간
  deliveredAt?: string | null;  // 배송 완료 시간
  orderItems: OrderItem[];
  originalPrice?: number;
  couponDiscount?: number;
  pointsDiscount?: number;
  totalDiscount?: number;
  finalPrice?: number;
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
  const [sortMode, setSortMode] = useState<"asc" | "desc">("asc");
  const [reviewStatus, setReviewStatus] = useState<{ [key: string]: boolean }>({});

  /** ========== 금액/표시 유틸 ========== */
  const toNum = (v: any): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (n: any) => `${toNum(n).toLocaleString()}원`;

  const calcOriginalPrice = (o: Order): number =>
    (o.orderItems ?? []).reduce((sum, it) => sum + toNum(it.orderPrice) * toNum(it.quantity), 0);

  const normalizeOrder = (o: Order): Order => {
    const original = toNum(o.originalPrice) || calcOriginalPrice(o);
    const coupon = toNum(o.couponDiscount);
    const points = toNum(o.pointsDiscount);
    const totalDiscount = toNum(o.totalDiscount) || (coupon + points);
    const finalPrice = toNum(o.finalPrice) || (original - totalDiscount);

    return {
      ...o,
      originalPrice: original,
      couponDiscount: coupon,
      pointsDiscount: points,
      totalDiscount,
      finalPrice,
      totalPrice: toNum(o.totalPrice),
    };
  };

  /** ========== 정렬 ========== */
  const getOrderTime = (o: Order) => {
    const t = new Date(o.orderDate).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const displayedOrders = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => (sortMode === "asc" ? getOrderTime(a) - getOrderTime(b) : getOrderTime(b) - getOrderTime(a)));
    return arr;
  }, [orders, sortMode]);

  /** ========== 스타일(스크롤바 숨김) ========== */
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /** ========== 최초/포커스 시 주문 새로고침 ========== */
  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchOrders();
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchOrders();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /** ========== 데이터 조회 ========== */
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        const normalized = (data as Order[]).map(normalizeOrder);
        setOrders(normalized);
        await checkReviewStatus(normalized);
      }
    } catch (error) {
      console.error("주문 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewStatus = async (ordersData: Order[]) => {
    const token = localStorage.getItem("access_token");
    const status: { [key: string]: boolean } = {};

    for (const order of ordersData) {
      for (const item of order.orderItems) {
        const key = `${order.id}-${item.capId}`;
        try {
          const response = await fetch(`${SERVER}/api/reviews/check?orderId=${order.id}&capId=${item.capId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (response.ok) {
            const data = await response.json();
            status[key] = !!data.alreadyReviewed; // { canWrite, alreadyReviewed }
          } else {
            status[key] = false;
          }
        } catch {
          status[key] = false;
        }
      }
    }
    setReviewStatus(status);
  };

  /** ========== 상태 표시 ========== */
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
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
    const colorMap: Record<string, string> = {
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

  /** ========== 액션들 ========== */
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
        fetchOrders();
      } else {
        const data = await response.json().catch(() => ({}));
        alert((data as any).error || "주문 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("주문 취소 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const openReturnModal = (orderId: number) => {
    setPendingOrderId(orderId);
    setShowReturnModal(true);
    setReturnMethod(null);
    setReturnReason(null);
  };

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

    setActionLoading(pendingOrderId);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setBanner({ type: "error", text: "로그인이 필요합니다." });
        navigate("/login");
        return;
      }

      const returnShippingFee = returnReason === "DEFECT" ? 0 : 3000;

      const response = await fetch(`${SERVER}/api/orders/${pendingOrderId}/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnReason, // "DEFECT" | "CHANGE_OF_MIND"
          returnMethod, // "SELF" | "PICKUP"
          returnShippingFee,
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
        setBanner({ type: "error", text: (data as any).error || "반품 요청에 실패했습니다." });
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

  const handleConfirmPurchase = async (orderId: number) => {
    if (!confirm("구매를 확정하시겠습니까? 구매확정 후에는 반품이 불가능합니다.")) return;

    setActionLoading(orderId);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        setBanner({ type: "success", text: "구매가 확정되었습니다." });
        fetchOrders();
      } else if (response.status === 401 || response.status === 403) {
        setBanner({ type: "error", text: "인증이 만료되었습니다. 다시 로그인해주세요." });
        navigate("/login");
      } else {
        const data = await response.json().catch(() => ({}));
        setBanner({ type: "error", text: (data as any).error || "구매확정에 실패했습니다." });
      }
    } catch (error) {
      console.error("구매확정 실패:", error);
      setBanner({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setActionLoading(null);
    }
  };

  /** ========== 렌더링 ========== */
  return (
    <>
      {/* 전체 고정 컨테이너 (PC : md 이상에서 표시) */}
      <div className="hidden md:block fixed inset-0 overflow-hidden">
        {/* 배경 */}
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${SERVER}/images/emptyload.png')`,
            zIndex: 0,
          }}
        />

        {/* 내용 래퍼 */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center" style={{ zIndex: 1, paddingTop: "10vh" }}>
          {/* 바깥 테두리 */}
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
              {/* 좌상단 타이틀 */}
              <div
                className="absolute top-2 left-12 text-white font-bold text-3xl font-beaver"
                style={{ imageRendering: "pixelated", zIndex: 10 }}
              >
                Order
              </div>
              {/* 안쪽 컨텐츠 */}
              <div
                className="w-full px-4 bg-[#f2d4a7] scrollbar-hide overflow-y-auto"
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
                <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-transparent p-6 rounded-lg">
                    {!loading && (
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => setSortMode((m) => (m === "asc" ? "desc" : "asc"))}
                          className="px-3 py-1.5 bg-white/20 text-black rounded font-bold hover:bg-white/30 border border-white/30 text-sm"
                        >
                          {sortMode === "asc" ? "최신순" : "시간순"}
                        </button>
                      </div>
                    )}
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
                      <div className="h-96 overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                        <div className="space-y-4">
                          {displayedOrders.map((order) => (
                            <div
                              key={order.id}
                              className="bg-white/10 rounded-lg border border-white/20 p-5 hover:bg-white/15 transition-colors"
                            >
                              {/* 헤더 */}
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    주문번호: <span className="font-mono text-black">{order.orderId}</span>
                                  </p>
                                  <p className="text-xs text-gray-500 mb-1">
                                    주문일: {new Date(order.orderDate).toLocaleString("ko-KR")}
                                  </p>
                                  {order.deliveredAt && (
                                    <p className="text-xs text-gray-500 mb-1">
                                      배송완료: {new Date(order.deliveredAt).toLocaleString("ko-KR")}
                                    </p>
                                  )}
                                  {order.confirmedAt && (
                                    <p className="text-xs text-gray-500">
                                      구매확정: {new Date(order.confirmedAt).toLocaleString("ko-KR")}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-sm font-bold ${order.status === "DELIVERED" && order.confirmed ? "text-purple-600" : getStatusColor(order.status)}`}>
                                  {order.status === "DELIVERED" && order.confirmed ? "구매확정 완료" : getStatusText(order.status)}
                                </span>
                              </div>

                              {/* 배송 정보 */}
                              <div className="mb-3 p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-xs text-gray-600 mb-1">
                                  <span className="font-medium">수령인:</span> {order.receiverName}
                                </p>
                                <p className="text-xs text-gray-600 mb-1">
                                  <span className="font-medium">배송지:</span> {order.address}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">연락처:</span> {order.phone}
                                </p>
                              </div>

                              {/* 아이템 */}
                              {order.orderItems?.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {order.orderItems.map((item, idx) => {
                                    const reviewKey = `${order.id}-${item.capId}`;
                                    const hasReview = reviewStatus[reviewKey];

                                    return (
                                      <div key={idx} className="text-sm text-black bg-white/5 rounded p-3 border border-white/10">
                                        <div className="flex justify-between items-center mb-1">
                                          <button
                                            onClick={() => navigate(`/cap/${item.capId}`)}
                                            className="font-medium text-left hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                                          >
                                            {item.capName} ({item.selectedSize})
                                          </button>
                                          <div className="flex items-center gap-2">
                                            <span>{item.quantity}개</span>

                                            {order.status === "DELIVERED" && (
                                              <button
                                                onClick={() => {
                                                  if (hasReview) return;
                                                  navigate(`/review/write?orderId=${order.id}&capId=${item.capId}`);
                                                }}
                                                disabled={hasReview}
                                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                                  hasReview
                                                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                                    : "bg-blue-500/80 text-white hover:bg-blue-600"
                                                }`}
                                              >
                                                {hasReview ? "리뷰 완료" : "리뷰 쓰기"}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-600">
                                          <span>개당 {money(item.orderPrice)}</span>
                                          <span className="font-medium">소계: {money(item.subTotal)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* 결제 내역 (할인 정보 포함) */}
                              <div className="pt-3 border-t border-white/20">
                                <div className="text-base font-bold text-black mb-2">결제 내역</div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>원래 금액</span>
                                  <span>{money(order.originalPrice)}</span>
                                </div>
                                {toNum(order.couponDiscount) > 0 && (
                                  <div className="flex justify-between text-sm text-blue-600 mb-1">
                                    <span>쿠폰 할인</span>
                                    <span>-{money(order.couponDiscount)}</span>
                                  </div>
                                )}
                                {toNum(order.pointsDiscount) > 0 && (
                                  <div className="flex justify-between text-sm text-yellow-600 mb-1">
                                    <span>포인트 할인</span>
                                    <span>-{money(order.pointsDiscount)}</span>
                                  </div>
                                )}
                                {toNum(order.totalDiscount) > 0 && (
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>총 할인</span>
                                    <span>-{money(order.totalDiscount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                  <span>최종 결제 금액</span>
                                  <span className="text-red-600">{money(order.finalPrice || order.totalPrice)}</span>
                                </div>
                              </div>

                              {/* 송장번호 및 반품 정보 */}
                              {(order.trackingNumber || order.returnTrackingNumber || order.returnReason) && (
                                <div className="mt-2 p-3 bg-white/5 rounded border border-white/10">
                                  {order.trackingNumber && (
                                    <div className="text-sm text-black/80 mb-1">
                                      <span className="font-medium">송장번호:</span> <span className="font-mono">{order.trackingNumber}</span>
                                    </div>
                                  )}
                                  {order.returnTrackingNumber && (
                                    <div className="text-sm text-black/80 mb-1">
                                      <span className="font-medium">반품송장:</span> <span className="font-mono">{order.returnTrackingNumber}</span>
                                    </div>
                                  )}
                                  {order.returnReason && (
                                    <div className="text-sm text-black/80 mb-1">
                                      <span className="font-medium">반품사유:</span> {order.returnReason === "DEFECT" ? "제품하자" : "단순변심"}
                                      {order.returnMethod && (
                                        <span className="ml-2">
                                          ({order.returnMethod === "PICKUP" ? "회수요청" : "직접반품"})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {order.returnShippingFee && order.returnShippingFee > 0 && (
                                    <div className="text-sm text-black/80">
                                      <span className="font-medium">반품택배비:</span> {money(order.returnShippingFee)}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 액션 */}
                              <div className="mt-4 flex gap-2 justify-end">
                                {order.status === "ORDERED" && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={actionLoading === order.id}
                                    className="px-4 py-2 bg-red-500/80 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {actionLoading === order.id ? "처리중..." : "주문 취소"}
                                  </button>
                                )}
                                {order.status === "DELIVERED" && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmPurchase(order.id)}
                                      disabled={actionLoading === order.id || order.confirmed}
                                      className={`px-4 py-2 text-sm rounded transition-colors ${
                                        order.confirmed
                                          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                          : "bg-green-500/80 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                      }`}
                                    >
                                      {order.confirmed ? "구매확정 완료" : actionLoading === order.id ? "처리중..." : "구매 확정"}
                                    </button>

                                    <button
                                      onClick={() => openReturnModal(order.id)}
                                      disabled={actionLoading === order.id || order.confirmed}
                                      className={`px-4 py-2 text-sm rounded transition-colors ${
                                        order.confirmed
                                          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                          : "bg-orange-500/80 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                      }`}
                                    >
                                      {order.confirmed ? "반품 불가" : actionLoading === order.id ? "처리중..." : "반품 요청"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 뒤로 가기 */}
                  <div className="text-center">
                    <button
                      onClick={() => navigate("/account")}
                      className="px-6 py-2 bg-white/20 text-black rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      뒤로 가기
                    </button>
                  </div>
                </div>
              </div>
              {/* 안쪽 컨텐츠 끝 */}
            </div>
            {/* 중간 테두리 끝 */}
          </div>
          {/* 바깥 테두리 끝 */}
        </div>
        {/* 내용 래퍼 끝 */}
      </div>
      {/* 전체 고정 컨테이너 끝 */}

      {/* ================= 모바일 (md 미만) 버전: 단순화된 스택 리스트 ================= */}
     <div
      className="block md:hidden min-h-screen text-white font-sans"
      style={{
        backgroundImage: `url('${SERVER}/images/emptyload.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
     >
      {/* 네비게이션 높이만큼 위 여백 주고, 가운데 정렬 */}
      <div className="w-full h-full flex justify-center items-start pt-20 px-5">
        {/* 🔒 여기 컨테이너는 고정, 내부만 스크롤 */}
        <div className="w-full max-w-md bg-black/50 rounded-xl p-3 mt-4 flex flex-col max-h-[calc(100vh-120px)] mt-10">
          
          {/* 안쪽 내용 전체를 스크롤 영역으로 */}
          <div className="space-y-3 overflow-y-auto scrollbar-hide pr-1">
            {loading ? (
              <p className="text-white/80 p-4">로딩 중...</p>
            ) : displayedOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white text-base mb-4">주문 내역이 없습니다.</p>
                <button
                  onClick={() => navigate("/cap")}
                  className="px-6 py-3 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30 transition-colors border border-white/30"
                >
                  쇼핑하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map((order) => (
                  <div key={order.id} className="w-full bg-transparent text-white rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white/90">
                          {new Date(order.orderDate).toLocaleString("ko-KR")}
                        </div>
                        <div className="text-base font-bold">{order.orderId}</div>
                        <div className={`text-sm mt-1 ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-400">
                          {money(order.finalPrice || order.totalPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => navigate(`/order/${order.id}`)}
                        className="w-full h-12 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        상세보기
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {order.status === "ORDERED" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="h-12 w-full rounded-md bg-red-500/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === order.id ? "처리중..." : "주문 취소"}
                          </button>
                        )}

                        {order.status === "DELIVERED" && (
                          <>
                            <button
                              onClick={() => handleConfirmPurchase(order.id)}
                              disabled={actionLoading === order.id || order.confirmed}
                              className="h-12 w-full rounded-md bg-green-500/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {order.confirmed ? "구매확정 완료" : actionLoading === order.id ? "처리중..." : "구매 확정"}
                            </button>

                            <button
                              onClick={() => openReturnModal(order.id)}
                              disabled={actionLoading === order.id || order.confirmed}
                              className="h-12 w-full rounded-md bg-orange-500/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {order.confirmed ? "반품 불가" : actionLoading === order.id ? "처리중..." : "반품 요청"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* 안내 배너 */}
      {banner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`px-4 py-2 rounded shadow text-white ${
              banner.type === "success" ? "bg-green-600" : banner.type === "info" ? "bg-blue-600" : "bg-red-600"
            }`}
          >
            {banner.text}
            <button className="ml-3 underline text-white/90" onClick={() => setBanner(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 반품 요청 모달 */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReturnModal(false)} />
          <div className="relative bg-white w-[480px] max-w-[90vw] rounded-lg p-6 shadow-lg z-10">
            <h3 className="text-lg font-bold mb-3">반품 요청</h3>

            {/* 반품 사유 */}
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

            {/* 반품 방법 */}
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

            {/* 모달 버튼 */}
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
