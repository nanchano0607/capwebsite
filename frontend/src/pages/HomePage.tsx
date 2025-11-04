import { useRef, useEffect, useState } from "react";

const SERVER = "http://localhost:8080";

function isVideo(url: string) {
  const clean = (url || "").split(/[?#]/)[0].toLowerCase();
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".ogg");
}

export default function HomePage() {
  const [bgUrl, setBgUrl] = useState<string>("");
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 비디오 종료 후 보여줄 이미지
  const fallbackImage = `${SERVER}/images/background.png`;

  // 배경 리소스 URL 가져오기
  useEffect(() => {
    fetch(`${SERVER}/background`, { method: "GET" })
      .then((res) => res.json())
      .then((data) => setBgUrl(data?.url ?? ""))
      .catch(() => setBgUrl(""));
  }, []);

  // 자동재생 시도 (항상 1회 재생 후 이미지로 전환)
  useEffect(() => {
    if (!bgUrl || !isVideo(bgUrl)) return;

    const el = videoRef.current;
    if (!el) return;

    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";

    const tryPlay = async () => {
      try {
        await el.play();
      } catch {
        setTimeout(() => el.play().catch(() => {}), 100);
      }
    };
    tryPlay();
  }, [bgUrl]);

  const handleVideoEnd = () => setVideoEnded(true);
  const handleVideoError = () => {
    setVideoError(true);
    setVideoEnded(true);
  };

  // 렌더링 조건
  const showVideo = !!bgUrl && isVideo(bgUrl) && !videoEnded && !videoError;

  // --- 스크롤 리빌 ---
  const [, setImageVisible] = useState([false, false, false]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const imageObserver = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idxAttr = entry.target.getAttribute("data-image-idx");
          if (idxAttr == null) return;
          const idx = Number(idxAttr);
          setImageVisible((prev) => {
            if (prev[idx] === entry.isIntersecting) return prev;
            const next = [...prev];
            next[idx] = entry.isIntersecting;
            return next;
          });
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" }
    );

    imageRefs.current.forEach((el) => el && imageObserver.observe(el));
    return () => imageObserver.disconnect();
  }, []);

  return (
    <>
      {/* ===== Hero Section ===== */}
      <section className="bg-[#FFFFF0] w-full relative">
        {/* 비디오 (항상 1회 재생) */}
        {showVideo && (
          <div
            className={`absolute inset-0 w-full h-screen transition-opacity duration-700 ${
              videoEnded ? "opacity-0" : "opacity-100"
            }`}
            style={{ zIndex: 1 }}
          >
            <video
              ref={videoRef}
              src={bgUrl}
              autoPlay
              loop={false}
              muted
              playsInline
              preload="auto"
              poster={fallbackImage}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 폴백 이미지 (비디오 종료/에러/비디오가 아닌 경우) */}
        {(!showVideo || videoEnded || videoError) && (
          <div
            className={`absolute inset-0 w-full h-screen bg-cover bg-center transition-opacity duration-700 ${
              videoEnded || videoError || !showVideo ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url('${isVideo(bgUrl) ? fallbackImage : (bgUrl || fallbackImage)}')`,
              zIndex: 0,
            }}
          />
        )}

        {/* 레이아웃 높이 확보 */}
        <div style={{ height: "100vh" }} />
      </section>
    </>
  );
}
