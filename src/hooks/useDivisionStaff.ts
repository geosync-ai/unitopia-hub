import { useState, useEffect } from 'react';
import { useDivisionContext } from './useDivisionContext';
import { useAuth } from './useAuth';
import DivisionStaffMap from '../utils/divisionStaffMap';

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

export function useDivisionStaff() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentDivisionId } = useDivisionContext();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    
    // Get staff members for the current user's division
    if (currentDivisionId) {
      const staff = DivisionStaffMap.getStaffByDivision(currentDivisionId);
      setStaffMembers(staff);
    } else if (user?.email) {
      // If no division is selected, try to get staff based on the user's email
      const staff = DivisionStaffMap.getStaffForUserDivision(user.email);
      setStaffMembers(staff);
    } else {
      // Fallback to all staff if no context is available
      setStaffMembers(DivisionStaffMap.getAllStaff());
    }
    
    setLoading(false);
  }, [currentDivisionId, user?.email]);

  return {
    staffMembers,
    loading
  };
}

export default useDivisionStaff; 