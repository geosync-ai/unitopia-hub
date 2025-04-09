import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { OneDriveSetup } from '@/components/setup-wizard/steps/OneDriveSetup';
import { SetupMethod } from '@/components/setup-wizard/steps/SetupMethod';
import { ObjectivesSetup } from '@/components/setup-wizard/steps/ObjectivesSetup';
import { useToast } from '@/components/ui/use-toast';
import { useExcelSync } from '@/hooks/useExcelSync';
import { Loader2 } from 'lucide-react';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  setupState: any;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  setupState
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalSteps = 3;

  // Use the Excel sync hook
  const { 
    isLoading: isExcelLoading, 
    error: excelError, 
    loadDataFromExcel, 
    saveDataToExcel 
  } = useExcelSync({
    config: setupState.excelConfig,
    onConfigChange: setupState.setExcelConfig
  });

  // Update Excel config when setup method or objectives change
  useEffect(() => {
    if (setupState.oneDriveConfig && setupState.setupMethod) {
      setupState.updateExcelConfig();
    }
  }, [setupState.oneDriveConfig, setupState.setupMethod, setupState.objectives]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    setProgress(10);

    try {
      // Step 1: Save data to Excel
      if (setupState.excelConfig) {
        setProgress(30);
        await saveDataToExcel();
        setProgress(60);
      }

      // Step 2: Load data from Excel to populate the application
      if (setupState.excelConfig) {
        setProgress(80);
        await loadDataFromExcel();
        setProgress(90);
      }

      // Step 3: Complete setup
      setupState.handleSetupComplete();
      setProgress(100);

      toast({
        title: "Setup Complete",
        description: "Your unit has been successfully configured with OneDrive integration.",
      });
      
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: "Setup Error",
        description: "There was an error completing the setup process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OneDriveSetup
            onComplete={(config) => {
              setupState.setOneDriveConfig({
                folderId: config.folderId,
                folderName: config.path
              });
              handleNext();
            }}
          />
        );
      case 2:
        return (
          <SetupMethod
            onSelect={(method) => {
              setupState.setSetupMethod(method);
              handleNext();
            }}
          />
        );
      case 3:
        return (
          <ObjectivesSetup
            onComplete={(objectives) => {
              setupState.setObjectives(objectives);
              handleComplete();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Unit Setup Wizard</DialogTitle>
          <DialogDescription>
            Configure your unit's backend storage and structure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <Progress value={isProcessing ? progress : (currentStep / totalSteps) * 100} />
            <p className="text-sm text-muted-foreground text-center">
              {isProcessing ? 'Processing...' : `Step ${currentStep} of ${totalSteps}`}
            </p>
          </div>

          {/* Step content */}
          <Card className="p-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center">Setting up your unit data...</p>
                <p className="text-sm text-muted-foreground text-center">
                  This may take a moment as we configure your OneDrive integration.
                </p>
              </div>
            ) : (
              renderStep()
            )}
          </Card>

          {/* Navigation buttons */}
          {!isProcessing && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 