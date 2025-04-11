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