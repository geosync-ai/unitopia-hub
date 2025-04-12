import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this resource. Please contact your administrator
          if you believe this is a mistake.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default"
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 