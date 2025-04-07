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

  const getSharePointDocuments = async (): Promise<Document[] | null> => {
    if (!window.msalInstance) {
      console.error('MSAL instance not found');
      return null;
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
      return null;
    }
  };

  const getOneDriveDocuments = async (): Promise<Document[] | null> => {
    if (!window.msalInstance) {
      console.error('MSAL instance not found');
      return null;
    }

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.Read.All']
      });

      const graphEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/recent';
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
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        size: item.size
      }));
    } catch (error) {
      console.error('Error fetching OneDrive documents:', error);
      toast.error('Failed to fetch OneDrive documents');
      return null;
    }
  };

  return {
    isLoading,
    getSharePointDocuments,
    getOneDriveDocuments
  };
};

export default useMicrosoftGraph; 