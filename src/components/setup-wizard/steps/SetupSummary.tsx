import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SetupSummaryProps {
  oneDriveConfig: {
    folderId: string;
    folderName: string;
  } | null;
  objectives: any[];
  onComplete: () => void;
  onBack: () => void;
}

export const SetupSummary: React.FC<SetupSummaryProps> = ({
  oneDriveConfig,
  objectives,
  onComplete,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review Setup</h3>
        <p className="text-sm text-muted-foreground">
          Review your configuration before finalizing
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* OneDrive Configuration */}
          <div className="space-y-2">
            <h4 className="font-medium">OneDrive Configuration</h4>
            {oneDriveConfig ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Using folder: {oneDriveConfig.folderName}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>No folder selected</span>
              </div>
            )}
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <h4 className="font-medium">Objectives</h4>
            {objectives.length > 0 ? (
              <div className="space-y-2">
                {objectives.map((obj, index) => (
                  <div key={obj.id} className="pl-4 border-l-2 border-gray-200">
                    <p className="font-medium">Objective {index + 1}</p>
                    <p className="text-sm text-gray-600">{obj.title}</p>
                    {obj.kpis && obj.kpis.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">KPIs:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {obj.kpis.map((kpi: string, i: number) => (
                            <li key={i}>{kpi}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>No objectives defined</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete}>
          Complete Setup
        </Button>
      </div>
    </div>
  );
}; 