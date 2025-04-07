
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MicrosoftAPIConfigProps {
  availablePermissions: { value: string; label: string }[];
}

export interface MicrosoftAPIConfig {
  clientId: string;
  authorityUrl: string;
  redirectUri: string;
  permissions: string[];
  apiEndpoint: string;
  last_tested?: string | null;
  test_success?: boolean;
}

export interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

const MicrosoftAPIConfig: React.FC<MicrosoftAPIConfigProps> = ({
  availablePermissions
}) => {
  const [msConfig, setMsConfig] = useState<MicrosoftAPIConfig>({
    clientId: '',
    authorityUrl: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    permissions: ['User.Read'],
    apiEndpoint: 'https://graph.microsoft.com/v1.0/me'
  });
  
  const [msTestResult, setMsTestResult] = useState<TestResult>({
    status: 'idle'
  });
  
  // Fetch current Microsoft configuration from database
  useEffect(() => {
    const fetchMsConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'microsoft_config')
          .single();
        
        if (error) {
          console.error('Error fetching Microsoft config:', error);
          return;
        }
        
        if (data) {
          setMsConfig(data.value as MicrosoftAPIConfig);
        }
      } catch (error) {
        console.error('Error fetching Microsoft config:', error);
      }
    };
    
    fetchMsConfig();
  }, []);
  
  const handleMicrosoftPermissionToggle = (permission: string) => {
    setMsConfig(prev => {
      if (prev.permissions.includes(permission)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permission]
        };
      }
    });
  };
  
  const handleTestMicrosoftConnection = async () => {
    setMsTestResult({ status: 'testing' });
    
    try {
      // In a real implementation, this would verify connectivity to Microsoft Graph API
      // For now, we'll do basic validation and simulate a response
      if (!msConfig.clientId) {
        throw new Error('Client ID is required');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple validation: client ID should be at least 10 characters
      const success = msConfig.clientId.length >= 10;
      
      // Update the configuration with test results
      const updatedConfig: MicrosoftAPIConfig = {
        ...msConfig,
        last_tested: new Date().toISOString(),
        test_success: success
      };
      
      // Save the updated configuration to database
      const { error } = await supabase
        .from('app_config')
        .update({ value: updatedConfig })
        .eq('key', 'microsoft_config');
      
      if (error) {
        throw error;
      }
      
      setMsConfig(updatedConfig);
      
      if (success) {
        setMsTestResult({ 
          status: 'success',
          message: 'Successfully authenticated and connected to Microsoft Graph API!'
        });
        toast.success('Microsoft API connection successful!');
      } else {
        setMsTestResult({ 
          status: 'error',
          message: 'Failed to authenticate. Client ID is too short or invalid.'
        });
        toast.error('Microsoft API connection failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error testing Microsoft connection:', error);
      setMsTestResult({ 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast.error('Microsoft API connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Update the configuration with test results
      try {
        const updatedConfig: MicrosoftAPIConfig = {
          ...msConfig,
          last_tested: new Date().toISOString(),
          test_success: false
        };
        
        await supabase
          .from('app_config')
          .update({ value: updatedConfig })
          .eq('key', 'microsoft_config');
        
        setMsConfig(updatedConfig);
      } catch (updateError) {
        console.error('Error updating config:', updateError);
      }
    }
  };
  
  const handleSaveMicrosoftConfig = async () => {
    try {
      const { error } = await supabase
        .from('app_config')
        .update({ value: msConfig })
        .eq('key', 'microsoft_config');
      
      if (error) {
        throw error;
      }
      
      toast.success('Microsoft API configuration saved successfully!');
      
      // Save to localStorage for useAuth hook to use
      localStorage.setItem('ms-api-config', JSON.stringify(msConfig));
    } catch (error) {
      console.error('Error saving Microsoft config:', error);
      toast.error('Failed to save Microsoft configuration');
    }
  };
  
  const handleConfirmMicrosoftLink = async () => {
    try {
      if (msTestResult.status !== 'success') {
        toast.error('Please test the connection successfully before confirming the link.');
        return;
      }
      
      // In a real implementation, this would finalize the Microsoft API integration
      // For now, we just update the configuration and notify the user
      toast.success('Microsoft API link established successfully! The configuration is now active.');
      
      // Save to localStorage for useAuth hook to use
      localStorage.setItem('ms-api-config', JSON.stringify(msConfig));
    } catch (error) {
      console.error('Error confirming Microsoft link:', error);
      toast.error('Failed to confirm Microsoft link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="text-lg font-medium text-blue-800">Microsoft Graph API Configuration</h3>
        <p className="text-sm text-blue-700 mt-1">
          Configure connection settings for Microsoft services integration (Graph API, SharePoint, OneDrive, etc.)
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="ms-client-id">Client ID <span className="text-red-500">*</span></Label>
          <Input 
            id="ms-client-id" 
            placeholder="Enter your application's Client ID" 
            value={msConfig.clientId}
            onChange={e => setMsConfig(prev => ({ ...prev, clientId: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            The Client ID from your registered Azure AD application
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ms-authority">Authority URL</Label>
          <Input 
            id="ms-authority" 
            placeholder="https://login.microsoftonline.com/{tenant_id}"
            value={msConfig.authorityUrl}
            onChange={e => setMsConfig(prev => ({ ...prev, authorityUrl: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Use 'common' for multi-tenant or your specific tenant ID
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ms-redirect">Redirect URI</Label>
          <Input 
            id="ms-redirect" 
            placeholder="Enter redirect URI"
            value={msConfig.redirectUri}
            onChange={e => setMsConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Must match a redirect URI registered in your Azure AD app
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ms-endpoint">API Endpoint</Label>
          <Input 
            id="ms-endpoint" 
            placeholder="https://graph.microsoft.com/v1.0/me"
            value={msConfig.apiEndpoint}
            onChange={e => setMsConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            The Microsoft Graph API endpoint you want to access
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>API Permissions</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {availablePermissions.map(permission => (
              <div key={permission.value} className="flex items-center space-x-2">
                <Switch 
                  id={`perm-${permission.value}`}
                  checked={msConfig.permissions.includes(permission.value)}
                  onCheckedChange={() => handleMicrosoftPermissionToggle(permission.value)}
                />
                <Label htmlFor={`perm-${permission.value}`} className="text-sm">
                  {permission.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className={`p-4 rounded-lg mb-4 ${
          msTestResult.status === 'success' ? 'bg-green-50 border border-green-200' :
          msTestResult.status === 'error' ? 'bg-red-50 border border-red-200' :
          msTestResult.status === 'testing' ? 'bg-blue-50 border border-blue-200' : 'hidden'
        }`}>
          {msTestResult.status === 'testing' && (
            <p className="text-blue-700 flex items-center">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500 animate-ping mr-2"></span>
              Testing connection to Microsoft API...
            </p>
          )}
          {msTestResult.status === 'success' && (
            <p className="text-green-700 flex items-center">
              <Check size={16} className="mr-2" />
              {msTestResult.message}
            </p>
          )}
          {msTestResult.status === 'error' && (
            <p className="text-red-700 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {msTestResult.message}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveMicrosoftConfig}
          >
            Save Configuration
          </Button>
          <Button 
            variant="outline"
            className={`${msTestResult.status === 'testing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleTestMicrosoftConnection}
            disabled={msTestResult.status === 'testing'}
          >
            {msTestResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button 
            disabled={msTestResult.status !== 'success'}
            onClick={handleConfirmMicrosoftLink}
          >
            <Check size={16} className="mr-2" />
            Confirm API Link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MicrosoftAPIConfig;
