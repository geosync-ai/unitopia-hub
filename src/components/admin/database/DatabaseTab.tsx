import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import DatabaseTypeSelector, { DatabaseType } from './DatabaseTypeSelector';
import DatabaseForms from './DatabaseForms';
import DatabaseConnectionActions from './DatabaseConnectionActions';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import UpdateSupabaseDirectly from './UpdateSupabaseDirectly';
import SupabaseTestTool from './SupabaseTestTool';
import { Button } from '@/components/ui/button';
import { ExternalLink, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface SupabaseConfig {
  use_default: boolean;
  custom_url: string;
  custom_key: string;
  last_tested: string | null;
  test_success: boolean;
}

const DatabaseTab: React.FC = () => {
  const { user, isAdmin } = useAuth();
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
        
        if (data && data.value) {
          // Handle the Json type correctly
          const configValue = data.value as Record<string, any>;
          setSupabaseConfig({
            use_default: Boolean(configValue.use_default),
            custom_url: String(configValue.custom_url || ''),
            custom_key: String(configValue.custom_key || ''),
            last_tested: configValue.last_tested as string | null,
            test_success: Boolean(configValue.test_success)
          });
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
      // Convert SupabaseConfig to a Json compatible object
      const jsonConfig: Record<string, any> = {
        use_default: supabaseConfig.use_default,
        custom_url: supabaseConfig.custom_url,
        custom_key: supabaseConfig.custom_key,
        last_tested: supabaseConfig.last_tested,
        test_success: supabaseConfig.test_success
      };

      const { error } = await supabase
        .from('app_config')
        .update({ 
          value: jsonConfig as Json
        })
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Database Configuration</h2>
      
      {isAdmin && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-green-600" />
            <AlertTitle>Admin User Authenticated</AlertTitle>
          </div>
          <AlertDescription className="mt-1">
            You're logged in as <strong>{user?.email}</strong> with admin privileges. 
            You should have full access to database configuration.
          </AlertDescription>
        </Alert>
      )}
      
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
      
      <div className="mt-8 border-t pt-6" id="advanced-config-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Advanced Configuration</h3>
          <Button asChild>
            <Link to="/supabase-test" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Supabase Test Tool
            </Link>
          </Button>
        </div>
        <div className="space-y-6">
          <UpdateSupabaseDirectly />
          
          <div className="mt-6">
            <h4 className="text-md font-medium mb-4">Supabase Testing Tools</h4>
            <SupabaseTestTool />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTab;
