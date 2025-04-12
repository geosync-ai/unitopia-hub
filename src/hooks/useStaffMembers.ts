import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';
import supabaseConfig from '@/config/supabase';
import { getStaffMembersByDivision, staffMembers as mockStaffMembers } from '@/data/divisions';
import { StaffMember } from '@/data/divisions';

interface UseStaffMembersReturn {
  staffMembers: StaffMember[];
  loading: boolean;
  error: string | null;
  refreshStaffMembers: () => Promise<void>;
}

export function useStaffMembers(divisionId?: string): UseStaffMembersReturn {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      if (divisionId) {
        // Fetch staff for a specific division
        const { data, error } = await supabase
          .from(supabaseConfig.tables.staff_members)
          .select('*')
          .eq('division_id', divisionId);
          
        if (error) {
          console.error('Error fetching staff members:', error);
          // Fall back to mock data
          setStaffMembers(getStaffMembersByDivision(divisionId));
          return;
        }
        
        if (data && data.length > 0) {
          // Map the data to match our StaffMember interface
          const formattedData: StaffMember[] = data.map(staff => ({
            id: staff.id.toString(),
            name: staff.name,
            email: staff.email,
            jobTitle: staff.job_title,
            department: staff.department,
            mobile: staff.mobile,
            businessPhone: staff.business_phone,
            officeLocation: staff.office_location,
            divisionId: staff.division_id
          }));
          
          setStaffMembers(formattedData);
        } else {
          // Fall back to mock data if no results
          setStaffMembers(getStaffMembersByDivision(divisionId));
        }
      } else {
        // Fetch all staff members
        const { data, error } = await supabase
          .from(supabaseConfig.tables.staff_members)
          .select('*');
          
        if (error) {
          console.error('Error fetching all staff members:', error);
          // Fall back to mock data
          setStaffMembers(mockStaffMembers);
          return;
        }
        
        if (data && data.length > 0) {
          // Map the data to match our StaffMember interface
          const formattedData: StaffMember[] = data.map(staff => ({
            id: staff.id.toString(),
            name: staff.name,
            email: staff.email,
            jobTitle: staff.job_title,
            department: staff.department,
            mobile: staff.mobile,
            businessPhone: staff.business_phone,
            officeLocation: staff.office_location,
            divisionId: staff.division_id
          }));
          
          setStaffMembers(formattedData);
        } else {
          // Fall back to mock data if no results
          setStaffMembers(mockStaffMembers);
        }
      }
    } catch (err) {
      console.error('Exception in fetchStaffMembers:', err);
      setError('Failed to load staff members');
      
      // Fall back to mock data
      if (divisionId) {
        setStaffMembers(getStaffMembersByDivision(divisionId));
      } else {
        setStaffMembers(mockStaffMembers);
      }
    } finally {
      setLoading(false);
    }
  }, [divisionId]);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  return {
    staffMembers,
    loading,
    error,
    refreshStaffMembers: fetchStaffMembers
  };
} 