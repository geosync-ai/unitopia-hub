import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  size: number;
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

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/sites/root/drive/recent';
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
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        size: item.size
      }));
    } catch (error) {
      console.error('Error fetching SharePoint documents:', error);
      toast.error('Failed to fetch SharePoint documents');
      throw error; // Re-throw to let the component handle it
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

      // Using the same endpoint that worked in the test file
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
        size: item.size || 0
      }));
    } catch (error) {
      console.error('Error fetching OneDrive documents:', error);
      toast.error('Failed to fetch OneDrive documents');
      throw error; // Re-throw to let the component handle it
    }
  };

  return {
    isLoading,
    getSharePointDocuments,
    getOneDriveDocuments
  };
};

export default useMicrosoftGraph; 