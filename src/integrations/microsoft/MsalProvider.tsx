import React, { useEffect, useState } from 'react';
import { 
  PublicClientApplication, 
  EventType, 
  EventMessage, 
  AuthenticationResult,
  AccountInfo
} from '@azure/msal-browser';
import { MsalProvider as MsalReactProvider } from '@azure/msal-react';
import msalConfig, { updateMsalConfig } from './msalConfig';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile, setMsalInstance, getAccount } from './msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';

const ADMIN_EMAILS = ['geosyncsurvey@gmail.com', 'admin@scpng.com'];

// Component to wrap the application with the MSAL provider
// This component will initialize MSAL with the configuration from useAuth
export const MsalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [msalInstance, setMsalInstanceState] = useState<PublicClientApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setUser, msGraphConfig } = useAuth();

  useEffect(() => {
    const initializeMsal = async () => {
      try {
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
          }
        }
      } catch (err) {
        console.error('Error initializing MSAL:', err);
        toast.error('Failed to initialize Microsoft authentication.');
      }
    };

    if (!isInitialized) {
      initializeMsal();
    }
  }, [isInitialized, setUser, msGraphConfig]);

  if (!msalInstance || !isInitialized) {
    // Don't render children until MSAL is initialized to avoid auth issues
    return <div className="flex justify-center items-center h-screen">Initializing authentication...</div>;
  }

  return (
    <MsalReactProvider instance={msalInstance}>
      {children}
    </MsalReactProvider>
  );
};

export default MsalAuthProvider; 