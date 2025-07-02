
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { ShoppingCart, ChefHat, BarChart3, Users, Calculator } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { userProfile, hasPermission } = useAuth();

  const quickActions = [
    { 
      icon: ShoppingCart, 
      title: "Punto de Venta", 
      description: "Procesar órdenes y ventas",
      path: "/",
      color: "bg-blue-500",
      permission: "pos_access"
    },
    { 
      icon: ChefHat, 
      title: "Cocina", 
      description: "Ver órdenes pendientes",
      path: "/kitchen",
      color: "bg-red-500",
      permission: "kitchen_access"
    },
    { 
      icon: BarChart3, 
      title: "Ventas", 
      description: "Revisar reportes de ventas",
      path: "/sales",
      color: "bg-green-500",
      permission: "sales_view"
    },
    { 
      icon: Users, 
      title: "Usuarios", 
      description: "Gestionar usuarios y permisos",
      path: "/users",
      color: "bg-indigo-500",
      permission: "users_manage"
    },
    { 
      icon: Calculator, 
      title: "Corte de Caja", 
      description: "Realizar corte de caja",
      path: "/cash-cut",
      color: "bg-yellow-500",
      permission: "cash_manage"
    }
  ];

  const availableActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="text-6xl">🌮</div>
            <div>
              <h1 className="text-3xl font-bold">¡Bienvenido a Taquería El Sabroso!</h1>
              <p className="text-orange-100">Sistema de Punto de Venta</p>
              {userProfile && (
                <p className="text-sm text-orange-200 mt-1">
                  Hola, {userProfile.name} ({userProfile.role.replace('_', ' ')})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acciones Rápidas</h2>
          <p className="text-gray-600">Selecciona una opción para comenzar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {availableActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={action.path}
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-200"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">{action.description}</p>
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Ir a {action.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availableActions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin Permisos</h3>
            <p className="text-gray-500">No tienes permisos para acceder a ningún módulo del sistema.</p>
            <p className="text-sm text-gray-400 mt-2">Contacta al administrador para obtener acceso.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
