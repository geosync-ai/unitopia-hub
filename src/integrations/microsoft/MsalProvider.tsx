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
  const { setUser } = useAuth();

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('Initializing MSAL with config:', msalConfig);
        const instance = new PublicClientApplication(msalConfig);
        await instance.initialize();
        setMsalInstanceState(instance);
        setMsalInstance(instance);
        setIsInitialized(true);
        console.log('MSAL initialized successfully');

        // Handle redirect response
        const response = await instance.handleRedirectPromise();
        if (response) {
          console.log('Handling redirect response...');
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
            } catch (error) {
              console.error('Error getting user profile after redirect:', error);
            }
          }
        }

        // Register event callbacks
        const callbackId = instance.addEventCallback((event: EventMessage) => {
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            console.log('Login success event received');
            const result = event.payload as AuthenticationResult;
            const account = result.account;
            if (account) {
              getUserProfile(instance, microsoftAuthConfig.apiEndpoint)
                .then(userProfile => {
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
                  console.log('User state updated after login success');
                })
                .catch(error => {
                  console.error('Error getting user profile after login success:', error);
                });
            }
          } else if (event.eventType === EventType.LOGIN_FAILURE) {
            console.error('Login failure event received:', event.error);
          } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
            console.log('Logout success event received');
            setUser(null);
            localStorage.removeItem('user');
          }
        });

        return () => {
          if (callbackId) {
            instance.removeEventCallback(callbackId);
          }
        };
      } catch (error) {
        console.error('Error initializing MSAL:', error);
      }
    };

    initializeMsal();
  }, [setUser]);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};

export default MsalAuthProvider; 