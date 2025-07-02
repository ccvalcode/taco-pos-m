import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signIn, signUp, loading: authLoading, isInitialized } = useAuth();

  // Obtener la ruta de donde venía el usuario
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Solo redirigir si la auth está inicializada y hay usuario
    if (isInitialized && user && !authLoading) {
      console.log('🏠 Usuario autenticado, redirigiendo a:', from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, isInitialized, authLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && !name) {
      toast({
        title: "Error",
        description: "El nombre es requerido para crear una cuenta.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login with:', email);
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        
        console.log('Login successful');
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente."
        });
        
        // La redirección se manejará en useEffect
      } else {
        console.log('Attempting signup with:', email, name);
        const { error } = await signUp(email, password, name);
        
        if (error) {
          console.error('Signup error:', error);
          throw error;
        }
        
        toast({
          title: "Cuenta creada",
          description: "Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
          duration: 7000,
        });
        
        // Cambiar a modo login después del registro
        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = "Ocurrió un error durante la autenticación.";
      
      // Mapear errores comunes a mensajes más amigables
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "El email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = "Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "El formato del email no es válido.";
      } else if (error.message) {
        errorMessage = error.message;
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

  const fillTestCredentials = (role: 'superadmin' | 'admin') => {
    if (role === 'superadmin') {
      setEmail('superadmin@taqueria.com');
      setPassword('admin123');
    } else {
      setEmail('admin@taqueria.com');
      setPassword('admin123');
    }
    setIsLogin(true);
  };

  // Si el usuario ya está autenticado, mostrar mensaje de redirección
  if (isInitialized && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🌮</div>
            <h2 className="text-2xl font-bold mb-2">¡Ya estás autenticado!</h2>
            <p className="text-gray-600 mb-4">Redirigiendo al sistema...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🌮</div>
            <h2 className="text-2xl font-bold mb-2">Cargando...</h2>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
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
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nombre completo
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
                setName('');
              }}
              className="text-sm"
              disabled={loading}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Button>
          </div>

          {/* Credenciales de prueba */}
          {isLogin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Credenciales de prueba:</p>
              <div className="space-y-3">
                <div className="p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600 font-semibold">Super Admin:</p>
                  <p className="text-xs text-gray-600">superadmin@taqueria.com</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-xs h-6"
                    onClick={() => fillTestCredentials('superadmin')}
                    disabled={loading}
                  >
                    Usar estas credenciales
                  </Button>
                </div>
                <div className="p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600 font-semibold">Admin:</p>
                  <p className="text-xs text-gray-600">admin@taqueria.com</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-xs h-6"
                    onClick={() => fillTestCredentials('admin')}
                    disabled={loading}
                  >
                    Usar estas credenciales
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
