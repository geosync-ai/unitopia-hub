import { useState, useEffect } from 'react';
import { DivisionStaffMap } from '@/utils/divisionStaffMap';
import { StaffMember } from './useDivisionStaff';

interface UseStaffByDivisionOptions {
  divisionId?: string;
  searchQuery?: string;
  includeAllDivisions?: boolean;
}

export function useStaffByDivision(options: UseStaffByDivisionOptions = {}) {
  const { divisionId, searchQuery, includeAllDivisions = false } = options;
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      let staff: StaffMember[] = [];
      
      // Get staff based on divisionId or all staff
      if (divisionId) {
        staff = DivisionStaffMap.getStaffByDivision(divisionId);
      } else if (includeAllDivisions) {
        staff = DivisionStaffMap.getAllStaff();
      }
      
      // Apply search filtering if a query is provided
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        staff = staff.filter(
          member => 
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query) ||
            member.job_title.toLowerCase().includes(query) ||
            member.department.toLowerCase().includes(query)
        );
      }
      
      setStaffMembers(staff);
    } catch (err) {
      setError('Failed to fetch staff members');
      console.error('Error fetching staff members:', err);
    } finally {
      setLoading(false);
    }
  }, [divisionId, searchQuery, includeAllDivisions]);

  return {
    staffMembers,
    loading,
    error,
    isEmpty: staffMembers.length === 0 && !loading
  };
}

export default useStaffByDivision; 