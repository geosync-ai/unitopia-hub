import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loginWithMicrosoft, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
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

    // Check if we're returning from Microsoft login
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

    // Check if we have a hash in the URL (indicating a redirect from Microsoft)
    if (location.hash) {
      console.log('Detected hash in URL, waiting for MSAL to handle redirect...');
      // MSAL will handle this automatically
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to login');
    }
  };

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
            >
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
