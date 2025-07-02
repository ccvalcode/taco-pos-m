import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, userProfile, loading, hasPermission } = useAuth();

  console.log(
    "ProtectedRoute",
    JSON.stringify({
      loading,
      hasUser: !!user,
      hasProfile: !!userProfile,
      requiredPermission
    })
  );

  // 🚧 Todavía cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-xl font-semibold text-gray-600">
            Cargando...
          </div>
        </Card>
      </div>
    );
  }

  // 🚫 No hay sesión iniciada
  if (!user) {
    console.warn("ProtectedRoute: No user, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // 🚫 Usuario sin perfil creado en DB
  if (!userProfile) {
    console.error("ProtectedRoute: Usuario autenticado pero sin perfil en DB.");
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">
            Perfil Incompleto
          </h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta está activa, pero no tiene un perfil asignado en la base de datos.
          </p>
          <p className="text-sm text-gray-500">
            Contacta a un administrador para que cree tu perfil.
          </p>
        </Card>
      </div>
    );
  }

  // 🚫 Usuario sin permisos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.warn(
      `ProtectedRoute: Access denied. Missing permission "${requiredPermission}"`
    );
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Tu rol actual:{" "}
            <span className="font-semibold">{userProfile.role}</span>
          </p>
        </Card>
      </div>
    );
  }

  // ✅ Todo correcto
  return <>{children}</>;
};

export
