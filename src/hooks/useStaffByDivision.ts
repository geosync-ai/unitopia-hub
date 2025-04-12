import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';
import DivisionStaffMap from '@/utils/divisionStaffMap';
import { useDivisionContext } from './useDivisionContext';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  job_title: string;
  department: string;
  mobile: string;
  business_phone: string;
  office_location: string;
  division_id: string;
}

const useStaffByDivision = (divisionId?: string) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = getSupabaseClient();
  const { userDivisions } = useDivisionContext();

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First try to fetch from the database
        let { data, error } = await supabase
          .from('staff_members')
          .select('*')
          .eq(divisionId ? 'division_id' : '', divisionId || '');
        
        if (error) throw error;

        if (data && data.length > 0) {
          setStaff(data as StaffMember[]);
        } else {
          // Fallback to static data if no results or specified division
          let staffData: StaffMember[];
          
          if (divisionId) {
            staffData = DivisionStaffMap.getStaffByDivision(divisionId);
          } else if (userDivisions && userDivisions.length > 0) {
            // If no division specified but user has divisions, get staff for user's divisions
            // Use the division ID from the first division in userDivisions
            staffData = DivisionStaffMap.getStaffByDivision(userDivisions[0].id);
          } else {
            // Get all staff as a last resort
            staffData = DivisionStaffMap.getAllStaff();
          }
          
          setStaff(staffData);
        }
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fallback to static data on error
        let staffData: StaffMember[];
        
        if (divisionId) {
          staffData = DivisionStaffMap.getStaffByDivision(divisionId);
        } else {
          staffData = DivisionStaffMap.getAllStaff();
        }
        
        setStaff(staffData);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [divisionId, supabase, userDivisions]);

  return { staff, loading, error };
};

export default useStaffByDivision; 