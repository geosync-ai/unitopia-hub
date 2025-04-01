
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, User, UserRole } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, UserPlus, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const apiProviders = [
  { id: 'openai', name: 'OpenAI', enabled: true },
  { id: 'claude', name: 'Claude', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', enabled: false },
  { id: 'qwen', name: 'Qwen', enabled: false },
  { id: 'groq', name: 'Groq Cloud', enabled: false },
  { id: 'openroute', name: 'OpenRoute', enabled: false },
];

const mockUnits = [
  { id: 'finance', name: 'Finance Department' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'it', name: 'IT Department' },
  { id: 'operations', name: 'Operations' },
];

const mockUsers = [
  { id: '1', email: 'admin@scpng.com', name: 'Admin User', role: 'admin' as UserRole },
  { id: '2', email: 'manager@finance.scpng.com', name: 'Finance Manager', role: 'manager' as UserRole, unitId: 'finance' },
  { id: '3', email: 'user@hr.scpng.com', name: 'HR Staff', role: 'user' as UserRole, unitId: 'hr' },
  { id: '4', email: 'manager@it.scpng.com', name: 'IT Manager', role: 'manager' as UserRole, unitId: 'it' },
];

const AdminPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User> | null>(null);
  
  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" />;
  }

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
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser(null);
  };

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="units">Business Units</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
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
                        onChange={e => setNewUser({...newUser, unitId: e.target.value || undefined})}
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
                                onChange={e => setEditingUser({...editingUser, unitId: e.target.value || undefined})}
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
                              {user.unitId ? mockUnits.find(u => u.id === user.unitId)?.name || 'Unknown' : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button onClick={() => handleEditUser(user)} size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2">
                                <Pencil size={16} />
                              </Button>
                              <Button onClick={() => deleteUser(user.id)} size="sm" variant="ghost" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                <Trash size={16} />
                              </Button>
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
        </TabsContent>
        
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI providers and customize responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">AI Providers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apiProviders.map(provider => (
                      <div key={provider.id} className="border rounded-lg p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{provider.name}</h4>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              id={`toggle-${provider.id}`} 
                              checked={provider.enabled}
                              className="sr-only"
                            />
                            <label
                              htmlFor={`toggle-${provider.id}`}
                              className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${provider.enabled ? 'bg-intranet-primary' : ''}`}
                            >
                              <span
                                className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${provider.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                              ></span>
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">API Key</label>
                          <Input type="password" placeholder="Enter API key" disabled={!provider.enabled} />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Model</label>
                          <select className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!provider.enabled}>
                            <option>Default model</option>
                            <option>Advanced model</option>
                            <option>Economy model</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Knowledge Base Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Organization Knowledge Base</label>
                      <textarea
                        rows={4}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter organization-wide knowledge base context"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">AI Response Template</label>
                      <textarea
                        rows={4}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter template for AI responses"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Business Units</CardTitle>
              <CardDescription>
                Manage business units and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUnits.map(unit => (
                    <div key={unit.id} className="border rounded-lg p-4 dark:border-gray-700">
                      <h3 className="font-medium text-lg mb-3">{unit.name}</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Email Domain</label>
                          <Input value={`${unit.id}.scpng.com`} />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unit-Specific Knowledge</label>
                          <textarea
                            rows={2}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Custom knowledge for this unit"
                          ></textarea>
                        </div>
                        <div className="pt-2">
                          <Button size="sm" variant="outline" className="mr-2">Edit</Button>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border rounded-lg p-4 border-dashed flex items-center justify-center dark:border-gray-700">
                    <Button variant="outline" className="h-24 w-full">
                      <span className="flex flex-col items-center">
                        <UserPlus className="mb-2" />
                        Add New Business Unit
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default AdminPage;
