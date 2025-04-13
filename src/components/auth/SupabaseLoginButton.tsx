import React, { useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { signInWithProvider } from '@/integrations/supabase/supabaseAuth';
import { Provider } from '@supabase/supabase-js';

interface SupabaseLoginButtonProps {
  className?: string;
  text?: string | ReactNode;
  provider: Provider;
}

const SupabaseLoginButton: React.FC<SupabaseLoginButtonProps> = ({
  className = "w-full bg-[#00A86B] hover:bg-[#008F5D] text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2",
  text = "Sign in",
  provider
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    console.log(`Initiating login process with ${provider}`);
    
    try {
      const response = await signInWithProvider(provider);
      
      // For OAuth providers, Supabase will redirect the user
      // so we don't need to handle the response here
      console.log('Login initiated successfully');
      
      // Redirect to the auth URL provided by Supabase
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error(`Error during ${provider} login:`, error);
      
      // Capture detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      toast.error(`Failed to login with ${provider}. Please try again.`);
      setIsLoggingIn(false);
    }
  };

  // Provider icon mapping
  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12c0,5.523,4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
        );
      case 'github':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#fff" d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z"/>
          </svg>
        );
      case 'azure':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
            <path fill="#fff" d="M11.5 0C5.149 0 0 5.149 0 11.5S5.149 23 11.5 23 23 17.851 23 11.5 17.851 0 11.5 0zm0 11.5V0c6.351 0 11.5 5.149 11.5 11.5H11.5z"/>
          </svg>
        );
      default:
        return null;
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
          {getProviderIcon()}
          {text}
        </>
      )}
    </button>
  );
};

export default SupabaseLoginButton; 