import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';

interface SupabaseConfig {
  use_default: boolean;
  custom_url: string;
  custom_key: string;
  last_tested: string | null;
  test_success: boolean;
}

export function useSupabaseConfig() {
  const [config, setConfig] = useState<SupabaseConfig>({
    use_default: true,
    custom_url: '',
    custom_key: '',
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
        .eq('key', 'supabase_config')
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setConfig(data.value as SupabaseConfig);
      }
    } catch (err) {
      console.error('Error fetching Supabase configuration:', err);
      setError('Failed to load Supabase configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig: SupabaseConfig) => {
    try {
      // Clean the object to avoid circular references
      const cleanConfig = JSON.parse(JSON.stringify(newConfig));
      
      const { error } = await supabase
        .from('app_config')
        .update({ value: cleanConfig as unknown as Json })
        .eq('key', 'supabase_config');
      
      if (error) {
        throw error;
      }
      
      setConfig(newConfig);
      return true;
    } catch (err) {
      console.error('Error updating Supabase configuration:', err);
      toast.error('Failed to update Supabase configuration');
      return false;
    }
  };

  const testConnection = async (configToTest?: SupabaseConfig) => {
    const configForTest = configToTest || config;
    
    try {
      let client = supabase;
      
      // If using custom configuration, create a new client
      if (!configForTest.use_default && configForTest.custom_url && configForTest.custom_key) {
        client = createClient(configForTest.custom_url, configForTest.custom_key);
      }
      
      // Test connection by trying to fetch documents
      const { data, error } = await client
        .from('documents')
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      // Update config with test results
      const updatedConfig = {
        ...configForTest,
        last_tested: new Date().toISOString(),
        test_success: true
      };
      
      await updateConfig(updatedConfig);
      
      toast.success('Database connection successful');
      return true;
    } catch (err) {
      console.error('Connection test failed:', err);
      
      // Update config with test results
      const updatedConfig = {
        ...configForTest,
        last_tested: new Date().toISOString(),
        test_success: false
      };
      
      await updateConfig(updatedConfig);
      
      toast.error('Database connection failed');
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

export default useSupabaseConfig;
