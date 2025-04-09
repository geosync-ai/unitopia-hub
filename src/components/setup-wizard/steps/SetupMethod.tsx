import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Database, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SetupMethodProps {
  onSelect: (method: string) => void;
}

export const SetupMethod: React.FC<SetupMethodProps> = ({ onSelect }) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const methods = [
    {
      id: 'standard',
      title: 'Standard Setup',
      description: 'Generate empty but pre-structured files for each tab (KRs, Tasks, etc.)',
      icon: Database,
    },
    {
      id: 'import',
      title: 'Drag & Drop to AI',
      description: 'Upload files (Excel, CSV, JSON) and let AI map the content',
      icon: Upload,
    },
    {
      id: 'demo',
      title: 'Demo Data',
      description: 'Load sample data for all tabs to get started quickly',
      icon: FileSpreadsheet,
    },
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    } else {
      toast({
        title: "No Method Selected",
        description: "Please select a setup method to continue",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Setup Method</h3>
        <p className="text-sm text-muted-foreground">
          Select how you want to initialize your unit's data
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => (
          <Card
            key={method.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleMethodSelect(method.id)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${
                selectedMethod === method.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                <method.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{method.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}; 