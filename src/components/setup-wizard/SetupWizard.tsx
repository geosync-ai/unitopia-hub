import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Cloud, FileSpreadsheet, Database } from 'lucide-react';

interface SetupWizardState {
  setSetupMethod: (method: string) => void;
  setOneDriveConfig: (config: { folderId: string; folderName: string }) => void;
  setObjectives: (objectives: any[]) => void;
  handleSetupComplete: () => void;
  updateExcelConfig: () => void;
  excelConfig: any;
  oneDriveConfig: any;
  setupMethod: string;
  objectives: any[];
}

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  setupState: SetupWizardState;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  setupState
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for initial selection
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSetupType, setSelectedSetupType] = useState<string | null>(null);

  const totalSteps = 4; // Now 4 steps: initial selection + 3 setup steps

  // Use the Excel sync hook
  const { 
    isLoading: isExcelLoading, 
    error: excelError, 
    loadDataFromExcel, 
    saveDataToExcel 
  } = useExcelSync({
    config: setupState?.excelConfig || null,
    onConfigChange: setupState?.updateExcelConfig || (() => {})
  });

  // Initialize component
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setCurrentStep(0);
      setProgress(0);
      setIsProcessing(false);
      setSelectedSetupType(null);
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  // Reset initialization when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  // Update Excel config when setup method or objectives change
  useEffect(() => {
    if (setupState?.oneDriveConfig && setupState?.setupMethod) {
      setupState.updateExcelConfig();
    }
  }, [setupState?.oneDriveConfig, setupState?.setupMethod, setupState?.objectives]);

  // Define handleComplete first because handleNext uses it
  const handleComplete = useCallback(async () => {
    if (!setupState?.excelConfig) {
      toast({
        title: "Setup Error",
        description: "Excel configuration is not properly initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Step 1: Save data to Excel
      setProgress(30);
      await saveDataToExcel();
      setProgress(60);

      // Step 2: Load data from Excel to populate the application
      setProgress(80);
      await loadDataFromExcel();
      setProgress(90);

      // Step 3: Complete setup
      if (setupState?.handleSetupComplete) {
        setupState.handleSetupComplete();
      }
      setProgress(100);

      toast({
        title: "Setup Complete",
        description: "Your unit has been successfully configured.",
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
  }, [setupState, toast, onComplete, onClose, saveDataToExcel, loadDataFromExcel]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, totalSteps, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Wrap handleSetupTypeSelect with useCallback
  const handleSetupTypeSelect = useCallback((type: string) => {
    console.log('Setup type selected:', type);
    setSelectedSetupType(type);

    console.log('Inspecting setupState in handleSetupTypeSelect (callback):', setupState);

    if (!setupState?.setSetupMethod) {
      toast({
        title: "Setup Error",
        description: "Setup state is not properly initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Set the appropriate setup method based on selection
    if (type === 'onedrive') {
      setupState.setSetupMethod('standard');
      setCurrentStep(1);
    } else if (type === 'excel') {
      setupState.setSetupMethod('import');
      setCurrentStep(1);
    } else if (type === 'demo') {
      setupState.setSetupMethod('demo');
      setCurrentStep(1);
    }
  }, [setupState, toast]);

  const renderInitialSelection = () => {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Choose Setup Method</h3>
          <p className="text-sm text-muted-foreground">
            Select how you want to set up your unit data
          </p>
        </div>

        <div className="grid gap-4">
          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('onedrive')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Cloud className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">OneDrive Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Connect to OneDrive and select a folder to store your unit data
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('excel')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Upload Excel File</h4>
                <p className="text-sm text-muted-foreground">
                  Upload an existing Excel file with your unit data
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSetupTypeSelect('demo')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Demo Data</h4>
                <p className="text-sm text-muted-foreground">
                  Start with sample data to explore the application
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderInitialSelection();
      case 1:
        if (selectedSetupType === 'onedrive') {
          return (
            <OneDriveSetup
              onComplete={(config) => {
                console.log('OneDrive setup completed:', config);
                if (setupState?.setOneDriveConfig) {
                  setupState.setOneDriveConfig({
                    folderId: config.folderId,
                    folderName: config.path
                  });
                  // Show success notification
                  toast({
                    title: "OneDrive folder selected successfully!",
                    description: `Using folder: "${config.path}"`,
                    duration: 2000,
                  });
                  // Wait a moment to show the notification
                  setTimeout(() => {
                    handleNext();
                  }, 1000);
                }
              }}
            />
          );
        } else if (selectedSetupType === 'excel') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Upload Excel File</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an Excel file containing your unit data
                </p>
              </div>
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <FileSpreadsheet className="h-12 w-12 text-green-500" />
                  <Button>
                    Select Excel File
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: .xlsx, .xls
                  </p>
                </div>
              </Card>
              <Button
                onClick={handleNext}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          );
        } else if (selectedSetupType === 'demo') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Demo Data</h3>
                <p className="text-sm text-muted-foreground">
                  Load sample data to explore the application
                </p>
              </div>
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Database className="h-12 w-12 text-purple-500" />
                  <p className="text-center">
                    This will load sample data for all tabs including tasks, projects, risks, and KRAs.
                  </p>
                </div>
              </Card>
              <Button
                onClick={handleNext}
                className="w-full"
              >
                Load Demo Data
              </Button>
            </div>
          );
        }
        break;
      case 2:
        return (
          <SetupMethod
            onSelect={(method) => {
              if (setupState?.setSetupMethod) {
                setupState.setSetupMethod(method);
                handleNext();
              }
            }}
          />
        );
      case 3:
        return (
          <ObjectivesSetup
            onComplete={(objectives) => {
              if (setupState?.setObjectives) {
                setupState.setObjectives(objectives);
                handleComplete();
              }
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
              {isProcessing ? 'Processing...' : `Step ${currentStep + 1} of ${totalSteps}`}
            </p>
          </div>

          {/* Step content */}
          <Card className="p-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center">Setting up your unit data...</p>
                <p className="text-sm text-muted-foreground text-center">
                  This may take a moment as we configure your data.
                </p>
              </div>
            ) : (
              renderStep()
            )}
          </Card>

          {/* Navigation buttons */}
          {!isProcessing && currentStep > 0 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
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