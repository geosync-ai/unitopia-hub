import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, User } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import ThemeCustomization from '@/components/admin/ThemeCustomization';
import AIConfiguration from '@/components/admin/AIConfiguration';
import UserNotifications from '@/components/admin/UserNotifications';
import BusinessUnits from '@/components/admin/BusinessUnits';
import UserDialogs from '@/components/admin/UserDialogs';
import OrganizationalStrategy from '@/components/admin/OrganizationalStrategy';
import BannerManagement from '@/components/admin/BannerManagement';
import DatabaseIntegration from '@/components/admin/DatabaseIntegration';
import BusinessUnitLinks from '@/components/admin/database/BusinessUnitLinks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink } from 'lucide-react';

// Mock users data
const mockUsers = [
  { id: '1', email: 'admin@scpng.com', name: 'Admin User', role: 'admin' as const, unitName: 'IT' },
  { id: '2', email: 'manager@finance.scpng.com', name: 'Finance Manager', role: 'manager' as const, unitId: 'finance', unitName: 'Finance Department' },
  { id: '3', email: 'user@hr.scpng.com', name: 'HR Staff', role: 'user' as const, unitId: 'hr', unitName: 'Human Resources' },
  { id: '4', email: 'manager@it.scpng.com', name: 'IT Manager', role: 'manager' as const, unitId: 'it', unitName: 'IT Department' },
];

const AdminPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" />;
  }

  const generatePasswordForUser = (user: User) => {
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);
    setGeneratedPassword(randomPassword);
    setSelectedUser(user);
    setShowPasswordDialog(true);
  };
  
  const configureEmailNotifications = (user: User) => {
    setSelectedUser(user);
    setShowEmailDialog(true);
  };

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Quick Access Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-primary" />
                Supabase Database Test Tool
              </CardTitle>
              <CardDescription>
                Verify connectivity and interact with your Supabase database
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 text-sm">
              Create, fetch, update, or delete records directly in the app_config table. 
              Great for troubleshooting configuration issues.
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/supabase-test" className="flex items-center justify-center gap-2">
                  Open Test Tool
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-9 mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="strategy">Org Strategy</TabsTrigger>
          <TabsTrigger value="units">Business Units</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="links">Unit Links</TabsTrigger>
        </TabsList>
        
        {/* USER MANAGEMENT TAB */}
        <TabsContent value="users" className="space-y-4">
          <UserManagement 
            users={users} 
            setUsers={setUsers} 
            onGeneratePassword={generatePasswordForUser}
            onConfigureEmail={configureEmailNotifications}
          />
        </TabsContent>
        
        {/* BANNER MANAGEMENT TAB */}
        <TabsContent value="banner">
          <BannerManagement />
        </TabsContent>
        
        {/* THEME CUSTOMIZATION TAB */}
        <TabsContent value="theme">
          <ThemeCustomization />
        </TabsContent>
        
        {/* AI CONFIGURATION TAB */}
        <TabsContent value="ai">
          <AIConfiguration />
        </TabsContent>
        
        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <UserNotifications />
        </TabsContent>
        
        {/* ORGANIZATIONAL STRATEGY TAB */}
        <TabsContent value="strategy">
          <OrganizationalStrategy />
        </TabsContent>
        
        {/* BUSINESS UNITS TAB */}
        <TabsContent value="units">
          <BusinessUnits />
        </TabsContent>
        
        {/* DATABASE INTEGRATION TAB */}
        <TabsContent value="database">
          <DatabaseIntegration />
        </TabsContent>
        
        {/* BUSINESS UNIT LINKS TAB */}
        <TabsContent value="links">
          <BusinessUnitLinks />
        </TabsContent>
      </Tabs>
      
      {/* User-related dialogs */}
      <UserDialogs 
        showPasswordDialog={showPasswordDialog}
        setShowPasswordDialog={setShowPasswordDialog}
        showEmailDialog={showEmailDialog}
        setShowEmailDialog={setShowEmailDialog}
        selectedUser={selectedUser}
        generatedPassword={generatedPassword}
      />
    </PageLayout>
  );
};

export default AdminPage;
