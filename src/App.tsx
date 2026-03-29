import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ChatWidget } from "./components/ChatWidget";
import { CartDrawer } from "./components/CartDrawer";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Mantenimiento from "./pages/Mantenimiento";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminClients from "./pages/admin/AdminClients";
import CategoryPage from "./pages/CategoryPage";

const queryClient = new QueryClient({});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <Index />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/categoria/:slug"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <CategoryPage />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <ProductDetail />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/mantenimiento"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <Mantenimiento />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="clients" element={<AdminClients />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
