import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/integrations/microsoft/msalConfig';
import { getAccount, getUserProfile, loginWithMicrosoft as loginWithMicrosoftService } from '@/integrations/microsoft/msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';
import { getSupabaseClient, notesService } from '@/integrations/supabase/supabaseClient';
import { OrganizationUnit, UserProfile, Division } from '@/types';
import supabaseConfig from '@/config/supabase';

export type UserRole = 'admin' | 'manager' | 'user';
export type DivisionRole = 'director' | 'manager' | 'officer' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
  unitName?: string;
  divisionId?: string;  // ID of the user's primary division
  divisionName?: string; // Name of the user's primary division
  divisionRole?: DivisionRole; // Role within the division
  divisionMemberships?: { divisionId: string, role: DivisionRole }[]; // All division memberships
  accessToken?: string; // For Microsoft Graph API
  profilePicture?: string; // URL to profile picture
  notes?: any[]; // User's notes from Supabase
  isAdmin?: boolean; // Whether the user is an admin
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDirector: boolean; // Whether the user is a director in any division
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  businessUnits: OrganizationUnit[];
  selectedUnit: string | null;
  setSelectedUnit: (unitId: string | null) => void;
  selectedDivision: string | null;
  setSelectedDivision: (divisionId: string | null) => void;
  userDivisions: Division[];
  msGraphConfig: MsGraphConfig | null;
  setUser: (user: User | null) => void;
  fetchUserNotes: () => Promise<any[]>;
  addUserNote: (content: string) => Promise<any>;
  fetchUserUnits: () => Promise<OrganizationUnit[]>;
  fetchUserDivisions: () => Promise<Division[]>;
  userProfile: UserProfile | null;
  hasAccessToDivision: (divisionId: string) => boolean;
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
  unitName: 'IT',
  isAdmin: true
};

