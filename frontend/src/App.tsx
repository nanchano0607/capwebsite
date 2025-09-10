import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";


export default function App() {
return (
<AuthProvider>
<Routes>
<Route element={<RootLayout />}>
<Route index element={<HomePage />} />
<Route path="/collections" element={<CollectionPage />} />
<Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
{/* Categories mimic screenshot */}
<Route path="/category/:slug" element={<CollectionPage />} />
<Route
path="/cart"
element={
<ProtectedRoute>
<CartPage />
</ProtectedRoute>
}
/>
<Route
path="/checkout"
element={
<ProtectedRoute>
<CheckoutPage />
</ProtectedRoute>
}
/>
<Route
path="/account"
element={
<ProtectedRoute>
<AccountPage />
</ProtectedRoute>
}
/>
<Route path="/login" element={<LoginPage />} />
<Route path="/login/success" element={<LoginPage success />} />
<Route path="*" element={<Navigate to="/" replace />} />
</Route>
</Routes>
</AuthProvider>
);
}

