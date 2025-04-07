import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/integrations/microsoft/msalConfig';
import { login as msalLogin, getAccount, getUserProfile } from '@/integrations/microsoft/msalService';
import microsoftAuthConfig from '@/config/microsoft-auth';

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
  email: 'admin@scpng.com',
  name: 'Admin User',
  role: 'admin' as UserRole,
  unitName: 'IT'
};

// List of emails that should receive admin role when authenticating
const adminEmails = [
  'geosyncsurvey@gmail.com',
  'admin@scpng.com'
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

    // Check if user is already logged in with Supabase
    const checkExistingSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        const supabaseUser = sessionData.session.user;
        
        // Determine role based on email
        const isAdminUser = adminEmails.includes(supabaseUser.email?.toLowerCase() || '');
        
        // Create user object
        const userObj: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: isAdminUser ? 'admin' : 'user',
          unitName: isAdminUser ? 'Administration' : undefined
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
      } else {
        // Check localStorage as fallback for default admin
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    };
    
    checkExistingSession();
  }, []);

  const login = async (email: string, password: string) => {
    // Special case for the default admin (demo only)
    if (email.toLowerCase() === 'admin@scpng.com' && password === 'admin') {
      setUser(defaultAdmin);
      localStorage.setItem('user', JSON.stringify(defaultAdmin));
      return Promise.resolve();
    }
    
    try {
      // Attempt to authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Determine role based on email
        const isAdminUser = adminEmails.includes(data.user.email?.toLowerCase() || '');
        
        // Create user object
        const userObj: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0] || 'User',
          role: isAdminUser ? 'admin' : 'user',
          unitName: isAdminUser ? 'Administration' : undefined
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Login error:', error);
      return Promise.reject(new Error('Invalid credentials'));
    }
  };

  const loginWithMicrosoft = async () => {
    // Debug msGraphConfig and msalInitialized status
    console.log('Microsoft authentication status:', { 
      msGraphConfig: !!msGraphConfig, 
      msGraphConfigDetails: msGraphConfig,
      msalInitialized, 
      windowMsalInstance: !!(window as any).msalInstance 
    });
    
    if (!msGraphConfig || !msalInitialized) {
      console.error('Microsoft authentication is not configured.');
      toast.error("Microsoft authentication is not configured. Please contact an administrator.");
      return Promise.reject(new Error('Microsoft authentication not configured'));
    }
    
    console.log('Attempting Microsoft login with config:', msGraphConfig);
    
    try {
      // Get the MSAL instance
      // We'll use a workaround here since we can't use useMsal() directly
      // In a real implementation, this would be better organized
      const msalInstance = (window as any).msalInstance;
      
      if (!msalInstance) {
        throw new Error('MSAL instance not found');
      }
      
      // Check if we already have an account
      const existingAccount = getAccount(msalInstance);
      if (existingAccount) {
        console.log('User already logged in, getting profile');
        
        // Get user profile from MS Graph API
        const userProfile = await getUserProfile(msalInstance, msGraphConfig.apiEndpoint);
        
        console.log('User profile from MS Graph:', userProfile);
        
        // Create user object
        const userObj: User = {
          id: existingAccount.localAccountId,
          email: existingAccount.username,
          name: userProfile.displayName || existingAccount.name || existingAccount.username.split('@')[0],
          role: adminEmails.includes(existingAccount.username.toLowerCase()) ? 'admin' : 'user',
          accessToken: 'ms-token', // We don't store the actual token for security
          profilePicture: userProfile.photo || undefined
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return Promise.resolve();
      }
      
      // Attempt login with Microsoft
      await msalLogin(msalInstance, msGraphConfig.permissions);
      
      // Note: The rest of this function will only execute if we're using popup flow
      // For redirect flow, the page will reload and the useEffect in the Login component
      // will handle the redirect after detecting the stored user
      
      // Get account info
      const account = getAccount(msalInstance);
      
      if (!account) {
        throw new Error('Failed to get account information after login');
      }
      
      // Get user profile from MS Graph API
      const userProfile = await getUserProfile(msalInstance, msGraphConfig.apiEndpoint);
      
      console.log('User profile from MS Graph:', userProfile);
      
      // Create user object
      const userObj: User = {
        id: account.localAccountId,
        email: account.username,
        name: userProfile.displayName || account.name || account.username.split('@')[0],
        role: adminEmails.includes(account.username.toLowerCase()) ? 'admin' : 'user',
        accessToken: 'ms-token', // We don't store the actual token for security
        profilePicture: userProfile.photo || undefined
      };
      
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Failed to login with Microsoft: ' + (error instanceof Error ? error.message : String(error)));
      return Promise.reject(error);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Sign out from Microsoft if we're using Microsoft auth
      if (user?.accessToken?.includes('ms-token')) {
        const msalInstance = (window as any).msalInstance;
        if (msalInstance) {
          try {
            await msalInstance.logoutRedirect({
              postLogoutRedirectUri: window.location.origin
            });
          } catch (msLogoutError) {
            console.error('Error logging out from Microsoft:', msLogoutError);
          }
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state regardless of any errors
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const authValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    login,
    loginWithMicrosoft,
    logout,
    businessUnits: mockBusinessUnits,
    selectedUnit,
    setSelectedUnit,
    msGraphConfig,
    setUser
  };

  return (
    <AuthContext.Provider value={authValue}>
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
