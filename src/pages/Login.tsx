import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loginWithMicrosoft } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated && user) {
      console.log('User is already authenticated, redirecting to home...');
      navigate('/');
      return;
    }

    // Check if we're returning from Microsoft login
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('Found stored user, redirecting to home...');
      navigate('/');
      return;
    }

    // Check if we have a hash in the URL (indicating a redirect from Microsoft)
    if (location.hash) {
      console.log('Detected hash in URL, waiting for MSAL to handle redirect...');
      // MSAL will handle this automatically
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleMicrosoftLogin = async () => {
    try {
      console.log('Initiating Microsoft login...');
      await loginWithMicrosoft();
      console.log('Microsoft login initiated successfully');
      // The page will redirect to Microsoft login
    } catch (error) {
      console.error('Error during Microsoft login:', error);
      toast.error('Failed to login with Microsoft');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Unitopia Hub</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMicrosoftLogin}
            className="w-full"
            variant="outline"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
