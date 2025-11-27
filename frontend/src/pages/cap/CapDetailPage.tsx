import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Lightbox from "../../components/Lightbox";
import { isMobileDevice } from "../../utils/isMobile";

type Cap = {
  id: number;
  name: string;
  price: number;
  color: string;
  description: string;
  mainImageUrl: string;
  imageUrls: string[];
  category: string;
  stock: number;
  size: string[];
  sizeInfo: string;
};

type Review = {
  id: number;
  userId: number;
  userName?: string;
  capId: number;
  capName: string;
  orderId: number;
  selectedSize: string;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt?: string;
};

const SERVER = "http://localhost:8080";

export default function CapDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cap, setCap] = useState<Cap | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [sizeStocks, setSizeStocks] = useState<{ [size: string]: number }>({});
  const [currentSizeStock, setCurrentSizeStock] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 감지
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // 상품 + 재고 + 리뷰 로딩
  useEffect(() => {
    if (!id) return;

    // 상품 정보 + 재고
    fetch(`${SERVER}/cap/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCap(data);
        return fetch(`${SERVER}/cap/stocks/${id}`);
      })
      .then((res) => res.json())
      .then((stocks) => {
        if (stocks && typeof stocks === "object") {
          setSizeStocks(stocks);
        }
      })
      .catch(() => setCap(null));

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const reviewsResponse = await fetch(`${SERVER}/reviews/cap/${id}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }

      const statsResponse = await fetch(
        `${SERVER}/reviews/cap/${id}/statistics`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setReviewStats({
          averageRating: statsData.averageRating || 0,
          totalReviews: statsData.totalReviews || 0,
        });
      }
    } catch (error) {
      console.error("리뷰 데이터 조회 실패:", error);
    }
  };

  // 사이즈 선택 시 재고 업데이트
  useEffect(() => {
    if (size && sizeStocks[size] !== undefined) {
      const stock = sizeStocks[size];
      setCurrentSizeStock(stock);
      if (quantity > stock) {
        setQuantity(stock > 0 ? 1 : 1);
      }
    } else {
      setCurrentSizeStock(0);
      setQuantity(1);
    }
  }, [size, sizeStocks, quantity]);

  const images = useMemo(
    () =>
      cap
        ? [cap.mainImageUrl, ...(cap.imageUrls ?? [])].filter(Boolean)
        : [],
    [cap]
  );

  const toast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // sizeInfo JSON 파싱 함수
  const parseSizeInfo = (sizeInfoStr: string) => {
    try {
      const parsed = JSON.parse(sizeInfoStr);
      return parsed;
    } catch {
      return null;
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast("로그인이 필요합니다!");
      navigate("/login");
      return;
    }
    if (!cap) return;
    if (!size) return toast("사이즈를 선택해 주세요.");

    try {
      const accessToken = localStorage.getItem("access_token");

      // 1. 최신 재고 조회
      const stockRes = await fetch(`${SERVER}/cap/stocks/${cap.id}`);
      let availableStock = currentSizeStock;

      if (stockRes.ok) {
        const stocks = await stockRes.json();
        if (
          stocks &&
          typeof stocks === "object" &&
          stocks[size] !== undefined
        ) {
          availableStock = Number(stocks[size]);
        }
      }

      if (availableStock === 0) {
        return toast(`${size} 사이즈가 품절되었습니다.`);
      }

      // 2. 장바구니 현재 수량 조회
      const findUrl = `${SERVER}/cart/find?userId=${user.id}&capId=${cap.id}&size=${size}`;
      const findRes = await fetch(findUrl, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      let currentQuantity = 0;
      if (findRes.ok) {
        const data = await findRes.json();
        if (typeof data === "number") {
          currentQuantity = data;
        } else if (data && typeof data === "object" && "quantity" in data) {
          currentQuantity = data.quantity ?? 0;
        }
      }

      const totalQuantity = currentQuantity + quantity;
      if (totalQuantity > availableStock) {
        return toast(
          `재고를 초과할 수 없습니다.\n` +
            `장바구니: ${currentQuantity}개 + 추가: ${quantity}개 = ${totalQuantity}개\n` +
            `${size} 사이즈 재고: ${availableStock}개`
        );
      }

      const saveRes = await fetch(`${SERVER}/cart/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          capId: cap.id,
          quantity,
          size,
        }),
      });

      saveRes.ok
        ? toast("장바구니에 추가되었습니다!")
        : toast("장바구니 추가에 실패했습니다.");
    } catch (e) {
      console.error(e);
      toast("오류가 발생했습니다.");
    }
  };

  if (!cap) return <div className="py-12 text-center">로딩 중...</div>;

  // ---------- 공통 서브 컴포넌트들 ----------

  const ProductInfo = (
    <>
      <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">
        {cap.name}
        <span className="block text-base md:text-lg font-semibold mt-2 text-white">
          {cap.color}
        </span>
      </h1>

      <div className="text-2xl md:text-3xl font-extrabold mt-4 text-white">
        {cap.price.toLocaleString()}{" "}
        <span className="text-lg font-bold">원</span>
      </div>

      {/* SIZE */}
      <div className="mt-6">
        <label className="block text-sm font-bold tracking-wide mb-2 text-white">
          SIZE
        </label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full p-3 border border-black bg-white"
        >
          <option value="">[필수] 옵션선택</option>
          {cap.size && cap.size.length > 0 ? (
            cap.size.map((s: string) => {
              const stock = sizeStocks[s] || 0;
              const isOutOfStock = stock === 0;
              return (
                <option
                  key={s}
                  value={s}
                  disabled={isOutOfStock}
                  style={isOutOfStock ? { color: "#999" } : {}}
                >
                  {s}
                  {isOutOfStock ? " (품절)" : ""}
                </option>
              );
            })
          ) : (
            <option value="FREE">FREE (One Size)</option>
          )}
        </select>
      </div>

      {/* 수량 */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2 text-white">수량</label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24 p-2 border border-black bg-white"
          disabled={!size || currentSizeStock === 0}
        >
          {!size || currentSizeStock === 0 ? (
            <option value={1}>-</option>
          ) : (
            Array.from(
              { length: Math.min(currentSizeStock, 10) },
              (_, i) => i + 1
            ).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))
          )}
        </select>
        <div className="text-xs text-white/60 mt-1">
          {size
            ? `${size} 사이즈 재고: ${currentSizeStock}개`
            : "사이즈를 먼저 선택해주세요"}
        </div>
      </div>

      {/* 제품 설명 */}
      <div className="mt-6">
        <label className="block text-sm font-bold mb-2 text-white">제품설명</label>
        <p className="leading-relaxed text-sm md:text-base whitespace-pre-line text-white ">
          {cap.description}
        </p>
      </div>

      {/* 접는 섹션들 */}
      <div className="mt-6 space-y-3">
        <details className="group">
          <summary className="cursor-pointer select-none py-2 font-bold flex items-center justify-between text-white">
            Size <span className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="pb-3 text-sm text-white/80">
            {(() => {
              const sizeData = parseSizeInfo(cap.sizeInfo);
              if (Array.isArray(sizeData) && sizeData.length > 0) {
                const headers = Object.keys(sizeData[0]);
                return (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-black/20">
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="text-left py-2 px-2 font-bold"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeData.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-black/10">
                          {headers.map((header) => (
                            <td key={header} className="py-2 px-2">
                              {String(row[header] || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              } else if (sizeData && typeof sizeData === "object") {
                return (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-black/20">
                        <th className="text-left py-2 px-2 font-bold">사이즈</th>
                        <th className="text-left py-2 px-2 font-bold">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sizeData).map(([key, value]) => (
                        <tr key={key} className="border-b border-black/10">
                          <td className="py-2 px-2 font-semibold">{key}</td>
                          <td className="py-2 px-2">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              } else {
                return (
                  cap.sizeInfo ||
                  "FREE (머리둘레 조절 가능). * 상세 표는 출시 시 업데이트."
                );
              }
            })()}
          </div>
        </details>

        <details className="group">
          <summary className="cursor-pointer select-none py-2 font-bold flex items-center justify-between text-white">
            Shipping{" "}
            <span className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="pb-3 text-sm text-white/80">
            결제 후 1~3영업일 내 출고(택배사: 계약 예정).
          </div>
        </details>

        <details className="group">
          <summary className="cursor-pointer select-none py-2 font-bold flex items-center justify-between text-white">
            Exchange{" "}
            <span className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="pb-3 text-sm text-white/80">
            수령 7일 이내 교환/반품 가능(미착용·미훼손·택 보존).
          </div>
        </details>
      </div>
    </>
  );

  const Buttons = (
    <div className="mt-4 space-y-3">
      <button
        onClick={handleAddToCart}
        className="w-full py-4 bg-black text-white font-extrabold tracking-wide hover:opacity-90 transition-opacity"
        disabled={!size || currentSizeStock === 0}
      >
        {!size
          ? "사이즈를 선택해주세요"
          : currentSizeStock === 0
          ? "SOLD OUT"
          : "ADD TO CART"}
      </button>

      <button
        className="w-full py-4 bg-white border border-black font-extrabold tracking-wide hover:bg-gray-100 transition-colors"
        onClick={() => {
          if (!cap || !size || currentSizeStock === 0) return;
          if (!user) {
            navigate(`/login?redirect=/cap/${cap.id}`);
            return;
          }
          navigate("/buy", {
            state: {
              mode: "buy-now",
              item: {
                capId: cap.id,
                capName: cap.name,
                price: cap.price,
                quantity,
                size,
              },
            },
          });
        }}
        disabled={!size || currentSizeStock === 0}
      >
        BUY IT !
      </button>
    </div>
  );

  const ReviewSection = (
    <div className="mt-16 max-w-[900px] mx-auto">
      <div className="bg-white/20 backdrop-blur-sm p-6 shadow-lg">
        {/* 리뷰 헤더 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">리뷰</h2>
          {reviewStats.totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(reviewStats.averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-black">
                {reviewStats.averageRating.toFixed(1)} (
                {reviewStats.totalReviews}개 리뷰)
              </span>
            </div>
          )}
        </div>

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 왼쪽: 텍스트 */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= review.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-black">
                          {review.userName || "익명"} ·{" "}
                          {new Date(
                            review.createdAt
                          ).toLocaleDateString("ko-KR")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {review.capId !== cap?.id && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            상품: {review.capName}
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          구매 사이즈: {review.selectedSize}
                        </span>
                        <span className="text-black">
                          주문번호: {review.orderId}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      {review.content}
                    </p>
                  </div>

                  {/* 오른쪽: 이미지 */}
                  <div className="flex justify-center items-center">
                    {review.imageUrls && review.imageUrls.length > 0 ? (
                      <div className="grid gap-2 w-full max-w-xs">
                        {review.imageUrls.length === 1 ? (
                          <img
                            src={review.imageUrls[0]}
                            alt="리뷰 이미지"
                            className="w-full h-48 object-cover rounded-lg border shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setExpandedImage(review.imageUrls[0])
                            }
                          />
                        ) : review.imageUrls.length === 2 ? (
                          <>
                            {review.imageUrls.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`리뷰 이미지 ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setExpandedImage(imageUrl)
                                }
                              />
                            ))}
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {review.imageUrls
                              .slice(0, 4)
                              .map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`리뷰 이미지 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() =>
                                      setExpandedImage(imageUrl)
                                    }
                                  />
                                  {index === 3 &&
                                    review.imageUrls.length > 4 && (
                                      <div
                                        className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-60 transition-colors"
                                        onClick={() =>
                                          setExpandedImage(imageUrl)
                                        }
                                      >
                                        <span className="text-white text-xs font-medium">
                                          +{review.imageUrls.length - 4}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full max-w-xs h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          이미지 없음
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {reviews.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    // TODO: 전체 리뷰 페이지로 이동
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  리뷰 {reviews.length}개 모두 보기 →
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
          </p>
        )}
      </div>
    </div>
  );

  const ImagesSection = (
    <section className="md:pr-4 mt-6">
      {images.map((src, i) => (
        <figure key={i} className="mb-10 last:mb-0">
          <img
            src={src}
            alt={`${cap.name} ${i + 1}`}
            className="block mx-auto w-full max-w-[900px] h-auto object-contain"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </figure>
      ))}
      {ReviewSection}
    </section>
  );

  // ---------- 실제 렌더 ----------

  return (
    <div className="min-h-screen relative bg-transparent font-sans" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      {/* ✅ 공통 배경 이미지 (모바일/데스크탑 모두 사용) */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center z-0"
        style={{
          backgroundImage: `url('${SERVER}/images/emptyload.png')`,
        }}
      />

      {/* 토스트 메시지 */}
      {message && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-6 py-3 shadow-lg">
          {message}
        </div>
      )}

      {isMobile ? (
        // 📱 모바일 레이아웃
        <div className="pt-24 pb-12 px-4 relative">
          {/* 메인 이미지들 */}
          <section className="mt-4">
            {images.map((src, i) => (
              <figure key={i} className="mb-6 last:mb-2">
                <img
                  src={src}
                  alt={`${cap.name} ${i + 1}`}
                  className="w-full h-auto object-contain"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </figure>
            ))}
          </section>

          {/* 상품 정보 + 버튼 */}
          <section className="mt-6">
            {ProductInfo}
            {Buttons}
          </section>

          {/* 리뷰 섹션 */}
          <section className="mt-10">{ReviewSection}</section>
        </div>
      ) : (
        // 💻 데스크탑 레이아웃
        <div
          className="
            relative
            max-w-[1400px] mx-auto
            grid grid-cols-1
            md:grid-cols-[minmax(0,1fr)_minmax(0,900px)_420px]
            gap-0 md:gap-10
            px-4 md:px-6
            pt-24 md:pt-32
            pb-12
          "
        >
          {/* 좌측 여백 */}
          <div className="hidden md:block" aria-hidden />

          {/* 가운데: 이미지 + 리뷰 */}
          {ImagesSection}

          {/* 오른쪽: 상품 정보 */}
          <aside
            className="
              fixed top-10 right-10
              md:h-[calc(100vh-15rem)]
              p-0
              bg-transparent
              shadow-none border-none
              md:justify-self-end
              md:translate-x-6
              mt-8
              w-[420px] max-w-[420px]
              flex flex-col
            "
          >
            <div className="flex-1">{ProductInfo}</div>
            {Buttons}
          </aside>
        </div>
      )}

      {/* 라이트박스 */}
      <Lightbox
        imageSrc={expandedImage || ""}
        isOpen={!!expandedImage}
        onClose={() => setExpandedImage(null)}
      />
    </div>
  );
}
