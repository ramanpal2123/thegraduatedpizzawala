import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminMenu from "./pages/AdminMenu";
import AdminToppings from "./pages/AdminToppings";
import AdminOffers from "./pages/AdminOffers";
import { ThemeProvider } from "./context/ThemeContext";
import AdminSettings from "./pages/AdminSettings";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/admin" element={<AdminLogin />} />
           <Route path="/admin/forgot-password" element={<ForgotPassword />} />

          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="order/:orderId" element={<AdminOrderDetail />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="toppings" element={<AdminToppings />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
