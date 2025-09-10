import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { Search, UserRound, ShoppingBag } from "lucide-react";
import { useAuth } from "../auth/useAuth";

const primary = [
{ to: "/new", label: "New Arrivals" },
{ to: "/collections", label: "Collections" },
{ to: "/about", label: "About" },
{ to: "/contact", label: "Contact" },
];

const categories = [
{ to: "/category/fedoras", label: "FEDORAS" },
{ to: "/category/sun-hats", label: "SUN HATS" },
{ to: "/category/bowlers", label: "BOWLERS" },
{ to: "/category/beanies", label: "BEANIES" },
{ to: "/category/caps", label: "CAPS" },
];

export default function RootLayout() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return (
<div className="min-h-screen bg-slate-50 text-slate-900">
{/* Top Nav */}
<header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b border-slate-200">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="h-16 flex items-center justify-between">
<Link to="/" className="font-semibold tracking-[0.2em] text-lg">PREMIUM</Link>


<nav className="hidden md:flex items-center gap-6">
{primary.map((i) => (
<NavLink
key={i.to}
to={i.to}
className={({ isActive }) =>
`text-sm ${isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`
}
>
{i.label}
</NavLink>
))}
</nav>


<div className="flex items-center gap-4">
<button aria-label="Search" className="p-2 rounded hover:bg-slate-100">
<Search className="h-5 w-5" />
</button>


<Link
to={user && user.id ? "/account" : "/login"}
aria-label="Account"
className="p-2 rounded hover:bg-slate-100"
>
<UserRound className="h-5 w-5" />
</Link>


<button
aria-label="Cart"
className="relative p-2 rounded hover:bg-slate-100"
onClick={() => navigate("/cart")}
>
<ShoppingBag className="h-5 w-5" />
{/* Badge example: replace 3 with dynamic count */}
<span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">3</span>
</button>
</div>
</div>
</div>{/* Category bar */}
<div className="border-t border-slate-200 bg-white/90">
<div className="max-w-7xl mx-auto h-10 px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto">
{categories.map((c) => (
<NavLink
key={c.to}
to={c.to}
className={({ isActive }) =>
`text-[12px] tracking-wide ${isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`
}
>
{c.label}
</NavLink>
))}
</div>
</div>
</header>


{/* Main */}
<main>
<Outlet />
</main>


{/* Footer (minimal) */}
<footer className="border-t border-slate-200 mt-20">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-slate-500">
© {new Date().getFullYear()} CapShop. All rights reserved.
</div>
</footer>
</div>
);
}