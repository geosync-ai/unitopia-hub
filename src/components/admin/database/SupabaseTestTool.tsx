import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Save, Trash, RefreshCw, Copy, Clipboard, KeyRound, ShieldAlert, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

// Template examples for common configurations
const TEMPLATES = {
  microsoft: {
    key: 'microsoft_config',
    value: {
      clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
      apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
      permissions: ['User.Read'],
      redirectUri: 'https://id-preview--3816f188-bb84-4c3d-963d-5a30c86f087c.lovable.app',
      authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
      test_success: true,
      last_tested: new Date().toISOString(),
      confirmed: true,
      last_confirmed: new Date().toISOString()
    }
  },
  test: {
    key: 'test',
    value: {
      timestamp: new Date().toISOString(),
      sample_value: 'test-data-' + Math.floor(Math.random() * 1000),
      is_working: true
    }
  }
};

const SupabaseTestTool = () => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [formatAsJson, setFormatAsJson] = useState(true);
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [useServiceRole, setUseServiceRole] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const handleUpsertRecord = async () => {
    if (!key.trim()) {
      toast.error('Key is required');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      let processedValue;
      
      // Parse as JSON if formatAsJson is true and value is valid JSON
      if (formatAsJson) {
        try {
          processedValue = JSON.parse(value);
        } catch (parseError) {
          throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      } else {
        // Use as plain string
        processedValue = value;
      }
      
      // Use either the default supabase client or create a new one with service role key
      let client = supabase;
      
      if (useServiceRole && serviceRoleKey) {
        // Create a new client with the service role key
        client = createClient(
          "https://dmasclpgspatxncspcvt.supabase.co", 
          serviceRoleKey
        );
        
        console.log('Using service role key for this operation');
      }
      
      // Check if record exists
      const { data: existingData, error: checkError } = await client
        .from('app_config')
        .select('id')
        .eq('key', key);
      
      if (checkError) {
        throw new Error(`Failed to check for existing records: ${checkError.message}`);
      }
      
      let operationResult;
      
      if (!existingData || existingData.length === 0) {
        // Insert new record
        console.log('Creating new record with key:', key);
        
        const { data: insertData, error: insertError } = await client
          .from('app_config')
          .insert({
            key: key,
            value: processedValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          throw new Error(`Failed to create record: ${insertError.message}`);
        }
        
        operationResult = insertData;
        toast.success(`Record with key "${key}" created successfully`);
      } else {
        // Update existing record
        console.log('Updating existing record with key:', key);
        
        const { data: updateData, error: updateError } = await client
          .from('app_config')
          .update({
            value: processedValue,
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .select();
        
        if (updateError) {
          throw new Error(`Failed to update record: ${updateError.message}`);
        }
        
        operationResult = updateData;
        toast.success(`Record with key "${key}" updated successfully`);
      }
      
      setResult({
        success: true,
        message: `Record with key "${key}" successfully ${!existingData || existingData.length === 0 ? 'created' : 'updated'}`,
        data: operationResult
      });
    } catch (error) {
      console.error('Operation failed:', error);
      
      let errorMessage = error instanceof Error ? error.message : String(error);
      let suggestedFix = '';
      
      // Add suggestions for common errors
      if (errorMessage.includes('violates row-level security policy')) {
        suggestedFix = 'This error occurs when your user doesn\'t have permission to write to this table. Try enabling the "Use Service Role Key" option above and entering your service role key from Supabase.';
      }
      
      setResult({
        success: false,
        message: errorMessage,
        data: suggestedFix ? { suggestedFix } : undefined
      });
      
      toast.error('Operation failed: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteRecord = async () => {
    if (!key.trim()) {
      toast.error('Key is required for deletion');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      // Use either the default supabase client or create a new one with service role key
      let client = supabase;
      
      if (useServiceRole && serviceRoleKey) {
        // Create a new client with the service role key
        client = createClient(
          "https://dmasclpgspatxncspcvt.supabase.co", 
          serviceRoleKey
        );
        
        console.log('Using service role key for this operation');
      }
      
      // Delete the record
      const { error: deleteError } = await client
        .from('app_config')
        .delete()
        .eq('key', key);
      
      if (deleteError) {
        throw new Error(`Failed to delete record: ${deleteError.message}`);
      }
      
      setResult({
        success: true,
        message: `Record with key "${key}" successfully deleted`
      });
      
      toast.success(`Record with key "${key}" deleted successfully`);
    } catch (error) {
      console.error('Delete operation failed:', error);
      
      let errorMessage = error instanceof Error ? error.message : String(error);
      let suggestedFix = '';
      
      // Add suggestions for common errors
      if (errorMessage.includes('violates row-level security policy')) {
        suggestedFix = 'This error occurs when your user doesn\'t have permission to delete from this table. Try enabling the "Use Service Role Key" option above and entering your service role key from Supabase.';
      }
      
      setResult({
        success: false,
        message: errorMessage,
        data: suggestedFix ? { suggestedFix } : undefined
      });
      
      toast.error('Delete failed: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFetchRecord = async () => {
    if (!key.trim()) {
      toast.error('Key is required for fetching');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      // Use either the default supabase client or create a new one with service role key
      let client = supabase;
      
      if (useServiceRole && serviceRoleKey) {
        // Create a new client with the service role key
        client = createClient(
          "https://dmasclpgspatxncspcvt.supabase.co", 
          serviceRoleKey
        );
        
        console.log('Using service role key for this operation');
      }
      
      // Fetch the record
      const { data, error } = await client
        .from('app_config')
        .select('*')
        .eq('key', key);
      
      if (error) {
        throw new Error(`Failed to fetch record: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        setResult({
          success: false,
          message: `No record found with key "${key}"`
        });
        return;
      }
      
      // If record exists, update the value field
      const recordValue = data[0].value;
      
      if (formatAsJson && typeof recordValue === 'object') {
        setValue(JSON.stringify(recordValue, null, 2));
      } else {
        setValue(String(recordValue));
      }
      
      setResult({
        success: true,
        message: `Record with key "${key}" successfully retrieved`,
        data: data[0]
      });
      
      toast.success(`Record with key "${key}" retrieved successfully`);
    } catch (error) {
      console.error('Fetch operation failed:', error);
      
      let errorMessage = error instanceof Error ? error.message : String(error);
      let suggestedFix = '';
      
      // Add suggestions for common errors
      if (errorMessage.includes('violates row-level security policy')) {
        suggestedFix = 'This error occurs when your user doesn\'t have permission to read from this table. Try enabling the "Use Service Role Key" option above and entering your service role key from Supabase.';
      }
      
      setResult({
        success: false,
        message: errorMessage,
        data: suggestedFix ? { suggestedFix } : undefined
      });
      
      toast.error('Fetch failed: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadTemplate = (templateName: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateName];
    setKey(template.key);
    setValue(JSON.stringify(template.value, null, 2));
    
    toast.info(`Template loaded: ${template.key}. Click 'Save to Supabase' to create/update this record.`);
  };
  
  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="text-lg font-medium">Supabase Test Tool</h3>
      <p className="text-sm text-gray-500">
        Create, update, or delete records in the app_config table to test Supabase connectivity.
      </p>
      
      {/* Admin user info */}
      {isAdmin && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <AlertTitle className="text-green-800">Admin Access</AlertTitle>
              <AlertDescription className="mt-1 text-sm">
                <p className="mb-1">You're logged in as an admin user: <strong>{user?.email}</strong></p>
                <p>
                  You should have access to manage Supabase data directly. If you're still experiencing
                  RLS policy errors, use the service role key option below.
                </p>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => loadTemplate('microsoft')}
        >
          <Clipboard className="h-3.5 w-3.5" />
          Microsoft Config Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => loadTemplate('test')}
        >
          <Clipboard className="h-3.5 w-3.5" />
          Test Record Template
        </Button>
      </div>
      
      {/* RLS Error Alert */}
      <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <AlertTitle className="text-amber-800">Row Level Security Notice</AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              If you're seeing <strong>"violates row-level security policy"</strong> errors, you need 
              additional permissions to modify data. Toggle "Use Service Role Key" below and enter your 
              Supabase service role key to bypass RLS policies.
            </AlertDescription>
          </div>
        </div>
      </Alert>
      
      {/* Service Key Option */}
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">Use Service Role Key</span>
        </div>
        <Switch 
          checked={useServiceRole}
          onCheckedChange={(checked) => {
            setUseServiceRole(checked);
            setShowKeyInput(checked);
          }}
        />
      </div>
      
      {showKeyInput && (
        <div className="space-y-2">
          <Label htmlFor="service-key" className="text-sm">Service Role Key</Label>
          <Alert variant="destructive" className="py-2 px-3 bg-red-50 text-red-800 border-red-200">
            <p className="text-xs">
              <strong>Security warning:</strong> Service role keys have full access to your database.
              Only use this for testing and never share or expose this key.
            </p>
          </Alert>
          <Input
            id="service-key"
            type="password"
            placeholder="Enter your Supabase service role key"
            value={serviceRoleKey}
            onChange={(e) => setServiceRoleKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Find this in your Supabase dashboard under Project Settings &gt; API &gt; Project API keys
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            placeholder="Enter record key (e.g., 'microsoft_config', 'test', etc.)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="value">Value</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="json-format" 
                checked={formatAsJson}
                onCheckedChange={setFormatAsJson}
              />
              <Label htmlFor="json-format" className="text-xs">Format as JSON</Label>
            </div>
          </div>
          
          <Textarea
            id="value"
            placeholder={formatAsJson ? 
              '{\n  "prop1": "value1",\n  "prop2": "value2"\n}' : 
              'Enter value as plain text'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <p className="text-xs text-muted-foreground">
            {formatAsJson ? 
              'Enter valid JSON object to be stored in the database' : 
              'Enter plain text value to be stored in the database'
            }
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            className="flex items-center gap-2"
            disabled={isLoading || (useServiceRole && !serviceRoleKey)}
            onClick={handleUpsertRecord}
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save to Supabase'}
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading || (useServiceRole && !serviceRoleKey)}
            onClick={handleFetchRecord}
          >
            <RefreshCw className="h-4 w-4" />
            {isLoading ? 'Fetching...' : 'Fetch Record'}
          </Button>
          
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            disabled={isLoading || (useServiceRole && !serviceRoleKey)}
            onClick={handleDeleteRecord}
          >
            <Trash className="h-4 w-4" />
            {isLoading ? 'Deleting...' : 'Delete Record'}
          </Button>
        </div>
      </div>
      
      {result && (
        <div className="mt-4">
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {result.message}
              {result.data && (
                <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
                  {result.data.suggestedFix ? (
                    <div className="text-xs mb-2 text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <p className="font-medium">Suggestion:</p>
                      <p>{result.data.suggestedFix}</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium mb-1">Response data:</p>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-48">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Use this tool to verify Supabase connectivity and update configuration data:</p>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Enter a key (such as 'microsoft_config' or 'test')</li>
          <li>Enter a value (in JSON format or plain text)</li>
          <li>Click "Save to Supabase" to create or update the record</li>
          <li>Use "Fetch Record" to retrieve existing data</li>
          <li>Use "Delete Record" to remove records (use with caution)</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseTestTool; 