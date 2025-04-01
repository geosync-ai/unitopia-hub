
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unitId?: string;
  unitName?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isManager: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const initialUsers: User[] = [
  { 
    id: '1', 
    email: 'admin@scpng.com', 
    name: 'Admin User', 
    role: 'admin' 
  },
  { 
    id: '2', 
    email: 'manager@finance.scpng.com', 
    name: 'Finance Manager', 
    role: 'manager',
    unitId: 'finance',
    unitName: 'Finance Department'
  },
  { 
    id: '3', 
    email: 'user@hr.scpng.com', 
    name: 'HR Staff', 
    role: 'user',
    unitId: 'hr',
    unitName: 'Human Resources'
  },
  { 
    id: '4', 
    email: 'manager@it.scpng.com', 
    name: 'IT Manager', 
    role: 'manager',
    unitId: 'it',
    unitName: 'IT Department'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check for saved user in localStorage on initialization
    const savedUser = localStorage.getItem('scpng_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  const login = async (email: string, password: string): Promise<void> => {
    // For demo purposes, we'll just validate email format and find the user
    // In a real app, this would verify credentials with a backend
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    const foundUser = initialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('scpng_user', JSON.stringify(foundUser));
    } else {
      throw new Error('User not found');
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('scpng_user');
  };
  
  const value = {
    user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isAuthenticated: !!user,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
