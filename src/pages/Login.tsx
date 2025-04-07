import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { loginWithMicrosoft, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're returning from Microsoft authentication
  useEffect(() => {
    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          console.log('Found stored user, redirecting to dashboard');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, [navigate]);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log('User is authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);

    try {
      await loginWithMicrosoft();
      // The navigation will happen after the user is redirected back
      // and the useEffect above detects the stored user
      toast.success('Successfully logged in with Microsoft');
    } catch (error) {
      toast.error('Microsoft authentication failed');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-intranet-primary/90 to-intranet-secondary p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-intranet-primary flex items-center justify-center text-white text-xl font-bold">
              SC
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">SCPNG Intranet Portal</CardTitle>
          <CardDescription>
            Sign in with your Microsoft account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            type="button"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
          >
            <LogIn size={20} />
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            <span>Authorized personnel only</span>
          </div>
          <div className="text-xs text-center text-gray-400">
            <span>SCPNG Intranet Portal © {new Date().getFullYear()}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
