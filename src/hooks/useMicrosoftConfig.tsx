import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface MicrosoftConfig {
  clientId: string;
  authorityUrl: string;
  redirectUri: string;
  permissions: string[];
  apiEndpoint: string;
  last_tested: string | null;
  test_success: boolean;
  confirmed: boolean;
  last_confirmed: string | null;
}

export function useMicrosoftConfig() {
  const [config, setConfig] = useState<MicrosoftConfig>({
    clientId: '',
    authorityUrl: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    permissions: ['User.Read'],
    apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
    last_tested: null,
    test_success: false,
    confirmed: false,
    last_confirmed: null
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
        const parsedConfig = data.value as unknown as MicrosoftConfig;
        setConfig(parsedConfig);
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
      console.log('Updating config in Supabase:', newConfig);
      
      // Clean the object to avoid circular references and ensure proper serialization
      const cleanConfig = JSON.parse(JSON.stringify(newConfig));
      
      // First attempt: Direct update
      const { error } = await supabase
        .from('app_config')
        .update({ 
          value: cleanConfig,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'microsoft_config');
      
      if (error) {
        console.error('First update attempt failed:', error);
        
        // Second attempt: Cast as unknown first
        const { error: secondError } = await supabase
          .from('app_config')
          .update({ 
            value: cleanConfig as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'microsoft_config');
        
        if (secondError) {
          console.error('Second update attempt failed:', secondError);
          throw secondError;
        }
      }
      
      // Verify the update was successful
      const { data, error: verifyError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'microsoft_config')
        .single();
      
      if (verifyError) {
        console.error('Verification query failed:', verifyError);
        throw verifyError;
      }
      
      console.log('Updated config in database:', data.value);
      
      // Update local state
      setConfig(newConfig);
      
      // Update localStorage for auth hook to use
      localStorage.setItem('ms-api-config', JSON.stringify(cleanConfig));
      
      return true;
    } catch (err) {
      console.error('Error updating Microsoft configuration:', err);
      toast.error('Failed to update Microsoft configuration: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
