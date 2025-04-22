import { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import {
  signInWithProvider,
  signInWithEmail,
  signOut,
  getCurrentUser,
  getCurrentSession,
  setupAuthStateListener
} from '@/integrations/supabase/supabaseAuth';
import { AccountInfo } from '@azure/msal-browser';
import { supabase } from '@/lib/supabaseClient';

// Auth context type
interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github' | 'azure') => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

// Create context
const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Provider component
export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current session and user
        const currentSession = await getCurrentSession();
        setSession(currentSession);
        
        if (currentSession) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
        
        // Listen for auth state changes
        const subscription = setupAuthStateListener((event, session) => {
          console.log('[SupabaseAuthProvider] Auth event:', event);
          setSession(session);
          setUser(session?.user || null);
          
          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              toast.success('Signed in successfully');
              break;
            case 'SIGNED_OUT':
              toast.info('Signed out');
              break;
            case 'USER_UPDATED':
              toast.info('User information updated');
              break;
            case 'TOKEN_REFRESHED':
              // Silently handle token refresh
              break;
            default:
              // Handle other events
              break;
          }
        });
        
        return () => {
          // Clean up subscription
          subscription?.unsubscribe();
        };
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          toast.error(`Authentication error: ${err.message}`);
        } else {
          setError('An unknown error occurred');
          toast.error('An unknown authentication error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login with email and password
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await signInWithEmail(email, password);
      setSession(data.session);
      setUser(data.user);
      
      return Promise.resolve();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Login failed: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        toast.error('Login failed. Please try again.');
      }
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with a provider
  const loginWithProvider = async (provider: 'google' | 'github' | 'azure') => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signInWithProvider(provider);
      
      // The authentication will happen through the redirect flow,
      // so we don't update state here
      
      return Promise.resolve();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Login failed: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        toast.error('Login failed. Please try again.');
      }
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signOut();
      setSession(null);
      setUser(null);
      
      return Promise.resolve();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Logout failed: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        toast.error('Logout failed. Please try again.');
      }
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: SupabaseAuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    loginWithEmail,
    loginWithProvider,
    logout,
    error,
    setUser
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// Hook for using the auth context
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}; 