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
import { useAuth, UserRole } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile, setMsalInstance, getAccount } from './msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';

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
        
        await instance.initialize();
        setMsalInstanceState(instance);
        setMsalInstance(instance);
        setIsInitialized(true);
        console.log('MSAL initialized successfully');

        // Still set global instance for backward compatibility
        // This will be removed in a future version once all components use the context
        (window as any).msalInstance = instance;

        // Handle redirect response
        if (typeof window !== 'undefined') {
          try {
            console.log('Checking for redirect response...');
            const response = await instance.handleRedirectPromise();
            
            if (response) {
              console.log('Handling redirect response...', response);
              const account = getAccount(instance);
              if (account) {
                try {
                  const userProfile = await getUserProfile(instance, microsoftAuthConfig.apiEndpoint);
                  const userObj = {
                    id: account.localAccountId,
                    email: account.username,
                    name: userProfile.displayName || account.name || account.username.split('@')[0],
                    role: ADMIN_EMAILS.includes(account.username.toLowerCase()) ? 'admin' as UserRole : 'user' as UserRole,
                    accessToken: 'ms-token',
                    profilePicture: userProfile.photo || undefined
                  };
                  
                  setUser(userObj);
                  localStorage.setItem('user', JSON.stringify(userObj));
                  console.log('User state updated after redirect');
                  toast.success(`Welcome, ${userObj.name}! You're now signed in.`);
                } catch (profileError) {
                  console.error('Error getting user profile after redirect:', profileError);
                  toast.error('Signed in, but had trouble getting your profile details.');
                }
              }
            } else {
              console.log('No redirect response detected');
            }
          } catch (redirectError) {
            console.error('Error handling redirect:', redirectError);
            setAuthError(redirectError instanceof Error ? redirectError : new Error(String(redirectError)));
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

  // Enhanced loading state that provides more information
  if (!msalInstance || !isInitialized) {
    // Don't render children until MSAL is initialized to avoid auth issues
    return (
      <MsalContext.Provider value={contextValue}>
        <div className="flex flex-col justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-center">
            <p className="text-lg font-semibold">Initializing authentication...</p>
            {authError && (
              <p className="text-sm text-red-600 mt-2">
                {authError.message}
              </p>
            )}
          </div>
        </div>
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