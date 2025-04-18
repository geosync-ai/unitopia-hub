import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';

// Configuration for Microsoft Authentication
interface MsalConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
}

// OneDrive file upload options
interface UploadFileOptions {
  fileName: string;
  content: string | Blob;
  contentType?: string;
  folderId?: string;
  overwrite?: boolean;
}

// Response from a file upload
interface UploadFileResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webUrl?: string;
  error?: string;
}

/**
 * OneDriveFileUploader - Utility class for uploading files to OneDrive
 * 
 * This class handles authentication with Microsoft, token acquisition,
 * and direct file uploads to OneDrive using Microsoft Graph API.
 */
class OneDriveFileUploader {
  private msalInstance: PublicClientApplication | null = null;
  private msalConfig: MsalConfig;
  private scopes: string[] = ["User.Read", "Files.ReadWrite.All"];
  private isInitialized: boolean = false;
  private currentAccount: AccountInfo | null = null;
  
  /**
   * Create a new OneDriveFileUploader instance
   * 
   * @param config - MSAL configuration
   */
  constructor(config: MsalConfig) {
    this.msalConfig = config;
  }
  
  /**
   * Initialize the MSAL instance
   * 
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      const msalConfig = {
        auth: {
          clientId: this.msalConfig.clientId,
          authority: this.msalConfig.authority,
          redirectUri: this.msalConfig.redirectUri,
        },
        cache: {
          cacheLocation: 'sessionStorage',
          storeAuthStateInCookie: false,
        }
      };
      
      this.msalInstance = new PublicClientApplication(msalConfig);
      
      // Handle redirect promise to avoid unhandled rejections
      await this.msalInstance.handleRedirectPromise().catch(err => {
        console.error("Redirect promise error:", err);
      });
      
      await this.msalInstance.initialize();
      
      // Check if we already have accounts
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.currentAccount = accounts[0];
        this.isInitialized = true;
        return true;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MSAL:", error);
      return false;
    }
  }
  
  /**
   * Check if a user is authenticated
   */
  public isAuthenticated(): boolean {
    if (!this.msalInstance) {
      return false;
    }
    
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0;
  }
  
