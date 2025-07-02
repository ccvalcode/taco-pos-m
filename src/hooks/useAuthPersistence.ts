// hooks/useAuthPersistence.ts
import { useEffect, useState } from 'react';

interface AuthPersistenceState {
  isInitialized: boolean;
  hasCheckedSession: boolean;
}

/**
 * Hook para manejar la persistencia del estado de autenticación
 * Ayuda a evitar redirects prematuros durante la inicialización
 */
export const useAuthPersistence = () => {
  const [state, setState] = useState<AuthPersistenceState>({
    isInitialized: false,
    hasCheckedSession: false,
  });

  useEffect(() => {
    // Marcar como inicializado después de un pequeño delay
    // para permitir que Supabase verifique la sesión
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isInitialized: true,
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const markSessionChecked = () => {
    setState(prev => ({
      ...prev,
      hasCheckedSession: true,
    }));
  };

  return {
    ...state,
    markSessionChecked,
  };
};
