import React from 'react';
import { DatabaseType } from './DatabaseTypeSelector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SupabaseConfig {
  use_default: boolean;
  custom_url: string;
  custom_key: string;
  last_tested: string | null;
  test_success: boolean;
}

interface DatabaseFormsProps {
  selectedDbType: DatabaseType | null;
  supabaseConfig?: SupabaseConfig;
  onConfigChange?: (field: string, value: string | boolean) => void;
}

const DatabaseForms: React.FC<DatabaseFormsProps> = ({
  selectedDbType,
  supabaseConfig,
  onConfigChange
}) => {
  if (!selectedDbType) {
    return <div className="text-center text-gray-500">Select a database type to configure</div>;
  }

  // Handle configuration changes for Supabase
  const handleSupabaseChange = (field: string, value: string | boolean) => {
    if (onConfigChange) {
      onConfigChange(field, value);
    }
  };

  return (
    <div className="space-y-6">
      {selectedDbType === 'supabase' && (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <h3 className="text-lg font-medium text-blue-800">Supabase Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Configure connection settings for Supabase database integration
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-default">Use Default Configuration</Label>
              <p className="text-xs text-muted-foreground">
                Use the pre-configured Supabase project for this application
              </p>
            </div>
            <Switch
              id="use-default"
              checked={supabaseConfig?.use_default}
              onCheckedChange={(checked) => handleSupabaseChange('use_default', checked)}
            />
          </div>

          {!supabaseConfig?.use_default && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="custom-url">Supabase Project URL</Label>
                <Input
                  id="custom-url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseConfig?.custom_url || ''}
                  onChange={(e) => handleSupabaseChange('custom_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-key">Supabase API Key</Label>
                <Input
                  id="custom-key"
                  type="password"
                  placeholder="Your Supabase API key"
                  value={supabaseConfig?.custom_key || ''}
                  onChange={(e) => handleSupabaseChange('custom_key', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the anon/public key from your Supabase project settings
                </p>
              </div>
            </div>
          )}

          {supabaseConfig?.last_tested && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm">Last tested:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(supabaseConfig.last_tested).toLocaleString()}
                </span>
                {supabaseConfig.test_success ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Success
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
                    <XCircle size={14} /> Failed
                  </Badge>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      {selectedDbType === 'mysql' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mysql-host">Host</Label>
            <Input id="mysql-host" placeholder="localhost" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mysql-port">Port</Label>
              <Input id="mysql-port" placeholder="3306" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mysql-database">Database</Label>
              <Input id="mysql-database" placeholder="my_database" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mysql-user">Username</Label>
            <Input id="mysql-user" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mysql-password">Password</Label>
            <Input id="mysql-password" type="password" />
          </div>
        </div>
      )}
      
      {selectedDbType === 'postgresql' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pg-host">Host</Label>
            <Input id="pg-host" placeholder="localhost" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pg-port">Port</Label>
              <Input id="pg-port" placeholder="5432" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pg-database">Database</Label>
              <Input id="pg-database" placeholder="postgres" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-user">Username</Label>
            <Input id="pg-user" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-password">Password</Label>
            <Input id="pg-password" type="password" />
          </div>
        </div>
      )}
      
      {selectedDbType === 'mongodb' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mongo-uri">Connection URI</Label>
            <Input id="mongo-uri" placeholder="mongodb://localhost:27017" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mongo-database">Database</Label>
            <Input id="mongo-database" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mongo-user">Username (Optional)</Label>
            <Input id="mongo-user" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mongo-password">Password (Optional)</Label>
            <Input id="mongo-password" type="password" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseForms;
