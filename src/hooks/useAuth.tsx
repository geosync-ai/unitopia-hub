
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
  unitName?: string;
  accessToken?: string; // For Microsoft Graph API
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
}

interface MsGraphConfig {
  clientId: string;
  authorityUrl: string;
  redirectUri: string;
  permissions: string[];
  apiEndpoint: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock admin user
const adminUser: User = {
  id: '1',
  email: 'admin@scpng.com',
  name: 'Admin User',
  role: 'admin',
  unitName: 'IT'
};

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
  { id: 'chairman', name: 'Chairman' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [msGraphConfig, setMsGraphConfig] = useState<MsGraphConfig | null>(null);
  
  // Load saved config and user on mount
  useEffect(() => {
    // Load Microsoft Graph API configuration
    const savedMsConfig = localStorage.getItem('ms-api-config');
    if (savedMsConfig) {
      setMsGraphConfig(JSON.parse(savedMsConfig));
    }

    // Load user if saved in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Fallback login for demo purposes
    if (email && password) {
      const loggedInUser = adminUser;
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return Promise.resolve();
    }
    return Promise.reject(new Error('Invalid credentials'));
  };

  const loginWithMicrosoft = async () => {
    // In a real implementation, this would use MSAL.js to authenticate with Microsoft
    // For now, we'll simulate a successful auth for demo purposes
    
    if (!msGraphConfig) {
      toast.error("Microsoft authentication is not configured. Please contact an administrator.");
      return Promise.reject(new Error('Microsoft authentication not configured'));
    }
    
    try {
      // Simulate Microsoft authentication
      // In a real implementation, this would redirect to Microsoft login
      // and handle the authentication flow
      
      // For demo, we'll just simulate a successful authentication
      const mockMsUser: User = {
        id: 'ms-user-123',
        email: 'user@scpng.gov.pg',
        name: 'Microsoft User',
        role: 'user',
        accessToken: 'mock-access-token-' + Date.now()
      };
      
      setUser(mockMsUser);
      localStorage.setItem('user', JSON.stringify(mockMsUser));
      return Promise.resolve();
    } catch (error) {
      console.error('Microsoft login error:', error);
      return Promise.reject(error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
    msGraphConfig
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
