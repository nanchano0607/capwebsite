import { useEffect, useMemo, useState } from "react";

const SERVER = "http://localhost:8080";

type Order = {
  id: number;
  orderId: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  orderDate?: string;
  itemsJson?: string;
  trackingNumber?: string | null;
  returnTrackingNumber?: string | null;
};

type OrderItem = {
  capId: number;
  quantity: number;
  size?: string | null;
};

interface OrderManagementProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function OrderManagement({ isOpen, onToggle }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortMode, setSortMode] = useState<"asc" | "desc">("asc");

  const getOrderTime = (o: Order) => {
    const t = new Date((o.orderDate ?? o.createdAt) as string).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const displayedOrders = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => (sortMode === "asc" ? getOrderTime(a) - getOrderTime(b) : getOrderTime(b) - getOrderTime(a)));
    return arr;
  }, [orders, sortMode]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await fetch(`${SERVER}/api/admin/orders${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("관리자 주문 조회 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const parseItems = (itemsJson?: string): OrderItem[] => {
    if (!itemsJson) return [];
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
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
    const key = (status as any)?.toUpperCase?.() ?? status;
    return statusMap[key] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      ORDERED: "text-yellow-700",
      SHIPPED: "text-indigo-700",
      RETURN_SHIPPING: "text-orange-700",
      DELIVERED: "text-green-700",
      CANCELLED: "text-red-700",
      RETURN_REQUESTED: "text-orange-700",
      RETURNED: "text-gray-700",
    };
    const key = (status as any)?.toUpperCase?.() ?? status;
    return colorMap[key] || "text-gray-600";
  };

  const shipOrder = async (id: number) => {
    const input = prompt("송장번호를 입력하세요 (예: 123-456-7890)");
    if (input === null) return;
    const trackingNumber = input.trim();
    if (!trackingNumber) {
      alert("송장번호를 입력해주세요.");
      return;
    }
    setActionLoading(id);
    try {
      const token = localStorage.getItem("access_token");
      const setTn = await fetch(
        `${SERVER}/api/admin/orders/${id}/tracking?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!setTn.ok) {
        const data = await setTn.json().catch(() => ({}));
        alert(data.error || "송장번호 설정에 실패했습니다.");
        return;
      }
      const shipRes = await fetch(`${SERVER}/api/admin/orders/${id}/ship`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (shipRes.ok) {
        await fetchOrders();
      } else {
        const data = await shipRes.json().catch(() => ({}));
        alert(data.error || "배송 시작에 실패했습니다.");
      }
    } catch (e) {
      console.error("배송 시작 실패:", e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const deliverOrder = async (id: number) => {
    if (!confirm("이 주문을 배송 완료로 처리하시겠습니까?")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${SERVER}/api/admin/orders/${id}/deliver`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "배송 완료 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error("배송 완료 실패:", e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const approveReturn = async (id: number) => {
    const input = prompt("수거 송장번호를 입력하세요 (반품 승인 시 필요)");
    if (input === null) return;
    const returnTrackingNumber = input.trim();
    if (!returnTrackingNumber) {
      alert("수거 송장번호를 입력해주세요.");
      return;
    }
    setActionLoading(id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `${SERVER}/api/admin/orders/${id}/approve-return?returnTrackingNumber=${encodeURIComponent(returnTrackingNumber)}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "반품 승인에 실패했습니다.");
      }
    } catch (e) {
      console.error("반품 승인 실패:", e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const completeReturn = async (id: number) => {
    const reasonChoice = prompt(
      "반품 완료 사유를 선택하세요:\n1) 단순변심(기본 배송비 3,000원 차감)\n2) 제품하자(전액 환불)",
      "1"
    );
    if (reasonChoice === null) return;
    let returnReason: string;
    if (reasonChoice.trim() === "1") {
      returnReason = "단순변심";
    } else if (reasonChoice.trim() === "2") {
      returnReason = "제품하자";
    } else {
      alert("올바른 번호를 입력해주세요 (1 또는 2)");
      return;
    }

    let returnShippingFee = 0;
    if (returnReason === "단순변심") {
      const feeInput = prompt(
        "차감할 반품 배송비를 입력하세요 (숫자, 원)",
        "3000"
      );
      if (feeInput === null) return;
      const parsed = Number(feeInput.replace(/[^0-9]/g, ""));
      if (Number.isNaN(parsed) || parsed < 0) {
        alert("유효한 금액을 입력해주세요.");
        return;
      }
      returnShippingFee = parsed;
    }

    if (!confirm("이 조건으로 반품을 완료 처리(환불)하시겠습니까?")) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${SERVER}/api/admin/orders/${id}/complete-return`, {
        method: "POST",
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
        body: JSON.stringify({ returnReason, returnShippingFee }),
      });
      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "반품 완료 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error("반품 완료 처리 실패:", e);
      alert("오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="border p-4 rounded mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">주문 관리</h2>
          {!loading && (
            <span className="text-sm text-orange-800">({orders.length})</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="px-3 py-1 border rounded text-sm bg-blue-300 hover:bg-blue-200"
        >
          {isOpen ? "접기" : "펼치기"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="flex items-center justify-end gap-2 mt-4">
            <label className="text-sm text-gray-600">상태 필터</label>
            <select
              className="border rounded px-2 py-1 text-sm bg-blue-300 hover:bg-blue-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">전체</option>
              <option value="ORDERED">상품 준비중</option>
              <option value="SHIPPED">배송중</option>
              <option value="RETURN_SHIPPING">반품 배송중</option>
              <option value="DELIVERED">배송 완료</option>
              <option value="CANCELLED">주문 취소</option>
              <option value="RETURN_REQUESTED">반품 요청</option>
              <option value="RETURNED">반품 완료</option>
            </select>
            <button
              onClick={() => setSortMode((m) => (m === "asc" ? "desc" : "asc"))}
              className="px-3 py-1 border rounded text-sm bg-blue-300 hover:bg-blue-200"
            >
              {sortMode === "asc" ? "최신순" : "시간순"}
            </button>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 border rounded text-sm bg-blue-300 hover:bg-blue-200"
            >
              새로고침
            </button>
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-black">로딩 중...</p>
            ) : orders.length === 0 ? (
              <p className="text-black">주문이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map((order) => {
                  const items = parseItems(order.itemsJson);
                  return (
                    <div key={order.id} className="border rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-black mb-1">
                            주문번호: <span className="font-mono">{order.orderId}</span>
                          </p>
                          <p className="text-xs text-black">
                            주문일: {new Date(order.orderDate ?? order.createdAt).toLocaleString("ko-KR")}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      {items.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {items.map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-800">
                              상품 ID: {item.capId} × {item.quantity}개
                              {item.size ? ` / 사이즈: ${item.size}` : ""}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-base font-semibold">결제 금액</span>
                        <span className="text-lg font-bold">
                          {order.totalPrice.toLocaleString()}원
                        </span>
                      </div>

                      {order.trackingNumber && (
                        <div className="mt-2 text-sm text-gray-700">
                          송장번호: <span className="font-mono">{order.trackingNumber}</span>
                        </div>
                      )}

                      {order.returnTrackingNumber && (
                        <div className="mt-1 text-sm text-gray-700">
                          반품 송장번호: <span className="font-mono">{order.returnTrackingNumber}</span>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2 justify-end">
                        {order.status === "ORDERED" && (
                          <button
                            onClick={() => shipOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? "처리중..." : "배송 시작"}
                          </button>
                        )}
                        {order.status === "SHIPPED" && (
                          <button
                            onClick={() => deliverOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? "처리중..." : "배송 완료"}
                          </button>
                        )}
                        {order.status === "RETURN_REQUESTED" && (
                          <button
                            onClick={() => approveReturn(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? "처리중..." : "반품 승인(수거 송장)"}
                          </button>
                        )}
                        {(order.status === "RETURN_SHIPPING" || order.status === "return_shipping") && (
                          <button
                            onClick={() => completeReturn(order.id)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? "처리중..." : "반품 완료(환불)"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}