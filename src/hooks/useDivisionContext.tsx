import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';

interface DivisionData {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface DivisionRole {
  divisionId: string;
  role: string;
}

interface DivisionContextType {
  currentDivisionId: string | null;
  setCurrentDivisionId: (id: string) => void;
  userDivisions: DivisionData[];
  userRoles: DivisionRole[];
  loading: boolean;
  error: string | null;
  refreshDivisions: () => Promise<void>;
  userHasRole: (roles: string[], divisionId?: string | null) => boolean;
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined);

export const DivisionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentDivisionId, setCurrentDivisionId] = useState<string | null>(
    localStorage.getItem('current_division_id')
  );
  const [userDivisions, setUserDivisions] = useState<DivisionData[]>([]);
  const [userRoles, setUserRoles] = useState<DivisionRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Save current division to localStorage whenever it changes
  useEffect(() => {
    if (currentDivisionId) {
      localStorage.setItem('current_division_id', currentDivisionId);
    } else {
      localStorage.removeItem('current_division_id');
    }
  }, [currentDivisionId]);

  // Function to fetch user's divisions and roles
  const fetchUserDivisions = async () => {
    if (!isAuthenticated || !user?.email) return;

    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Fetch user's staff record to get their ID
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('id')
        .eq('email', user.email)
        .single();

      if (staffError) throw staffError;
      if (!staffData) throw new Error('Staff record not found');

      const staffId = staffData.id;

      // Fetch user's division memberships with roles
      const { data: membershipData, error: membershipError } = await supabase
        .from('division_memberships')
        .select(`
          division_id,
          role,
          divisions:division_id (
            id,
            name,
            description,
            color
          )
        `)
        .eq('staff_id', staffId);

      if (membershipError) throw membershipError;

      // Format the division data
      const divisions = membershipData.map((membership) => ({
        id: membership.divisions.id,
        name: membership.divisions.name,
        description: membership.divisions.description,
        color: membership.divisions.color,
      }));

      // Format the role data
      const roles = membershipData.map((membership) => ({
        divisionId: membership.division_id,
        role: membership.role,
      }));

      setUserDivisions(divisions);
      setUserRoles(roles);

      // Set first division as current if none is set
      if (!currentDivisionId && divisions.length > 0) {
        setCurrentDivisionId(divisions[0].id);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching user divisions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load divisions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch divisions when user auth state changes
  useEffect(() => {
    fetchUserDivisions();
  }, [isAuthenticated, user?.email]);

  // Function to check if user has any of the specified roles in the division
  const userHasRole = (roles: string[], divisionId?: string | null): boolean => {
    // If no roles specified, return false
    if (!roles || roles.length === 0) return false;

    // If no division specified, use current division
    const targetDivisionId = divisionId || currentDivisionId;
    
    // If we have no target division, return false
    if (!targetDivisionId) return false;

    // Find the user's role in the specified division
    const membership = userRoles.find(r => r.divisionId === targetDivisionId);
    
    // If user is not a member of the division, return false
    if (!membership) return false;

    // Check if user's role is included in the allowed roles
    return roles.includes(membership.role);
  };

  return (
    <DivisionContext.Provider
      value={{
        currentDivisionId,
        setCurrentDivisionId,
        userDivisions,
        userRoles,
        loading,
        error,
        refreshDivisions: fetchUserDivisions,
        userHasRole,
      }}
    >
      {children}
    </DivisionContext.Provider>
  );
};

export const useDivisionContext = (): DivisionContextType => {
  const context = useContext(DivisionContext);
  if (!context) {
    throw new Error('useDivisionContext must be used within a DivisionProvider');
  }
  return context;
};

export default useDivisionContext; 