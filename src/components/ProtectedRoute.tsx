import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, userProfile, loading, hasPermission, signOut } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute render:', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!userProfile,
    requiredPermission,
    currentPath: location.pathname 
  });

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-600">
            Verificando autenticación...
          </div>
        </Card>
      </div>
    );
  }

  // Si no hay usuario después de cargar, redirigir a login
  if (!loading && !user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si se requiere un perfil de usuario pero no está disponible YET
  // Damos un poco más de tiempo para que se cargue el perfil
  if (user && !userProfile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-600">
            Cargando perfil de usuario...
          </div>
        </Card>
      </div>
    );
  }

  // Verificar permisos si son requeridos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Permiso requerido:</span> {requiredPermission}
            </p>
            {userProfile && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Tu rol:</span> {userProfile.role}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Tus permisos:</span>{' '}
                  {userProfile.permissions && userProfile.permissions.length > 0
                    ? userProfile.permissions.join(', ')
                    : 'Ninguno asignado'}
                </p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => window.history.back()} 
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Regresar
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Ir al Inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Si todas las verificaciones pasan, renderizar el componente hijo
  return <>{children}</>;
};

export default ProtectedRoute;
