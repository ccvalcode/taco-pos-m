import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /* -------------- Helpers -------------- */
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!profile) {
        console.warn('No profile found for user:', userId);
        return null;
      }

      // Obtener permisos del usuario
      const { data: perms, error: permErr } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", profile.id);

      if (permErr) {
        console.error('Error fetching user permissions:', permErr);
      }

      return {
        ...profile,
        permissions: perms?.map((p) => p.permission) || [],
      };
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  }, [user, fetchUserProfile]);

  /* -------------- Auth flow -------------- */
  useEffect(() => {
    let mounted = true;
    let profileTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticación...');
        
        // Verificar sesión existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (!mounted) return;

        console.log('📋 Sesión inicial:', session?.user?.email || 'Sin sesión');
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Cargar perfil del usuario
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUserProfile(profile);
            console.log('👤 Perfil cargado:', profile?.name || 'Sin perfil');
          }
        } else {
          if (mounted) setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
          console.log('✅ Inicialización de auth completada');
        }
      }
    };

    // Listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Cambio de estado auth:', event, session?.user?.email || 'Sin usuario');
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Dar un poco de tiempo para que el perfil se cargue
          profileTimeout = setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUserProfile(profile);
              console.log('👤 Perfil actualizado:', profile?.name || 'Sin perfil');
            }
          }, 100);
        } else {
          if (mounted) {
            setUserProfile(null);
            console.log('🚪 Usuario deslogueado');
          }
        }
        
        if (mounted && !isInitialized) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      if (profileTimeout) clearTimeout(profileTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, isInitialized]);

  /* -------------- Auth Methods -------------- */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return { error: result.error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      return { error: result.error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  /* -------------- Permission Check -------------- */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!userProfile || !userProfile.permissions) {
      return false;
    }

    // Normalizar permisos para comparación case-insensitive
    const userPermissions = userProfile.permissions.map(p => p.toLowerCase());
    const requiredPermission = permission.toLowerCase();

    return userPermissions.includes(requiredPermission);
  }, [userProfile]);

  /* -------------- Context Value -------------- */
  const contextValue: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
