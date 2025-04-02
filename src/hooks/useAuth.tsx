
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  businessUnits: {id: string, name: string}[];
  selectedUnit: string | null;
  setSelectedUnit: (unitId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock admin user
const adminUser: User = {
  id: '1',
  email: 'admin@scpng.com',
  name: 'Admin User',
  role: 'admin'
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
  const [user, setUser] = useState<User | null>(adminUser); // Auto logged in for demo
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  // Simulating persistent auth
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would validate credentials against a backend
    if (email && password) {
      const loggedInUser = adminUser;
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return Promise.resolve();
    }
    return Promise.reject(new Error('Invalid credentials'));
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
    logout,
    businessUnits: mockBusinessUnits,
    selectedUnit,
    setSelectedUnit
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
