import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Document {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  size: number;
  isFolder?: boolean;
  parentReference?: {
    path: string;
  };
  source: 'SharePoint' | 'OneDrive';
}

export const useMicrosoftGraph = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to check if MSAL is properly initialized and has an active account
  const checkMsalAuth = () => {
    if (!window.msalInstance) {
      console.error('MSAL instance not found');
      return false;
    }
    
    const accounts = window.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found');
      return false;
    }
    
    // Set active account if not already set
    if (!window.msalInstance.getActiveAccount()) {
      window.msalInstance.setActiveAccount(accounts[0]);
    }
    
    return true;
  };

  const getSharePointDocuments = async (): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.Read.All', 'Sites.Read.All']
      });

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/sites/root/drive/root/children';
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch SharePoint documents: ${result.statusText}`);
      }

      const data = await result.json();
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: 'SharePoint' as const
      }));
    } catch (error) {
      console.error('Error fetching SharePoint documents:', error);
      toast.error('Failed to fetch SharePoint documents');
      throw error;
    }
  };

  const getOneDriveDocuments = async (): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['User.Read', 'Files.Read.All']
      });

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch OneDrive documents: ${result.statusText}`);
      }

      const data = await result.json();
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: 'OneDrive' as const
      }));
    } catch (error) {
      console.error('Error fetching OneDrive documents:', error);
      toast.error('Failed to fetch OneDrive documents');
      throw error;
    }
  };

  const getFolderContents = async (folderId: string, source: 'SharePoint' | 'OneDrive'): Promise<Document[] | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: source === 'SharePoint' 
          ? ['Files.Read.All', 'Sites.Read.All'] 
          : ['User.Read', 'Files.Read.All']
      });

      const baseEndpoint = source === 'SharePoint' 
        ? 'https://graph.microsoft.com/v1.0/sites/root/drive/items'
        : 'https://graph.microsoft.com/v1.0/me/drive/items';
      
      const graphEndpoint = `${baseEndpoint}/${folderId}/children`;
      
      const result = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch folder contents: ${result.statusText}`);
      }

      const data = await result.json();
      return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.webUrl || item['@microsoft.graph.downloadUrl'],
        lastModified: item.lastModifiedDateTime,
        size: item.size || 0,
        isFolder: item.folder !== undefined,
        parentReference: item.parentReference,
        source: source
      }));
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      toast.error('Failed to fetch folder contents');
      throw error;
    }
  };

  // Create a new folder in OneDrive
  const createFolder = async (folderName: string, parentFolderId?: string): Promise<Document | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const baseEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
      const endpoint = parentFolderId 
        ? `${baseEndpoint}/items/${parentFolderId}/children`
        : `${baseEndpoint}/root/children`;

      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'replace'
        })
      });

      if (!result.ok) {
        throw new Error(`Failed to create folder: ${result.statusText}`);
      }

      const data = await result.json();
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        lastModified: data.lastModifiedDateTime,
        size: 0,
        isFolder: true,
        parentReference: data.parentReference,
        source: 'OneDrive' as const
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      throw error;
    }
  };

  // Rename a folder in OneDrive
  const renameFolder = async (folderId: string, newName: string): Promise<Document | null> => {
    if (!checkMsalAuth()) {
      throw new Error('No accounts found');
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All']
      });

      const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}`;

      const result = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName
        })
      });

      if (!result.ok) {
        throw new Error(`Failed to rename folder: ${result.statusText}`);
      }

      const data = await result.json();
      return {
        id: data.id,
        name: data.name,
        url: data.webUrl || '',
        lastModified: data.lastModifiedDateTime,
        size: data.size || 0,
        isFolder: data.folder !== undefined,
        parentReference: data.parentReference,
        source: 'OneDrive' as const
      };
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Failed to rename folder');
      throw error;
    }
  };

  return {
    isLoading,
    getSharePointDocuments,
    getOneDriveDocuments,
    getFolderContents,
    createFolder,
    renameFolder
  };
};

export default useMicrosoftGraph; 