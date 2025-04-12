import React, { useEffect, useState, createContext, useContext } from 'react';
import { 
  PublicClientApplication, 
  EventType, 
  EventMessage, 
  AuthenticationResult,
  AccountInfo,
  IPublicClientApplication
} from '@azure/msal-browser';
import { MsalProvider as MsalReactProvider } from '@azure/msal-react';
import msalConfig, { updateMsalConfig } from './msalConfig';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile, setMsalInstance, getAccount } from './msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';

// Define admin emails that match the ones in useAuth.tsx
const ADMIN_EMAILS = ['geosyncsurvey@gmail.com', 'admin@scpng.com'];

// Create a context for the MSAL instance
interface MsalContextValue {
  msalInstance: IPublicClientApplication | null;
  isInitialized: boolean;
  isInitializing: boolean;
  authError: Error | null;
}

export const MsalContext = createContext<MsalContextValue>({
  msalInstance: null,
  isInitialized: false,
  isInitializing: false,
  authError: null
});

// Hook to access the MSAL instance directly
export const useMsalContext = () => useContext(MsalContext);

// Component to wrap the application with the MSAL provider
// This component will initialize MSAL with the configuration from useAuth
export const MsalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [msalInstance, setMsalInstanceState] = useState<PublicClientApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const { setUser, msGraphConfig } = useAuth();

  useEffect(() => {
    const initializeMsal = async () => {
      if (isInitializing || isInitialized) return;
      
      try {
        setIsInitializing(true);
        
        // Update config with the current window location as redirectUri if running in browser
        const configToUse = typeof window !== 'undefined' 
          ? updateMsalConfig({
              ...microsoftAuthConfig,
              redirectUri: window.location.origin
            })
          : msalConfig;
          
        console.log('Initializing MSAL with config:', configToUse);
        const instance = new PublicClientApplication(configToUse);
        
        // Register event callbacks
        instance.addEventCallback((event: EventMessage) => {
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            console.log('Login success event detected');
            const result = event.payload as AuthenticationResult;
            if (result && result.account) {
              instance.setActiveAccount(result.account);
            }
          }
        });
        
        // Initialize MSAL with proper error handling
        try {
          await instance.initialize();
          console.log('MSAL initialized successfully');
        } catch (initError) {
          console.error('MSAL initialization error:', initError);
          // Continue despite initialization error - the instance can still be used
        }
        
        setMsalInstanceState(instance);
        setMsalInstance(instance);
        setIsInitialized(true);

        // Still set global instance for backward compatibility
        // This will be removed in a future version once all components use the context
        if (typeof window !== 'undefined') {
          (window as any).msalInstance = instance;
        }
        
        // Check for redirect response to handle sign-in
        try {
          const response = await instance.handleRedirectPromise();
          console.log('Checking for redirect response...');
          if (response) {
            console.log('Redirect response detected:', response);
            if (response.account) {
              // Set active account if available
              instance.setActiveAccount(response.account);
              
              // Fetch user profile
              const userProfile = await getUserProfile(instance);
              if (userProfile) {
                const userEmail = userProfile.mail || userProfile.userPrincipalName || response.account.username;
                
                // Create a properly typed user object
                setUser({
                  id: response.account.localAccountId,
                  name: response.account.name || 'Unknown',
                  email: userEmail,
                  role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                  isAdmin: ADMIN_EMAILS.includes(userEmail),
                });
                
                // For localStorage, we can use a simplified version
                localStorage.setItem('user', JSON.stringify({
                  id: response.account.localAccountId,
                  name: response.account.name || 'Unknown',
                  email: userEmail,
                  role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                  isAdmin: ADMIN_EMAILS.includes(userEmail),
                }));
                
                console.log('User profile fetched and set');
              }
            }
          } else {
            console.log('No redirect response detected');
            
            // Try to check for existing account
            const accounts = instance.getAllAccounts();
            if (accounts.length > 0) {
              const account = accounts[0];
              instance.setActiveAccount(account);
              
              const userProfile = await getUserProfile(instance);
              if (userProfile) {
                const userEmail = userProfile.mail || userProfile.userPrincipalName || account.username;
                
                // Create a properly typed user object
                setUser({
                  id: account.localAccountId,
                  name: account.name || 'Unknown',
                  email: userEmail,
                  role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                  isAdmin: ADMIN_EMAILS.includes(userEmail),
                });
                
                // For localStorage, we can use the same format
                localStorage.setItem('user', JSON.stringify({
                  id: account.localAccountId,
                  name: account.name || 'Unknown',
                  email: userEmail,
                  role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                  isAdmin: ADMIN_EMAILS.includes(userEmail),
                }));
                
                console.log('Found existing account and set user');
              }
            }
          }
        } catch (redirectError) {
          console.error('Error handling redirect:', redirectError);
          setAuthError(redirectError instanceof Error ? redirectError : new Error(String(redirectError)));
          
          // Check if user exists in localStorage as a fallback
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              console.log('Found stored user despite redirect error, restoring session');
              setUser(JSON.parse(storedUser));
            }
          } catch (e) {
            console.error('Error checking localStorage for user:', e);
          }
        }
      } catch (err) {
        console.error('Error initializing MSAL:', err);
        setAuthError(err instanceof Error ? err : new Error(String(err)));
        toast.error('Failed to initialize Microsoft authentication.');
      } finally {
        setIsInitializing(false);
      }
    };

    if (!isInitialized && !isInitializing) {
      initializeMsal();
    }
  }, [isInitialized, isInitializing, setUser, msGraphConfig]);

  // Provide context value for consumers
  const contextValue = {
    msalInstance,
    isInitialized,
    isInitializing,
    authError
  };

  if (!msalInstance) {
    return (
      <MsalContext.Provider value={contextValue}>
        {children}
      </MsalContext.Provider>
    );
  }

  return (
    <MsalContext.Provider value={contextValue}>
      <MsalReactProvider instance={msalInstance}>
        {children}
      </MsalReactProvider>
    </MsalContext.Provider>
  );
};

export default MsalAuthProvider; 