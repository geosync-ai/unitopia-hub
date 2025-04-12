import { useState, useEffect } from 'react';
import { DivisionStaffMap } from '@/utils/divisionStaffMap';
import { useAuth } from './useAuth';

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

export function useStaffByDepartment() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user?.email) {
        setStaffMembers([]);
        return;
      }

      // Find the current user's staff member record
      const currentStaff = DivisionStaffMap.getStaffByEmail(user.email);
      
      if (!currentStaff) {
        setStaffMembers([]);
        return;
      }

      // Get all staff members
      const allStaff = DivisionStaffMap.getAllStaff();
      
      // Filter staff to only include those in the same department/unit
      const departmentStaff = allStaff.filter(
        staff => staff.department === currentStaff.department
      );
      
      setStaffMembers(departmentStaff);
    } catch (err) {
      console.error('Error getting staff by department:', err);
      setError('Failed to load staff members');
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  return {
    staffMembers,
    loading,
    error,
    currentUserDepartment: staffMembers.length > 0 && user?.email 
      ? DivisionStaffMap.getStaffByEmail(user.email)?.department 
      : null
  };
}

export default useStaffByDepartment; 