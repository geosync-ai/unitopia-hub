
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MicrosoftAPIConfig from './database/MicrosoftAPIConfig';
import DatabaseTab from './database/DatabaseTab';

const DatabaseIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'database' | 'microsoft'>('database');
  
  const availablePermissions = [
    { value: 'User.Read', label: 'User Profile (User.Read)' },
    { value: 'Files.Read.All', label: 'Read All Files (Files.Read.All)' },
    { value: 'Files.ReadWrite.All', label: 'Read/Write All Files (Files.ReadWrite.All)' },
    { value: 'Sites.Read.All', label: 'Read All Sites (Sites.Read.All)' },
    { value: 'Sites.ReadWrite.All', label: 'Read/Write All Sites (Sites.ReadWrite.All)' },
    { value: 'Mail.Read', label: 'Read Mail (Mail.Read)' },
    { value: 'Calendars.Read', label: 'Read Calendar (Calendars.Read)' },
    { value: 'People.Read', label: 'Read People (People.Read)' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Center</CardTitle>
        <CardDescription>
          Configure database connections and API integrations for the intranet portal
        </CardDescription>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'database' | 'microsoft')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database">Database Connections</TabsTrigger>
            <TabsTrigger value="microsoft">Microsoft Integration</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'database' && <DatabaseTab />}
        
        {activeTab === 'microsoft' && (
          <MicrosoftAPIConfig
            availablePermissions={availablePermissions}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseIntegration;
