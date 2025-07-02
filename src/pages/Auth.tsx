import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      console.log("User already authenticated, redirecting...");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting login with:", email);
        const { error } = await signIn(email, password);

        if (error) {
          console.error("Login error:", error);
          throw error;
        }

        console.log("Login successful");
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente."
        });

        // No redirigimos manualmente, useEffect se encarga
      } else {
        console.log("Attempting signup with:", email);
        const { error } = await signUp(email, password, name);

        if (error) throw error;

        toast({
          title: "Cuenta creada",
          description: "Revisa tu email para confirmar tu cuenta."
        });

        // Opcional: limpiar formulario
        setName("");
        setEmail("");
        setPassword("");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Auth error:", error);

      let errorMessage = "Ocurrió un error durante la autenticación.";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Confirma tu email antes de iniciar sesión.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "El usuario ya está registrado. Intenta iniciar sesión.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🌮</div>
            <h2 className="text-2xl font-bold mb-2">¡Ya estás autenticado!</h2>
            <p className="text-gray-600 mb-4">Redirigiendo al sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🌮</div>
          <CardTitle className="text-2xl text-red-600">
            Taquería El Sabroso
          </CardTitle>
          <p className="text-gray-600">Sistema POS</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading
                ? "Procesando..."
                : isLogin
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Credenciales de prueba:
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600 font-semibold">
                  Super Admin:
                </p>
                <p className="text-xs text-gray-600">
                  Email: superadmin@taqueria.com
                </p>
                <p className="text-xs text-gray-600">Contraseña: admin123</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">
                  Admin:
                </p>
                <p className="text-xs text-gray-600">
                  Email: admin@taqueria.com
                </p>
                <p className="text-xs text-gray-600">Contraseña: admin123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
