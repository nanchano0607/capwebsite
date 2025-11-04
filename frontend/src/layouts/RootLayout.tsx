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

  // primary 메뉴를 user 상태에 따라 동적으로 생성
  const primary = useMemo(() => {
    const stationChildren = [
      { to: "/account", label: "Contact" },
      { to: "/cart", label: "Review" },
      { to: "/login", label: "Q & A" },
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
          { to: "/lookbook", label: "LOOKBOOK" },
          { to: "/about", label: "Story" },
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
    <div
      className="min-h-screen flex flex-col bg-[#fffff0]"
      style={{ overflowX: "hidden", fontFamily: "'Bangers', cursive" }}
    >
      {/* Google Font (프로덕션에선 index.html에 넣는 걸 권장) */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bangers&display=swap"
      />

      {/* 상단 네비게이션 */}
      <header className="w-full fixed top-0 z-50">
        <div className="w-full flex items-center justify-between px-6 py-3">
          {/* 로고 (빈 문자열 방지: 조건부 렌더링) */}
          <Link to="/" className="flex items-center">
            {safeSrc(logoUrl) ? (
              <img
                src={safeSrc(logoUrl)}
                alt="Hey Mr. Trucker Logo"
                className="h-24 object-contain"
                onError={(e) => {
                  // 로고가 404일 때 폴백 이미지
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/homelogo.png`;
                }}
              />
            ) : null}
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav
            className="flex items-center mr-auto ml-12"
            style={{ gap: "40px" }}
          >
            {primary.map((item) => (
              <div key={item.to} className="relative group">
                {/* 하위 메뉴가 있으면 클릭 불가능한 span, 없으면 NavLink */}
                {Array.isArray((item as any).children) && (item as any).children.length > 0 ? (
                  <span
                    className="transition-all duration-200 text-[#fff] hover:text-yellow-200 cursor-default"
                    style={{
                      fontFamily: "'Bangers', cursive",
                      letterSpacing: "2px",
                      fontSize: "28px",
                      display: "inline-block",
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
                          ? "text-yellow-300 drop-shadow-[0_0_6px_#fff]"
                          : "text-[#fff] hover:text-yellow-200",
                      ].join(" ")
                    }
                    style={{
                      fontFamily: "'Bangers', cursive",
                      letterSpacing: "2px",
                      fontSize: "28px",
                      display: "inline-block",
                    }}
                  >
                    {item.label}
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
                            className="block px-4 py-2 text-white hover:text-yellow-300 whitespace-nowrap"
                            style={{
                              fontFamily: "'Bangers', cursive",
                              letterSpacing: "1px",
                              fontSize: "20px",
                            }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            ))}
          </nav>

          {/* 우측 아이콘 영역 (항상 문자열이라 빈 src 경고 없음 + onError 폴백) */}
          <div className="flex items-center space-x-6">
            <img
              src={`${SERVER_URL}/images/searchIcon.png`}
              alt="Search"
              className="w-10 h-10 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
              }}
            />
            <Link to="/mygarage" className="inline-block">
              <img
                src={`${SERVER_URL}/images/${user ? "loginIcon" : "noLoginIcon"}.png`}
                alt="User"
                className="w-12 h-12 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${SERVER_URL}/images/emptyload.png`;
                }}
              />
            </Link>
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
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20 relative">
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
