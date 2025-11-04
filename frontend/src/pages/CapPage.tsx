import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const SERVER = "http://localhost:8080";

export default function CapPage() {
  const [caps, setCaps] = useState<
    Array<{ id: number; name: string; price: number; mainImageUrl: string; color: string; stock?: number }>
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 모든 모자 목록 조회
    fetch(`${SERVER}/cap/findAll`)
      .then((res) => res.json())
      .then((data) => setCaps(data));
  }, []);

  const displayBg = `${SERVER}/images/emptyload.png`;

  return (
    <div className="min-h-screen relative">
      {/* ✅ 고정 배경: 스크롤해도 그대로 */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url('${displayBg}')`,
          zIndex: 0,
        }}
      />

      {/* ✅ 컨텐츠는 일반 flow (자연스럽게 스크롤됨) */}
      <main
        className="relative max-w-2xl mx-auto px-4 py-8 pt-24 md:pt-32"
        style={{ zIndex: 1 }}
      >
        <div className="flex flex-col gap-36 items-center">
          {caps.map((cap) => (
            <div key={cap.id} className="flex flex-col items-center mb-16">
              <img
                src={cap.mainImageUrl}
                alt={cap.name}
                className="w-[700px] h-[500px] object-cover mb-4 cursor-pointer"
                onClick={() => navigate(`/cap/${cap.id}`)}
              />

              <div className="text-2xl text-center font-bold mt-2 mb-2 text-white">
                {cap.name} - {cap.color}
                <span className="ml-6 text-gray-400">{cap.price.toLocaleString()}</span>
                {(cap.stock ?? 0) === 0 && (
                  <span className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                    품절
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
