
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface DatabaseConnectionActionsProps {
  selectedDbType: string | null;
  testStatus: 'idle' | 'testing' | 'success' | 'error';
  onTestConnection: () => void;
  onSaveConfiguration: () => void;
  onCancel: () => void;
}

const DatabaseConnectionActions: React.FC<DatabaseConnectionActionsProps> = ({ 
  selectedDbType, 
  testStatus, 
  onTestConnection, 
  onSaveConfiguration, 
  onCancel 
}) => {
  if (!selectedDbType) return null;
  
  return (
    <div className="flex justify-end mt-6 gap-2">
      <Button 
        variant="outline" 
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button 
        variant="outline"
        className={`${testStatus === 'testing' ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={onTestConnection}
        disabled={testStatus === 'testing'}
      >
        {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
      </Button>
      <Button 
        disabled={testStatus !== 'success'}
        onClick={onSaveConfiguration}
      >
        <Check size={16} className="mr-2" />
        Save Configuration
      </Button>
    </div>
  );
};

export default DatabaseConnectionActions;
