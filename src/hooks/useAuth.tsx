import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/integrations/microsoft/msalConfig';
import { getAccount, getUserProfile, loginWithMicrosoft as loginWithMicrosoftService, diagnoseMsalIssues } from '@/integrations/microsoft/msalService';
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

  // --- Function to update user status in Supabase ---
  const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
    if (!userId) {
        console.error('[updateUserStatus] Attempted to update status with no userId.');
        return;
    }
    console.log(`[updateUserStatus] Attempting to update status for user ${userId} to ${status}`);
    const supabase = getSupabaseClient();
    try {
      const payload = {
        user_id: userId,
        status: status,
        last_seen: new Date().toISOString()
      };
      console.log('[updateUserStatus] Payload:', payload);

      const { data, error } = await supabase
        .from('user_status')
        .upsert(payload, { onConflict: 'user_id' }); 

      if (error) {
        console.error(`[updateUserStatus] Supabase error updating status to ${status} for user ${userId}:`, error);
        toast.error(`Failed to update your status: ${error.message}`); // Make error visible
      } else {
        console.log(`[updateUserStatus] Successfully updated status to ${status} for user ${userId}. Response data:`, data);
      }
    } catch (err) {
        console.error(`[updateUserStatus] Unexpected Javascript error updating status to ${status} for user ${userId}:`, err);
        toast.error('An unexpected error occurred while updating your status.');
    }
  };

  const login = async (email: string, password: string) => {
    // This is demo login - skip status update for now
    if (email.toLowerCase() === 'admin@app.com' && password === 'admin') {
      setUser(defaultAdmin);
      localStorage.setItem('user', JSON.stringify(defaultAdmin));
      return Promise.resolve();
    }
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
      await loginWithMicrosoftService(msalInstance);
      const account = getAccount(msalInstance);
      
      if (!account) {
        console.error('No account found after Microsoft login');
        toast.error('Failed to get account after login');
        return;
      }
      
      console.log('Microsoft login successful, fetching user profile');
      const profile = await getUserProfile(msalInstance);
      
      if (!profile) {
        console.error('Failed to fetch user profile');
        toast.error('Failed to fetch user profile');
        return;
      }
      
      const email = profile.mail || profile.userPrincipalName || account.username;
      const isAdmin = adminEmails.includes(email.toLowerCase());
      
      const newUser: User = {
        id: account.localAccountId || account.homeAccountId,
        email: email,
        name: profile.displayName || email,
        role: isAdmin ? 'admin' : 'user',
        profilePicture: profile.photo || undefined,
        isAdmin,
        accessToken: null
      };
      
      // Update user state FIRST
      setUser(newUser);
      setUserProfile(profile);
      localStorage.setItem('user', JSON.stringify(newUser));
      console.log('User successfully logged in and profile saved');

      // THEN update status in Supabase
      await updateUserStatus(newUser.id, 'online');
      
      // Fetch additional user data from Supabase if needed
      fetchUserUnits().then(units => {
        // Select first unit if available
        if (units.length > 0 && !selectedUnit) {
          setSelectedUnit(units[0].id);
          localStorage.setItem('selectedUnit', units[0].id);
        }
      });
      
      return;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      toast.error('Failed to login with Microsoft');
      // Optionally try setting status to offline here if login fails mid-way?
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
        // Define the expected shape of the data from the memberships query
        interface MembershipWithUnit {
          unit_id: string | number; 
          organization_units: { 
            id: string | number; 
            name: string;
            description?: string;
            created_at: string; 
            updated_at: string; 
          } | null; 
        }

        const { data, error } = await supabase
          .from('user_unit_memberships')
          .select(`
            unit_id,
            organization_units!inner(
              id, 
              name, 
              description, 
              created_at, 
              updated_at
            )
          `)
          .eq('user_id', user.id)
          // Explicitly type the returned data
          .returns<MembershipWithUnit[]>(); 
          
        if (error) throw error;
        if (!data) return []; // Handle case where data is null
        
        // Now map the correctly typed data
        const units = data.map(item => {
          const unitData = item.organization_units; // Should be correctly typed now
          if (!unitData) return null; 
          return {
             id: unitData.id,
             name: unitData.name,
             description: unitData.description,
             createdAt: new Date(unitData.created_at), 
             updatedAt: new Date(unitData.updated_at)  
          } as OrganizationUnit;
        }).filter(unit => unit !== null);
        
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
    // Capture user ID *before* clearing state
    const userIdToLogOut = user?.id;

    try {
      // Update status to offline FIRST
      if (userIdToLogOut) {
        await updateUserStatus(userIdToLogOut, 'offline');
      }

      // Then clear local user data
      setUser(null);
      setUserProfile(null); // Also clear profile if needed
      localStorage.removeItem('user');
      localStorage.removeItem('selectedUnit');
      localStorage.removeItem('selectedDivision'); // Also remove selected division
      
      // If MSAL is initialized, log out from Microsoft
      const msalInstance = (typeof window !== 'undefined' && window.msalInstance) 
        ? window.msalInstance 
        : null;
      if (msalInstance) {
        await msalInstance.logoutRedirect();
        // Note: logoutRedirect might clear session before Supabase update completes
        // If issues arise, consider using logoutPopup or updating status *after* redirect resolves if possible
      } else {
          console.warn("MSAL instance not found during logout.");
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to clear local state even if Supabase/MSAL fails
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('user');
      localStorage.removeItem('selectedUnit');
      localStorage.removeItem('selectedDivision');
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