// List of emails that should receive admin role when authenticating
const adminEmails = [
  'geosyncsurvey@gmail.com',
  'admin@app.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [businessUnits, setBusinessUnits] = useState<OrganizationUnit[]>([]);
  const [userDivisions, setUserDivisions] = useState<Division[]>([]);
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
        
        // Load user units
        fetchUserUnits().then(units => {
          // If user has at least one unit and no unit is selected, select the first one
          if (units.length > 0 && !selectedUnit) {
            setSelectedUnit(units[0].id);
            localStorage.setItem('selectedUnit', units[0].id);
          }
        });
      }
    };
    
    checkExistingSession();
    
    // Check for saved selected unit in localStorage
    const savedUnit = localStorage.getItem('selectedUnit');
    if (savedUnit) {
      setSelectedUnit(savedUnit);
    }
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

    // Get the MSAL instance from window or context
    const msalInstance = (typeof window !== 'undefined' && window.msalInstance) 
      ? window.msalInstance 
      : null;

    if (!msalInstance) {
      console.error('MSAL instance not found. Retrying after a short delay...');
      
      // Wait a moment and retry once
      setTimeout(() => {
        const retryInstance = (typeof window !== 'undefined' && window.msalInstance) 
          ? window.msalInstance 
          : null;
          
        if (retryInstance) {
          console.log('MSAL instance found on retry');
          loginWithMicrosoftService(retryInstance).catch(error => {
            console.error('Microsoft login retry failed:', error);
            toast.error('Failed to login with Microsoft');
          });
        } else {
          console.error('MSAL instance still not available after retry');
          toast.error('Authentication service is not ready. Please refresh the page and try again.');
        }
      }, 1000);
      
      return;
    }

    try {
      console.log('Initiating Microsoft login...');
      
      // Clean up any previous login state
      if (typeof window !== 'undefined') {
        // Clear all MSAL-related entries from session storage
        Object.keys(sessionStorage)
          .filter(key => key.startsWith('msal.'))
          .forEach(key => sessionStorage.removeItem(key));
          
        // Clear local storage MSAL data
        localStorage.removeItem('msalLoginAttempts');
        localStorage.removeItem('msalLoginTimestamp');
        
        // Set a new login attempt marker
        localStorage.setItem('msalLoginAttempts', '1');
      }
      
      // Clear any existing accounts to force a clean login attempt
      msalInstance.clearCache();
      
      // Create a very specific login request with the correct redirect URI
      const loginRedirectRequest = {
        scopes: msGraphConfig.permissions || ['User.Read'],
        redirectUri: window.location.origin, // Explicitly use origin for consistency
        prompt: 'select_account', // Force account selection UI to appear
        redirectStartPage: window.location.href
      };
      
      console.log('Login redirect request:', loginRedirectRequest);
      
      // Initiate the login with the custom request
      await msalInstance.loginRedirect(loginRedirectRequest);
      
      console.log('Microsoft login initiated successfully');
      // The page will redirect to Microsoft login
    } catch (error) {
      // Clean up tracking state on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('msalLoginAttempts');
        localStorage.removeItem('msalLoginTimestamp');
      }
      
      console.error('Error during Microsoft login:', error);
      toast.error('Failed to login with Microsoft');
      
      // Display more specific error messages depending on the error
      if (error instanceof Error) {
        if (error.message.includes('redirect_uri_mismatch')) {
          toast.error('Authentication failed: Redirect URI mismatch. Please contact your administrator.');
        } else if (error.message.includes('consent_required')) {
          toast.error('Authentication failed: Consent required. Please try again and accept permissions.');
        } else if (error.message.includes('interaction_in_progress')) {
          // Try to clear the interaction state
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('msal.interaction.status');
            toast.error('Authentication in progress. Please try again.');
          }
        }
      }
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

  // New method to fetch user's organizational units
  const fetchUserUnits = async (): Promise<OrganizationUnit[]> => {
    if (!user?.id) {
      console.error('Cannot fetch units: No user is logged in');
      return [];
    }
    
    try {
      const supabase = getSupabaseClient();
      
      // For admin users, fetch all units
      if (user.isAdmin || user.role === 'admin') {
        const { data, error } = await supabase
          .from('organization_units')
          .select('*');
          
        if (error) throw error;
        
        const units = data.map(unit => ({
          ...unit,
          createdAt: new Date(unit.created_at),
          updatedAt: new Date(unit.updated_at)
        }));
        
        setBusinessUnits(units);
        return units;
      } 
      // For regular users, fetch only units they are members of
      else {
        const { data, error } = await supabase
          .from('user_unit_memberships')
          .select(`
            unit_id,
            organization_units!inner(*)
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        const units = data.map(item => ({
          ...item.organization_units,
          id: item.organization_units.id,
          createdAt: new Date(item.organization_units.created_at),
          updatedAt: new Date(item.organization_units.updated_at)
        }));
        
        setBusinessUnits(units);
        return units;
      }
    } catch (error) {
      console.error('Error fetching user units:', error);
      toast.error('Failed to load your units');
      
      // Fall back to mock business units for demo
      const mockUnits = [
        { id: 'hr', name: 'HR', description: 'Human Resources', createdAt: new Date(), updatedAt: new Date() },
        { id: 'finance', name: 'Finance', description: 'Financial Department', createdAt: new Date(), updatedAt: new Date() },
        { id: 'it', name: 'IT', description: 'Information Technology', createdAt: new Date(), updatedAt: new Date() }
      ];
      
      setBusinessUnits(mockUnits);
      return mockUnits;
    }
  };

  // New method to fetch user's divisions
  const fetchUserDivisions = async (): Promise<Division[]> => {
    if (!user?.id) {
      console.error('Cannot fetch divisions: No user is logged in');
      return [];
    }
    
    try {
      const supabase = getSupabaseClient();
      
      // Fetch division memberships for the user
      const { data: memberships, error: membershipError } = await supabase
        .from(supabaseConfig.tables.division_memberships)
        .select('*')
        .eq('userId', user.id);
        
      if (membershipError) {
        console.error('Error fetching division memberships:', membershipError);
        return [];
      }
      
      if (!memberships || memberships.length === 0) {
        return [];
      }
      
      // Extract division IDs from memberships
      const divisionIds = memberships.map(m => m.divisionId);
      
      // Fetch divisions using those IDs
      const { data: divisions, error: divisionsError } = await supabase
        .from(supabaseConfig.tables.divisions)
        .select('*')
        .in('id', divisionIds);
        
      if (divisionsError) {
        console.error('Error fetching divisions:', divisionsError);
        return [];
      }
      
      // Update user's division memberships
      setUser({
        ...user,
        divisionMemberships: memberships.map(m => ({
          divisionId: m.divisionId,
          role: m.role
        }))
      });
      
      // Update state with fetched divisions
      setUserDivisions(divisions || []);
      
      // If no division is selected yet, select the first one
      if (divisions && divisions.length > 0 && !selectedDivision) {
        setSelectedDivision(divisions[0].id);
        localStorage.setItem('selectedDivision', divisions[0].id);
      }
      
      return divisions || [];
    } catch (error) {
      console.error('Error in fetchUserDivisions:', error);
      return [];
    }
  };
  
  // Helper function to check if user has access to a division
  const hasAccessToDivision = (divisionId: string): boolean => {
    if (!user) return false;
    
    // Admins have access to all divisions
    if (user.isAdmin) return true;
    
    // Check if user is a member of the division
    return user.divisionMemberships?.some(m => m.divisionId === divisionId) || false;
  };

  const logout = async () => {
    try {
      // Clear user data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('selectedUnit');
      
      // If MSAL is initialized, log out from Microsoft
      if (window.msalInstance) {
        await window.msalInstance.logoutRedirect();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // When selected unit changes, save to localStorage
  useEffect(() => {
    if (selectedUnit) {
      localStorage.setItem('selectedUnit', selectedUnit);
    }
  }, [selectedUnit]);

  // Compute derived values
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || !!user?.isAdmin;
  const isManager = user?.role === 'manager';
  const isDirector = user?.divisionRole === 'director';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isManager,
        isDirector,
        login,
        loginWithMicrosoft,
        logout,
        businessUnits,
        selectedUnit,
        setSelectedUnit,
        selectedDivision,
        setSelectedDivision,
        userDivisions,
        msGraphConfig,
        setUser,
        fetchUserNotes,
        addUserNote,
        fetchUserUnits,
        fetchUserDivisions,
        userProfile,
        hasAccessToDivision
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
