import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest } from './integrations/microsoft/msalConfig';

// Wizard steps
const STEPS = {
  FOLDER_SELECTION: 0,
  TABLE_SELECTION: 1,
  DETAILS_ENTRY: 2,
  COMPLETION: 3
};

// Table templates
const TABLE_TEMPLATES = {
  TASKS: {
    name: 'Tasks',
    headers: ['Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Project', 'Actions']
  },
  KRAS_KPIS: {
    name: 'KRAs/KPIs',
    headers: ['KRA', 'KPI', 'Start Date', 'Date', 'Target', 'Actual', 'Status', 'Actions']
  },
  PROJECTS: {
    name: 'Projects',
    headers: ['Name', 'Status', 'Manager', 'Timeline', 'Budget', 'Progress', 'Actions']
  },
  RISKS: {
    name: 'Risks',
    headers: ['Title', 'Project', 'Impact', 'Likelihood', 'Status', 'Owner', 'Last Updated', 'Actions']
  },
  USER_ASSETS: {
    name: 'User Assets',
    headers: ['Name', 'Type', 'Assigned To', 'Department', 'Serial Number', 'Purchase Date', 'Warranty', 'Status', 'Actions']
  }
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
  const [selectedTable, setSelectedTable] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    customFields: {}
  });
  
  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  
  // Initialize MSAL (keep your existing useEffect for MSAL initialization)

  // Authentication parameters (keep your existing loginRequest)

  // Authentication handlers (keep your existing handleSignIn, handleSignOut)

  // OneDrive operations (keep your existing getOneDriveFolders, createFolder, deleteFolder)

  // Upload CSV to selected folder - modified to include table headers
  const uploadCSV = async () => {
    if (!selectedFolder) {
      setError("Please select a folder first");
      return;
    }

    setLoading(true);
    try {
      // Convert form data to CSV with appropriate headers
      let csvContent = '';
      
      if (selectedTable) {
        // Use the selected table headers
        const headers = TABLE_TEMPLATES[selectedTable].headers;
        csvContent = headers.join(',') + '\n';
        
        // Add sample data row with form data
        const sampleData = headers.map(header => {
          if (header.toLowerCase() === 'name') return formData.name;
          if (header.toLowerCase() === 'status') return 'Not Started';
          if (header.toLowerCase() === 'email') return formData.email;
          return ''; // Empty for other fields
        });
        
        csvContent += sampleData.join(',');
      } else {
        // Fallback to basic format if no table selected
        csvContent = `Name,Email,Description\n${formData.name},${formData.email},${formData.description}`;
      }
      
      const fileName = selectedTable 
        ? `${TABLE_TEMPLATES[selectedTable].name}_Template_${new Date().toISOString().slice(0,10)}.csv`
        : `data_${new Date().toISOString().slice(0,10)}.csv`;
      
      // Rest of your upload logic remains the same...
      const file = new Blob([csvContent], { type: 'text/csv' });
      
      const currentAccount = user || msalInstance.getAllAccounts()[0];
      if (!currentAccount) {
        throw new Error("No account found. Please sign in first.");
      }
      
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: currentAccount
      });

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
      // Error handling remains the same...
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

  // Handle custom field changes
  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value
      }
    }));
  };

  // Navigate to next step - modified for new flow
  const nextStep = () => {
    if (currentStep === STEPS.FOLDER_SELECTION && !selectedFolder) {
      setError("Please select a folder before proceeding");
      return;
    }
    
    if (currentStep === STEPS.TABLE_SELECTION && !selectedTable) {
      setError("Please select a table template before proceeding");
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

  // Render steps based on current step - updated with new TABLE_SELECTION step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.FOLDER_SELECTION:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 1: Select OneDrive Folder</h2>
            {/* Keep your existing folder selection UI */}
          </div>
        );
      
      case STEPS.TABLE_SELECTION:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 2: Select Table Template</h2>
            
            <p className="mb-4 text-gray-700">
              Selected folder: <span className="font-medium">{selectedFolder?.name}</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(TABLE_TEMPLATES).map(([key, template]) => (
                <div 
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTable === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTable(key)}
                >
                  <h3 className="font-medium text-lg mb-2">{template.name}</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Headers:</p>
                    <ul className="list-disc list-inside">
                      {template.headers.slice(0, 3).map(header => (
                        <li key={header}>{header}</li>
                      ))}
                      {template.headers.length > 3 && (
                        <li className="text-gray-500">+{template.headers.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
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
                disabled={!selectedTable || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        );
      
      case STEPS.DETAILS_ENTRY:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 3: Enter Details</h2>
            
            <div className="mb-4 flex items-center gap-4">
              <p className="text-gray-700">
                <span className="font-medium">Folder:</span> {selectedFolder?.name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Template:</span> {TABLE_TEMPLATES[selectedTable]?.name || 'Custom'}
              </p>
            </div>
            
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
              
              {selectedTable && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Template Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TABLE_TEMPLATES[selectedTable].headers
                      .filter(header => !['name', 'email', 'actions'].includes(header.toLowerCase()))
                      .map(header => (
                        <div key={header}>
                          <label className="block text-gray-700 text-sm mb-1">{header}</label>
                          <input
                            type="text"
                            value={formData.customFields[header] || ''}
                            onChange={(e) => handleCustomFieldChange(header, e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder={`Enter ${header.toLowerCase()}`}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
                disabled={!formData.name || !formData.email || loading || isAuthInProgress}
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
              Your {selectedTable ? TABLE_TEMPLATES[selectedTable].name : 'data'} template has been successfully saved to the folder "{selectedFolder?.name}" in your OneDrive.
            </p>
            
            <button
              onClick={() => {
                setCurrentStep(STEPS.FOLDER_SELECTION);
                setSelectedFolder(null);
                setSelectedTable(null);
                setFormData({ name: '', email: '', description: '', customFields: {} });
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
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h1 className="text-2xl font-bold mb-8 text-center">OneDrive Template Setup Wizard</h1>
      
      {/* Error display remains the same */}
      
      {/* Progress Steps - updated for new flow */}
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
               step === STEPS.TABLE_SELECTION ? 'Choose Template' :
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