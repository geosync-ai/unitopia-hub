import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logger } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('Initializing login page check');
    setError(null);

    supabase.auth.getUser()
      .then(({ data, error: checkError }) => {
        if (checkError) {
          logger.error('Error checking authentication status', checkError);
        } else if (data.user) {
          logger.success('User already authenticated', { userId: data.user.id });
          navigate('/', { replace: true });
        } else {
          logger.info('No authenticated user found, showing login page.');
        }
        setLoading(false);
      })
      .catch(err => {
        logger.error('Unexpected error in auth check', err);
        setError('Failed to check authentication status');
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`Auth state changed: ${event}`, { userId: session?.user?.id });
        if (event === 'SIGNED_IN' && session?.user) {
          logger.success('User signed in successfully via OAuth', { userId: session.user.id });
          navigate('/', { replace: true });
        } else if (event === 'SIGN_IN_ERROR') {
            logger.error('Sign in error event received', session);
            setError('Failed to sign in with Microsoft. Please try again.');
            setLoading(false);
        } else if (event === 'SIGNED_OUT') {
            logger.info('User explicitly signed out');
            setLoading(false);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
      logger.info('Login page cleanup');
    };
  }, [navigate]);

  const handleMicrosoftLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    logger.info('Initiating Azure sign-in');

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: window.location.origin 
        },
      });

      if (signInError) {
        logger.error('Azure login error', signInError);
        setError(signInError.message || 'An error occurred during Microsoft sign-in.');
        setLoading(false);
      }
    } catch (err: any) {
      logger.error('Unexpected error during sign-in attempt', err);
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };
  
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
            <div className="w-16 h-16 bg-[#400010] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              SC
            </div>
            <h1 className="text-2xl font-semibold text-center text-gray-800 mb-1">SCPNG Intranet Portal</h1>
            <p className="text-gray-500 text-sm text-center">Sign in to access the portal</p>
          </div>

           {loading && !error && (
             <div className="py-6 flex justify-center items-center">
               <Loader2 className="h-6 w-6 animate-spin text-[#400010]" />
               <span className="ml-2 text-gray-600">Checking session...</span>
             </div>
           )}
           
           {renderError()}

           {!loading && (
             <Button
               variant="outline"
               className="w-full mt-6 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
               onClick={handleMicrosoftLogin}
               disabled={loading} 
             >
               {loading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
               )}
               <span>Sign in with Microsoft</span>
             </Button>
           )}

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
