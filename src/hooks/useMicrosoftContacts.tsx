import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';
import { PublicClientApplication } from '@azure/msal-browser';

// Extend the Window interface globally
declare global {
  interface Window {
    msalInstance?: PublicClientApplication;
  }
}

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
  mail?: string;
  givenName?: string;
  surname?: string;
  companyName?: string;
  preferredLanguage?: string;
  photo?: string;
}

export const useMicrosoftContacts = () => {
  const { user } = useSupabaseAuth();
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
        scopes: ['User.Read', 'People.Read', 'Directory.Read.All']
      });

      const result = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,givenName,surname,mail,jobTitle,department,officeLocation,businessPhones,mobilePhone,userPrincipalName,preferredLanguage,companyName', {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to fetch organization contacts: ${result.statusText}`);
      }

      const data = await result.json();
      
      const transformedContacts = data.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName || `${user.givenName || ''} ${user.surname || ''}`.trim(),
        jobTitle: user.jobTitle,
        department: user.department,
        businessPhones: user.businessPhones,
        mobilePhone: user.mobilePhone,
        officeLocation: user.officeLocation,
        emailAddresses: user.mail ? [{ address: user.mail, name: user.displayName }] : undefined,
        userPrincipalName: user.userPrincipalName,
        mail: user.mail,
        givenName: user.givenName,
        surname: user.surname,
        companyName: user.companyName,
        preferredLanguage: user.preferredLanguage
      }));
      
      setContacts(transformedContacts);
    } catch (error) {
      console.error('Error fetching organization contacts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch organization contacts');
      toast.error('Failed to fetch organization contacts from Microsoft');
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