import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MicrosoftContact {
  id: string;
  displayName: string;
  jobTitle?: string;
  department?: string;
  businessPhones?: string[];
  mobilePhone?: string;
  officeLocation?: string;
  emailAddresses?: {
    address: string;
    name: string;
  }[];
  userPrincipalName?: string;
}

export const useMicrosoftContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<MicrosoftContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!window.msalInstance) {
      setError('MSAL instance not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['People.Read']
      });

      const result = await fetch('https://graph.microsoft.com/v1.0/me/contacts', {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch contacts: ${result.statusText}`);
      }

      const data = await result.json();
      setContacts(data.value);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch contacts');
      toast.error('Failed to fetch contacts from Microsoft');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  return {
    contacts,
    isLoading,
    error,
    refetch: fetchContacts
  };
};

export default useMicrosoftContacts; 