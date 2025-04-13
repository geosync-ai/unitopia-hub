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
import msalConfig, { updateMsalConfig, loginRequest } from './msalConfig';
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
  const [forceSignIn, setForceSignIn] = useState(false);
  
  // Safely try to use the auth context if available, but don't error if it's not
  let authContextValue: { setUser?: any, msGraphConfig?: any } = {};
  try {
    authContextValue = useAuth();
  } catch (error) {
    console.warn('Auth context not available yet in MsalAuthProvider. This is okay if AuthProvider comes after MsalAuthProvider.');
  }
  
  const { setUser, msGraphConfig } = authContextValue;

  useEffect(() => {
    const initializeMsal = async () => {
      if (isInitializing || isInitialized) return;
      
      try {
        setIsInitializing(true);
        
        // Clear any stale MSAL state on initialization
        if (typeof window !== 'undefined') {
          // Try to clean session storage
          try {
            // Clear any MSAL-related entries
            Object.keys(sessionStorage)
              .filter(key => key.startsWith('msal.'))
              .forEach(key => sessionStorage.removeItem(key));
              
            // Clear interaction state specifically
            sessionStorage.removeItem('msal.interaction.status');
            sessionStorage.removeItem('msal.interaction.error');
          } catch (e) {
            console.warn('Unable to clean session storage:', e);
          }
          
          // Clean local storage
          localStorage.removeItem('msalLoginAttempts');
        }
        
        // Update config with the exact redirect URI from the config, NOT the window location
        const configToUse = updateMsalConfig({
          ...microsoftAuthConfig
        });
        
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
          } else if (event.eventType === EventType.LOGIN_FAILURE) {
            console.error('Login failure event detected:', event.error);
          } else if (event.eventType === EventType.HANDLE_REDIRECT_START) {
            console.log('Starting redirect handling...');
          } else if (event.eventType === EventType.HANDLE_REDIRECT_END) {
            console.log('Finished redirect handling');
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
          console.log('Attempting to handle redirect promise...');
          
          // ENHANCEMENT: Check for URL hash parameters that might indicate an auth response
          if (typeof window !== 'undefined') {
            const hasAuthParams = window.location.hash && 
              (window.location.hash.includes('access_token') || 
              window.location.hash.includes('error') || 
              window.location.hash.includes('code'));
              
            console.log('URL contains auth parameters:', hasAuthParams);
            console.log('Current URL hash:', window.location.hash ? '[PRESENT]' : '[EMPTY]');
          }
          
          // Check for cached data in browser storage to determine if we're mid-auth
          const isAuthInProgress = (typeof window !== 'undefined') && 
                                  (sessionStorage.getItem('msal.interaction.status') === 'handling_redirect' ||
                                   localStorage.getItem('msalLoginAttempts'));
          
          console.log('Auth in progress status:', isAuthInProgress);
                                  
          // First, immediately try to handle the redirect without any delay
          try {
            console.log('Calling handleRedirectPromise() to process auth response...');
            const response = await instance.handleRedirectPromise();
            console.log('handleRedirectPromise result:', response ? 'Response received' : 'No response');
            
            if (response) {
              console.log('Successfully processed redirect response:', response);
              // Handle the successful login
              if (response.account) {
                instance.setActiveAccount(response.account);
              }
            } else {
              console.log('No redirect response found during initial check');
              
              // ENHANCEMENT: If we don't have a response but accounts exist, then user is already logged in
              const accounts = instance.getAllAccounts();
              if (accounts.length > 0) {
                console.log('Found existing accounts, setting active account:', accounts[0].username);
                instance.setActiveAccount(accounts[0]);
              } else {
                console.log('No accounts found, user may need to login');
                
                // ENHANCEMENT: Check if we should initiate a login attempt
                const shouldAttemptLogin = !isAuthInProgress && !localStorage.getItem('loginAttempted');
                
                if (shouldAttemptLogin) {
                  console.log('Attempting initial login...');
                  localStorage.setItem('loginAttempted', 'true');
                  
                  // Set small timeout to ensure browser is ready
                  setTimeout(async () => {
                    try {
                      await instance.loginRedirect({
                        scopes: microsoftAuthConfig.permissions || [],
                        redirectUri: microsoftAuthConfig.redirectUri,
                        prompt: 'select_account'
                      });
                    } catch (loginError) {
                      console.error('Error initiating login:', loginError);
                    }
                  }, 1000);
                }
              }
            }
          } catch (redirectError) {
            console.error('Error during initial redirect handling:', redirectError);
          }
          
          // Add a bit of timeout as a fallback to ensure browser has fully loaded
          setTimeout(async () => {
            try {
              // Get URL parameters again in case they've changed
              if (typeof window !== 'undefined') {
                const hasAuthParams = window.location.hash && 
                  (window.location.hash.includes('access_token') || 
                  window.location.hash.includes('error') || 
                  window.location.hash.includes('code'));
                  
                console.log('TIMEOUT CHECK - URL contains auth parameters:', hasAuthParams);
                console.log('TIMEOUT CHECK - Current URL hash:', window.location.hash ? '[PRESENT]' : '[EMPTY]');
              }
                
              // Force clear any stale interaction status
              if (typeof window !== 'undefined') {
                // More thorough cleaning of MSAL cache to prevent redirect issues
                if (sessionStorage.getItem('msal.interaction.status')) {
                  console.log('Clearing interaction status');
                  sessionStorage.removeItem('msal.interaction.status');
                }
                // Clear any interaction errors that might be preventing completion
                sessionStorage.removeItem('msal.interaction.error');
                // Clean up other potential stale MSAL entries
                const msalKeys = Object.keys(sessionStorage).filter(key => key.startsWith('msal.'));
                if (msalKeys.length > 0) {
                  console.log('Cleaning stale MSAL session entries:', msalKeys);
                  msalKeys.forEach(key => sessionStorage.removeItem(key));
                }
              }
              
              // Try again after cleaning up the session
              console.log('Checking for redirect response after cleanup...');
              console.log('Making second handleRedirectPromise() call...');
              const secondResponse = await instance.handleRedirectPromise().catch(err => {
                console.error('Error handling redirect after cleanup:', err);
                return null;
              });
              
              console.log('Second handleRedirectPromise result:', secondResponse ? 'Response received' : 'No response');
              
              if (secondResponse) {
                console.log('Redirect response detected:', secondResponse);
                if (secondResponse.account) {
                  // Set active account if available
                  instance.setActiveAccount(secondResponse.account);
                  
                  // Fetch user profile
                  const userProfile = await getUserProfile(instance);
                  if (userProfile) {
                    const userEmail = userProfile.mail || userProfile.userPrincipalName || secondResponse.account.username;
                    
                    // Create a properly typed user object
                    const userData = {
                      id: secondResponse.account.localAccountId,
                      name: secondResponse.account.name || 'Unknown',
                      email: userEmail,
                      role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                      isAdmin: ADMIN_EMAILS.includes(userEmail),
                    };
                    
                    // For localStorage, we can use a simplified version
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log('User profile fetched and stored in localStorage');
                    
                    // Only call setUser if it's available (auth context exists)
                    if (setUser) {
                      setUser(userData);
                      console.log('User profile set in auth context');
                    } else {
                      console.log('Auth context not available, user is stored in localStorage only');
                    }

                    // Force navigation to home page after successful auth
                    if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    }
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
                    const userData = {
                      id: account.localAccountId,
                      name: account.name || 'Unknown',
                      email: userEmail,
                      role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user',
                      isAdmin: ADMIN_EMAILS.includes(userEmail),
                    };
                    
                    // For localStorage, we can use the same format
                    localStorage.setItem('user', JSON.stringify(userData));
                    
                    // Only call setUser if it's available (auth context exists)
                    if (setUser) {
                      setUser(userData);
                      console.log('Existing user account set in auth context');
                    } else {
                      console.log('Auth context not available, existing user is stored in localStorage only');
                    }
                  }
                } else if (isAuthInProgress) {
                  // We think we should be logged in but have no accounts
                  console.log('Auth appears to be in progress but no accounts found. Attempting to force login...');
                  
                  // Clean up any remnant status
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('msalLoginAttempts');
                    sessionStorage.removeItem('msal.interaction.status');
                  }
                  
                  // Check if we have a stored user despite no active account
                  const storedUser = localStorage.getItem('user');
                  if (storedUser) {
                    console.log('Found stored user, attempting to restore session');
                    if (setUser) {
                      setUser(JSON.parse(storedUser));
                      console.log('User restored from localStorage');
                    }
                    
                    // Give the UI a moment to update, then redirect
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/';
                      }
                    }, 500);
                  } else {
                    // As a last resort, try to initiate a login again
                    console.log('No stored user found, attempting to initiate login again');
                    try {
                      await instance.loginRedirect(loginRequest);
                    } catch (loginError) {
                      console.error('Failed to initiate login redirect:', loginError);
                    }
                  }
                }
              }
            } catch (timeoutError) {
              console.error('Error in setTimeout handler:', timeoutError);
            }
          }, 500); // Small delay to ensure browser is ready
        } catch (redirectError) {
          console.error('Error handling redirect:', redirectError);
          setAuthError(redirectError instanceof Error ? redirectError : new Error(String(redirectError)));
          
          // Add more detailed logging for redirect errors
          console.error('Detailed redirect error:', {
            message: redirectError.message,
            name: redirectError.name,
            stack: redirectError.stack,
            timestamp: new Date().toISOString()
          });
          
          // Set a flag to display the manual login option
          setForceSignIn(true);
          
          // Check if user exists in localStorage as a fallback
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              console.log('Found stored user despite redirect error, restoring session');
              
              // Only call setUser if it's available (auth context exists)
              if (setUser) {
                setUser(JSON.parse(storedUser));
              } else {
                console.log('Auth context not available, cannot restore user from localStorage to context');
              }
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

  // Add fallback UI for when authentication fails
  const renderFallbackContent = () => {
    if (authError || forceSignIn) {
      return (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Authentication Issue Detected</h2>
            <p className="mb-4">
              We're having trouble logging you in automatically. Please try clicking the button below.
            </p>
            <button
              onClick={() => {
                // Clear any existing data
                if (typeof window !== 'undefined') {
                  // Clear MSAL data
                  Object.keys(sessionStorage)
                    .filter(key => key.startsWith('msal.'))
                    .forEach(key => sessionStorage.removeItem(key));
                    
                  localStorage.removeItem('msalLoginAttempts');
                }
                
                // Force a clean login
                try {
                  msalInstance.loginRedirect({
                    scopes: microsoftAuthConfig.permissions || [],
                    redirectUri: microsoftAuthConfig.redirectUri,
                    prompt: 'select_account' // Force a fresh login experience
                  });
                } catch (error) {
                  console.error('Manual login redirect failed:', error);
                  alert('Login failed. Please refresh the page and try again.');
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Sign in with Microsoft
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <MsalContext.Provider value={contextValue}>
      <MsalReactProvider instance={msalInstance}>
        {renderFallbackContent()}
        {children}
      </MsalReactProvider>
    </MsalContext.Provider>
  );
};

export default MsalAuthProvider; 