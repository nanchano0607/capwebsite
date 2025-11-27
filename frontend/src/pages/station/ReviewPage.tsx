import { useState, useEffect } from "react";

const SERVER = "http://localhost:8080";

type Review = {
  id: number;
  userId: number;
  capId: number;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${SERVER}/reviews`);
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data: Review[] = await response.json();
        // Sort latest first
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const pagedReviews = reviews.slice(startIdx, startIdx + itemsPerPage);

  // layout constants
  const itemHeight = 130; // px per review row (approx)
  const paginationArea = 80; // px reserved for pagination + padding
  const boxHeight = itemsPerPage * itemHeight + paginationArea;

  return (
    <>
      {/* Desktop (md 이상) */}
      <div
        className="hidden md:flex md:flex-col md:justify-end min-h-screen bg-cover bg-center bg-no-repeat font-sans"
        style={{ backgroundImage: `url(${SERVER}/images/emptyload.png)` }}
      >
        <div className="w-full">
          <div className="mx-auto bg-white shadow-2xl" style={{ width: "60%"}}>
            <div className="p-6 flex flex-col" style={{ height: `${boxHeight}px` }}>
              {loading ? (
                <div className="text-center">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center">No reviews yet.</div>
              ) : (
                <>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex flex-col h-full justify-start">
                      {pagedReviews.map((review) => (
                        <div key={review.id} className="flex items-start py-4 border-b" style={{ height: `${itemHeight}px` }}>
                          <div className="w-24 h-24 mr-4 flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
                            {review.imageUrls && review.imageUrls.length > 0 ? (
                              <img
                                src={
                                  review.imageUrls[0].startsWith("http")
                                    ? review.imageUrls[0]
                                    : `${SERVER}/images/${review.imageUrls[0]}`
                                }
                                alt={`Review ${review.id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-400">사진 없음</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-yellow-500">
                                {"★".repeat(review.rating)}
                                {"☆".repeat(5 - review.rating)}
                              </div>
                              <div className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                            </div>
                            <p className="text-gray-800 mt-2">{review.content}</p>
                            <div className="text-sm text-gray-400 mt-2">ID: {review.userId} · Cap: {review.capId}</div>
                          </div>
                        </div>
                      ))}
                      {/* if less than itemsPerPage, empty space remains below — reviews stay at top */}
                    </div>
                  </div>

                  {/* Pagination controls */}
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          aria-current={page === currentPage ? "page" : undefined}
                          className={(page === currentPage ? "px-3 py-1 bg-gray-800 text-white rounded" : "px-3 py-1 bg-gray-200 rounded") + " focus:outline-none"}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile (md 미만) */}
      <div className="block md:hidden h-screen bg-cover bg-center font-sans" style={{ backgroundImage: `url(${SERVER}/images/emptyload.png)` }}>
        <div className="h-full overflow-y-auto p-4 pt-20">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl font-bold text-white">Reviews</h2>

            {loading ? (
              <div className="text-white/80">로딩 중...</div>
            ) : reviews.length === 0 ? (
              <div className="text-white">등록된 리뷰가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {pagedReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-black/50 rounded-lg flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0 overflow-hidden">
                      {review.imageUrls && review.imageUrls.length > 0 ? (
                        <img src={review.imageUrls[0].startsWith('http') ? review.imageUrls[0] : `${SERVER}/images/${review.imageUrls[0]}`} alt={`Review ${review.id}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400 p-2">사진 없음</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-yellow-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                        <div className="text-xs text-white/80">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-white mt-2">{review.content}</div>
                      <div className="text-xs text-white/60 mt-2">ID: {review.userId} · Cap: {review.capId}</div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-center space-x-2 mt-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={(page === currentPage ? 'px-3 py-1 bg-white/90 text-black rounded' : 'px-3 py-1 bg-white/20 text-white rounded') + ' focus:outline-none'}>
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
