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
      // Check if we have a hash or search params (indicating a redirect from Microsoft)
      if (location.hash || location.search) {
        console.log('Detected hash or search params in URL, handling redirect...', {
          hash: location.hash,
          search: location.search
        });
        
        setIsProcessingRedirect(true);
        
        // Explicitly try to handle the redirect response with our helper
        if (msalInstance) {
          try {
            const response = await handleRedirectResponse(msalInstance);
            if (response) {
              console.log('Successfully handled redirect response, navigating home');
              navigate('/');
              return;
            } else {
              console.log('No redirect response despite URL parameters');
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
          // If we're still on the login page after timeout, redirect to home
          // as a recovery mechanism
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            console.log('Redirect processing timed out but found stored user, forcing navigation');
            navigate('/');
          } else {
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
    
    console.log('Initiating Microsoft login from button click');
    await loginWithMicrosoft();
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

          <div className="space-y-4">
            <Button
              onClick={() => {}}
              className="w-full bg-[#400010] hover:bg-[#500020] text-white flex items-center justify-center gap-2"
              type="button"
            >
              <Mail className="w-5 h-5" />
              Email
            </Button>

            <Button
              onClick={handleMicrosoftLogin}
              className="w-full bg-white hover:bg-gray-50 text-black border border-gray-200"
              type="button"
              disabled={isProcessingRedirect}
            >
              {isProcessingRedirect ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </>
              ) : (
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
              )}
            </Button>
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