  /**
   * Authenticate a user via popup
   * 
   * @returns Promise resolving to the account info if login is successful
   */
  public async login(): Promise<AccountInfo | null> {
    if (!this.msalInstance) {
      await this.initialize();
    }
    
    if (!this.msalInstance) {
      throw new Error("MSAL not initialized");
    }
    
    try {
      const loginRequest = {
        scopes: this.scopes
      };
      
      const loginResponse = await this.msalInstance.loginPopup(loginRequest);
      if (loginResponse) {
        this.currentAccount = loginResponse.account;
        return loginResponse.account;
      }
      
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      
      // Special handling for interaction_in_progress
      if (error.name === "BrowserAuthError" && error.message.includes("interaction_in_progress")) {
        throw new Error("A login window is already open. Please complete that process first.");
      }
      
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   */
  public logout(): void {
    if (this.msalInstance) {
      this.msalInstance.logout();
      this.currentAccount = null;
    }
  }
  
  /**
   * Acquire an access token silently or interactively if needed
   * 
   * @returns Promise resolving to the access token
   */
  private async getAccessToken(): Promise<string> {
    if (!this.msalInstance) {
      await this.initialize();
    }
    
    if (!this.msalInstance) {
      throw new Error("MSAL not initialized");
    }
    
    // Get the current account
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error("No account found. Please sign in first.");
    }
    
    const currentAccount = this.currentAccount || accounts[0];
    
    try {
      // Try silent token acquisition first
      const silentRequest = {
        scopes: this.scopes,
        account: currentAccount
      };
      
      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      // If silent acquisition fails, try interactive
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const interactiveRequest = {
            scopes: this.scopes
          };
          
          const response = await this.msalInstance.acquireTokenPopup(interactiveRequest);
          return response.accessToken;
        } catch (interactiveError) {
          console.error("Interactive token acquisition failed:", interactiveError);
          throw new Error(`Failed to acquire token interactively: ${interactiveError.message}`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Convert data to CSV format
   * 
   * @param data - Array of objects to convert
   * @param headers - Array of header keys to include
   * @returns CSV formatted string
   */
  public convertToCsv(data: any[], headers: string[]): string {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }
    
    const csvRows = [headers.join(',')];
    
    for (const item of data) {
      const values = headers.map(header => {
        const value = item[header];
        
        // Handle values that might need quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value === null || value === undefined ? '' : String(value);
      });
      
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
  
  /**
   * Upload a file to OneDrive
   * 
   * @param options - File upload options
   * @returns Promise resolving to upload result
   */
  public async uploadFile(options: UploadFileOptions): Promise<UploadFileResponse> {
    if (!this.isAuthenticated()) {
      try {
        await this.login();
      } catch (error) {
        return {
          success: false,
          error: `Authentication failed: ${error.message}`
        };
      }
    }
    
    try {
      const accessToken = await this.getAccessToken();
      
      // Prepare content
      let content: Blob;
      const contentType = options.contentType || 'text/plain';
      
      if (typeof options.content === 'string') {
        content = new Blob([options.content], { type: contentType });
      } else {
        content = options.content;
      }
      
      // Determine upload URL
      let uploadUrl: string;
      if (options.folderId) {
        // Upload to specific folder
        uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${options.folderId}:/${options.fileName}:/content`;
      } else {
        // Upload to root
        uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${options.fileName}:/content`;
      }
      
      // Add conflict behavior if specified
      if (options.overwrite === false) {
        uploadUrl += '?@microsoft.graph.conflictBehavior=rename';
      } else if (options.overwrite === true) {
        uploadUrl += '?@microsoft.graph.conflictBehavior=replace';
      }
      
      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': contentType
        },
        body: content
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
      }
      
      const responseData = await uploadResponse.json();
      
      return {
        success: true,
        fileId: responseData.id,
        fileName: responseData.name,
        webUrl: responseData.webUrl
      };
    } catch (error) {
      console.error(`Failed to upload file ${options.fileName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create a folder in OneDrive
   * 
   * @param folderName - Name of the folder to create
   * @param parentFolderId - Optional parent folder ID (creates in root if not specified)
   * @returns Promise resolving to the created folder info
   */
  public async createFolder(folderName: string, parentFolderId?: string): Promise<any> {
    if (!this.isAuthenticated()) {
      await this.login();
    }
    
    try {
      const accessToken = await this.getAccessToken();
      
      // Determine endpoint
      let endpoint: string;
      if (parentFolderId) {
        endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
      } else {
        endpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      }
      
      // Create folder
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error creating folder: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to create folder ${folderName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a list of folders from OneDrive root
   * 
   * @returns Promise resolving to array of folders
   */
  public async getFolders(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      await this.login();
    }
    
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching folders: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error("Failed to get folders:", error);
      throw error;
    }
  }
}

/**
 * Example usage:
 * 
 * // Initialize
 * const uploader = new OneDriveFileUploader({
 *   clientId: "your-client-id",
 *   authority: "https://login.microsoftonline.com/your-tenant-id",
 *   redirectUri: window.location.origin
 * });
 * 
 * await uploader.initialize();
 * 
 * // Login if needed
 * if (!uploader.isAuthenticated()) {
 *   await uploader.login();
 * }
 * 
 * // Upload a CSV file
 * const csvContent = uploader.convertToCsv(
 *   [{ id: '1', name: 'Test' }], 
 *   ['id', 'name']
 * );
 * 
 * const result = await uploader.uploadFile({
 *   fileName: 'data.csv',
 *   content: csvContent,
 *   contentType: 'text/csv',
 *   folderId: 'folder-id-here',
 *   overwrite: true
 * });
 * 
 * if (result.success) {
 *   console.log('File uploaded successfully:', result.fileName);
 * } else {
 *   console.error('Failed to upload file:', result.error);
 * }
 */

export default OneDriveFileUploader; 




// import React, { useState, useEffect } from 'react';
// import { PublicClientApplication } from '@azure/msal-browser';

// // Wizard steps
// const STEPS = {
//   FOLDER_SELECTION: 0,
//   TABLE_SELECTION: 1,
//   DETAILS_ENTRY: 2,
//   COMPLETION: 3
// };

// // Table templates
// const TABLE_TEMPLATES = {
//   TASKS: {
//     name: 'Tasks',
//     headers: ['Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Project', 'Actions']
//   },
//   KRAS_KPIS: {
//     name: 'KRAs/KPIs',
//     headers: ['KRA', 'KPI', 'Start Date', 'Date', 'Target', 'Actual', 'Status', 'Actions']
//   },
//   PROJECTS: {
//     name: 'Projects',
//     headers: ['Name', 'Status', 'Manager', 'Timeline', 'Budget', 'Progress', 'Actions']
//   },
//   RISKS: {
//     name: 'Risks',
//     headers: ['Title', 'Project', 'Impact', 'Likelihood', 'Status', 'Owner', 'Last Updated', 'Actions']
//   },
//   USER_ASSETS: {
//     name: 'User Assets',
//     headers: ['Name', 'Type', 'Assigned To', 'Department', 'Serial Number', 'Purchase Date', 'Warranty', 'Status', 'Actions']
//   }
// };

// const Apps = () => {
//   // Authentication and OneDrive state
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState(null);
//   const [folders, setFolders] = useState([]);
//   const [msalInstance, setMsalInstance] = useState(null);
  
//   // Wizard state
//   const [currentStep, setCurrentStep] = useState(STEPS.FOLDER_SELECTION);
//   const [selectedFolder, setSelectedFolder] = useState(null);
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [newFolderName, setNewFolderName] = useState('');
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     description: '',
//     customFields: {}
//   });
  
//   // UI state
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  
//   // Initialize MSAL
//   useEffect(() => {
//     const msalConfig = {
//       auth: {
//         clientId: '648a96d7-e3f5-4e13-8084-ba0b74dbb56f',
//         authority: 'https://login.microsoftonline.com/b173aac7-6781-4d49-a037-d874bd4a09ab',
//         redirectUri: 'https://unitopia-hub.vercel.app/',
//       },
//       cache: {
//         cacheLocation: 'sessionStorage',
//         storeAuthStateInCookie: false,
//       }
//     };

//     const msalInstanceCreate = new PublicClientApplication(msalConfig);
    
//     msalInstanceCreate.handleRedirectPromise()
//       .catch(err => {
//         console.error("Redirect promise error:", err);
//       });
    
//     msalInstanceCreate.initialize().then(() => {
//       setMsalInstance(msalInstanceCreate);
      
//       const accounts = msalInstanceCreate.getAllAccounts();
//       if (accounts.length > 0) {
//         setIsAuthenticated(true);
//         setUser(accounts[0]);
//       }
//     }).catch(err => {
//       setError(`Failed to initialize MSAL: ${err.message}`);
//       console.error(err);
//     });
//   }, []);

//   // Authentication parameters
//   const loginRequest = {
//     scopes: ['user.read', 'files.read', 'files.readwrite']
//   };

//   // Handle sign in
//   const handleSignIn = async () => {
//     if (!msalInstance) {
//       setError("Authentication library is not initialized yet. Please try again in a moment.");
//       return;
//     }
    
//     if (isAuthInProgress) {
//       setError("Authentication is already in progress. Please complete the login process in the popup window.");
//       return;
//     }
    
//     setIsAuthInProgress(true);
//     setLoading(true);
//     setError(null);
    
//     try {
//       const loginResponse = await msalInstance.loginPopup(loginRequest);
//       if (loginResponse) {
//         setIsAuthenticated(true);
//         setUser(loginResponse.account);
//         await getOneDriveFolders(loginResponse.account);
//       }
//     } catch (err) {
//       if (err.name === "BrowserAuthError" && err.message.includes("interaction_in_progress")) {
//         setError("A login window is already open. Please complete that process first.");
//       } else {
//         setError(`Authentication failed: ${err.message}`);
//         console.error(err);
//       }
//     } finally {
//       setIsAuthInProgress(false);
//       setLoading(false);
//     }
//   };

//   // Handle sign out
//   const handleSignOut = () => {
//     if (!msalInstance) return;
    
//     msalInstance.logout();
//     setIsAuthenticated(false);
//     setUser(null);
//     setFolders([]);
//     setSelectedFolder(null);
//     setCurrentStep(STEPS.FOLDER_SELECTION);
//   };

//   // Get OneDrive folders
//   const getOneDriveFolders = async (accountToUse = null) => {
//     if (!msalInstance) {
//       setError("Authentication library is not initialized yet. Please try again in a moment.");
//       return;
//     }
    
//     const currentAccount = accountToUse || user || msalInstance.getAllAccounts()[0];
    
//     if (!currentAccount) {
//       setError("No account found. Please sign in first.");
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const tokenResponse = await msalInstance.acquireTokenSilent({
//         ...loginRequest,
//         account: currentAccount
//       });

//       const response = await fetch(
//         'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
//         {
//           headers: {
//             Authorization: `Bearer ${tokenResponse.accessToken}`
//           }
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Error fetching folders: ${response.statusText}`);
//       }

//       const data = await response.json();
//       setFolders(data.value);
//       setError(null);
//     } catch (err) {
//       setError(`Failed to get folders: ${err.message}`);
//       console.error(err);
      
//       if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
//         try {
//           setIsAuthInProgress(true);
//           const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
//           setIsAuthInProgress(false);
          
//           const response = await fetch(
//             'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null',
//             {
//               headers: {
//                 Authorization: `Bearer ${tokenResponse.accessToken}`
//               }
//             }
//           );
//           const data = await response.json();
//           setFolders(data.value);
//           setError(null);
//         } catch (interactiveErr) {
//           setIsAuthInProgress(false);
//           setError(`Failed to get folders: ${interactiveErr.message}`);
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Create new folder
//   const createFolder = async () => {
//     if (!newFolderName.trim()) {
//       setError("Please enter a folder name");
//       return;
//     }

//     setLoading(true);
//     try {
//       const currentAccount = user || msalInstance.getAllAccounts()[0];
//       if (!currentAccount) {
//         throw new Error("No account found. Please sign in first.");
//       }
      
//       const tokenResponse = await msalInstance.acquireTokenSilent({
//         ...loginRequest,
//         account: currentAccount
//       });

//       const response = await fetch(
//         'https://graph.microsoft.com/v1.0/me/drive/root/children',
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${tokenResponse.accessToken}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             name: newFolderName,
//             folder: {},
//             '@microsoft.graph.conflictBehavior': 'rename'
//           })
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Error creating folder: ${response.statusText}`);
//       }

//       const newFolder = await response.json();
//       setFolders([...folders, newFolder]);
//       setNewFolderName('');
//       setError(null);
//     } catch (err) {
//       setError(`Failed to create folder: ${err.message}`);
//       console.error(err);
      
//       if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
//         try {
//           setIsAuthInProgress(true);
//           const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
//           setIsAuthInProgress(false);
//           await createFolder();
//         } catch (interactiveErr) {
//           setIsAuthInProgress(false);
//           setError(`Failed to create folder: ${interactiveErr.message}`);
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Delete folder
//   const deleteFolder = async (folderId) => {
//     setLoading(true);
//     try {
//       const currentAccount = user || msalInstance.getAllAccounts()[0];
//       if (!currentAccount) {
//         throw new Error("No account found. Please sign in first.");
//       }
      
//       const tokenResponse = await msalInstance.acquireTokenSilent({
//         ...loginRequest,
//         account: currentAccount
//       });

//       const response = await fetch(
//         `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`,
//         {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${tokenResponse.accessToken}`
//           }
//         }
//       );

//       if (!response.ok && response.status !== 204) {
//         throw new Error(`Error deleting folder: ${response.statusText}`);
//       }

//       setFolders(folders.filter(folder => folder.id !== folderId));
      
//       if (selectedFolder && selectedFolder.id === folderId) {
//         setSelectedFolder(null);
//       }
      
//       setError(null);
//     } catch (err) {
//       setError(`Failed to delete folder: ${err.message}`);
//       console.error(err);
      
//       if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
//         try {
//           setIsAuthInProgress(true);
//           const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
//           setIsAuthInProgress(false);
//           await deleteFolder(folderId);
//         } catch (interactiveErr) {
//           setIsAuthInProgress(false);
//           setError(`Failed to delete folder: ${interactiveErr.message}`);
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Upload CSV to selected folder
//   const uploadCSV = async () => {
//     if (!selectedFolder) {
//       setError("Please select a folder first");
//       return;
//     }

//     setLoading(true);
//     try {
//       let csvContent = '';
      
//       if (selectedTable) {
//         const headers = TABLE_TEMPLATES[selectedTable].headers;
//         csvContent = headers.join(',') + '\n';
        
//         const sampleData = headers.map(header => {
//           if (header.toLowerCase() === 'name') return formData.name;
//           if (header.toLowerCase() === 'status') return 'Not Started';
//           if (header.toLowerCase() === 'email') return formData.email;
//           return formData.customFields[header] || '';
//         });
        
//         csvContent += sampleData.join(',');
//       } else {
//         csvContent = `Name,Email,Description\n${formData.name},${formData.email},${formData.description}`;
//       }
      
//       const fileName = selectedTable 
//         ? `${TABLE_TEMPLATES[selectedTable].name}_Template_${new Date().toISOString().slice(0,10)}.csv`
//         : `data_${new Date().toISOString().slice(0,10)}.csv`;
      
//       const file = new Blob([csvContent], { type: 'text/csv' });
      
//       const currentAccount = user || msalInstance.getAllAccounts()[0];
//       if (!currentAccount) {
//         throw new Error("No account found. Please sign in first.");
//       }
      
//       const tokenResponse = await msalInstance.acquireTokenSilent({
//         ...loginRequest,
//         account: currentAccount
//       });

//       const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${selectedFolder.id}:/${fileName}:/content`;
      
//       const uploadResponse = await fetch(uploadUrl, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${tokenResponse.accessToken}`,
//           'Content-Type': 'text/csv'
//         },
//         body: file
//       });

//       if (!uploadResponse.ok) {
//         throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
//       }

//       setSuccess(true);
//       setCurrentStep(STEPS.COMPLETION);
//       setError(null);
//     } catch (err) {
//       setError(`Failed to upload CSV: ${err.message}`);
//       console.error(err);
      
//       if (err.name === "InteractionRequiredAuthError" && msalInstance && !isAuthInProgress) {
//         try {
//           setIsAuthInProgress(true);
//           const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
//           setIsAuthInProgress(false);
//           await uploadCSV();
//         } catch (interactiveErr) {
//           setIsAuthInProgress(false);
//           setError(`Failed to upload CSV: ${interactiveErr.message}`);
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle form changes
//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Handle custom field changes
//   const handleCustomFieldChange = (fieldName, value) => {
//     setFormData(prev => ({
//       ...prev,
//       customFields: {
//         ...prev.customFields,
//         [fieldName]: value
//       }
//     }));
//   };

//   // Navigate to next step
//   const nextStep = () => {
//     if (currentStep === STEPS.FOLDER_SELECTION && !selectedFolder) {
//       setError("Please select a folder before proceeding");
//       return;
//     }
    
//     if (currentStep === STEPS.TABLE_SELECTION && !selectedTable) {
//       setError("Please select a table template before proceeding");
//       return;
//     }
    
//     if (currentStep === STEPS.DETAILS_ENTRY) {
//       uploadCSV();
//     } else {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   // Navigate to previous step
//   const prevStep = () => {
//     setCurrentStep(currentStep - 1);
//   };

//   // Clear any auth errors when component unmounts
//   useEffect(() => {
//     return () => {
//       if (msalInstance) {
//         try {
//           sessionStorage.removeItem('msal.interaction.status');
//         } catch (e) {
//           console.error('Failed to clear interaction status:', e);
//         }
//       }
//     };
//   }, [msalInstance]);

//   // Render steps based on current step
//   const renderStep = () => {
//     switch (currentStep) {
//       case STEPS.FOLDER_SELECTION:
//         return (
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-semibold mb-4">Step 1: Select OneDrive Folder</h2>
            
//             {!isAuthenticated ? (
//               <button 
//                 onClick={handleSignIn}
//                 className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//                 disabled={!msalInstance || loading || isAuthInProgress}
//               >
//                 {loading ? 'Connecting...' : 'Connect to OneDrive'}
//               </button>
//             ) : (
//               <div>
//                 <div className="mb-4 flex items-center justify-between">
//                   <p className="font-semibold text-gray-700">Connected as: {user?.username}</p>
//                   <button 
//                     onClick={handleSignOut}
//                     className="text-red-600 hover:text-red-800 text-sm font-medium"
//                   >
//                     Disconnect
//                   </button>
//                 </div>

//                 <div className="mb-6">
//                   <h3 className="font-medium mb-2">Your OneDrive Folders</h3>
//                   <button 
//                     onClick={() => getOneDriveFolders()} 
//                     className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
//                     disabled={loading || isAuthInProgress}
//                   >
//                     {loading ? 'Refreshing...' : 'Refresh Folders'}
//                   </button>
                  
//                   {folders.length > 0 ? (
//                     <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
//                       {folders.map(folder => (
//                         <div 
//                           key={folder.id} 
//                           className={`p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer ${
//                             selectedFolder?.id === folder.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
//                           }`}
//                           onClick={() => setSelectedFolder(folder)}
//                         >
//                           <div className="flex items-center gap-2">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
//                               <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
//                               <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
//                             </svg>
//                             <span className="font-medium">{folder.name}</span>
//                           </div>
//                           <button 
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               if (window.confirm(`Are you sure you want to delete "${folder.name}"?`)) {
//                                 deleteFolder(folder.id);
//                               }
//                             }}
//                             className="text-gray-500 hover:text-red-500"
//                             title="Delete folder"
//                           >
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                               <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//                             </svg>
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-gray-500 italic">No folders found. Create a new folder below.</p>
//                   )}
//                 </div>
                
//                 <div className="mb-6">
//                   <h3 className="font-medium mb-2">Create New Folder</h3>
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       value={newFolderName}
//                       onChange={(e) => setNewFolderName(e.target.value)}
//                       placeholder="Enter folder name"
//                       className="flex-1 border rounded px-3 py-2"
//                     />
//                     <button
//                       onClick={createFolder}
//                       disabled={loading || !newFolderName.trim() || isAuthInProgress}
//                       className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
//                     >
//                       Create
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="flex justify-end mt-6">
//                   {selectedFolder && (
//                     <button
//                       onClick={nextStep}
//                       className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
//                     >
//                       Next
//                     </button>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         );
      
//       case STEPS.TABLE_SELECTION:
//         return (
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-semibold mb-4">Step 2: Select Table Template</h2>
            
//             <p className="mb-4 text-gray-700">
//               Selected folder: <span className="font-medium">{selectedFolder?.name}</span>
//             </p>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//               {Object.entries(TABLE_TEMPLATES).map(([key, template]) => (
//                 <div 
//                   key={key}
//                   className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
//                     selectedTable === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
//                   }`}
//                   onClick={() => setSelectedTable(key)}
//                 >
//                   <h3 className="font-medium text-lg mb-2">{template.name}</h3>
//                   <div className="text-sm text-gray-600">
//                     <p className="font-medium mb-1">Headers:</p>
//                     <ul className="list-disc list-inside">
//                       {template.headers.slice(0, 3).map(header => (
//                         <li key={header}>{header}</li>
//                       ))}
//                       {template.headers.length > 3 && (
//                         <li className="text-gray-500">+{template.headers.length - 3} more...</li>
//                       )}
//                     </ul>
//                   </div>
//                 </div>
//               ))}
//             </div>
            
//             <div className="flex justify-between mt-6">
//               <button
//                 onClick={prevStep}
//                 className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4"
//               >
//                 Back
//               </button>
              
//               <button
//                 onClick={nextStep}
//                 disabled={!selectedTable || loading}
//                 className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         );
      
//       case STEPS.DETAILS_ENTRY:
//         return (
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-semibold mb-4">Step 3: Enter Details</h2>
            
//             <div className="mb-4 flex items-center gap-4">
//               <p className="text-gray-700">
//                 <span className="font-medium">Folder:</span> {selectedFolder?.name}
//               </p>
//               <p className="text-gray-700">
//                 <span className="font-medium">Template:</span> {TABLE_TEMPLATES[selectedTable]?.name || 'Custom'}
//               </p>
//             </div>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-gray-700 font-medium mb-1">Name *</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleFormChange}
//                   className="w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-gray-700 font-medium mb-1">Email *</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleFormChange}
//                   className="w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>
              
//               {selectedTable && (
//                 <div>
//                   <h3 className="font-medium text-gray-700 mb-2">Template Fields</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {TABLE_TEMPLATES[selectedTable].headers
//                       .filter(header => !['name', 'email', 'actions'].includes(header.toLowerCase()))
//                       .map(header => (
//                         <div key={header}>
//                           <label className="block text-gray-700 text-sm mb-1">{header}</label>
//                           <input
//                             type="text"
//                             value={formData.customFields[header] || ''}
//                             onChange={(e) => handleCustomFieldChange(header, e.target.value)}
//                             className="w-full border rounded px-3 py-2 text-sm"
//                             placeholder={`Enter ${header.toLowerCase()}`}
//                           />
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             <div className="flex justify-between mt-6">
//               <button
//                 onClick={prevStep}
//                 className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4"
//               >
//                 Back
//               </button>
              
//               <button
//                 onClick={nextStep}
//                 disabled={!formData.name || !formData.email || loading || isAuthInProgress}
//                 className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
//               >
//                 {loading ? 'Saving...' : 'Save Data'}
//               </button>
//             </div>
//           </div>
//         );
      
//       case STEPS.COMPLETION:
//         return (
//           <div className="bg-white p-6 rounded-lg shadow-md text-center">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
            
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
            
//             <p className="text-gray-600 mb-6">
//               Your {selectedTable ? TABLE_TEMPLATES[selectedTable].name : 'data'} template has been successfully saved to the folder "{selectedFolder?.name}" in your OneDrive.
//             </p>
            
//             <button
//               onClick={() => {
//                 setCurrentStep(STEPS.FOLDER_SELECTION);
//                 setSelectedFolder(null);
//                 setSelectedTable(null);
//                 setFormData({ name: '', email: '', description: '', customFields: {} });
//                 setSuccess(false);
//               }}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
//             >
//               Start New Setup
//             </button>
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto my-8 px-4">
//       <h1 className="text-2xl font-bold mb-8 text-center">OneDrive Template Setup Wizard</h1>
      
//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 relative" role="alert">
//           <p>{error}</p>
//           <button 
//             onClick={() => setError(null)} 
//             className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//           >
//             <span className="sr-only">Dismiss</span>
//             <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
//             </svg>
//           </button>
//         </div>
//       )}
      
//       {/* Progress Steps */}
//       <div className="flex items-center justify-between mb-8">
//         {Object.values(STEPS).map((step) => (
//           <div key={step} className="flex flex-col items-center">
//             <div 
//               className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
//                 currentStep === step 
//                   ? 'bg-blue-600 text-white' 
//                   : currentStep > step 
//                     ? 'bg-green-500 text-white' 
//                     : 'bg-gray-200 text-gray-600'
//               }`}
//             >
//               {currentStep > step ? (
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                 </svg>
//               ) : (
//                 step + 1
//               )}
//             </div>
//             <div className="text-xs mt-1">
//               {step === STEPS.FOLDER_SELECTION ? 'Select Folder' : 
//                step === STEPS.TABLE_SELECTION ? 'Choose Template' :
//                step === STEPS.DETAILS_ENTRY ? 'Enter Details' : 
//                'Complete'}
//             </div>
//           </div>
//         ))}
//       </div>
      
//       {renderStep()}
//     </div>
//   );
// };

// export default Apps;