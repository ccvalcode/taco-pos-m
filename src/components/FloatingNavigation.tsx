import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart,
  ChefHat,
  Users,
  Package,
  BarChart3,
  Calculator,
  FileText,
  LogOut,
  Menu,
  X,
  Home
} from "lucide-react";

const FloatingNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Inicio", path: "/dashboard", permission: null },
    { icon: ShoppingCart, label: "POS", path: "/", permission: "pos_access" },
    { icon: ChefHat, label: "Cocina", path: "/kitchen", permission: "kitchen_access" },
    { icon: Package, label: "Inventario", path: "/inventory", permission: "inventory_manage" },
    { icon: BarChart3, label: "Ventas", path: "/sales", permission: "sales_view" },
    { icon: Users, label: "Usuarios", path: "/users", permission: "users_manage" },
    { icon: Calculator, label: "Corte", path: "/cash-cut", permission: "cash_manage" },
    { icon: FileText, label: "Reportes", path: "/reports", permission: "reports_view" },
  ];

  const availableItems = navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu items */}
      {isOpen && (
        <div className="mb-4 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2">
          {availableItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "secondary"}
                className="shadow-lg min-w-[120px] justify-start"
                onClick={() => handleNavigate(item.path)}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
          
          {/* Logout button */}
          <Button
            variant="destructive"
            className="shadow-lg min-w-[120px] justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      )}

      {/* Toggle button */}
      <Button
        className="rounded-full h-14 w-14 p-0 shadow-xl bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>
    </div>
  );
};

export default FloatingNavigation;