import React, { useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import microsoftAuthConfig from '@/config/microsoft-auth';
import { handleRedirectResponse } from '@/integrations/microsoft/msalService';

interface MicrosoftLoginButtonProps {
  className?: string;
  text?: string | ReactNode;
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ 
  className = "w-full bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2",
  text = "Sign in with Microsoft"
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Check for redirect response on component mount
  useEffect(() => {
    const checkForRedirectResponse = async () => {
      try {
        // Get the MSAL instance from the window object
        const msalInstance = (typeof window !== 'undefined' && (window as any).msalInstance) 
          ? (window as any).msalInstance 
          : null;
        
        if (!msalInstance) {
          console.log('No MSAL instance available for redirect check');
          return;
        }
        
        // Check if we're returning from a redirect
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = window.location.hash;
        const hasAuthParams = urlParams.has('code') || urlParams.has('error') || 
                              urlHash.includes('access_token') || urlHash.includes('id_token');
        
        if (hasAuthParams) {
          console.log('Auth parameters detected in URL, processing redirect response');
          setIsLoggingIn(true);
          
          // Handle the redirect response
          const response = await handleRedirectResponse(msalInstance);
          
          if (response) {
            console.log('Redirect login successful, account:', response.account.username);
            toast.success('Successfully signed in!');
          } else {
            console.log('No response from redirect handling');
          }
          
          setIsLoggingIn(false);
        } else {
          console.log('No auth parameters in URL, not processing redirect');
        }
      } catch (error) {
        console.error('Error checking redirect response:', error);
        setIsLoggingIn(false);
      }
    };
    
    checkForRedirectResponse();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    console.log('Microsoft login button clicked - initiating login process');
    
    try {
      // Get the MSAL instance from the window object
      const msalInstance = (typeof window !== 'undefined' && (window as any).msalInstance) 
        ? (window as any).msalInstance 
        : null;
      
      if (!msalInstance) {
        toast.error('Microsoft authentication service is not available.');
        console.error('MSAL instance not found on window object');
        setIsLoggingIn(false);
        return;
      }
      
      console.log('Microsoft login button - MSAL instance found');
      
      // Ensure clean state before login attempt
      sessionStorage.removeItem('msal.interaction.status');
      
      // Use the exact redirect URI from the config
      const redirectUri = microsoftAuthConfig.redirectUri;
      console.log('Microsoft login button - Using redirect URI:', redirectUri);
      
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        console.log('User already has an account, attempting silent token acquisition');
        try {
          await msalInstance.acquireTokenSilent({
            account: accounts[0],
            scopes: ['User.Read'],
          });
          
          toast.success('Signed in successfully!');
          console.log('Silent authentication successful');
          setIsLoggingIn(false);
          return;
        } catch (error) {
          console.log('Silent token acquisition failed, falling back to redirect:', error);
        }
      }
      
      // Add state parameter for better tracking
      const state = `login-${new Date().getTime()}`;
      
      // Force a clean login with explicit redirect URI
      console.log('Microsoft login button - Initiating login redirect');
      await msalInstance.loginRedirect({
        scopes: ['User.Read'],
        redirectUri: redirectUri,
        state: state,
        prompt: 'select_account', // Force account selection
      });
      
      console.log('Login redirect initiated successfully');
    } catch (error) {
      console.error('Error during Microsoft login:', error);
      
      // Capture detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      toast.error('Failed to login with Microsoft. Please try again.');
      setIsLoggingIn(false);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={isLoggingIn}
      className={className}
    >
      {isLoggingIn ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </span>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
            <path fill="#fff" d="M11.5 0C5.149 0 0 5.149 0 11.5S5.149 23 11.5 23 23 17.851 23 11.5 17.851 0 11.5 0zm0 11.5V0c6.351 0 11.5 5.149 11.5 11.5H11.5z"/>
          </svg>
          {text}
        </>
      )}
    </button>
  );
};

export default MicrosoftLoginButton; 