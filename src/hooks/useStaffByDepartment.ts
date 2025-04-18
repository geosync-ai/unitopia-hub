import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient'; // Import Supabase client
import { useAuth } from './useAuth';
import { StaffMember } from '@/types/staff';

// Helper function to convert snake_case to camelCase (add this if not available globally)
// Assuming it's not exported from unitService.ts
const snakeToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelCase);
  }
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const camelKey = key.replace(/(_\w)/g, k => k[1].toUpperCase());
      // Recursively convert nested objects if needed (unlikely for staff_members)
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        value = snakeToCamelCase(value);
      }
      return [camelKey, value];
    })
  );
};

export function useStaffByDepartment() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserDepartment, setCurrentUserDepartment] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStaff = async () => {
      const userEmail = user?.email?.toLowerCase(); // Use lowercase email for comparison
      console.log('[useStaffByDepartment] Hook running for user:', userEmail);

      if (!userEmail) {
        console.log('[useStaffByDepartment] No user email, resetting state.');
        setStaffMembers([]);
        setLoading(false);
        setCurrentUserDepartment(null);
        return;
      }

      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();

      try {
        console.log('[useStaffByDepartment] Fetching staff from Supabase...');
        // Fetch all staff members from Supabase
        const { data: allStaffData, error: fetchError } = await supabase
          .from('staff_members')
          .select('*');

        if (fetchError) {
          console.error('[useStaffByDepartment] Error fetching staff members:', fetchError);
          throw new Error('Failed to load staff members');
        }
        
        if (!allStaffData) {
            console.warn('[useStaffByDepartment] No staff data returned from Supabase.');
            setStaffMembers([]);
            setCurrentUserDepartment(null);
            setLoading(false);
            return;
        }
        
        console.log(`[useStaffByDepartment] Fetched ${allStaffData.length} raw staff records.`);

        // Convert fetched data to camelCase
        const allStaffCamelCase = snakeToCamelCase(allStaffData) as StaffMember[];
        console.log('[useStaffByDepartment] Converted staff data to camelCase:', allStaffCamelCase);

        // Find the current user's staff record and department (case-insensitive email match)
        const currentStaff = allStaffCamelCase.find(staff => staff.email?.toLowerCase() === userEmail);
        console.log('[useStaffByDepartment] Found current staff record:', currentStaff);

        const userDepartment = currentStaff?.department || null;
        setCurrentUserDepartment(userDepartment);
        console.log('[useStaffByDepartment] Determined user department:', userDepartment);

        if (!userDepartment) {
          console.warn(`[useStaffByDepartment] Could not determine department for user: ${userEmail}. Setting empty staff list.`);
          setStaffMembers([]); 
        } else {
          // Filter staff to only include those in the same department (case-insensitive comparison)
          const departmentStaff = allStaffCamelCase.filter(
            staff => staff.department?.toLowerCase() === userDepartment.toLowerCase()
          );
          console.log(`[useStaffByDepartment] Filtered staff for department "${userDepartment}":`, departmentStaff);
          setStaffMembers(departmentStaff);
        }

      } catch (err) {
        console.error('[useStaffByDepartment] Error in fetchStaff:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStaffMembers([]);
        setCurrentUserDepartment(null);
      } finally {
        setLoading(false);
        console.log('[useStaffByDepartment] Fetch finished.');
      }
    };

    fetchStaff();
  }, [user?.email]); // Dependency remains user?.email

  return {
    staffMembers,
    loading,
    error,
    currentUserDepartment, // Return the determined department
    isEmpty: staffMembers.length === 0 && !loading
  };
}

export default useStaffByDepartment; 