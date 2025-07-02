// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------- Helpers -------------- */
  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", userId)
      .single();

    if (error || !profile) return null;

    const { data: perms, error: permErr } = await supabase
      .from("user_permissions")
      .select("permission")
      .eq("user_id", profile.id);

    if (permErr) console.error(permErr);

    return {
      ...profile,
      permissions: perms?.map((p) => p.permission) || [],
    };
  };

  /* -------------- Auth flow -------------- */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const prof = await fetchUserProfile(session.user.id);
        if (mounted) setUserProfile(prof);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_evt, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const prof = await fetchUserProfile(session.user.id);
          if (mounted) setUserProfile(prof);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    init();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* -------------- Mutations -------------- */
  const signIn = async (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email: string, password: string, name: string) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/` },
    });

  const signOut = async () => supabase.auth.signOut();

  /* -------------- Permisos (fixture) -------------- */
  const hasPermission = (perm: string) =>
    (userProfile?.permissions ?? [])
      .map((p) => p.toLowerCase())
      .includes(perm.toLowerCase());

  /* -------------- Context value -------------- */
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
