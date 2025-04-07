import React from 'react';
import { Card } from '@/components/ui/card';
import SupabaseTestTool from '@/components/admin/database/SupabaseTestTool';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SupabaseTestPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Supabase Database Testing</h1>
        </div>
        <Database className="h-8 w-8 text-primary" />
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">What is this tool for?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Verify Database Connectivity</strong> - Test that your application can successfully connect to and 
              interact with your Supabase database.
            </li>
            <li>
              <strong>Manage Configuration</strong> - Easily create, update, fetch, or delete configuration records 
              in the app_config table.
            </li>
            <li>
              <strong>Debug API Issues</strong> - When experiencing problems with API configurations like Microsoft Graph,
              use this tool to directly view and modify the stored configuration.
            </li>
            <li>
              <strong>Ensure Data Persistence</strong> - Confirm that data is being correctly stored and retrieved from 
              your Supabase backend.
            </li>
          </ul>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Common Issues</h2>
          
          <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200 mb-6">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <AlertTitle className="text-amber-800">Row Level Security Errors</AlertTitle>
                <AlertDescription className="mt-1">
                  <p className="mb-2">
                    If you see <strong>"violates row-level security policy"</strong> errors, this means your current user 
                    doesn't have sufficient permissions to modify data in the table.
                  </p>
                  <p>
                    Supabase uses Row Level Security (RLS) to control which users can access which data. By default, 
                    tables are protected from both read and write operations.
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">How to Fix RLS Errors</h3>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                <li>
                  <strong>Use a Service Role Key</strong> - In the tool below, toggle "Use Service Role Key" and 
                  enter your Supabase service role key. This bypasses RLS entirely for administrative operations.
                </li>
                <li>
                  <strong>Update RLS Policies</strong> - In your Supabase dashboard, go to Authentication → Policies 
                  and create policies for the app_config table that allow the operations you need.
                </li>
                <li>
                  <strong>Make Sure You're Authenticated</strong> - RLS policies often check if a user is authenticated. 
                  Make sure you're logged in with a user that has the required permissions.
                </li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Testing Microsoft API Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                To view or modify the Microsoft API configuration:
              </p>
              <ol className="list-decimal pl-5 text-sm space-y-1">
                <li>Enter <code className="bg-gray-100 px-1 rounded">microsoft_config</code> as the key</li>
                <li>Click "Fetch Record" to see the current configuration</li>
                <li>Make any necessary changes to the JSON structure</li>
                <li>Click "Save to Supabase" to update the configuration</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Creating Test Records</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                To create a simple test record to verify database connectivity:
              </p>
              <ol className="list-decimal pl-5 text-sm space-y-1">
                <li>Enter <code className="bg-gray-100 px-1 rounded">test</code> as the key</li>
                <li>Enter a simple JSON object like <code className="bg-gray-100 px-1 rounded">{`{"timestamp": "2023-01-01", "value": "test-value"}`}</code></li>
                <li>Click "Save to Supabase" to create the record</li>
                <li>Verify the response shows a successful creation</li>
              </ol>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <SupabaseTestTool />
        </Card>
      </div>
    </div>
  );
};

export default SupabaseTestPage; 