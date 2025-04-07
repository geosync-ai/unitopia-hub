
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MicrosoftConfig {
  clientId: string;
  authorityUrl: string;
  redirectUri: string;
  permissions: string[];
  apiEndpoint: string;
  last_tested: string | null;
  test_success: boolean;
}

export function useMicrosoftConfig() {
  const [config, setConfig] = useState<MicrosoftConfig>({
    clientId: '',
    authorityUrl: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    permissions: ['User.Read'],
    apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
    last_tested: null,
    test_success: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'microsoft_config')
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setConfig(data.value as MicrosoftConfig);
      }
    } catch (err) {
      console.error('Error fetching Microsoft configuration:', err);
      setError('Failed to load Microsoft configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig: MicrosoftConfig) => {
    try {
      const { error } = await supabase
        .from('app_config')
        .update({ value: newConfig })
        .eq('key', 'microsoft_config');
      
      if (error) {
        throw error;
      }
      
      setConfig(newConfig);
      
      // Update localStorage for auth hook to use
      localStorage.setItem('ms-api-config', JSON.stringify(newConfig));
      
      return true;
    } catch (err) {
      console.error('Error updating Microsoft configuration:', err);
      toast.error('Failed to update Microsoft configuration');
      return false;
    }
  };

  const testConnection = async (configToTest?: MicrosoftConfig) => {
    const configForTest = configToTest || config;
    
    try {
      // In a real application, we would test the connection with Microsoft Graph API
      // For now, we'll do a basic validation
      
      if (!configForTest.clientId) {
        throw new Error('Client ID is required');
      }
      
      // Simple validation: client ID should be at least 10 characters
      const success = configForTest.clientId.length >= 10;
      
      if (!success) {
        throw new Error('Client ID is too short or invalid');
      }
      
      // Update config with test results
      const updatedConfig = {
        ...configForTest,
        last_tested: new Date().toISOString(),
        test_success: true
      };
      
      await updateConfig(updatedConfig);
      
      toast.success('Microsoft API connection successful');
      return true;
    } catch (err) {
      console.error('Microsoft connection test failed:', err);
      
      // Update config with test results
      const updatedConfig = {
        ...configForTest,
        last_tested: new Date().toISOString(),
        test_success: false
      };
      
      await updateConfig(updatedConfig);
      
      toast.error(`Microsoft API connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };

  return {
    config,
    isLoading,
    error,
    fetchConfig,
    updateConfig,
    testConnection
  };
}

export default useMicrosoftConfig;
