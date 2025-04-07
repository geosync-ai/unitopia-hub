
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Database } from 'lucide-react';
import { DatabaseType } from './DatabaseTypeSelector';

interface DatabaseFormsProps {
  selectedDbType: DatabaseType | null;
}

const DatabaseForms: React.FC<DatabaseFormsProps> = ({ selectedDbType }) => {
  switch (selectedDbType) {
    case 'sharepoint':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="sp-site-url">SharePoint Site URL</Label>
              <Input id="sp-site-url" placeholder="https://tenant.sharepoint.com/sites/your-site" />
            </div>
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <Select defaultValue="app">
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="365">Microsoft 365 Credentials</SelectItem>
                  <SelectItem value="app">App-Only Authentication</SelectItem>
                  <SelectItem value="api">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-client-id">Client ID</Label>
              <Input id="sp-client-id" placeholder="Enter Client ID" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-client-secret">Client Secret</Label>
              <Input id="sp-client-secret" type="password" placeholder="Enter Client Secret" />
            </div>
          </div>
        </div>
      );
      
    case 'excel':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Upload Method</Label>
              <Select defaultValue="direct">
                <SelectTrigger>
                  <SelectValue placeholder="Select upload method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct File Upload</SelectItem>
                  <SelectItem value="cloud">Cloud Storage Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excel-file">Excel File</Label>
              <Input id="excel-file" type="file" accept=".xlsx,.csv" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-name">Sheet Name</Label>
              <Input id="sheet-name" placeholder="Enter sheet name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="has-headers">Has Headers</Label>
              <div className="flex items-center space-x-2">
                <Switch id="has-headers" defaultChecked />
                <Label htmlFor="has-headers">First row contains column names</Label>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'firebase':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fb-project-id">Firebase Project ID</Label>
              <Input id="fb-project-id" placeholder="your-project-id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-service-account">Service Account JSON</Label>
              <Input id="fb-service-account" type="file" accept=".json" />
            </div>
            <div className="space-y-2">
              <Label>Database Type</Label>
              <Select defaultValue="firestore">
                <SelectTrigger>
                  <SelectValue placeholder="Select Firebase database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Realtime Database</SelectItem>
                  <SelectItem value="firestore">Firestore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-security">Security Rules</Label>
              <div className="flex items-center space-x-2">
                <Switch id="fb-security" />
                <Label htmlFor="fb-security">Apply public access rules</Label>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'sql':
    case 'mysql':
    case 'postgresql': {
      const dbName = selectedDbType === 'sql' ? 'SQL Server' : 
                    selectedDbType === 'mysql' ? 'MySQL' : 'PostgreSQL';
      
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="sql-host">Host</Label>
              <Input id="sql-host" placeholder="localhost or server address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sql-port">Port</Label>
              <Input 
                id="sql-port" 
                placeholder={selectedDbType === 'sql' ? '1433' : selectedDbType === 'mysql' ? '3306' : '5432'} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sql-db">Database Name</Label>
              <Input id="sql-db" placeholder="Enter database name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sql-user">Username</Label>
              <Input id="sql-user" placeholder="Database username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sql-password">Password</Label>
              <Input id="sql-password" type="password" placeholder="Database password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sql-ssl">SSL Connection</Label>
              <div className="flex items-center space-x-2">
                <Switch id="sql-ssl" />
                <Label htmlFor="sql-ssl">Use SSL for connection</Label>
              </div>
            </div>
          </div>
        </div>
      );
    }
      
    case 'supabase':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase Project URL</Label>
              <Input id="supabase-url" placeholder="https://your-project.supabase.co" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-key">Supabase API Key</Label>
              <Input id="supabase-key" placeholder="Enter API key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-tables">Auto-fetch Schema</Label>
              <div className="flex items-center space-x-2">
                <Switch id="supabase-tables" defaultChecked />
                <Label htmlFor="supabase-tables">Automatically fetch tables and views</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-rls">Row Level Security</Label>
              <div className="flex items-center space-x-2">
                <Switch id="supabase-rls" />
                <Label htmlFor="supabase-rls">Enable Row Level Security</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-realtime">Realtime Subscriptions</Label>
              <div className="flex items-center space-x-2">
                <Switch id="supabase-realtime" />
                <Label htmlFor="supabase-realtime">Enable Realtime subscriptions</Label>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'mongodb':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="mongo-uri">Connection String</Label>
              <Input id="mongo-uri" placeholder="mongodb://username:password@host:port/database" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mongo-db">Database Name</Label>
              <Input id="mongo-db" placeholder="Enter database name" />
            </div>
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <Select defaultValue="standard">
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Username/Password</SelectItem>
                  <SelectItem value="x509">X.509 Certificate</SelectItem>
                  <SelectItem value="aws">AWS IAM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
      
    case 'rest':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="rest-base-url">Base URL</Label>
              <Input id="rest-base-url" placeholder="https://api.example.com/v1" />
            </div>
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              <Select defaultValue="bearer">
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-token">Authentication Token</Label>
              <Input id="rest-token" placeholder="Enter token or key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-headers">Additional Headers</Label>
              <Input id="rest-headers" placeholder='{"Content-Type": "application/json"}' />
            </div>
          </div>
        </div>
      );
      
    case 'custom':
      return (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-connection">Connection String</Label>
              <Input id="custom-connection" placeholder="Custom connection string" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-code">Custom Connection Code</Label>
              <textarea 
                id="custom-code"
                className="w-full h-40 p-2 border rounded-md font-mono text-sm"
                placeholder={`// Example connection code\nconst connection = {\n  // Your custom connection logic\n};`}
              />
            </div>
            <div className="space-y-2">
              <Label>Runtime Environment</Label>
              <Select defaultValue="node">
                <SelectTrigger>
                  <SelectValue placeholder="Select runtime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="node">Node.js</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="text-center py-8">
          <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-4">Select a Database Type</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Choose a database type from the options above to configure your connection settings.
          </p>
        </div>
      );
  }
};

export default DatabaseForms;
