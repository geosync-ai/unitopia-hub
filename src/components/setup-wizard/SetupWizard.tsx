import React, { useState } from 'react';
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
import { OneDriveSetup } from './steps/OneDriveSetup';
import { SetupMethod } from './steps/SetupMethod';
import { ObjectivesSetup } from './steps/ObjectivesSetup';
import { useToast } from '@/components/ui/use-toast';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [oneDriveConfig, setOneDriveConfig] = useState<any>(null);
  const [setupMethod, setSetupMethod] = useState<string>('');
  const [objectives, setObjectives] = useState<any[]>([]);

  const totalSteps = 3;

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

  const handleComplete = () => {
    // Here we would implement the actual setup logic
    toast({
      title: "Setup Complete",
      description: "Your unit has been successfully configured with OneDrive integration.",
    });
    onComplete();
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OneDriveSetup
            onComplete={(config) => {
              setOneDriveConfig(config);
              handleNext();
            }}
          />
        );
      case 2:
        return (
          <SetupMethod
            onSelect={(method) => {
              setSetupMethod(method);
              handleNext();
            }}
          />
        );
      case 3:
        return (
          <ObjectivesSetup
            onComplete={(objectives) => {
              setObjectives(objectives);
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
            <Progress value={(currentStep / totalSteps) * 100} />
            <p className="text-sm text-muted-foreground text-center">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Step content */}
          <Card className="p-6">
            {renderStep()}
          </Card>

          {/* Navigation buttons */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}; 