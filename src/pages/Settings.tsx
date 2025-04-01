
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the intranet looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Theme</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setTheme('light')}
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Sun size={16} />
                    <span>Light</span>
                  </Button>
                  <Button
                    onClick={() => setTheme('dark')}
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Moon size={16} />
                    <span>Dark</span>
                  </Button>
                  <Button
                    onClick={() => setTheme('system')}
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Monitor size={16} />
                    <span>System</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your profile and account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="mt-1">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <p className="mt-1 capitalize">{user?.role}</p>
              </div>
              {user?.unitName && (
                <div>
                  <label className="text-sm font-medium">Business Unit</label>
                  <p className="mt-1">{user.unitName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Settings;
