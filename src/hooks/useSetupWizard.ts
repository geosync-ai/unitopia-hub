import { useState } from 'react';

interface SetupWizardState {
  showSetupWizard: boolean;
  setShowSetupWizard: (show: boolean) => void;
}

interface UseSetupWizardProps {
  projectState: any;
  taskState: any;
  riskState: any;
  kraState: any;
  assetState: any;
}

export const useSetupWizard = ({
  projectState,
  taskState,
  riskState,
  kraState,
  assetState,
}: UseSetupWizardProps): SetupWizardState => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  return {
    showSetupWizard,
    setShowSetupWizard,
  };
}; 