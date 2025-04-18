import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSupabaseClient, notesService } from '@/integrations/supabase/supabaseClient';
import { signInWithEmail as supabaseSignInWithEmail, setupAuthStateListener, signOut as supabaseSignOut } from '@/integrations/supabase/supabaseAuth';
import { Provider, Session, User as SupabaseUser } from '@supabase/supabase-js';
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
  divisionId?: string;
  divisionName?: string;
  divisionRole?: DivisionRole;
  divisionMemberships?: { divisionId: string, role: DivisionRole }[];
  accessToken?: string;
  profilePicture?: string;
  notes?: any[];
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDirector: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  businessUnits: OrganizationUnit[];
  selectedUnit: string | null;
  setSelectedUnit: (unitId: string | null) => void;
  selectedDivision: string | null;
  setSelectedDivision: (divisionId: string | null) => void;
  userDivisions: Division[];
  setUser: (user: User | null) => void;
  fetchUserNotes: () => Promise<any[]>;
  addUserNote: (content: string) => Promise<any>;
  fetchUserUnits: () => Promise<OrganizationUnit[]>;
  fetchUserDivisions: (userId: string) => Promise<any[]>;
  hasAccessToDivision: (divisionId: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const adminEmails = [
  'geosyncsurvey@gmail.com',
  'admin@app.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [businessUnits, setBusinessUnits] = useState<OrganizationUnit[]>([]);
  const [userDivisions, setUserDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const createUserObjectFromSupabase = useCallback(async (supabaseUser: SupabaseUser, session: Session | null): Promise<User | null> => {
    if (!supabaseUser || !supabaseUser.email) return null;

    setIsLoading(true);
    try {
      console.log('Constructing User object for:', supabaseUser.email);
      const role: UserRole = adminEmails.includes(supabaseUser.email.toLowerCase()) ? 'admin' : 'user';

      let userMemberships: any[] = [];
      let primaryDivision: Division | undefined;
      let primaryRole: DivisionRole = 'staff';

      try {
        userMemberships = await fetchUserDivisions(supabaseUser.id);
        console.log(`Fetched ${userMemberships.length} memberships for ${supabaseUser.id}`);
        const primaryMembership = userMemberships.length > 0 ? userMemberships[0] : null;
        primaryDivision = primaryMembership?.divisions;
        primaryRole = primaryMembership?.role || 'staff';
        const divisionsFromMemberships = userMemberships.map(m => m.divisions).filter(Boolean);
        setUserDivisions(divisionsFromMemberships);
      } catch (fetchError) {
        console.error('Error fetching user divisions during user object creation:', fetchError);
        toast.warning('Could not load division information.');
      }

      const newUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
        role: role,
        isAdmin: role === 'admin',
        divisionId: primaryDivision?.id,
        divisionName: primaryDivision?.name,
        divisionRole: primaryRole,
        divisionMemberships: userMemberships.map(m => ({
            divisionId: m.divisionId,
            role: m.role as DivisionRole
        })),
        profilePicture: supabaseUser.user_metadata?.avatar_url,
        accessToken: session?.access_token,
      };
      console.log('Constructed User:', newUser);
      return newUser;
    } catch (error) {
        console.error("Error constructing user object:", error);
        toast.error("Failed to initialize user session.");
        return null;
    } finally {
        setIsLoading(false);
    }
  }, [fetchUserDivisions]);

  useEffect(() => {
    setIsLoading(true);
    console.log("Setting up Supabase auth state listener...");

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not available for auth listener.");
      setIsLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user: initialSupabaseUser } }) => {
        if (initialSupabaseUser) {
            console.log("Found initial Supabase user:", initialSupabaseUser.email);
            const { data: { session } } = await supabase.auth.getSession();
            const appUser = await createUserObjectFromSupabase(initialSupabaseUser, session);
            if (appUser) {
                setUserState(appUser);
                localStorage.setItem('user', JSON.stringify(appUser));
                console.log("Initial user session loaded.");
            } else {
                 console.error("Failed to create app user from initial Supabase user.");
                 await supabase.auth.signOut();
                 localStorage.removeItem('user');
            }
        } else {
            console.log("No initial Supabase user found.");
            const storedUser = localStorage.getItem('user');
             if (storedUser) {
                 console.warn("Found user in local storage but no Supabase session. Clearing local user.");
                 localStorage.removeItem('user');
             }
             setUserState(null);
        }
        setIsLoading(false);
    }).catch(error => {
        console.error("Error getting initial Supabase user:", error);
        setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(`Supabase auth event: ${_event}`);
        setIsLoading(true);
        const supabaseUser = session?.user ?? null;

        if (_event === 'SIGNED_IN' && supabaseUser) {
          console.log('User signed in:', supabaseUser.email);
          const appUser = await createUserObjectFromSupabase(supabaseUser, session);
           if (appUser) {
               setUserState(appUser);
               localStorage.setItem('user', JSON.stringify(appUser));
               toast.success('Successfully signed in!');
           } else {
                console.error("Failed to create app user after SIGNED_IN event.");
                await supabase.auth.signOut();
           }
        } else if (_event === 'SIGNED_OUT') {
          console.log('User signed out.');
          setUserState(null);
          setUserDivisions([]);
          localStorage.removeItem('user');
        } else if (_event === 'TOKEN_REFRESHED' && supabaseUser) {
            console.log('Token refreshed for:', supabaseUser.email);
             const appUser = await createUserObjectFromSupabase(supabaseUser, session);
             if (appUser) {
                 setUserState(appUser);
                 localStorage.setItem('user', JSON.stringify(appUser));
             } else {
                 console.error("Failed to update app user after TOKEN_REFRESHED event.");
             }
        } else if (_event === 'USER_UPDATED' && supabaseUser) {
             console.log('Supabase user updated:', supabaseUser.email);
              const appUser = await createUserObjectFromSupabase(supabaseUser, session);
              if (appUser) {
                  setUserState(appUser);
                  localStorage.setItem('user', JSON.stringify(appUser));
              } else {
                  console.error("Failed to update app user after USER_UPDATED event.");
              }
        }
        setIsLoading(false);
      }
    );

    return () => {
      console.log("Unsubscribing from Supabase auth state changes.");
      listener?.subscription?.unsubscribe();
    };
  }, [createUserObjectFromSupabase]);

  useEffect(() => {
    const loadUserNotes = async () => {
        if (user?.email && user.notes === undefined) {
        console.log("Loading notes for:", user.email)
        try {
          const notes = await notesService.getNotes(user.email);
          setUserState(currentUser => currentUser ? { ...currentUser, notes } : null);
        } catch (error) {
          console.error('Error loading user notes:', error);
        }
      }
    };

    if (user) {
      loadUserNotes();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log(`Attempting Supabase login for: ${email}`);
      const authResponseData = await supabaseSignInWithEmail(email, password);

      if (!authResponseData || !authResponseData.user) {
        console.error('Supabase login error: No user data returned in response');
        toast.error('Login failed: Could not retrieve user information.');
        throw new Error('Login failed: No user data returned');
      }

      console.log('Supabase email login successful for:', authResponseData.user.email);

    } catch (error: any) {
      console.error('Login function caught error:', error);
      toast.error(`Login failed: ${error.message || 'An unknown error occurred'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    setIsLoading(true);
    console.log('Initiating Microsoft login via Supabase OAuth...');
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase client not available.");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email offline_access User.Read',
           redirectTo: window.location.origin
        },
      });

      if (error) {
        console.error('Supabase Azure OAuth error:', error.message);
        toast.error(`Microsoft login failed: ${error.message}`);
        throw error;
      }
      console.log('Redirecting to Microsoft for login...');
    } catch (error: any) {
      console.error('Error during Microsoft login initiation:', error);
      toast.error(`Microsoft login failed: ${error.message || 'An unexpected error occurred'}`);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    console.log("Initiating logout...");
    try {
      await supabaseSignOut();
      toast.success("Successfully signed out.");
    } catch (error: any) {
      console.error('Error during logout:', error);
      toast.error(`Logout failed: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserNotes = async (): Promise<any[]> => {
    if (!user?.email) {
      console.error('Cannot fetch notes: No user is logged in');
      return [];
    }

    try {
      const notes = await notesService.getNotes(user.email);
      setUserState(currentUser => currentUser ? { ...currentUser, notes } : null);
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load your notes');
      return [];
    }
  };

  const addUserNote = async (content: string) => {
     if (!user?.email) {
      console.error('Cannot add note: No user is logged in');
      toast.error('You must be logged in to add notes');
      return null;
    }

    try {
      const result = await notesService.addNote(user.email, content);
      await fetchUserNotes();
      toast.success('Note added successfully');
      return result;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      return null;
    }
  };

 const fetchUserUnits = async (): Promise<OrganizationUnit[]> => {
    console.log('Fetching user units...');
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available for fetching units.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from(supabaseConfig.tables.organization_units)
        .select('id, name, description, code, manager');

      if (error) {
        console.error('Error fetching organization units:', error);
        throw error;
      }

      console.log('Fetched units data:', data);

      const units: OrganizationUnit[] = (data || []).map((unit: any) => ({
          id: unit.id,
          name: unit.name,
          description: unit.description,
          code: unit.code,
          manager: unit.manager,
          createdAt: new Date(),
          updatedAt: new Date()
      }));

      setBusinessUnits(units);
      return units;
    } catch (error) {
      console.error('Failed to fetch user units:', error);
      toast.error('Failed to load business units');
      return [];
    }
  };

  const fetchUserDivisions = async (userId: string): Promise<any[]> => {
     if (!userId) {
      console.error('Cannot fetch divisions: No user ID provided');
      return [];
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available for fetching divisions.');
      return [];
    }

    console.log(`Fetching division memberships for user: ${userId}`);

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from(supabaseConfig.tables.division_memberships)
        .select(`
          role,
          divisionId: division_id,
          divisions ( id, name, description, code )
        `)
        .eq('user_id', userId);

      if (membershipError) {
        console.error('Error fetching division memberships:', membershipError);
        throw membershipError;
      }

      console.log('Fetched division memberships with division data:', memberships);

      return memberships || [];

    } catch (error) {
      console.error('Failed to fetch user divisions:', error);
      toast.error('Failed to load division memberships');
      return [];
    }
  };

  const hasAccessToDivision = (divisionId: string): boolean => {
     if (!user) return false;

    if (user.isAdmin) return true;

    return user.divisionMemberships?.some(m => m.divisionId === divisionId) || false;
  };

  useEffect(() => {
    if (selectedUnit) {
      localStorage.setItem('selectedUnit', selectedUnit);
    } else {
      localStorage.removeItem('selectedUnit');
    }
  }, [selectedUnit]);

  const isAuthenticated = !!user && !isLoading;
  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.role === 'manager';
  const isDirector = user?.divisionRole === 'director';

  const setUser = (newUser: User | null) => {
      console.warn("Manually setting user state:", newUser);
      setUserState(newUser);
      if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
      } else {
          localStorage.removeItem('user');
      }
  };

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
        setUser,
        fetchUserNotes,
        addUserNote,
        fetchUserUnits,
        fetchUserDivisions,
        hasAccessToDivision,
        isLoading,
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
