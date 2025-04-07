
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { loginWithMicrosoft, isAuthenticated, businessUnits, setSelectedUnit } = useAuth();
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);

    try {
      await loginWithMicrosoft();
      setSelectedUnit(selectedBusinessUnit || null);
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
            Sign in with your Microsoft account to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Select 
                value={selectedBusinessUnit} 
                onValueChange={setSelectedBusinessUnit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your business unit" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              <LogIn size={20} />
              {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          </div>
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
