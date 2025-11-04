import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";

const SERVER = "http://localhost:8080";

export default function NewPage() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showSelectModal, setShowSelectModal] = useState<boolean>(false);
  
  // 등록된 모자 목록
  const [allCaps, setAllCaps] = useState<any[]>([]);
  const [selectedCapIds, setSelectedCapIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // NEW 페이지에 표시될 모자들
  const [newCaps, setNewCaps] = useState<any[]>([]);
  
  const { user } = useAuth();

  // NEW 상품 불러오기
  const fetchNewCaps = async () => {
    try {
      const response = await fetch(`${SERVER}/cap/new`);
      if (response.ok) {
        const data = await response.json();
        setNewCaps(data);
      }
    } catch (error) {
      console.error("Error fetching new caps:", error);
    }
  };

  // 초기 로드 시 NEW 상품 불러오기
  useEffect(() => {
    fetchNewCaps();
  }, []);

  // 관리자 권한 확인
  useEffect(() => {
    if (user?.isAdmin) {
      setIsAdmin(true);
    }
  }, [user]);

  // 고정 배경 이미지
  const displayBg = `${SERVER}/images/emptyload.png`;

  // 모든 모자 목록 불러오기
  const fetchAllCaps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER}/cap/findAll`);
      if (response.ok) {
        const data = await response.json();
        setAllCaps(data);
      }
    } catch (error) {
      console.error("Error fetching caps:", error);
    } finally {
      setLoading(false);
    }
  };

  // 모달 열 때 모자 목록 불러오기
  const handleOpenModal = () => {
    setShowSelectModal(true);
    fetchAllCaps();
  };

  // 모자 선택/해제
  const toggleCapSelection = (capId: number) => {
    setSelectedCapIds((prev) =>
      prev.includes(capId)
        ? prev.filter((id) => id !== capId)
        : [...prev, capId]
    );
  };

  // NEW 페이지에 선택한 모자들 설정
  const handleSaveSelection = async () => {
    if (selectedCapIds.length === 0) {
      alert("최소 1개 이상의 상품을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 각 선택된 모자의 isNew를 true로 설정
      const promises = selectedCapIds.map(id =>
        fetch(`${SERVER}/cap/setNew/${id}`, { method: "POST" })
      );

      await Promise.all(promises);

      alert("NEW 상품이 설정되었습니다.");
      setShowSelectModal(false);
      setSelectedCapIds([]);
      
      // NEW 상품 목록 다시 불러오기
      await fetchNewCaps();
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // NEW 상품에서 제거
  const handleRemoveFromNew = async (capId: number, capName: string) => {
    if (!window.confirm(`"${capName}"을(를) NEW 상품에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`${SERVER}/cap/unsetNew/${capId}`, {
        method: "POST",
      });

      if (response.ok) {
        alert("NEW 상품에서 제거되었습니다.");
        // NEW 상품 목록 다시 불러오기
        await fetchNewCaps();
      } else {
        alert("제거에 실패했습니다.");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      {/* ===== 배경 섹션 ===== */}
      <section className="bg-[#FFFFF0] w-full relative">
        <div
          className="absolute inset-0 w-full h-screen bg-cover bg-center"
          style={{
            backgroundImage: `url('${displayBg}')`,
            zIndex: 0,
          }}
        />
        {/* 레이아웃 높이 확보 */}
        <div style={{ height: "100vh" }} />

        {/* NEW 상품 표시 영역 */}
        {newCaps.length > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center px-8"
            style={{ zIndex: 5 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl">
              {newCaps.map((cap) => (
                <div
                  key={cap.id}
                  className="bg-white/90 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all relative group"
                >
                  {/* 관리자 전용 삭제 버튼 */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromNew(cap.id, cap.name);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                      title="NEW 상품에서 제거"
                    >
                      ✕
                    </button>
                  )}

                  <div
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/cap/${cap.id}`}
                  >
                    <img
                      src={cap.mainImageUrl || cap.imageUrl}
                      alt={cap.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3
                        className="font-semibold text-lg mb-2 truncate"
                        style={{ fontFamily: "'Bangers', cursive" }}
                      >
                        {cap.name}
                      </h3>
                      <p
                        className="text-gray-700 font-bold"
                        style={{ fontFamily: "'Bangers', cursive" }}
                      >
                        {cap.price?.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 관리자 전용 상품 선택 버튼 */}
        {isAdmin && (
          <button
            onClick={handleOpenModal}
            className="absolute bottom-8 right-8 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
            style={{ zIndex: 10, fontFamily: "'Bangers', cursive", fontSize: "20px" }}
          >
            NEW 상품 선택
          </button>
        )}

        {/* 상품 선택 모달 */}
        {showSelectModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 50 }}
            onClick={() => setShowSelectModal(false)}
          >
            <div
              className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-3xl mb-6"
                style={{
                  fontFamily: "'Bangers', cursive",
                  textShadow: "2px 2px 0 #1A3A47",
                }}
              >
                NEW 페이지에 표시할 상품 선택
              </h2>

              {loading ? (
                <p className="text-center py-8">로딩 중...</p>
              ) : (
                <>
                  {allCaps.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      등록된 상품이 없습니다.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {allCaps.map((cap) => (
                        <div
                          key={cap.id}
                          onClick={() => toggleCapSelection(cap.id)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedCapIds.includes(cap.id)
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <img
                            src={cap.mainImageUrl || cap.imageUrl}
                            alt={cap.name}
                            className="w-full h-40 object-cover rounded mb-2"
                          />
                          <h3 className="font-semibold text-sm truncate">
                            {cap.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {cap.price?.toLocaleString()}원
                          </p>
                          {selectedCapIds.includes(cap.id) && (
                            <div className="mt-2 text-blue-600 text-xs font-bold">
                              ✓ 선택됨
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      선택된 상품: {selectedCapIds.length}개
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveSelection}
                        disabled={loading || selectedCapIds.length === 0}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'Bangers', cursive", fontSize: "18px" }}
                      >
                        {loading ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={() => setShowSelectModal(false)}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        style={{ fontFamily: "'Bangers', cursive", fontSize: "18px" }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
