import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ChatWidget } from "./components/ChatWidget";
import { CartDrawer } from "./components/CartDrawer";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Mantenimiento from "./pages/Mantenimiento";
import MantenimientoCompresores from "./pages/MantenimientoCompresores";
import MantenimientoExtintores from "./pages/MantenimientoExtintores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/mantenimiento" element={<Mantenimiento />} />
            <Route path="/mantenimiento-compresores" element={<MantenimientoCompresores />} />
            <Route path="/mantenimiento-extintores" element={<MantenimientoExtintores />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatWidget />
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
