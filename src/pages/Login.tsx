import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, KeyRound, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { user, isAuthenticated, login, loginWithMicrosoft, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Login Page: Already authenticated, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login) {
      toast.error('Login service is not available.');
      return;
    }
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login page: Login failed:', error);
    }
  };

  const handleMicrosoftLogin = async () => {
    if (isLoading) return;
    if (!loginWithMicrosoft) {
      toast.error('Microsoft login is not available right now.');
      return;
    }
    console.log('Login.tsx - Microsoft login button clicked - calling loginWithMicrosoft...');
    try {
      await loginWithMicrosoft();
    } catch (error) {
      console.error('Login.tsx - Microsoft login initiation failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#400010] p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#400010] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              SC
            </div>
            <h1 className="text-2xl font-semibold text-center text-gray-800 mb-1">SCPNG Intranet Portal</h1>
            <p className="text-gray-500 text-sm text-center">Sign in to access the portal</p>
          </div>

          <Button 
            variant="outline" 
            className="w-full mb-4 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2" 
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" /> 
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
            )}
            <span>Sign in with Microsoft</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
           </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10"
                placeholder="your.email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#400010] hover:bg-[#500020] text-white flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span>Sign in</span>
            </Button>
          </form>

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
