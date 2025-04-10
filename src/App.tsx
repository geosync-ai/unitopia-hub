import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

// Wizard steps
const STEPS = {
  FOLDER_SELECTION: 0,
  DETAILS_ENTRY: 1,
  COMPLETION: 2
};

const Apps = () => {
  // Authentication and OneDrive state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState([]);
  const [msalInstance, setMsalInstance] = useState(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(STEPS.FOLDER_SELECTION);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: ''
  });
  
  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Initialize MSAL
  useEffect(() => {
    const msalConfig = {
      auth: {
        clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f', // Your application (client) ID
        authority: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab', // Your directory (tenant) ID
        redirectUri: 'https://unitopia-hub.vercel.app/', // Your specific redirect URI
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      }
    };

    const msalInstanceCreate = new PublicClientApplication(msalConfig);
    
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

  // Authentication parameters
  const loginRequest = {
    scopes: ['user.read', 'files.read', 'files.readwrite']
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!msalInstance) {
      setError("Authentication library is not initialized yet. Please try again in a moment.");
      return;
    }
    
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      if (loginResponse) {
        setIsAuthenticated(true);
        setUser(loginResponse.account);
        await getOneDriveFolders();
      }
    } catch (err) {
      setError(`Authentication failed: ${err.message}`);
      console.error(err);
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

  // Get OneDrive folders
  const getOneDriveFolders = async () => {
    if (!msalInstance) {
      setError("Authentication library is not initialized yet. Please try again in a moment.");
      return;
    }
    
    setLoading(true);
    try {
      // Get token
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: user
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
      setFolders(data.value);
      setError(null);
    } catch (err) {
      setError(`Failed to get folders: ${err.message}`);
      console.error(err);
      
      // If silent token acquisition fails, fall back to interactive method
      if (err.name === "InteractionRequiredAuthError" && msalInstance) {
        try {
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
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
          setFolders(data.value);
          setError(null);
        } catch (interactiveErr) {
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
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: user
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
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setError(null);
    } catch (err) {
      setError(`Failed to create folder: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance) {
        try {
          await msalInstance.acquireTokenPopup(loginRequest);
          // Retry after getting new token
          await createFolder();
        } catch (interactiveErr) {
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
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: user
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
      
      setError(null);
    } catch (err) {
      setError(`Failed to delete folder: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance) {
        try {
          await msalInstance.acquireTokenPopup(loginRequest);
          // Retry after getting new token
          await deleteFolder(folderId);
        } catch (interactiveErr) {
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
      
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: user
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
    } catch (err) {
      setError(`Failed to upload CSV: ${err.message}`);
      console.error(err);
      
      if (err.name === "InteractionRequiredAuthError" && msalInstance) {
        try {
          await msalInstance.acquireTokenPopup(loginRequest);
          // Retry after getting new token
          await uploadCSV();
        } catch (interactiveErr) {
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

  // Render steps based on current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.FOLDER_SELECTION:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 1: Select OneDrive Folder</h2>
            
            {!isAuthenticated ? (
              <button 
                onClick={handleSignIn}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={!msalInstance || loading}
              >
                {loading ? 'Connecting...' : 'Connect to OneDrive'}
              </button>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-gray-700">Connected as: {user?.username}</p>
                  <button 
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium mb-2">Your OneDrive Folders</h3>
                  <button 
                    onClick={getOneDriveFolders} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : 'Refresh Folders'}
                  </button>
                  
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
                              <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
                            </svg>
                            <span className="font-medium">{folder.name}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolder(folder.id);
                            }}
                            className="text-gray-500 hover:text-red-500"
                            title="Delete folder"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No folders found. Create a new folder below.</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Create New Folder</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <button
                      onClick={createFolder}
                      disabled={loading || !newFolderName.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  {selectedFolder && (
                    <button
                      onClick={nextStep}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      
      case STEPS.DETAILS_ENTRY:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 2: Enter Details</h2>
            
            <p className="mb-4 text-gray-700">
              Selected folder: <span className="font-medium">{selectedFolder?.name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 h-24"
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Back
              </button>
              
              <button
                onClick={nextStep}
                disabled={!formData.name || !formData.email || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Data'}
              </button>
            </div>
          </div>
        );
      
      case STEPS.COMPLETION:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
            
            <p className="text-gray-600 mb-6">
              Your data has been successfully saved to the folder "{selectedFolder?.name}" in your OneDrive.
            </p>
            
            <button
              onClick={() => {
                setCurrentStep(STEPS.FOLDER_SELECTION);
                setSelectedFolder(null);
                setFormData({ name: '', email: '', description: '' });
                setSuccess(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              Start New Setup
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <h1 className="text-2xl font-bold mb-8 text-center">OneDrive Integration Wizard</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 relative" role="alert">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
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
      
      {renderStep()}
    </div>
  );
};

export default Apps;