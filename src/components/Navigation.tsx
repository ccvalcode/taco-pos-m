
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ShoppingCart, 
  ChefHat, 
  BarChart3, 
  Users, 
  Calculator,
  Menu,
  X,
  FileText,
  Package,
  PieChart,
  LogOut
} from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: ShoppingCart, label: "POS", color: "bg-blue-500" },
    { path: "/kitchen", icon: ChefHat, label: "Cocina", color: "bg-red-500" },
    { path: "/orders", icon: FileText, label: "Órdenes", color: "bg-orange-500" },
    { path: "/sales", icon: BarChart3, label: "Ventas", color: "bg-green-500" },
    { path: "/inventory", icon: Package, label: "Inventario", color: "bg-purple-500" },
    { path: "/users", icon: Users, label: "Usuarios", color: "bg-indigo-500" },
    { path: "/cash-cut", icon: Calculator, label: "Corte", color: "bg-yellow-500" },
    { path: "/reports", icon: PieChart, label: "Reportes", color: "bg-pink-500" },
  ];

  const handleLogout = async () => {
    // TODO: Implementar logout real cuando se implemente el contexto de auth
    navigate('/auth');
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón flotante para abrir menú */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
        size="sm"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Overlay del menú */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Menú lateral */}
      <Card className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">🌮 El Sabroso</h2>
              <p className="text-sm text-orange-100">Sistema POS</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full justify-start gap-3 h-12 ${
                  isActive ? `${item.color} text-white` : 'hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
          
          <div className="border-t pt-4 mt-6">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 h-12 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default Navigation;
