
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ShoppingCart, 
  ChefHat, 
  BarChart3, 
  Users, 
  Calculator,
  Home
} from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: ShoppingCart, label: "POS - Ventas", color: "bg-blue-500" },
    { path: "/kitchen", icon: ChefHat, label: "Cocina", color: "bg-red-500" },
    { path: "/sales", icon: BarChart3, label: "Ventas Realizadas", color: "bg-green-500" },
    { path: "/users", icon: Users, label: "Usuarios y Turnos", color: "bg-purple-500" },
    { path: "/cash-cut", icon: Calculator, label: "Corte de Caja", color: "bg-orange-500" },
  ];

  return (
    <Card className="fixed top-4 right-4 p-2 bg-white/95 backdrop-blur-sm shadow-lg z-50">
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className={`justify-start gap-2 ${isActive ? item.color : 'hover:bg-gray-100'}`}
              title={item.label}
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default Navigation;
