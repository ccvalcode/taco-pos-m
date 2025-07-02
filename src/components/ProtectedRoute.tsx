// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredPermission }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando…</div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <Navigate to="/auth" replace />;
  }

  // Si requieres lógica adicional de permisos, agrégala aquí
  return <>{children}</>;
};

export default ProtectedRoute;
