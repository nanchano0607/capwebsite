import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SERVER = "http://localhost:8080";

type Cap = {
  id: number;
  name: string;
  price: number;
  mainImageUrl: string;
  color: string;
  stock?: number;
  stocks?: CapStock[]; // 사이즈별 재고 추가
};

type CapStock = {
  size: string;
  stock: number;
};

interface ProductManagementProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ProductManagement({
  isOpen,
  onToggle,
}: ProductManagementProps) {
  const [caps, setCaps] = useState<Cap[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 컴포넌트 마운트 시 항상 상품 목록을 가져옴
    fetchCaps();
  }, []);

  useEffect(() => {
    if (isOpen) fetchCaps();
  }, [isOpen]);

  const fetchCaps = async () => {
    try {
      const res = await fetch(`${SERVER}/cap/findAll`);
      if (res.ok) {
        const data = await res.json();
        setCaps(data);
      }
    } catch (e) {
      console.error("상품 목록 조회 실패:", e);
    }
  };

  // 사이즈별 재고 업데이트
  const handleUpdateSizeStock = async (capId: number, size: string, currentStock: number) => {
    const newStock = prompt(
      `"${size}" 사이즈 재고 수량을 입력하세요 (현재: ${currentStock}):`,
      String(currentStock)
    );
    if (newStock === null) return;

    const stockNumber = parseInt(newStock);
    if (isNaN(stockNumber) || stockNumber < 0) {
      alert("올바른 숫자를 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/cap/updateStock/${capId}/${size}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(stockNumber),
      });

      if (response.ok) {
        alert(`"${size}" 사이즈 재고가 업데이트되었습니다.`);
        await fetchCaps();
      } else {
        alert("재고 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("사이즈별 재고 업데이트 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  

  // 사이즈별 품절 처리
  const handleMarkSizeOutOfStock = async (capId: number, size: string, capName: string) => {
    if (!confirm(`"${capName}" 상품의 "${size}" 사이즈를 품절 처리하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${SERVER}/cap/updateStock/${capId}/${size}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(0),
      });

      if (response.ok) {
        alert(`"${size}" 사이즈가 품절 처리되었습니다.`);
        await fetchCaps();
      } else {
        alert("품절 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("사이즈별 품절 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleMarkOutOfStock = async (capId: number, capName: string) => {
    if (
      !confirm(`"${capName}" 상품을 품절 처리하시겠습니까? (모든 사이즈 재고가 0으로 설정됩니다)`)
    )
      return;

    try {
      const token = localStorage.getItem("access_token");
      
      // 먼저 상품의 사이즈별 재고 정보를 가져옴
      const stocksResponse = await fetch(`${SERVER}/cap/stocks/${capId}`);
      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json();
        
        // 각 사이즈별로 재고를 0으로 설정
        const updatePromises = Object.keys(stocksData).map(size => 
          fetch(`${SERVER}/cap/updateStock/${capId}/${size}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(0),
          })
        );
        
        await Promise.all(updatePromises);
      }
      
      // 전체 재고도 0으로 설정
      const response = await fetch(`${SERVER}/cap/updateStock/${capId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(0),
      });

      if (response.ok) {
        alert("품절 처리되었습니다.");
        await fetchCaps();
      } else {
        alert("품절 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("품절 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDeleteCap = async (capId: number, capName: string) => {
    if (!confirm(`"${capName}" 상품을 정말 삭제하시겠습니까?`)) return;

    try {
      const imagesRes = await fetch(`${SERVER}/cap/getImages/${capId}`);
      const imageFiles = await imagesRes.json();

      await fetch(`${SERVER}/cap/delete/${capId}`, { method: "POST" });

      await fetch(`${SERVER}/image/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageFiles),
      });

      alert("상품이 삭제되었습니다.");
      await fetchCaps();
    } catch (error) {
      console.error("상품 삭제 실패:", error);
      alert("상품 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="border p-4 rounded md:col-span-2 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">상품 관리</h2>
          <span className="text-sm text-orange-800">({caps.length})</span>
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
            <button
              onClick={() => navigate("/register")}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded bg-blue-300 hover:bg-blue-200"
            >
              상품 등록
            </button>
            <button
              onClick={fetchCaps}
              className="px-3 py-1 border rounded text-sm bg-blue-300 hover:bg-blue-200"
            >
              새로고침
            </button>
          </div>

          <div className="mt-4">
            {caps.length === 0 ? (
              <p className="text-gray-600">상품이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {caps.map((cap) => (
                  <div key={cap.id} className="border rounded p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={cap.mainImageUrl}
                        alt={cap.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{cap.name}</h3>
                            <p className="text-sm text-black">
                              색상: {cap.color}
                            </p>
                            <p className="text-sm text-black">
                              가격: {cap.price.toLocaleString()}원
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-black">
                                재고: {cap.stock ?? 0}개
                              </p>
                              {(cap.stock ?? 0) === 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  품절
                                </span>
                              )}
                              {(cap.stock ?? 0) > 0 &&
                                (cap.stock ?? 0) <= 5 && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    재고 부족
                                  </span>
                                )}
                            </div>
                            
                            {/* 사이즈별 재고 표시 */}
                            {cap.stocks && cap.stocks.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-black mb-1">사이즈별 재고:</p>
                                <div className="flex flex-wrap gap-2">
                                  {cap.stocks.map((sizeStock) => (
                                    <div 
                                      key={sizeStock.size}
                                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                                    >
                                      <span className="font-medium">{sizeStock.size}:</span>
                                      <span className={sizeStock.stock === 0 ? "text-red-800 font-medium" : ""}>{sizeStock.stock}개</span>
                                      <button
                                        onClick={() => handleUpdateSizeStock(cap.id, sizeStock.size, sizeStock.stock)}
                                        className="ml-1 px-1 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                        title="재고 수정"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => handleMarkSizeOutOfStock(cap.id, sizeStock.size, cap.name)}
                                        className="ml-1 px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                        title="품절 처리"
                                        disabled={sizeStock.stock === 0}
                                      >
                                        품절
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleMarkOutOfStock(cap.id, cap.name)
                            }
                            className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                            disabled={(cap.stock ?? 0) === 0}
                          >
                            품절 처리
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCap(cap.id, cap.name)
                            }
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            제품 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
