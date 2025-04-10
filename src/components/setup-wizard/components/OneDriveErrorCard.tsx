import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCw, FolderPlus } from 'lucide-react';

interface OneDriveErrorCardProps {
  folderError: string;
  onRetry: () => void;
  onCreateFolder: () => void;
  onLocalStorage: () => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  isLoading: boolean;
}

const OneDriveErrorCard: React.FC<OneDriveErrorCardProps> = ({
  folderError,
  onRetry,
  onCreateFolder,
  onLocalStorage,
  newFolderName,
  setNewFolderName,
  isLoading
}) => {
  return (
    <Card className="p-6 mb-4">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
        <h4 className="font-semibold">Unable to retrieve your OneDrive folders</h4>
        <p className="text-sm text-muted-foreground">
          We're having trouble connecting to your OneDrive. You can try these options:
        </p>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          
          <div className="border-t pt-4">
            <h5 className="font-medium mb-2">Create a new folder anyway</h5>
            <div className="flex gap-2">
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button
                onClick={onCreateFolder}
                disabled={!newFolderName.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Alternatively, you can use local storage instead
            </p>
            <Button
              onClick={onLocalStorage}
              variant="secondary"
              className="flex items-center justify-center"
            >
              Continue with Local Storage
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OneDriveErrorCard; 