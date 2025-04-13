import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { handleRedirectResponse } from '@/integrations/microsoft/msalService';
import { useMsalContext } from '@/integrations/microsoft/MsalProvider';
import MicrosoftLoginButton from '@/components/auth/MicrosoftLoginButton';
import microsoftAuthConfig from '@/config/microsoft-auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  
  // Safely try to use contexts, handle errors gracefully
  let auth: any = {};
  let msalInstance = null;
  
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Auth context not available:', error);
  }
  
  try {
    const msalContext = useMsalContext();
    msalInstance = msalContext.msalInstance;
  } catch (error) {
    console.error('MSAL context not available:', error);
  }
  
  const { user, isAuthenticated, loginWithMicrosoft, login } = auth;

  useEffect(() => {
    // Handle redirect process more robustly
    const handleInitialRedirect = async () => {
      // ENHANCEMENT: Add detailed logging of current state
      console.log('Login page - Current URL:', window.location.href);
      console.log('Login page - URL hash:', window.location.hash);
      console.log('Login page - URL search params:', window.location.search);
      
      // ENHANCEMENT: Check for hash parameters more thoroughly
      const hasAuthParams = (
        (location.hash && 
         (location.hash.includes('access_token') || 
          location.hash.includes('error') || 
          location.hash.includes('code'))) ||
        (location.search && 
         (location.search.includes('error') || 
          location.search.includes('code')))
      );
      
      console.log('Login page - Has auth params in URL:', hasAuthParams);
      
      // Check if authentication might be in progress based on browser storage
      const isAuthMaybeInProgress = (typeof window !== 'undefined') && 
        (sessionStorage.getItem('msal.interaction.status') === 'handling_redirect' ||
         localStorage.getItem('msalLoginAttempts') ||
         hasAuthParams ||
         location.hash || 
         location.search);
         
      // Track login attempts to avoid infinite loops
      const loginRetryCount = parseInt(localStorage.getItem('loginRetryCount') || '0', 10);
      console.log('Login page - Current retry count:', loginRetryCount);
      
      // If we've tried too many times, force a clean restart
      if (loginRetryCount > 1) {
        console.log('Login page - Too many retries, clearing state and forcing reload');
        // Clear all data and just reload the page
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return;
      }
         
      // Check if we have a hash or search params (indicating a redirect from Microsoft)
      if (isAuthMaybeInProgress) {
        console.log('Detected potential auth in progress:', {
          hash: location.hash,
          search: location.search,
          msalStatus: sessionStorage.getItem('msal.interaction.status'),
          attemptCount: localStorage.getItem('msalLoginAttempts')
        });
        
        // Increment retry counter
        localStorage.setItem('loginRetryCount', (loginRetryCount + 1).toString());
        
        setIsProcessingRedirect(true);
        
        // Explicitly try to handle the redirect response with our helper
        if (msalInstance) {
          try {
            console.log('Login page - Calling handleRedirectResponse');
            const response = await handleRedirectResponse(msalInstance);
            console.log('Login page - handleRedirectResponse result:', response ? 'Response received' : 'No response');
            
            if (response) {
              console.log('Successfully handled redirect response, navigating home');
              // Reset retry counter on success
              localStorage.removeItem('loginRetryCount'); 
              navigate('/');
              return;
            } else {
              console.log('No redirect response despite URL parameters');
              
              // Check for already logged in account
              const accounts = msalInstance.getAllAccounts();
              if (accounts.length > 0) {
                console.log('Found existing account, user should be logged in');
                
                // Force a check for stored user
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                  console.log('Found stored user, navigating home');
                  navigate('/');
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error handling redirect explicitly:', error);
          }
        } else {
          console.log('MSAL instance not available for redirect handling');
        }
        
        // We'll show processing state and let MSAL provider handle the redirect
        // The timeout ensures we don't get stuck if something goes wrong
        setTimeout(() => {
          // If we're still on the login page after timeout, try one more redirect check
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            console.log('Redirect processing timed out but found stored user, forcing navigation');
            navigate('/');
          } else {
            // Clean up any stale auth state
            if (typeof window !== 'undefined') {
              if (sessionStorage.getItem('msal.interaction.status') === 'handling_redirect') {
                console.log('Clearing stale interaction status');
                sessionStorage.removeItem('msal.interaction.status');
              }
              localStorage.removeItem('msalLoginAttempts');
            }
            setIsProcessingRedirect(false);
          }
        }, 3000);
        
        return;
      }
      
      // Normal flow: Check if user is already authenticated
      if (isAuthenticated && user) {
        console.log('User is already authenticated, redirecting to home...');
        try {
          navigate('/');
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback - force a page reload to the home page
          window.location.href = '/';
        }
        return;
      }
  
      // Check if we're returning from Microsoft login with stored user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        console.log('Found stored user, redirecting to home...');
        try {
          navigate('/');
        } catch (error) {
          console.error('Navigation error from stored user:', error);
          // Fallback - force a page reload to the home page
          window.location.href = '/';
        }
        return;
      }
    };

    handleInitialRedirect();
  }, [isAuthenticated, user, navigate, location, msalInstance]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login) {
      toast.error('Login is not available right now. Try Microsoft login instead.');
      return;
    }
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to login');
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!loginWithMicrosoft) {
      toast.error('Microsoft login is not available right now. Please try again later.');
      return;
    }
    
    console.log('Microsoft login button clicked - initiating login process');
    
    // Verify MSAL instance is available
    if (!msalInstance) {
      console.error('Microsoft login button - MSAL instance not found');
      toast.error('Unable to initialize Microsoft login. Please try again later.');
      return;
    }
    
    console.log('Microsoft login button - MSAL instance found');
    
    try {
      // Use popup login which is working for the user
      await loginWithMicrosoft();
      
      // Check for successful login
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        console.log('Login successful, navigating to home page');
        navigate('/');
      }
    } catch (error) {
      console.error('Microsoft login failed:', error);
      toast.error('Microsoft login failed. Please try again.');
    }
  };

  // Utility function to force a clean login
  const forceCleanLogin = () => {
    // Clear all MSAL and auth-related state
    localStorage.clear(); // Clear ALL localStorage (more thorough)
    
    // Clear all sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear(); // Clear ALL sessionStorage (more thorough)
    }
    
    // Reset any state
    setIsProcessingRedirect(false);
    
    // Simply reload the current page without any redirects
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#400010]">
      <Card className="w-[400px] bg-white rounded-3xl shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#400010] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              SC
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">SCPNG Intranet Portal</h1>
            <p className="text-gray-500 text-sm">Sign in to access the portal</p>
          </div>

          {isProcessingRedirect && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 mb-1">Authentication in progress...</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-xs text-blue-600">Please wait</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={forceCleanLogin}
                  className="text-xs py-0 h-6"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={() => {}}
              className="w-full bg-[#400010] hover:bg-[#500020] text-white flex items-center justify-center gap-2"
              type="button"
            >
              <Mail className="w-5 h-5" />
              Email
            </Button>

            <MicrosoftLoginButton 
              className="w-full bg-white hover:bg-gray-50 text-black border border-gray-200 flex items-center justify-center py-2 px-4 rounded gap-2"
              text={
                isProcessingRedirect ? "Processing..." : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="microsoft"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path
                        fill="currentColor"
                        d="M0 256h214.6v214.6H0V256zm233.8 0H448v214.6H233.8V256zM0 0h214.6v214.6H0V0zm233.8 0H448v214.6H233.8V0z"
                      ></path>
                    </svg>
                    Microsoft
                  </>
                )
              }
            />
          </div>

          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full bg-[#400010] hover:bg-[#500020] text-white">
              Sign in
            </Button>
          </form>

          {/* Emergency Direct Login Button */}
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-gray-500 mb-2">Having login issues? Try direct login:</p>
            <Button 
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-700 text-sm"
              onClick={() => {
                // Completely clear state
                localStorage.clear();
                sessionStorage.clear();
                
                // Go directly to Microsoft login
                window.location.href = `https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab/oauth2/v2.0/authorize?client_id=648a96d7-e3f5-4e13-8084-ba0b74dbb56f&response_type=code&redirect_uri=${encodeURIComponent("https://unitopia-hub.vercel.app/")}&scope=User.Read`;
              }}
            >
              Emergency Direct Login
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default admin credentials:</p>
            <p>Email: admin@app.com | Password: admin</p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Authorized personnel only</p>
            <p className="text-xs text-gray-400 mt-1">SCPNG Intranet Portal © 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
