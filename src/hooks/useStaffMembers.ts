import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';
import supabaseConfig from '@/config/supabase';
import { getStaffMembersByDivision, staffMembers as mockStaffMembers } from '@/data/divisions';
import { StaffMember } from '@/data/divisions';

// Helper function to get staff member by email with proper query formatting
export const getStaffMemberByEmail = async (email: string): Promise<StaffMember | null> => {
  if (!email) return null;
  
  try {
    const supabase = getSupabaseClient();
    
    // Use encodeURIComponent properly and select all fields
    const { data, error } = await supabase
      .from(supabaseConfig.tables.staff_members)
      .select('*')
      .eq('email', email) // Using eq rather than direct URL encoding
      .single();
    
    if (error) {
      console.error('Error fetching staff member by email:', error);
      return null;
    }
    
    if (data) {
      return {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        jobTitle: data.job_title,
        department: data.unit || 'N/A', // Database field is 'unit' not 'department'
        mobile: data.mobile || 'N/A',
        businessPhone: data.business_phone || 'N/A',
        officeLocation: data.office_location || 'N/A',
        divisionId: data.division_id
      };
    }
    
    return null;
  } catch (err) {
    console.error('Exception in getStaffMemberByEmail:', err);
    return null;
  }
};

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
      
      // Set headers for the Supabase client
      const customHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      };
      
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
          // Using the exact database schema fields: unit, job_title, mobile, business_phone, office_location, division_id
          console.log('[useStaffMembers] Raw database data sample:', data[0]);
          const formattedData: StaffMember[] = data.map(staff => ({
            id: staff.id.toString(),
            name: staff.name,
            email: staff.email,
            jobTitle: staff.job_title,
            department: staff.unit, // Database field is 'unit' not 'department'
            mobile: staff.mobile || 'N/A',
            businessPhone: staff.business_phone || 'N/A',
            officeLocation: staff.office_location || 'N/A',
            divisionId: staff.division_id
          }));
          console.log('[useStaffMembers] Formatted data sample:', formattedData[0]);
          
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
          // Using the exact database schema fields: unit, job_title, mobile, business_phone, office_location, division_id
          console.log('[useStaffMembers] Raw database data sample (all staff):', data[0]);
          const formattedData: StaffMember[] = data.map(staff => ({
            id: staff.id.toString(),
            name: staff.name,
            email: staff.email,
            jobTitle: staff.job_title,
            department: staff.unit, // Database field is 'unit' not 'department'
            mobile: staff.mobile || 'N/A',
            businessPhone: staff.business_phone || 'N/A',
            officeLocation: staff.office_location || 'N/A',
            divisionId: staff.division_id
          }));
          console.log('[useStaffMembers] Formatted data sample (all staff):', formattedData[0]);
          
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