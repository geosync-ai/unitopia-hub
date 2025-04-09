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
import { SetupSummary } from '@/components/setup-wizard/steps/SetupSummary';
import { useToast } from '@/components/ui/use-toast';
import { useExcelSync } from '@/hooks/useExcelSync';
import { Loader2, Cloud, FileSpreadsheet, Database } from 'lucide-react';

// Define individual props needed from the setup state
interface SetupWizardSpecificProps {
  setSetupMethod: (method: string) => void;
  setOneDriveConfig: (config: { folderId: string; folderName: string } | null) => void;
  setObjectives: (objectives: any[]) => void;
  handleSetupCompleteFromHook: () => void; // Renamed to avoid conflict
  updateExcelConfig: () => void;
  excelConfig: any; // Consider stronger typing if possible
  oneDriveConfig: any; // Consider stronger typing if possible
  setupMethodProp?: string; // Pass if needed directly, or rely on internal state?
  objectivesProp?: any[]; // Pass if needed directly
}

interface SetupWizardProps extends SetupWizardSpecificProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Prop from parent for completion feedback
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  // Destructure individual props
  setSetupMethod,
  setOneDriveConfig,
  setObjectives,
  handleSetupCompleteFromHook,
  updateExcelConfig,
  excelConfig,
  oneDriveConfig,
  setupMethodProp, // Receive props
  objectivesProp,
}) => {
  // Remove previous logs
  // console.log('SetupWizard start - setupState:', setupState);
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSetupType, setSelectedSetupType] = useState<string | null>(null);
  const [tempObjectives, setTempObjectives] = useState<any[]>([]);

  const totalSteps = 5;

  // Use the Excel sync hook with props
  // console.log('SetupWizard before useExcelSync - setupState:', setupState);
  const { 
    isLoading: isExcelLoading, 
    error: excelError, 
    loadDataFromExcel, 
    saveDataToExcel 
  } = useExcelSync({
    config: excelConfig || null, // Use prop
    onConfigChange: updateExcelConfig || (() => {}) // Use prop
  });

  // Initialize component
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setCurrentStep(0);
      setProgress(0);
      setIsProcessing(false);
      setSelectedSetupType(null);
      setTempObjectives([]);
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  // Reset initialization when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  // Update Excel config based on props
  useEffect(() => {
    // Only update Excel config if we have both oneDriveConfig and setupMethodProp
    // and we're not already processing
    if (oneDriveConfig && setupMethodProp && !isProcessing) {
      // Add a debounce to prevent multiple rapid updates
      const timeoutId = setTimeout(() => {
        updateExcelConfig();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [oneDriveConfig, setupMethodProp, updateExcelConfig, isProcessing]);

  // Define handleComplete first
  const handleComplete = useCallback(async () => {
    if (!excelConfig) { // Use prop
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
      setProgress(30);
      await saveDataToExcel();
      setProgress(60);
      await loadDataFromExcel();
      setProgress(90);
      if (handleSetupCompleteFromHook) { // Use prop
        handleSetupCompleteFromHook();
      }
      setProgress(100);
      toast({ title: "Setup Complete", description: "Your unit has been successfully configured." });
      onComplete(); // Call parent's onComplete
      onClose();    // Call parent's onClose
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({ title: "Setup Error", description: "There was an error completing the setup process. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [excelConfig, handleSetupCompleteFromHook, onComplete, onClose, saveDataToExcel, loadDataFromExcel, toast]); // Update dependencies

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Use props in handleSetupTypeSelect
  const handleSetupTypeSelect = useCallback((type: string) => {
    console.log('Setup type selected:', type);
    setSelectedSetupType(type);
    console.log('Inspecting setSetupMethod prop:', setSetupMethod);

    if (!setSetupMethod) { // Check prop
      toast({ title: "Setup Error", description: "Setup state (setSetupMethod) is not properly initialized. Please try again.", variant: "destructive" });
      return;
    }
    
    if (type === 'onedrive') {
      setSetupMethod('standard'); // Use prop
      setCurrentStep(1);
    } else if (type === 'excel') {
      setSetupMethod('import'); // Use prop
      setCurrentStep(1);
    } else if (type === 'demo') {
      setSetupMethod('demo'); // Use prop
      setCurrentStep(1);
    }
  }, [setSetupMethod, toast]); // Update dependencies

  const handleObjectivesComplete = useCallback((objectives: any[]) => {
    setTempObjectives(objectives);
    setCurrentStep(4); // Move to summary step
  }, []);

  const handleSummaryComplete = useCallback(() => {
    if (setObjectives) {
      setObjectives(tempObjectives);
    }
    handleComplete();
  }, [tempObjectives, setObjectives, handleComplete]);

  const renderInitialSelection = () => {
    // console.log('SetupWizard rendering renderInitialSelection - setupState:', setupState);
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

  // Update renderStep to use props
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
                if (setOneDriveConfig) { // Use prop
                  setOneDriveConfig({ folderId: config.folderId, folderName: config.path });
                  toast({ title: "OneDrive folder selected successfully!", description: `Using folder: "${config.path}"`, duration: 2000 });
                  setTimeout(() => { handleNext(); }, 1000);
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
              if (setSetupMethod) { // Use prop
                setSetupMethod(method);
                handleNext();
              }
            }}
          />
        );
      case 3:
        return (
          <ObjectivesSetup
            onComplete={handleObjectivesComplete}
          />
        );
      case 4:
        return (
          <SetupSummary
            oneDriveConfig={oneDriveConfig}
            objectives={tempObjectives}
            onComplete={handleSummaryComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  // Rest of the component (Dialog structure) remains largely the same
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