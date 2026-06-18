import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ChatWidget } from "./components/ChatWidget";
import { CartDrawer } from "./components/CartDrawer";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute as AdminProtectedRoute } from "./components/admin/ProtectedRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Mantenimiento from "./pages/Mantenimiento";
import NotFound from "./pages/NotFound";
import PagoExitoso from "./pages/PagoExitoso";
import Ticket from "./pages/Ticket";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminClients from "./pages/admin/AdminClients";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminCertificates from "./pages/admin/AdminCertificates";
import PortalHome from "./pages/portal/PortalHome";
import PortalCertificates from "./pages/portal/PortalCertificates";
import PortalOrders from "./pages/portal/PortalOrders";
import VerifyCertificate from "./pages/VerifyCertificate";
import VerifyEquipment from "./pages/VerifyEquipment";
import AdminEquipment from "./pages/admin/AdminEquipment";
import AdminQrPrint from "./pages/admin/AdminQrPrint";
import AdminContent from "./pages/admin/AdminContent";
import AdminStripeAudit from "./pages/admin/AdminStripeAudit";
import AdminCRM from "./pages/admin/AdminCRM";
import AdminPaymentEvents from "./pages/admin/AdminPaymentEvents";
import CategoryPage from "./pages/CategoryPage";
import ServiceDetail from "./pages/ServiceDetail";
import RastreoMantenimiento from "./pages/RastreoMantenimiento";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/Callback";
import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";
import Unsubscribe from "./pages/Unsubscribe";
import CambiosDevoluciones from "./pages/CambiosDevoluciones";
import PrivacidadGlobal from "./pages/PrivacidadGlobal";

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
                path="/mantenimiento/:serviceId"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <ServiceDetail />
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
                      <Route path="/pago-exitoso" element={<PagoExitoso />} />
              <Route path="/ticket/:token" element={<Ticket />} />
              <Route
                path="/rastreo"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <RastreoMantenimiento />
                    <Footer />
                  </>
                }
              />

              {/* Auth routes (public) */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Legal */}
              <Route
                path="/privacidad"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <Privacidad />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/terminos"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <Terminos />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/cambios-devoluciones"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <CambiosDevoluciones />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route
                path="/privacidad-global"
                element={
                  <>
                    <Navbar />
                    <CartDrawer />
                    <PrivacidadGlobal />
                    <Footer />
                    <ChatWidget />
                  </>
                }
              />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="clients" element={<AdminClients />} />
                <Route path="maintenance" element={<AdminMaintenance />} />
                <Route path="calendario" element={<AdminCalendar />} />
                <Route path="certificados" element={<AdminCertificates />} />
                <Route path="equipos" element={<AdminEquipment />} />
                <Route path="contenido" element={<AdminContent />} />
                <Route path="auditoria" element={<AdminStripeAudit />} />
                <Route path="crm" element={<AdminCRM />} />
              </Route>

              {/* Print view (admin auth required) */}
              <Route path="/admin/qr-print" element={<AdminProtectedRoute><AdminQrPrint /></AdminProtectedRoute>} />

              {/* Customer portal (authenticated) */}
              <Route path="/portal" element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
              <Route path="/portal/certificados" element={<ProtectedRoute><PortalCertificates /></ProtectedRoute>} />
              <Route path="/portal/pagos" element={<ProtectedRoute><PortalOrders /></ProtectedRoute>} />

              {/* Public verification (QR targets) */}
              <Route path="/verificar/certificado/:token" element={<VerifyCertificate />} />
              <Route path="/verificar/equipo/:token" element={<VerifyEquipment />} />
              {/* Legacy alias for already-printed QRs */}
              <Route path="/verificar/:token" element={<VerifyCertificate />} />

              <Route path="/index" element={<Navigate to="/" replace />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
