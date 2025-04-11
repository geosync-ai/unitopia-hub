import React, { useState, useEffect, useCallback } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Folder, FolderPlus, RefreshCw, AlertTriangle, Trash2, Check } from 'lucide-react';
import microsoftAuthConfig from '@/config/microsoft-auth';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: microsoftAuthConfig.clientId,
    authority: microsoftAuthConfig.authorityUrl,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : "https://unitopia-hub.vercel.app",
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

// Scopes needed for OneDrive operations
const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite.All"]
};

// Define wizard steps
const STEPS = {
  FOLDER_SELECTION: 0,
  DETAILS_ENTRY: 1,
  COMPLETION: 2
};

// Types for OneDrive folder items
interface OneDriveFolder {
  id: string;
  name: string;
  webUrl?: string;
}

// Enhanced OneDrive Integration component
const EnhancedOneDriveIntegration = ({ onComplete }) => {
  const { toast } = useToast();
  
  // Authentication and OneDrive state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState<OneDriveFolder[]>([]);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(STEPS.FOLDER_SELECTION);
  const [selectedFolder, setSelectedFolder] = useState<OneDriveFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: ''
  });
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  
  // Initialize MSAL
  useEffect(() => {
    const msalInstanceCreate = new PublicClientApplication(msalConfig);
    
    // Handle redirect to avoid unhandled promise rejection
    msalInstanceCreate.handleRedirectPromise()
      .catch(err => {
        console.error("Redirect promise error:", err);
      });
    
    msalInstanceCreate.initialize().then(() => {
      setMsalInstance(msalInstanceCreate);
      
      const accounts = msalInstanceCreate.getAllAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        setUser(accounts[0]);
      }
    }).catch(err => {
      setError(`Failed to initialize MSAL: ${err.message}`);
      console.error(err);
    });
  }, []);

  // Handle sign in
  const handleSignIn = async () => {
    if (!msalInstance) {
      setError("Authentication library is not initialized yet. Please try again in a moment.");
      return;
    }
    
    if (isAuthInProgress) {
      setError("Authentication is already in progress. Please complete the login process in the popup window.");
      return;
    }
    
    setIsAuthInProgress(true);
    setLoading(true);
    setError(null);
    
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      if (loginResponse) {
        setIsAuthenticated(true);
        setUser(loginResponse.account);
        await getOneDriveFolders(loginResponse.account);
      }
    } catch (err) {
      if (err.name === "BrowserAuthError" && err.message.includes("interaction_in_progress")) {
        setError("A login window is already open. Please complete that process first.");
      } else {
        setError(`Authentication failed: ${err.message}`);
        console.error(err);
      }
    } finally {
      setIsAuthInProgress(false);
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    if (!msalInstance) return;
    
    msalInstance.logout();
    setIsAuthenticated(false);
    setUser(null);
    setFolders([]);
    setSelectedFolder(null);
    setCurrentStep(STEPS.FOLDER_SELECTION);
  };

  // Get OneDrive folders with explicit account parameter
  const getOneDriveFolders = async (accountToUse = null) => {
    if (!msalInstance) {
      setError("Authentication library is not initialized yet. Please try again in a moment.");
      return;
    }
    
    const currentAccount = accountToUse || user || msalInstance.getAllAccounts()[0];
    
    if (!currentAccount) {
      setError("No account found. Please sign in first.");
      return;
    }
    
    setLoading(true);
    try {
      // Get token with explicit account parameter
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching folders: ${response.statusText}`);
      }

      const data = await response.json();
      setFolders(data.value.map(item => ({
        id: item.id,
        name: item.name,
        webUrl: item.webUrl
      })));
      setError(null);
    } catch (err) {
      setError(`Failed to get folders: ${err.message}`);
      console.error(err);
      
      // If silent token acquisition fails, fall back to interactive method
      if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
        try {
          setIsAuthInProgress(true);
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          setIsAuthInProgress(false);
          
          // Try fetching folders again with the new token
          const response = await fetch(
            'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
            {
              headers: {
                Authorization: `Bearer ${tokenResponse.accessToken}`
              }
            }
          );
          const data = await response.json();
          setFolders(data.value.map(item => ({
            id: item.id,
            name: item.name,
            webUrl: item.webUrl
          })));
          setError(null);
        } catch (interactiveErr) {
          setIsAuthInProgress(false);
          setError(`Failed to get folders: ${interactiveErr.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Please enter a folder name");
      return;
    }

    setLoading(true);
    try {
      const currentAccount = user || msalInstance.getAllAccounts()[0];
      if (!currentAccount) {
        throw new Error("No account found. Please sign in first.");
      }
      
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newFolderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating folder: ${response.statusText}`);
      }

      const newFolder = await response.json();
      setFolders([...folders, {
        id: newFolder.id,
        name: newFolder.name,
        webUrl: newFolder.webUrl
      }]);
      setNewFolderName('');
      setError(null);
      toast({
        title: "Folder created",
        description: `Folder "${newFolder.name}" has been created successfully.`
      });
    } catch (err) {
      setError(`Failed to create folder: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
        try {
          setIsAuthInProgress(true);
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          setIsAuthInProgress(false);
          // Retry after getting new token
          await createFolder();
        } catch (interactiveErr) {
          setIsAuthInProgress(false);
          setError(`Failed to create folder: ${interactiveErr.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    setLoading(true);
    try {
      const currentAccount = user || msalInstance.getAllAccounts()[0];
      if (!currentAccount) {
        throw new Error("No account found. Please sign in first.");
      }
      
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error(`Error deleting folder: ${response.statusText}`);
      }

      // Update folders list
      setFolders(folders.filter(folder => folder.id !== folderId));
      
      // If selected folder was deleted, clear selection
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(null);
      }
      
      toast({
        title: "Folder deleted",
        description: "The folder has been deleted successfully."
      });
      
      setError(null);
    } catch (err) {
      setError(`Failed to delete folder: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
        try {
          setIsAuthInProgress(true);
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          setIsAuthInProgress(false);
          // Retry after getting new token
          await deleteFolder(folderId);
        } catch (interactiveErr) {
          setIsAuthInProgress(false);
          setError(`Failed to delete folder: ${interactiveErr.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Upload CSV to selected folder
  const uploadCSV = async () => {
    if (!selectedFolder) {
      setError("Please select a folder first");
      return;
    }

    setLoading(true);
    try {
      // Convert form data to CSV
      const csvContent = `Name,Email,Description\n${formData.name},${formData.email},${formData.description}`;
      const fileName = `data_${new Date().toISOString().slice(0,10)}.csv`;
      
      // Create file blob
      const file = new Blob([csvContent], { type: 'text/csv' });
      
      const currentAccount = user || msalInstance.getAllAccounts()[0];
      if (!currentAccount) {
        throw new Error("No account found. Please sign in first.");
      }
      
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });

      // Upload file to the selected folder
      const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${selectedFolder.id}:/${fileName}:/content`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'text/csv'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
      }

      setSuccess(true);
      setCurrentStep(STEPS.COMPLETION);
      setError(null);
      
      toast({
        title: "File uploaded successfully",
        description: `Your data has been saved to "${selectedFolder.name}" folder.`
      });
      
      // Call onComplete with folder information
      onComplete({
        folderId: selectedFolder.id,
        folderName: selectedFolder.name,
        path: selectedFolder.webUrl || `/drive/folders/${selectedFolder.name}`,
        isTemporary: false,
        uploadedFile: {
          name: fileName,
          content: csvContent
        }
      });
      
    } catch (err) {
      setError(`Failed to upload CSV: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
        try {
          setIsAuthInProgress(true);
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          setIsAuthInProgress(false);
          // Retry after getting new token
          await uploadCSV();
        } catch (interactiveErr) {
          setIsAuthInProgress(false);
          setError(`Failed to upload CSV: ${interactiveErr.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep === STEPS.FOLDER_SELECTION && !selectedFolder) {
      setError("Please select a folder before proceeding");
      return;
    }
    
    if (currentStep === STEPS.DETAILS_ENTRY) {
      uploadCSV();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any auth errors when component unmounts
      if (msalInstance) {
        try {
          sessionStorage.removeItem('msal.interaction.status');
        } catch (e) {
          console.error('Failed to clear interaction status:', e);
        }
      }
    };
  }, [msalInstance]);

  // Render steps based on current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.FOLDER_SELECTION:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select OneDrive Folder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
                  <p>Connect to your Microsoft account to select or create a OneDrive folder.</p>
                  <Button 
                    onClick={handleSignIn}
                    className="bg-blue-500 hover:bg-blue-700 text-white"
                    disabled={!msalInstance || loading || isAuthInProgress}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Connect to OneDrive
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-700">Connected as: {user?.username}</p>
                    <Button 
                      onClick={handleSignOut}
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                    >
                      Disconnect
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Your OneDrive Folders</h3>
                      <Button 
                        onClick={() => getOneDriveFolders()} 
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        disabled={loading || isAuthInProgress}
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Folders
                      </Button>
                    </div>
                    
                    {folders.length > 0 ? (
                      <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                        {folders.map(folder => (
                          <div 
                            key={folder.id} 
                            className={`p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer ${
                              selectedFolder && selectedFolder.id === folder.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => setSelectedFolder(folder)}
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="h-5 w-5 text-yellow-500" />
                              <span className="font-medium">{folder.name}</span>
                            </div>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder.id);
                              }}
                              className="text-gray-500 hover:text-red-500"
                              title="Delete folder"
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic p-4 border rounded-md text-center">
                        No folders found. Create a new folder below.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Create New Folder</h3>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        className="flex-1"
                        disabled={loading}
                      />
                      <Button
                        onClick={createFolder}
                        disabled={loading || !newFolderName.trim() || isAuthInProgress}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                        Create
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    {selectedFolder && (
                      <Button
                        onClick={nextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case STEPS.DETAILS_ENTRY:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Enter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Selected folder: <span className="font-medium">{selectedFolder?.name}</span>
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full h-24"
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Back
                </Button>
                
                <Button
                  onClick={nextStep}
                  disabled={!formData.name || !formData.email || loading || isAuthInProgress}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Data
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case STEPS.COMPLETION:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Setup Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800">Setup Complete!</h2>
              
              <p className="text-gray-600">
                Your data has been successfully saved to the folder "{selectedFolder?.name}" in your OneDrive.
              </p>
              
              <Button
                onClick={() => {
                  setCurrentStep(STEPS.FOLDER_SELECTION);
                  setSelectedFolder(null);
                  setFormData({ name: '', email: '', description: '' });
                  setSuccess(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                Start New Setup
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-4">
        {Object.values(STEPS).map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                currentStep === step 
                  ? 'bg-blue-600 text-white' 
                  : currentStep > step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {currentStep > step ? (
                <Check className="h-5 w-5" />
              ) : (
                step + 1
              )}
            </div>
            <div className="text-xs mt-1">
              {step === STEPS.FOLDER_SELECTION ? 'Select Folder' : 
               step === STEPS.DETAILS_ENTRY ? 'Enter Details' : 
               'Complete'}
            </div>
          </div>
        ))}
      </div>
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {renderStep()}
    </div>
  );
};

export default EnhancedOneDriveIntegration; 