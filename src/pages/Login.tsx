import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logger } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

// MSAL Imports
import { useMsal } from "@azure/msal-react";
import { InteractionStatus, type AccountInfo } from "@azure/msal-browser"; // To check interaction status, Add AccountInfo type
import { loginRequest } from '../authConfig'; // Import scopes

export default function Login() {
  const navigate = useNavigate();
  const { instance, inProgress } = useMsal(); // Get MSAL instance and interaction status
  const [msalLoading, setMsalLoading] = useState(false); // Specific loading for MSAL interaction
  const [error, setError] = useState<string | null>(null);
  // Add state for MSAL completion
  const [isMsalLoginComplete, setIsMsalLoginComplete] = useState(false);
  const [msalAccountInfo, setMsalAccountInfo] = useState<AccountInfo | null>(null);

  const handleMicrosoftLogin = async () => {
    if (inProgress !== InteractionStatus.None || msalLoading) {
      logger.info('MSAL interaction already in progress or loading.');
      return;
    }
    setMsalLoading(true);
    setError(null);
    setIsMsalLoginComplete(false); // Reset flag on new attempt
    setMsalAccountInfo(null);
    logger.info('Initiating MSAL loginPopup');

    try {
      const msalResponse = await instance.loginPopup(loginRequest);
      logger.success('MSAL login successful', { username: msalResponse.account?.username });

      // Store account info and set flag instead of navigating or calling function immediately
      if (msalResponse.account) {
        setMsalAccountInfo(msalResponse.account);
        setIsMsalLoginComplete(true); 
        // Navigation and function call will happen in the useEffect hook below

        // Navigate immediately after successful MSAL login
        toast.success("Signed in successfully via Microsoft");
        navigate('/', { replace: true }); // Navigate to the main app
      } else {
        logger.error('MSAL login succeeded but account info was missing.');
        setError('Authentication failed: Missing account information from Microsoft.');
      }
    } catch (msalError: any) {
      logger.error('MSAL loginPopup error', msalError);
      if (msalError.errorCode === 'user_cancelled') {
        setError('Microsoft sign-in was cancelled.');
      } else if (msalError.errorCode === 'popup_window_error') {
        setError('Popup window blocked or closed. Please allow popups for this site.');
      } else {
        setError(msalError.message || 'An error occurred during Microsoft sign-in.');
      }
      setIsMsalLoginComplete(false); // Ensure flag is false on error
      setMsalAccountInfo(null);
    } finally {
      setMsalLoading(false);
    }
  };

  // New useEffect to listen for Supabase auth state changes after MSAL login
  useEffect(() => {
    // Only proceed if MSAL login finished successfully
    if (!isMsalLoginComplete || !msalAccountInfo) {
      return;
    }

    console.log('[Login Auth Listener] MSAL login complete, listening for Supabase SIGNED_IN event.');

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Login Auth Listener] Supabase auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Login Auth Listener] Supabase SIGNED_IN event detected for user:', session.user.id);
        
        // Now we have the Supabase user ID, invoke the function
        if (msalAccountInfo?.username) { // Use MSAL username, Supabase ID
          console.log(`[Login Auth Listener] Invoking Edge Function with Supabase User ID: ${session.user.id}`);
          try {
            const { data, error: functionError } = await supabase.functions.invoke(
              'log-msal-login',
              {
                body: {
                  user_id: session.user.id, // <<< Use Supabase User ID
                  user_email: msalAccountInfo.username // Use MSAL email
                }
              }
            );

            if (functionError) {
              console.error('[Login Auth Listener] Error invoking log-msal-login function:', functionError);
            } else {
              console.log('[Login Auth Listener] Successfully invoked log-msal-login function.', data);
            }
          } catch (invokeError) {
            console.error('[Login Auth Listener] Caught exception invoking function:', invokeError);
          }
        } else {
          console.warn('[Login Auth Listener] MSAL username missing when trying to invoke function.');
        }

        // Now navigate after Supabase session is confirmed and function is invoked (or attempted)
        // toast.success("Signed in successfully via Microsoft & Supabase");
        // navigate('/', { replace: true });

      } else if (event === 'SIGNED_OUT') {
        console.log('[Login Auth Listener] Supabase SIGNED_OUT event detected.');
      }
    });

    // Cleanup listener on component unmount or when MSAL state changes
    return () => {
      console.log('[Login Auth Listener] Cleaning up Supabase auth listener.');
      authListener?.subscription?.unsubscribe(); // Correct way to unsubscribe
    };
  }, [isMsalLoginComplete, msalAccountInfo, navigate]); // Dependencies for the effect
  
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-sm">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-red-700 font-medium">Login Error</p>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#400010] p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/images/SCPNG Original Logo.png" 
              alt="SCPNG Logo"
              className="w-24 h-auto mb-4"
            />
            <h1 className="text-2xl font-semibold text-center text-gray-800 mb-1">SCPNG Intranet Portal</h1>
            <p className="text-gray-500 text-sm text-center">Sign in to access the portal</p>
          </div>

           {renderError()}

           <Button
             variant="outline"
             className="w-full mt-6 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
             onClick={handleMicrosoftLogin}
             disabled={inProgress !== InteractionStatus.None || msalLoading}
           >
             {msalLoading || inProgress !== InteractionStatus.None ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
             )}
             <span>Sign in with Microsoft</span>
           </Button>

          <div className="mt-6 border-t pt-4">
             <p className="text-xs text-center text-gray-500">
               Authorized personnel only. &copy; SCPNG Intranet Portal {new Date().getFullYear()}
             </p>
           </div>

        </CardContent>
      </Card>
    </div>
  );
}
