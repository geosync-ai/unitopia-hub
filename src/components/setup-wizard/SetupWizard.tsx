import { useState, useEffect, useCallback, Fragment } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Import step components
import { SetupMethod } from './steps/SetupMethod';
import { ObjectivesSetup } from './steps/ObjectivesSetup';
import { KRASetup } from './steps/KRASetup';
import { KPISetup } from './steps/KPISetup';
import { SetupSummary } from './steps/SetupSummary';

// Import custom components
import ProgressSteps from './components/ProgressSteps';
import LocalStorageFallbackNotice from './components/LocalStorageFallbackNotice';
import SimplifiedOneDriveSetup from './components/SimplifiedOneDriveSetup';

// Import utilities and types
import { SetupWizardProps, WizardStep } from './types';
import { addGlobalFolderHighlightStyle } from './utils';
import { useSetupWizard } from './hooks/useSetupWizard';

// Add global style for folder highlighting
addGlobalFolderHighlightStyle();

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  // Destructure individual props
  setSetupMethod,
  setOneDriveConfig,
  setObjectives,
  setKRAs,
  setKPIs,
  handleSetupCompleteFromHook,
  updateCsvConfig,
  csvConfig,
  oneDriveConfig,
  setupMethodProp,
  objectivesProp,
  krasProp,
  kpisProp,
  isSetupComplete,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSetupType, setSelectedSetupType] = useState<string | null>(null);

  // Use our custom hook to manage wizard state
  const {
    isProcessing,
    progress,
    tempObjectives,
    tempKRAs,
    tempKPIs,
    setupError,
    isUsingLocalStorage,
    setTempObjectives,
    setTempKRAs,
    setTempKPIs,
    handleComplete,
    useLocalStorage,
    setSetupError
  } = useSetupWizard({
    oneDriveConfig,
    csvConfig,
    updateCsvConfig,
    setObjectives,
    setKRAs,
    setKPIs,
    handleSetupCompleteFromHook,
    isSetupComplete
  });

  // Define steps for the wizard
  const steps: WizardStep[] = [
    { id: 0, name: "Setup Method" },
    { id: 1, name: "Storage Location" },
    { id: 2, name: "Objectives" },
    { id: 3, name: "KRAs" },
    { id: 4, name: "KPIs" },
    { id: 5, name: "Summary" }
  ];

  // Initialize component
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setCurrentStep(0);
      setIsProcessing(false);
      setSelectedSetupType(null);
      setTempObjectives([]);
      setTempKRAs([]);
      setTempKPIs([]);
      setSetupError(null);
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized, setSetupError, setTempObjectives, setTempKRAs, setTempKPIs]);

  // Reset initialization when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  }, [currentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  }, [currentStep]);

  // Define handleSetupTypeSelect
  const handleSetupTypeSelect = useCallback((type: string) => {
    console.log('Setup type selected:', type);
    setSelectedSetupType(type);
    setSetupError(null);

    if (!setSetupMethod) {
      toast({
        title: "Setup Error",
        description: "Setup state (setSetupMethod) is not properly initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Set the appropriate setup method based on the selected type
    if (type === 'onedrive') {
      try {
        console.log('[DEBUG] Setting up OneDrive integration');
        setSetupMethod('standard'); // Standard setup for OneDrive
        
        // Add a small delay to ensure console logs are visible
        setTimeout(() => {
          console.log('[DEBUG] Moving to step 1 for OneDrive setup');
          setCurrentStep(1);
        }, 500);
      } catch (error) {
        console.error('[DEBUG] Error in OneDrive setup initialization:', error);
        // Don't proceed to next step if there's an error
        setSetupError(`OneDrive initialization error: ${error.message || 'Unknown error'}`);
        
        // Revert to local storage if OneDrive fails
        useLocalStorage(true);
      }
    } else if (type === 'csv') {
      setSetupMethod('import'); // Import method for CSV
      setCurrentStep(1);
    } else if (type === 'demo') {
      setSetupMethod('demo'); // Demo data
      setCurrentStep(1);
    }
  }, [setSetupMethod, toast, setCurrentStep, setSetupError, useLocalStorage]);

  // Add handling for the step completion
  const handleObjectivesComplete = useCallback((objectives: any[]) => {
    setTempObjectives(objectives);
    setCurrentStep(3); // Move to KRA setup step
  }, [setTempObjectives]);

  const handleKRAComplete = useCallback((kras: any[]) => {
    setTempKRAs(kras);
    setCurrentStep(4); // Move to KPI setup step
  }, [setTempKRAs]);

  const handleKPIComplete = useCallback((kpis: any[]) => {
    setTempKPIs(kpis);
    setCurrentStep(5); // Move to Summary step
  }, [setTempKPIs]);

  const handleSummaryComplete = useCallback(() => {
    console.log("Starting setup completion process...");
    // Set the objectives, KRAs, and KPIs in the parent component
    if (setObjectives) {
      setObjectives(tempObjectives);
    }
    if (setKRAs) {
      setKRAs(tempKRAs);
    }
    if (setKPIs) {
      setKPIs(tempKPIs);
    }
    
    // Start the setup completion process without prompting
    handleComplete().then(success => {
      if (success) {
        // Close the dialog after successful completion
        setTimeout(() => {
          onComplete(); // Call parent's onComplete
          onClose();    // Call parent's onClose
        }, 500);
      }
    });
  }, [
    tempObjectives, 
    tempKRAs, 
    tempKPIs, 
    setObjectives, 
    setKRAs, 
    setKPIs, 
    handleComplete, 
    onComplete, 
    onClose
  ]);

  // Update handlePathSelect in step 1 to handle temp folders
  const handlePathSelect = useCallback((config: any) => {
    console.log('OneDrive path selected:', config);
    
    if (config.isTemporary) {
      console.log('Using temporary local storage instead of OneDrive');
      useLocalStorage(true);
      
      // Set up local storage config for later steps
      if (setOneDriveConfig) {
        setOneDriveConfig({ 
          folderId: config.folderId, 
          folderName: config.path || config.folderName,
          isTemporary: true 
        });
        toast({ 
          title: "Using Local Storage", 
          description: "Your data will be stored locally for this session.",
          duration: 3000
        });
      }
      setCurrentStep(2); // Move to Objectives step
    } else {
      // Normal OneDrive folder setup
      if (setOneDriveConfig) {
        // Clear any existing local storage data
        localStorage.removeItem('unitopia_objectives');
        localStorage.removeItem('unitopia_kras');
        localStorage.removeItem('unitopia_kpis');
        localStorage.removeItem('unitopia_storage_type');
        
        // Clear CSV-related storage
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('unitopia_csv_')) {
            localStorage.removeItem(key);
          }
        }
        
        // Clear any sessionStorage that might affect CSV operations
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('csv_') || key.includes('unitopia')) {
            sessionStorage.removeItem(key);
          }
        }
        
        console.log('Cleared all local storage data to prevent old data contamination');
        
        // Ensure we're using the correct property names from the config
        setOneDriveConfig({ 
          folderId: config.folderId, 
          folderName: config.path || config.folderName 
        });
        toast({ 
          title: "OneDrive folder selected successfully!", 
          description: `Using folder: "${config.path || config.folderName}"`,
          duration: 2000
        });
      }
      
      // Add a short delay to ensure state is updated before proceeding
      setTimeout(() => {
        setCurrentStep(2); // Move to Objectives step
      }, 100);
    }
  }, [setOneDriveConfig, toast, setCurrentStep, useLocalStorage]);

  // Render the appropriate step content
  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          <SetupMethod onSelect={handleSetupTypeSelect} />
        );
      case 1:
        if (selectedSetupType === 'onedrive') {
          return <SimplifiedOneDriveSetup onComplete={handlePathSelect} />;
        } else if (selectedSetupType === 'csv') {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Upload CSV Files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload CSV files containing your unit data
                </p>
              </div>
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <Button>
                    Select CSV Files
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supported format: .csv
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
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                  </div>
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
          <ObjectivesSetup
            onComplete={handleObjectivesComplete}
          />
        );
      case 3:
        return (
          <KRASetup
            objectives={tempObjectives}
            onComplete={handleKRAComplete}
          />
        );
      case 4:
        return (
          <KPISetup
            kras={tempKRAs}
            onComplete={handleKPIComplete}
          />
        );
      case 5:
        return (
          <SetupSummary
            oneDriveConfig={oneDriveConfig}
            objectives={tempObjectives}
            kras={tempKRAs}
            kpis={tempKPIs}
            onComplete={handleSummaryComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  }, [
    currentStep,
    selectedSetupType,
    handleSetupTypeSelect,
    handlePathSelect,
    handleObjectivesComplete,
    handleKRAComplete,
    handleKPIComplete,
    handleSummaryComplete,
    handleNext,
    handleBack,
    tempObjectives,
    tempKRAs,
    tempKPIs,
    oneDriveConfig
  ]);

  // Dialog structure with updated UI
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow closing if not processing
        if (!open && !isProcessing) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Unit Setup Wizard</DialogTitle>
          <DialogDescription>
            Configure your unit's backend storage and structure
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Progress Steps */}
          <ProgressSteps steps={steps} currentStep={currentStep} />

          {/* Error display */}
          {setupError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{setupError}</span>
            </div>
          )}

          {/* Local storage notification */}
          {isUsingLocalStorage && currentStep > 1 && <LocalStorageFallbackNotice />}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {progress < 100 ? 'Processing...' : 'Complete!'} ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {/* Step content */}
          <div className="rounded-lg border min-h-[400px] p-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center">Setting up your unit data...</p>
                <p className="text-sm text-muted-foreground text-center">
                  This may take a moment as we configure your data.
                </p>
              </div>
            ) : (
              <>
                {renderStep()}
              </>
            )}
          </div>

          {/* Navigation buttons */}
          {!isProcessing && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={currentStep === 0 ? "invisible" : ""}
              >
                Back
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                
                {currentStep === 5 ? (
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Complete Setup button clicked, starting processing...");
                      handleSummaryComplete();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                ) : currentStep > 0 && currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={isProcessing}
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 