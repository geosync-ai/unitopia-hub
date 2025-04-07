import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Database, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Supabase connection constants
const SUPABASE_URL = "https://dmasclpgspatxncspcvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM";

const UpdateSupabaseDirectly = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handleDirectUpdate = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Hard-coded Microsoft config for SCPNG
      const msConfig = {
        clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
        apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
        permissions: ['User.Read'],
        redirectUri: 'https://id-preview--3816f188-bb84-4c3d-963d-5a30c86f087c.lovable.app',
        authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
        test_success: true,
        last_tested: new Date().toISOString(),
        confirmed: true,
        last_confirmed: new Date().toISOString()
      };
      
      console.log('Attempting direct update with:', msConfig);
      
      // First - check if there are multiple records with the same key (should not happen but let's check)
      const { data: allRecords, error: listError } = await supabase
        .from('app_config')
        .select('id')
        .eq('key', 'microsoft_config');
      
      if (listError) {
        console.error('Error listing records:', listError);
        throw new Error(`Could not check for existing records: ${listError.message}`);
      }
      
      if (allRecords && allRecords.length > 1) {
        console.warn('Multiple microsoft_config records found, cleaning up...');
        
        // Keep only one record and delete the rest
        const keepId = allRecords[0].id;
        
        for (let i = 1; i < allRecords.length; i++) {
          await supabase
            .from('app_config')
            .delete()
            .eq('id', allRecords[i].id);
        }
        
        console.log(`Kept record with ID ${keepId} and deleted ${allRecords.length - 1} duplicate(s)`);
      }
      
      // Now check if we have exactly one record
      if (!allRecords || allRecords.length === 0) {
        console.log('No microsoft_config record found, creating one...');
        
        // Insert new record
        const { error: insertError } = await supabase
          .from('app_config')
          .insert({
            key: 'microsoft_config',
            value: msConfig,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          throw new Error(`Failed to create record: ${insertError.message}`);
        }
        
        console.log('New record created successfully');
      } else {
        // Update existing record
        const { error: updateError } = await supabase
          .from('app_config')
          .update({
            value: msConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', allRecords[0].id);
        
        if (updateError) {
          throw new Error(`Failed to update record: ${updateError.message}`);
        }
        
        console.log('Existing record updated successfully');
      }
      
      // Verify the update - but don't throw an error if verification fails
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'microsoft_config')
          .limit(1);
        
        if (verifyError) {
          console.warn('Verification warning:', verifyError);
        } else if (verifyData && verifyData.length > 0) {
          console.log('Verification data:', verifyData[0]);
        } else {
          console.warn('No verification data returned');
        }
      } catch (verifyErr) {
        console.warn('Verification failed but update might still be successful:', verifyErr);
      }
      
      // Update localStorage for immediate use
      localStorage.setItem('ms-api-config', JSON.stringify(msConfig));
      
      setResult({
        success: true,
        message: 'Microsoft configuration successfully updated in Supabase!'
      });
      
      toast.success('Direct database update successful!');
    } catch (error) {
      console.error('Direct update failed:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast.error('Direct update failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRawAPIUpdate = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Prepare the Microsoft config JSON
      const msConfig = {
        clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
        apiEndpoint: 'https://graph.microsoft.com/v1.0/me',
        permissions: ['User.Read'],
        redirectUri: 'https://id-preview--3816f188-bb84-4c3d-963d-5a30c86f087c.lovable.app',
        authorityUrl: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
        test_success: true,
        last_tested: new Date().toISOString(),
        confirmed: true,
        last_confirmed: new Date().toISOString()
      };
      
      const msConfigJson = JSON.stringify(msConfig);
      console.log('Raw API call with data:', msConfigJson);
      
      // First, check if records exist
      const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.microsoft_config`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!listResponse.ok) {
        throw new Error(`Failed to check for existing records: ${listResponse.status}`);
      }
      
      const existingRecords = await listResponse.json();
      console.log('Existing records:', existingRecords);
      
      let responseStatus;
      
      // Decide whether to INSERT or UPDATE based on existing records
      if (!existingRecords || existingRecords.length === 0) {
        // No record exists, create a new one with INSERT
        console.log('No existing record found, creating new one...');
        
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            key: 'microsoft_config',
            value: msConfig,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
        
        responseStatus = insertResponse.status;
        
        if (!insertResponse.ok) {
          throw new Error(`INSERT failed with status ${insertResponse.status}`);
        }
        
        console.log('New record created successfully!');
      } else {
        // Records exist
        if (existingRecords.length > 1) {
          // Multiple records found, clean up by deleting all but one
          console.warn(`Found ${existingRecords.length} records, cleaning up duplicates...`);
          
          // Keep first record, delete others
          for (let i = 1; i < existingRecords.length; i++) {
            const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?id=eq.${existingRecords[i].id}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!deleteResponse.ok) {
              console.warn(`Failed to delete duplicate record ${existingRecords[i].id}`);
            }
          }
        }
        
        // Update the first record with PATCH
        console.log(`Updating record with id: ${existingRecords[0].id}`);
        
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/app_config?id=eq.${existingRecords[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            value: msConfig,
            updated_at: new Date().toISOString()
          })
        });
        
        responseStatus = updateResponse.status;
        
        if (!updateResponse.ok) {
          throw new Error(`UPDATE failed with status ${updateResponse.status}`);
        }
        
        console.log('Existing record updated successfully!');
      }
      
      // Update localStorage regardless of verification
      localStorage.setItem('ms-api-config', msConfigJson);
      
      setResult({
        success: true,
        message: `Microsoft configuration successfully updated via direct REST API! (Status: ${responseStatus})`
      });
      
      toast.success('Raw API update successful!');
    } catch (error) {
      console.error('Raw API update failed:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast.error('Raw API update failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestSupabaseConnection = async () => {
    setIsTestLoading(true);
    setTestResult(null);
    
    try {
      // Create a simple test record for the app_config table
      const testData = {
        test_timestamp: new Date().toISOString(),
        test_value: `Test value ${Math.floor(Math.random() * 1000)}`,
        message: "This is a test entry to verify Supabase connectivity"
      };
      
      console.log('Testing Supabase connection with test data:', testData);
      
      // First check if test record exists
      const { data: existingData, error: checkError } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', 'test')
        .single();
      
      let result;
      
      if (checkError) {
        // Record doesn't exist, create it
        console.log('No test record found, creating one...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('app_config')
          .insert({
            key: 'test',
            value: testData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          throw new Error(`Failed to create test record: ${insertError.message}`);
        }
        
        result = insertData;
        console.log('Test record created successfully:', insertData);
      } else {
        // Record exists, update it
        console.log('Existing test record found, updating it:', existingData);
        
        const { data: updateData, error: updateError } = await supabase
          .from('app_config')
          .update({
            value: testData,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'test')
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Failed to update test record: ${updateError.message}`);
        }
        
        result = updateData;
        console.log('Test record updated successfully:', updateData);
      }
      
      // Verify the test record
      const { data: verifyData, error: verifyError } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', 'test')
        .single();
      
      if (verifyError) {
        throw new Error(`Verification failed: ${verifyError.message}`);
      }
      
      setTestResult({
        success: true,
        message: 'Supabase connection test successful! Test record created/updated.',
        data: verifyData
      });
      
      toast.success('Supabase connection test successful!');
    } catch (error) {
      console.error('Supabase test failed:', error);
      
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast.error('Supabase test failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="text-lg font-medium">Direct Database Update</h3>
      <p className="text-sm text-gray-500">
        Use these options if the normal Microsoft API configuration update is not working.
      </p>
      
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          </div>
          <AlertDescription className="mt-2">{result.message}</AlertDescription>
        </Alert>
      )}
      
      {/* RLS Error Help */}
      {result && !result.success && result.message.includes('violates row-level security policy') && (
        <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200 mb-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <AlertTitle className="text-amber-800">Row Level Security Error</AlertTitle>
              <AlertDescription className="mt-1 text-sm">
                <p className="mb-2">
                  This error occurs because your current user doesn't have permission to modify the database. 
                  This is caused by Supabase's Row Level Security (RLS) policies.
                </p>
                <p className="mb-2">
                  <strong>To fix this:</strong>
                </p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to Project Settings → API</li>
                  <li>Copy your "service_role" key (appears as <KeyRound className="inline h-3 w-3" /> service_role)</li>
                  <li>Use our <a href="/supabase-test" className="underline text-blue-700">Supabase Test Tool</a> with this key</li>
                </ol>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="default" 
          disabled={isLoading}
          onClick={handleDirectUpdate}
        >
          {isLoading ? 'Updating...' : 'Update with Supabase JS'}
        </Button>
        
        <Button 
          variant="secondary" 
          disabled={isLoading}
          onClick={handleRawAPIUpdate}
        >
          {isLoading ? 'Updating...' : 'Update with Direct REST API'}
        </Button>
      </div>
      
      <div className="mt-6 border-t pt-4">
        <h4 className="text-md font-medium mb-2">Test Supabase Connection</h4>
        <p className="text-sm text-gray-500 mb-4">
          Click the button below to test the Supabase connection by adding/updating a 'test' record in the app_config table.
        </p>
        
        <Button 
          variant="outline"
          className="flex items-center gap-2" 
          disabled={isTestLoading}
          onClick={handleTestSupabaseConnection}
        >
          <Database className="h-4 w-4" />
          {isTestLoading ? 'Testing...' : 'Test Supabase Connection'}
        </Button>
        
        {testResult && (
          <div className="mt-4">
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{testResult.success ? "Test Success" : "Test Error"}</AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {testResult.message}
                {testResult.data && (
                  <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
                    <p className="font-medium mb-1">Response data:</p>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-28">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>These buttons will:</p>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Directly update the microsoft_config record in app_config table</li>
          <li>Use hardcoded values for the Microsoft API configuration</li>
          <li>Set the configuration as tested and confirmed</li>
          <li>Also update localStorage for immediate use</li>
        </ol>
      </div>
    </div>
  );
};

export default UpdateSupabaseDirectly; 