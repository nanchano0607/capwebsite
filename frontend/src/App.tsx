import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyGaragePage from "./pages/mygarage/MyGaragePage";
import LicensePage from "./pages/mygarage/LicensePage";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import BestPage from "./pages/LookBookPage";

import CapPage from "./pages/CapPage";
import LookBookPage from "./pages/LookBookPage";
import CapDetailPage from "./pages/CapDetailPage";
import NewPage from "./pages/NewPage";

import RegisterPage from "./pages/LegisterPage";
import SignUp from "./pages/SignUp";
import { CartProvider } from "./auth/CartContext";
import BuyPage from "./pages/BuyPage";
import PaymentPage from "./pages/PaymentPage";
import AddressPage from "./pages/mygarage/AddressPage";
import SuccessPage from "./pages/SuccessPage";
import FailPage from "./pages/FailPage";
import OrderPage from "./pages/mygarage/OrderPage";
import PointsPage from "./pages/mygarage/PointsPage";
import AdminPage from "./pages/AdminPage";
import ReviewWritePage from "./pages/ReviewWritePage";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/new" element={<NewPage />} />
            <Route path="/best" element={<BestPage />} />
            <Route path="/cap" element={<CapPage />} />
            <Route path="/cap/:id" element={<CapDetailPage />} />
            <Route path="/lookbook" element={<LookBookPage />} />
            <Route path="/collections" element={<CollectionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/register" element={<RegisterPage />} /> {/* 등록 페이지 추가 */}
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
              path="/mygarage"
              element={
                <ProtectedRoute>
                  <MyGaragePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/address"
              element={
                <ProtectedRoute>
                  <AddressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/license"
              element={
                <ProtectedRoute>
                  <LicensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order"
              element={
                <ProtectedRoute>
                  <OrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/points"
              element={
                <ProtectedRoute>
                  <PointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/success" element={<LoginPage success />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/buy"
              element={
                <ProtectedRoute>
                  <BuyPage />
                </ProtectedRoute>
              }
            />
            <Route path="/payment" element={<PaymentPage />} />
            <Route 
              path="/review/write"
              element={
                <ProtectedRoute>
                  <ReviewWritePage />
                </ProtectedRoute>
              }
            />
            <Route path="/success" element={<SuccessPage />} /> {/* 결제 성공 페이지 */}
            <Route path="/fail" element={<FailPage />} /> {/* 결제 실패 페이지 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

