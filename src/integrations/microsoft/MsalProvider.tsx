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
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile } from './msalService';

// Component to wrap the application with the MSAL provider
// This component will initialize MSAL with the configuration from useAuth
export const MsalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { msGraphConfig, setUser } = useAuth();
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  
  useEffect(() => {
    if (msGraphConfig) {
      try {
        console.log('Initializing MSAL with config:', msGraphConfig);
        console.log('Using redirectUri:', msGraphConfig.redirectUri || window.location.origin);
        console.log('Current window.location.origin:', window.location.origin);
        
        // Create Config object
        const config = updateMsalConfig(msGraphConfig);
        
        // Initialize MSAL instance
        const instance = new PublicClientApplication(config);
        
        // Set the instance for global access
        window.msalInstance = instance;
        
        // Check if we're returning from a redirect
        instance.handleRedirectPromise().then((response) => {
          if (response) {
            console.log('Handling redirect response:', response);
            // We have a response from the redirect, which means we're returning from login
            if (response.account) {
              console.log('Account from redirect:', response.account);
              
              // Get user profile from MS Graph API
              getUserProfile(instance, msGraphConfig.apiEndpoint)
                .then(userProfile => {
                  console.log('User profile from MS Graph after redirect:', userProfile);
                  
                  // Create user object
                  const userObj = {
                    id: response.account.localAccountId,
                    email: response.account.username,
                    name: userProfile.displayName || response.account.name || response.account.username.split('@')[0],
                    role: ['geosyncsurvey@gmail.com', 'admin@scpng.com'].includes(response.account.username.toLowerCase()) ? 'admin' : 'user',
                    accessToken: 'ms-token', // We don't store the actual token for security
                    profilePicture: userProfile.photo || undefined
                  };
                  
                  // Update user state
                  setUser(userObj);
                  localStorage.setItem('user', JSON.stringify(userObj));
                  
                  console.log('User state updated after redirect');
                })
                .catch(error => {
                  console.error('Error getting user profile after redirect:', error);
                });
            }
          } else {
            // Check if we have an account already
            const accounts = instance.getAllAccounts();
            if (accounts.length > 0) {
              console.log('Found existing account:', accounts[0]);
            }
          }
        }).catch(error => {
          console.error('Error handling redirect:', error);
        });
        
        // Register callback functions
        instance.addEventCallback((event) => {
          if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            console.log('MSAL login success event:', event);
            const result = event.payload as AuthenticationResult;
            
            // Check if the login was successful
            if (result.account) {
              console.log('Login successful for account:', result.account);
              
              // If there are accounts already, check if user needs to login
              if (instance.getAllAccounts().length > 0) {
                console.log('User is already logged in:', instance.getAllAccounts()[0]);
              }
            }
          } else if (event.eventType === EventType.LOGIN_FAILURE) {
            console.error('MSAL login failed:', event);
          } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
            console.log('Logout successful');
          }
        });
        
        setMsalInstance(instance);
        
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
      }
    }
    
    return () => {
      // Cleanup on unmount
      window.msalInstance = undefined;
    };
  }, [msGraphConfig, setUser]);
  
  // Only render the provider if MSAL is initialized
  if (!msalInstance) {
    return (
      <div>
        {/* Show the children anyway to avoid blocking the app */}
        {children}
      </div>
    );
  }
  
  return (
    <MsalReactProvider instance={msalInstance}>
      {children}
    </MsalReactProvider>
  );
};

export default MsalAuthProvider; 