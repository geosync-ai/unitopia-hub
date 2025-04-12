import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';
import { useDivisionContext } from './useDivisionContext';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  job_title: string;
  department: string;
  division_id: string;
  mobile?: string;
  business_phone?: string;
  office_location?: string;
}

export const useStaffByDivision = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentDivisionId } = useDivisionContext();

  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!currentDivisionId) return;

      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('staff_members')
          .select('*')
          .eq('division_id', currentDivisionId);

        if (error) throw error;

        setStaffMembers(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching staff members:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStaffMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffMembers();
  }, [currentDivisionId]);

  return {
    staffMembers,
    loading,
    error
  };
};

export default useStaffByDivision; 