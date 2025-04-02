
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash, UserPlus, Save, X, Bell, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { User, UserRole } from '@/hooks/useAuth';

// Mock business units data
const mockUnits = [
  { id: 'finance', name: 'Finance Department' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'it', name: 'IT Department' },
  { id: 'operations', name: 'Operations' },
];

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onGeneratePassword: (user: User) => void;
  onConfigureEmail: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  setUsers,
  onGeneratePassword,
  onConfigureEmail 
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User> | null>(null);

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const saveUserChanges = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
      toast.success('User updated successfully');
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast.success('User deleted successfully');
  };

  const startAddingUser = () => {
    setNewUser({
      email: '',
      name: '',
      role: 'user',
    });
  };

  const saveNewUser = () => {
    if (newUser?.email && newUser.name) {
      const userWithId = {
        ...newUser,
        id: Date.now().toString(),
      } as User;
      
      setUsers([...users, userWithId]);
      setNewUser(null);
      toast.success('User added successfully');
      
      // Generate password for new user
      onGeneratePassword(userWithId);
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Users</span>
          <Button onClick={startAddingUser} size="sm" className="flex items-center gap-1">
            <UserPlus size={16} />
            <span>Add User</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {newUser && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-3">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@domain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Unit</label>
                <select 
                  value={newUser.unitId || ''} 
                  onChange={e => {
                    const unitId = e.target.value || undefined;
                    const unitName = unitId ? mockUnits.find(u => u.id === unitId)?.name : undefined;
                    setNewUser({...newUser, unitId, unitName});
                  }}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">None (Admin only)</option>
                  {mockUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-1">
                <X size={16} />
                <span>Cancel</span>
              </Button>
              <Button onClick={saveNewUser} className="flex items-center gap-1">
                <Save size={16} />
                <span>Save</span>
              </Button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id}>
                  {editingUser && editingUser.id === user.id ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input 
                          value={editingUser.name} 
                          onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input 
                          value={editingUser.email} 
                          onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select 
                          value={editingUser.role} 
                          onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select 
                          value={editingUser.unitId || ''} 
                          onChange={e => {
                            const unitId = e.target.value || undefined;
                            const unitName = unitId ? mockUnits.find(u => u.id === unitId)?.name : undefined;
                            setEditingUser({...editingUser, unitId, unitName});
                          }}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="">None (Admin only)</option>
                          {mockUnits.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button onClick={saveUserChanges} size="sm" variant="ghost" className="text-green-600 dark:text-green-400 mr-2">
                          <Save size={16} />
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="ghost" className="text-gray-600 dark:text-gray-400">
                          <X size={16} />
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.unitName || (user.unitId ? mockUnits.find(u => u.id === user.unitId)?.name || 'Unknown' : '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button onClick={() => handleEditUser(user)} size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <Pencil size={16} />
                          </Button>
                          <Button onClick={() => onGeneratePassword(user)} size="sm" variant="ghost" className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300">
                            <SettingsIcon size={16} />
                          </Button>
                          <Button onClick={() => onConfigureEmail(user)} size="sm" variant="ghost" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Bell size={16} />
                          </Button>
                          <Button onClick={() => deleteUser(user.id)} size="sm" variant="ghost" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
