
import React, { useState } from 'react';
import { toast } from 'sonner';
import DatabaseTypeSelector, { DatabaseType } from './DatabaseTypeSelector';
import DatabaseForms from './DatabaseForms';
import DatabaseConnectionActions from './DatabaseConnectionActions';

const DatabaseTab: React.FC = () => {
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const handleTestConnection = () => {
    setTestStatus('testing');
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestStatus(success ? 'success' : 'error');
      
      if (success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed. Please check your credentials.');
      }
    }, 1500);
  };
  
  const handleSaveConfiguration = () => {
    toast.success(`${selectedDbType?.charAt(0).toUpperCase()}${selectedDbType?.slice(1)} database configuration saved`);
    setSelectedDbType(null);
    setTestStatus('idle');
  };

  return (
    <>
      <DatabaseTypeSelector 
        selectedDbType={selectedDbType} 
        setSelectedDbType={setSelectedDbType} 
      />
      
      <div className="border rounded-lg p-6">
        <DatabaseForms selectedDbType={selectedDbType} />
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
