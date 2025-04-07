
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LogIn, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

type LoginFormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const { login, loginWithMicrosoft, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'microsoft'>('email');
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleEmailLogin = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      navigate('/');
      toast.success('Successfully logged in');
    } catch (error) {
      toast.error('Invalid email or password');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);

    try {
      await loginWithMicrosoft();
      navigate('/');
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
            Sign in to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 mb-4">
            <Button
              type="button"
              variant={authMethod === 'email' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('email')}
              className="flex-1"
            >
              <Mail size={16} className="mr-2" />
              Email
            </Button>
            <Button
              type="button"
              variant={authMethod === 'microsoft' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('microsoft')}
              className="flex-1"
            >
              <LogIn size={16} className="mr-2" />
              Microsoft
            </Button>
          </div>
          
          {authMethod === 'email' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email">Email</Label>
                      <FormControl>
                        <Input 
                          id="email"
                          placeholder="Enter your email" 
                          type="email"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password">Password</Label>
                      <FormControl>
                        <Input 
                          id="password"
                          placeholder="Enter your password" 
                          type="password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
                
                <div className="text-sm text-center text-gray-500">
                  <p>Default admin credentials:</p>
                  <p>Email: admin@scpng.com | Password: admin</p>
                </div>
              </form>
            </Form>
          ) : (
            <Button 
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              <LogIn size={20} />
              {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          )}
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
