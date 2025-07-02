import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import POS from "./pages/POS";
import Kitchen from "./pages/Kitchen";
import Orders from "./pages/Orders";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import CashCut from "./pages/CashCut";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Configuración del QueryClient con mejores defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Ruta de autenticación - siempre accesible */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Ruta principal - POS */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas protegidas con permisos específicos */}
            <Route 
              path="/kitchen" 
              element={
                <ProtectedRoute requiredPermission="kitchen_access">
                  <Kitchen />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/sales" 
              element={
                <ProtectedRoute requiredPermission="sales_view">
                  <Sales />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute requiredPermission="inventory_manage">
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredPermission="users_manage">
                  <Users />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/cash-cut" 
              element={
                <ProtectedRoute requiredPermission="cash_manage">
                  <CashCut />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredPermission="reports_view">
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta catch-all para 404 - DEBE ir al final */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
