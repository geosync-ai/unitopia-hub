import React, { useState, useEffect } from 'react';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { supabase, logger } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Users, Settings, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
}

interface Division {
  id: string;
  name: string;
}

interface UserRole {
  id: string;
  user_email: string;
  role_id: string;
  role_name: string;
  division_id: string | null;
  division_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
  division_id: string | null;
}

const RoleManagement: React.FC = () => {
  const { hasPermission, user: currentUser } = useRoleBasedAuth();
  const { toast } = useToast();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Check if user can manage roles
  const canManageRoles = hasPermission('users', 'manage_roles') || hasPermission('admin', 'all');

  if (!canManageRoles) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Access denied. You don't have permission to manage user roles.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Fetch divisions
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select('id, name')
        .order('name');

      if (divisionsError) throw divisionsError;

      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('id, name, email, job_title, division_id')
        .order('name');

      if (staffError) throw staffError;

      // Fetch current user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_email,
          role_id,
          division_id,
          is_active,
          created_at,
          roles (
            name
          ),
          divisions (
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (userRolesError) throw userRolesError;

      setRoles(rolesData || []);
      setDivisions(divisionsData || []);
      setStaffMembers(staffData || []);
      setUserRoles(userRolesData?.map(ur => ({
        id: ur.id,
        user_email: ur.user_email,
        role_id: ur.role_id,
        role_name: ur.roles?.name || 'Unknown',
        division_id: ur.division_id,
        division_name: ur.divisions?.name || null,
        is_active: ur.is_active,
        created_at: ur.created_at
      })) || []);

      logger.success('[RoleManagement] Data fetched successfully');
    } catch (error: any) {
      logger.error('[RoleManagement] Error fetching data:', { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load role management data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select both user and role"
      });
      return;
    }

    try {
      setAssignLoading(true);

      // Check if user already has a role
      const existingRole = userRoles.find(ur => ur.user_email === selectedUser);
      
      if (existingRole) {
        toast({
          variant: "destructive",
          title: "User Already Has Role",
          description: "Remove existing role before assigning a new one"
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_email: selectedUser,
          role_id: selectedRole,
          division_id: selectedDivision || null,
          is_active: true
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully"
      });

      // Reset form
      setSelectedUser('');
      setSelectedRole('');
      setSelectedDivision('');

      // Refresh data
      await fetchData();

      logger.success('[RoleManagement] Role assigned successfully:', data);
    } catch (error: any) {
      logger.error('[RoleManagement] Error assigning role:', { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign role"
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role removed for ${userEmail}`
      });

      await fetchData();
    } catch (error: any) {
      logger.error('[RoleManagement] Error removing role:', { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove role"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStaff = staffMembers.filter(staff =>
    searchEmail === '' || staff.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading role management data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Assign and manage user roles and permissions
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Assign Role Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Assign Role to User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-search">Search User Email</Label>
              <Input
                id="user-search"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.email}>
                      {staff.name} ({staff.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="division-select">Division (Optional)</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Division</SelectItem>
                  {divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleAssignRole} 
            disabled={assignLoading || !selectedUser || !selectedRole}
            className="w-full md:w-auto"
          >
            {assignLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Role
          </Button>
        </CardContent>
      </Card>

      {/* Current User Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Current User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No user roles assigned
                  </TableCell>
                </TableRow>
              ) : (
                userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell>{userRole.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{userRole.role_name}</Badge>
                    </TableCell>
                    <TableCell>{userRole.division_name || 'No Division'}</TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveRole(userRole.id, userRole.user_email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Available Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Available Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{role.name}</h3>
                    <Badge variant="outline">{role.id.substring(0, 8)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                  <div className="text-xs">
                    <strong>Permissions:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(role.permissions || {}).map(([resource, actions]) => (
                        <Badge key={resource} variant="outline" className="text-xs">
                          {resource}: {Array.isArray(actions) ? actions.join(', ') : actions}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement; 