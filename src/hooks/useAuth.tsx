import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/integrations/microsoft/msalConfig';
import { getAccount, getUserProfile, loginWithMicrosoft as loginWithMicrosoftService } from '@/integrations/microsoft/msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';
import { getSupabaseClient, notesService } from '@/integrations/supabase/supabaseClient';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
  unitName?: string;
  accessToken?: string; // For Microsoft Graph API
  profilePicture?: string; // URL to profile picture
  notes?: any[]; // User's notes from Supabase
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  businessUnits: {id: string, name: string}[];
  selectedUnit: string | null;
  setSelectedUnit: (unitId: string | null) => void;
  msGraphConfig: MsGraphConfig | null;
  setUser: (user: User | null) => void;
  fetchUserNotes: () => Promise<any[]>;
  addUserNote: (content: string) => Promise<any>;
}

interface MsGraphConfig {
  clientId: string;
  authorityUrl: string;
  redirectUri: string;
  permissions: string[];
  apiEndpoint: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin for demo purposes only
const defaultAdmin = {
  id: '1',
  email: 'admin@app.com',
  name: 'Admin User',
  role: 'admin' as UserRole,
  unitName: 'IT'
};

// List of emails that should receive admin role when authenticating
const adminEmails = [
  'geosyncsurvey@gmail.com',
  'admin@app.com'
];

// Mock business units for SCPNG context
const mockBusinessUnits = [
  { id: 'hr', name: 'HR' },
  { id: 'finance', name: 'Finance' },
  { id: 'legal', name: 'Legal' },
  { id: 'research', name: 'Research and Publication' },
  { id: 'it', name: 'IT' },
  { id: 'market', name: 'Market Data' },
  { id: 'licensing', name: 'Licensing' },
  { id: 'supervision', name: 'Supervision' },
  { id: 'chairman', name: 'Chairman' },
  { id: 'administration', name: 'Administration' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [msGraphConfig, setMsGraphConfig] = useState<MsGraphConfig | null>(null);
  const [msalInitialized, setMsalInitialized] = useState(false);
  
  // Load saved config and user on mount
  useEffect(() => {
    // Load Microsoft Graph API configuration
    const loadMsConfig = async () => {
      try {
        console.log('Loading Microsoft configuration from config file...');
        
        // Use the configuration from our config file
        const config = {
          clientId: microsoftAuthConfig.clientId,
          authorityUrl: microsoftAuthConfig.authorityUrl,
          redirectUri: microsoftAuthConfig.redirectUri,
          permissions: microsoftAuthConfig.permissions,
          apiEndpoint: microsoftAuthConfig.apiEndpoint
        };
        
        console.log('Loaded Microsoft config:', config);
        setMsGraphConfig(config);
        setMsalInitialized(true);
        
        // Also save to localStorage for persistence
        localStorage.setItem('ms-api-config', JSON.stringify(microsoftAuthConfig));
        
      } catch (error) {
        console.error('Error loading MS config:', error);
        toast.error('Failed to load Microsoft authentication configuration');
      }
    };

    loadMsConfig();

    // Check if user is already logged in
    const checkExistingSession = async () => {
      // Check localStorage as fallback for default admin
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    
    checkExistingSession();
  }, []);

  // Update user object with notes if user exists
  useEffect(() => {
    const loadUserNotes = async () => {
      if (user?.email) {
        try {
          const notes = await notesService.getNotes(user.email);
          setUser({
            ...user,
            notes
          });
        } catch (error) {
          console.error('Error loading user notes:', error);
        }
      }
    };

    if (user) {
      loadUserNotes();
    }
  }, [user?.email]);

  const login = async (email: string, password: string) => {
    // Special case for the default admin (demo only)
    if (email.toLowerCase() === 'admin@app.com' && password === 'admin') {
      setUser(defaultAdmin);
      localStorage.setItem('user', JSON.stringify(defaultAdmin));
      return Promise.resolve();
    }
    
    // For now, we'll just use the default admin for any login attempt
    // In a real implementation, you would validate credentials against your backend
    setUser(defaultAdmin);
    localStorage.setItem('user', JSON.stringify(defaultAdmin));
    return Promise.resolve();
  };

  const loginWithMicrosoft = async () => {
    if (!msGraphConfig) {
      console.error('Microsoft authentication is not configured');
      toast.error('Microsoft authentication is not configured');
      return;
    }

    if (!msalInitialized) {
      console.error('MSAL is not initialized');
      toast.error('Authentication service is not ready. Please try again later.');
      return;
    }

    if (!window.msalInstance) {
      console.error('MSAL instance not found');
      toast.error('Authentication service is not ready. Please try again later.');
      return;
    }

    try {
      console.log('Initiating Microsoft login...');
      await loginWithMicrosoftService(window.msalInstance);
      console.log('Microsoft login initiated successfully');
      // The page will redirect to Microsoft login
    } catch (error) {
      console.error('Error during Microsoft login:', error);
      toast.error('Failed to login with Microsoft');
    }
  };

  // New method to fetch user notes
  const fetchUserNotes = async (): Promise<any[]> => {
    if (!user?.email) {
      console.error('Cannot fetch notes: No user is logged in');
      return [];
    }
    
    try {
      const notes = await notesService.getNotes(user.email);
      // Update the user object with the notes
      setUser({
        ...user,
        notes
      });
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load your notes');
      return [];
    }
  };
  
  // New method to add a user note
  const addUserNote = async (content: string) => {
    if (!user?.email) {
      console.error('Cannot add note: No user is logged in');
      toast.error('You must be logged in to add notes');
      return null;
    }
    
    try {
      const result = await notesService.addNote(user.email, content);
      // Refresh notes after adding
      await fetchUserNotes();
      toast.success('Note added successfully');
      return result;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return null;
    }
  };

  const logout = async () => {
    try {
      // Clear user data
      setUser(null);
      localStorage.removeItem('user');
      
      // If MSAL is initialized, log out from Microsoft
      if (window.msalInstance) {
        await window.msalInstance.logoutRedirect();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Compute derived values
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isManager,
        login,
        loginWithMicrosoft,
        logout,
        businessUnits: mockBusinessUnits,
        selectedUnit,
        setSelectedUnit,
        msGraphConfig,
        setUser,
        fetchUserNotes,
        addUserNote
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
