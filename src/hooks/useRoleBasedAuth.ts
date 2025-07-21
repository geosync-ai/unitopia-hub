import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { supabase, logger } from '@/lib/supabaseClient';

export interface UserRole {
  user_email: string;
  role_name: string;
  role_id: string;
  division_id: string | null;
  division_name: string | null;
  permissions: Record<string, any>;
  is_admin: boolean;
}

interface RoleBasedAuth {
  user: UserRole | null;
  loading: boolean;
  error: string | null;
  hasPermission: (resource: string, action: string) => boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
  checkResourceAccess: (resource: string, actions?: string[]) => boolean;
}

export const useRoleBasedAuth = (): RoleBasedAuth => {
  const { accounts } = useMsal();
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log initialization
  useEffect(() => {
    logger.info('🚀 Role-Based Authentication System Initialized');
  }, []);

  const fetchUserRole = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      logger.info('[useRoleBasedAuth] Fetching user role for email:', { email });

      const { data, error } = await supabase
        .rpc('get_user_role_info', { user_email_input: email });

      if (error) {
        logger.error('[useRoleBasedAuth] Supabase RPC error:', { error });
        
        // Check if it's a missing function error (migration not run)
        if (error.message?.includes('function get_user_role_info') || error.code === '42883') {
          setError('Database role system not set up. Please run the role migration script.');
        } else if (error.code === '42804') {
          setError('Function type mismatch detected. Please run the SQL fix script in your Supabase dashboard.');
        } else {
          setError(`Database error: ${error.message}`);
        }
        return;
      }

      if (data && data.length > 0) {
        const roleData = data[0] as UserRole;
        setUser(roleData);
        
        // 🎯 ENHANCED ROLE LOGGING - This is what you'll see in the console
        logger.success('✅ USER ROLE LOADED SUCCESSFULLY', {
          user_email: roleData.user_email,
          role_name: roleData.role_name,
          role_id: roleData.role_id,
          division_name: roleData.division_name || 'No Division',
          is_admin: roleData.is_admin,
          permissions: roleData.permissions,
          login_timestamp: new Date().toISOString()
        });
        
        // Enhanced console log for immediate visibility
        console.log(`
🔐 ROLE AUTHENTICATION SUCCESS
═══════════════════════════════════════════════════════════════
👤 User: ${roleData.user_email}
🎭 Role: ${roleData.role_name}
🏢 Division: ${roleData.division_name || 'No Division Assigned'}
👑 Admin Status: ${roleData.is_admin ? '✅ YES' : '❌ NO'}
🔑 Permissions: ${JSON.stringify(roleData.permissions, null, 2)}
⏰ Login Time: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
        `);
        
        // Log user login activity with role information
        try {
          await supabase
            .from('user_login_log')
            .insert({
              user_email: email,
              role_info: {
                role_name: roleData.role_name,
                division_name: roleData.division_name,
                is_admin: roleData.is_admin,
                login_timestamp: new Date().toISOString()
              }
            });
        } catch (logError) {
          console.warn('Login activity logging failed (non-critical):', logError);
        }

      } else {
        // User has no role assigned - check if they exist in staff_members
        logger.warn('[useRoleBasedAuth] No role found for user:', { email });
        
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('*')
          .eq('email', email)
          .single();

        if (staffData) {
          // Staff member exists but no role assigned
          setError('Account pending role assignment. Contact your administrator.');
          console.log(`
⚠️  ROLE ASSIGNMENT PENDING
═══════════════════════════════════════════════════════════════
👤 User: ${email}
⚠️  Status: Staff member found but no role assigned
📞 Action: Contact your administrator for role assignment
═══════════════════════════════════════════════════════════════
          `);
        } else {
          // User not found in system
          setError('Account not found in system. Contact your administrator.');
          console.log(`
❌ ACCOUNT NOT FOUND
═══════════════════════════════════════════════════════════════
👤 User: ${email}
❌ Status: Not found in staff system
📞 Action: Contact your administrator to be added to the system
═══════════════════════════════════════════════════════════════
          `);
        }
        setUser(null);
      }
    } catch (err: any) {
      logger.error('[useRoleBasedAuth] Error fetching user role:', err);
      setError(err.message || 'Failed to fetch user role');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) {
      logger.warn('[useRoleBasedAuth] No user found for permission check');
      return false;
    }
    
    // Super admin has all permissions
    if (user.is_admin) {
      logger.info('[useRoleBasedAuth] Admin user - granting all permissions');
      return true;
    }

    // Check specific permissions
    const permissions = user.permissions;
    
    // Check if user has "all" permissions (wildcard)
    if (permissions.all?.includes('*')) {
      return true;
    }

    // Check specific resource permissions
    const hasAccess = permissions[resource]?.includes(action) || 
                     permissions[resource]?.includes('*') ||
                     false;

    logger.info(`[useRoleBasedAuth] Permission check: ${resource}:${action} = ${hasAccess}`, {
      user_role: user.role_name,
      requested_resource: resource,
      requested_action: action,
      has_access: hasAccess,
      user_permissions: permissions
    });
    
    return hasAccess;
  };

  const checkResourceAccess = (resource: string, actions: string[] = ['read']): boolean => {
    return actions.every(action => hasPermission(resource, action));
  };

  const refreshRole = async () => {
    if (accounts[0]?.username) {
      await fetchUserRole(accounts[0].username);
    }
  };

  useEffect(() => {
    if (accounts[0]?.username) {
      logger.info('[useRoleBasedAuth] MSAL accounts detected, fetching role for user:', { username: accounts[0].username });
      fetchUserRole(accounts[0].username);
    } else {
      logger.warn('[useRoleBasedAuth] No MSAL accounts found, skipping role fetch');
      setLoading(false);
      setUser(null);
    }
  }, [accounts]);

  return {
    user,
    loading,
    error,
    hasPermission,
    isAdmin: user?.is_admin || false,
    refreshRole,
    checkResourceAccess
  };
};

export default useRoleBasedAuth; 