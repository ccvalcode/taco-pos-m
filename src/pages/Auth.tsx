// src/pages/Auth.tsx
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Auth: React.FC = () => {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando sesión…</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const action = isRegister
      ? await signUp(email, password, name)
      : await signIn(email, password);

    if (action.error) {
      setError(action.error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 border rounded shadow-md w-full max-w-sm"
      >
        {isRegister && (
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded bg-blue-600 text-white"
        >
          {isRegister ? "Registrar" : "Iniciar sesión"}
        </button>
        <div
          className="text-center text-sm text-blue-600 cursor-pointer"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </div>
      </form>
    </div>
  );
};

export default Auth;
