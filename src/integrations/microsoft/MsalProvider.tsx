import React, { useEffect, useState } from 'react';
import { 
  PublicClientApplication, 
  EventType, 
  EventMessage, 
  AuthenticationResult 
} from '@azure/msal-browser';
import { MsalProvider as MsalReactProvider } from '@azure/msal-react';
import msalConfig, { updateMsalConfig } from './msalConfig';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Component to wrap the application with the MSAL provider
// This component will initialize MSAL with the configuration from useAuth
export const MsalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { msGraphConfig } = useAuth();
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
  }, [msGraphConfig]);
  
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