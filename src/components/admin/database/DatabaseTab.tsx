
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DatabaseTypeSelector, { DatabaseType } from './DatabaseTypeSelector';
import DatabaseForms from './DatabaseForms';
import DatabaseConnectionActions from './DatabaseConnectionActions';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseConfig {
  use_default: boolean;
  custom_url: string;
  custom_key: string;
  last_tested: string | null;
  test_success: boolean;
}

const DatabaseTab: React.FC = () => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    use_default: true,
    custom_url: '',
    custom_key: '',
    last_tested: null,
    test_success: false
  });
  
  // Fetch current Supabase configuration from database
  useEffect(() => {
    const fetchSupabaseConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'supabase_config')
          .single();
        
        if (error) {
          console.error('Error fetching Supabase config:', error);
          return;
        }
        
        if (data) {
          setSupabaseConfig(data.value as SupabaseConfig);
        }
      } catch (error) {
        console.error('Error fetching Supabase config:', error);
      }
    };
    
    fetchSupabaseConfig();
  }, []);
  
  const handleTestConnection = async () => {
    setTestStatus('testing');
    
    try {
      let client = supabase;
      
      // If using custom configuration, create a new client
      if (!supabaseConfig.use_default && supabaseConfig.custom_url && supabaseConfig.custom_key) {
        // This is just for testing, we don't store this client
        const { createClient } = await import('@supabase/supabase-js');
        client = createClient(supabaseConfig.custom_url, supabaseConfig.custom_key);
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
        ...supabaseConfig,
        last_tested: new Date().toISOString(),
        test_success: true
      };
      
      // Update config in database
      const { error: updateError } = await supabase
        .from('app_config')
        .update({ value: updatedConfig })
        .eq('key', 'supabase_config');
        
      if (updateError) {
        throw updateError;
      }
      
      setSupabaseConfig(updatedConfig);
      setTestStatus('success');
      toast.success('Connection successful! Retrieved documents from database.');
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Update config with test results
      const updatedConfig = {
        ...supabaseConfig,
        last_tested: new Date().toISOString(),
        test_success: false
      };
      
      // Try to update config in database
      try {
        await supabase
          .from('app_config')
          .update({ value: updatedConfig })
          .eq('key', 'supabase_config');
        
        setSupabaseConfig(updatedConfig);
      } catch (updateError) {
        console.error('Error updating config:', updateError);
      }
      
      setTestStatus('error');
      toast.error('Connection failed. Please check your credentials.');
    }
  };
  
  const handleSaveConfiguration = async () => {
    try {
      const { error } = await supabase
        .from('app_config')
        .update({ value: supabaseConfig })
        .eq('key', 'supabase_config');
        
      if (error) {
        throw error;
      }
      
      toast.success(`Supabase configuration saved`);
      setSelectedDbType(null);
      setTestStatus('idle');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  // Update DatabaseForms component to handle our specific config values
  const handleConfigChange = (field: string, value: string | boolean) => {
    setSupabaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <DatabaseTypeSelector 
        selectedDbType={selectedDbType} 
        setSelectedDbType={setSelectedDbType} 
      />
      
      <div className="border rounded-lg p-6">
        <DatabaseForms 
          selectedDbType={selectedDbType}
          supabaseConfig={supabaseConfig}
          onConfigChange={handleConfigChange}
        />
      </div>
      
      <DatabaseConnectionActions
        selectedDbType={selectedDbType}
        testStatus={testStatus}
        onTestConnection={handleTestConnection}
        onSaveConfiguration={handleSaveConfiguration}
        onCancel={() => setSelectedDbType(null)}
      />
    </>
  );
};

export default DatabaseTab;
