import { Outlet, Link, NavLink } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/useAuth";

const SERVER_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

// 안전한 src 변환: 빈 문자열/공백/undefined/null -> undefined 로 변환
const safeSrc = (src?: string | null) =>
  src && src.trim() !== "" ? src : undefined;

export default function RootLayout() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user } = useAuth();

  // ✅ 모바일 메뉴 열림 상태
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 모바일: 하위메뉴 확장 상태 저장 (key: item.to)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) =>
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  // primary 메뉴를 user 상태에 따라 동적으로 생성
  const primary = useMemo(() => {
    const stationChildren = [
      { to: "/contact", label: "Contact" },
      { to: "/reviews", label: "Review" },
      { to: "/qna", label: "Q & A" },
    ];

    // 관리자인 경우 Admin 메뉴 추가
    if (user?.isAdmin) {
      stationChildren.push({ to: "/admin", label: "Admin" });
    }

    return [
      { to: "/new", label: "NEW" },
      {
        to: "/shop",
        label: "SHOP",
        children: [
          { to: "/cap", label: "CAP" },
          { to: "/acc", label: "Acc" },
        ],
      },
      { to: "/mygarage", label: "MY GARAGE" },
      {
        to: "/route",
        label: "ROUTE",
        children: [
          { to: "/logbook", label: "LOGBOOK" },
          { to: "/story", label: "Story" },
        ],
      },
      {
        to: "/station",
        label: "STATION",
        children: stationChildren,
      },
    ];
  }, [user?.isAdmin]);

  useEffect(() => {
    fetch(`${SERVER_URL}/logo`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setLogoUrl(data?.url || null))
      .catch(() => setLogoUrl(null));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fffff0]" style={{ overflowX: "hidden" }}>
      {/* Bangers font removed - replaced by local Beaver Punch */}

      {/* 상단 네비게이션 */}
      <header className="w-full fixed top-0 z-50 bg-transparent">
        {/* ===== 상단 바 (공통) ===== */}
        <div className="w-full flex items-center justify-between px-4 md:px-6 py-3">
          {/* 로고 */}
          <Link to="/" className="flex items-center">
            {safeSrc(logoUrl) ? (
              <img
                src={safeSrc(logoUrl)}
                alt="Hey Mr. Trucker Logo"
                className="h-16 md:h-24 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/homelogo.png`;
                }}
              />
            ) : null}
          </Link>

          {/* ===== 데스크탑 네비 (md 이상에서만 보임) ===== */}
          <nav
            className="hidden md:flex items-center mr-auto ml-12"
            style={{ gap: "40px" }}
          >
            {primary.map((item) => (
              <div key={item.to} className="relative group">
                {/* 하위 메뉴가 있으면 클릭 불가능한 span, 없으면 NavLink */}
                {Array.isArray((item as any).children) &&
                (item as any).children.length > 0 ? (
                  <span
                    className="transition-all duration-200 text-white hover:text-gray-200 cursor-default font-beaver"
                    style={{
                      transform: "scaleY(1.3)",
                      letterSpacing: "2px",
                      fontSize: "30px",
                      display: "inline-block",
                      transformOrigin: "center",
                    }}
                  >
                    {item.label}
                  </span>
                ) : (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "transition-all duration-200",
                          isActive
                            ? "text-white drop-shadow-[0_0_6px_#fff]"
                            : "text-white hover:text-gray-200",
                      ].join(" ")
                    }
                    style={{
                      transform: "scaleY(1.3)",
                      transformOrigin: "center", 
                      letterSpacing: "2px",
                      fontSize: "30px",
                      display: "inline-block",
                    }}
                    // Tailwind class for Beaver Punch
                    // Add className via innerProps: we'll merge using className above
                    
                    // Note: NavLink's className prop already returns classes; append font-beaver via style below
                    
                    
                  >
                    <span className="font-beaver">{item.label}</span>
                  </NavLink>
                )}

                {Array.isArray((item as any).children) &&
                  (item as any).children.length > 0 && (
                    <>
                      {/* hover 브리지: 부모 메뉴와 속메뉴 사이 갭에서 hover 유지 */}
                      <div className="absolute left-0 top-full h-2 w-full hidden group-hover:block" />
                      <div
                        className="absolute left-0 top-full hidden group-hover:block"
                        style={{
                          minWidth: "180px",
                          background: "transparent",
                          border: "2px solid transparent",
                          boxShadow: "none",
                          padding: "8px 0",
                          borderRadius: "6px",
                          zIndex: 60,
                        }}
                      >
                        {(item as any).children.map((child: any) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="block px-4 py-2 text-white hover:text-gray-200 whitespace-nowrap text-outline-black"
                            style={{
                              letterSpacing: "1px",
                              fontSize: "20px",
                            }}
                          >
                            <span className="font-beaver">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            ))}
          </nav>

          {/* ===== 데스크탑 우측 아이콘 (md 이상) ===== */}
          <div className="hidden md:flex items-center space-x-6">
            <img
              src={`${SERVER_URL}/images/searchIcon.png`}
              alt="Search"
              className="w-20 h-15 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
              }}
            />
            <Link to="/mygarage" className="inline-block">
              <img
                src={`${SERVER_URL}/images/${user ? "loginIcon" : "noLoginIcon"}.png`}
                alt="User"
                className="w-15 h-15 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </Link>
            <Link to="/cart" className="inline-block">
              <img
                src={`${SERVER_URL}/images/cartIcon.png`}
                alt="Cart"
                className="w-18 h-15 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </Link>
          </div>

          {/* ===== 모바일 우측 영역 (md 미만) ===== */}
          <div className="flex items-center space-x-3 md:hidden">
            {/* 검색 아이콘 */}
            <button
              type="button"
              aria-label="search"
              className="inline-block"
              onClick={() => {
                /* 필요 시 검색 모달 오픈 로직 추가 */
              }}
            >
              <img
                src={`${SERVER_URL}/images/searchIcon.png`}
                alt="Search"
                className="w-10 h-10 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </button>

            {/* 유저 아이콘 */}
            <Link to="/mygarage" className="inline-block">
              <img
                src={`${SERVER_URL}/images/${user ? "loginIcon" : "noLoginIcon"}.png`}
                alt="User"
                className="w-10 h-10 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </Link>

            {/* 장바구니 아이콘 */}
            <Link to="/cart" className="inline-block">
              <img
                src={`${SERVER_URL}/images/cartIcon.png`}
                alt="Cart"
                className="w-10 h-10 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </Link>

            {/* 햄버거 버튼 */}
            <button
              type="button"
              className="flex flex-col justify-center items-center w-9 h-9 border border-yellow-400 rounded-md bg-transparent"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="block w-5 h-0.5 bg-yellow-500 mb-1" />
              <span className="block w-5 h-0.5 bg-yellow-500 mb-1" />
              <span className="block w-5 h-0.5 bg-yellow-500" />
            </button>
          </div>
        </div>

        {/* ===== 모바일: 오른쪽 오프캔버스 메뉴 (md 미만) ===== */}
        {mobileMenuOpen && (
          <>
            {/* 스크린 오버레이: 클릭 시 닫힘 */}
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* 오른쪽 패널 */}
            <aside className="fixed top-0 right-0 h-full w-50 md:hidden z-50 bg-transparent border-l border-yellow-200 shadow-md mt-20">
              <div className="h-full px-4 py-6 overflow-y-auto">
                {primary
                  .filter((it) => it.to !== "/new")
                  .map((item) => {
                  const hasChildren = Array.isArray((item as any).children) && (item as any).children.length > 0;
                  const isExpanded = !!expandedItems[item.to];

                  return (
                    <div key={item.to} className="mb-3">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.to)}
                          className="w-full flex items-center justify-between text-white text-lg tracking-widest font-beaver px-2 py-2 hover:text-gray-200"
                        >
                          <span className="text-left">{item.label}</span>
                          <span className={`ml-3 transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                            ▶
                          </span>
                        </button>
                      ) : (
                        <NavLink
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            [
                              "block text-white text-lg tracking-widest px-2 py-2",
                              isActive ? "font-semibold" : "hover:text-gray-200",
                            ].join(" ")
                          }
                        >
                          {item.label}
                        </NavLink>
                      )}

                      {/* 하위 메뉴 (토글로 표시) */}
                      {hasChildren && isExpanded && (
                        <div className="pl-4 mt-2 space-y-1">
                          {(item as any).children.map((child: any) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={() => setMobileMenuOpen(false)}
                              className={({ isActive }) =>
                                [
                                  "block text-base text-white hover:text-gray-200",
                                  isActive ? "font-semibold" : "",
                                ].join(" ")
                              }
                            >
                              <span className="font-beaver">{child.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </>
        )}
      </header>

      <main className="flex-1 pt-24 md:pt-20 relative">
        {/* Outlet 래퍼: 빈 src 문제 없음 */}
        <div className="absolute inset-0">
          <Outlet />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="fixed bottom-3 right-3 text-xs text-slate-600 pointer-events-none">
        © {new Date().getFullYear()} Instagram @nanchano_
      </footer>
    </div>
  );
}
