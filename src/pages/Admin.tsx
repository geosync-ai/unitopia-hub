import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, User, UserRole } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, UserPlus, Save, X, Upload, Bell, Palette, Bot, Settings as SettingsIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  { id: '1', email: 'admin@scpng.com', name: 'Admin User', role: 'admin' as UserRole, unitName: 'IT' },
  { id: '2', email: 'manager@finance.scpng.com', name: 'Finance Manager', role: 'manager' as UserRole, unitId: 'finance', unitName: 'Finance Department' },
  { id: '3', email: 'user@hr.scpng.com', name: 'HR Staff', role: 'user' as UserRole, unitId: 'hr', unitName: 'Human Resources' },
  { id: '4', email: 'manager@it.scpng.com', name: 'IT Manager', role: 'manager' as UserRole, unitId: 'it', unitName: 'IT Department' },
];

// Default themes that can be customized
const defaultThemes = {
  light: {
    primary: '#83002A',
    secondary: '#5C001E',
    accent: '#ff6b6b',
    background: '#f8f9fa',
    text: '#212529',
  },
  dark: {
    primary: '#83002A',
    secondary: '#5C001E',
    accent: '#ff6b6b',
    background: '#1e1e1e',
    text: '#f8f9fa',
  }
};

const aiAssistantTypes = [
  { id: 'document', name: 'Document Assistant', description: 'Helps with document analysis and management' },
  { id: 'chat', name: 'Chat Assistant', description: 'General purpose conversational AI' },
  { id: 'data', name: 'Data Analysis Assistant', description: 'Specialized for analyzing business data' },
  { id: 'kpi', name: 'KPI Assistant', description: 'Focused on tracking and reporting KPIs' },
];

const AdminPage = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User> | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedAIConfig, setSelectedAIConfig] = useState<{unitId: string, aiType: string} | null>(null);
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [themeColors, setThemeColors] = useState(defaultThemes);
  
  // Form instances for different dialogs
  const emailForm = useForm();
  const aiConfigForm = useForm();
  
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
      
      // Generate and show password for new user
      generatePasswordForUser(userWithId);
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser(null);
  };
  
  const generatePasswordForUser = (user: User) => {
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);
    setGeneratedPassword(randomPassword);
    setSelectedUser(user);
    setShowPasswordDialog(true);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  const configureEmailNotifications = (user: User) => {
    setSelectedUser(user);
    setShowEmailDialog(true);
  };
  
  const configureAI = (unitId: string, aiType: string) => {
    setSelectedAIConfig({ unitId, aiType });
    setShowAIConfigDialog(true);
  };
  
  const saveAIConfig = (data: any) => {
    toast.success(`AI configuration saved for ${mockUnits.find(u => u.id === selectedAIConfig?.unitId)?.name}`);
    setShowAIConfigDialog(false);
  };
  
  const applyThemeChanges = () => {
    // In a real implementation, this would update CSS variables or a theme context
    // For now, we'll just show a success toast
    toast.success('Theme updated successfully');
    
    // Here you would update your theme context or CSS variables
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // This is just a placeholder for demonstration
    const root = document.documentElement;
    const theme = themeColors[currentTheme];
    
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.text);
  };

  const saveEmailSettings = (data: any) => {
    toast.success(`Email notification settings updated for ${selectedUser?.name}`);
    setShowEmailDialog(false);
  };
  
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="theme">Theme Customization</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="units">Business Units</TabsTrigger>
        </TabsList>
        
        {/* USER MANAGEMENT TAB */}
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
                                <Button onClick={() => generatePasswordForUser(user)} size="sm" variant="ghost" className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300">
                                  <SettingsIcon size={16} />
                                </Button>
                                <Button onClick={() => configureEmailNotifications(user)} size="sm" variant="ghost" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
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
        </TabsContent>
        
        {/* THEME CUSTOMIZATION TAB */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} />
                <span>Theme Customization</span>
              </CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Theme Mode</h3>
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant={currentTheme === 'light' ? 'default' : 'outline'} 
                          onClick={() => setCurrentTheme('light')}
                          className="w-32"
                        >
                          Light
                        </Button>
                        <Button 
                          variant={currentTheme === 'dark' ? 'default' : 'outline'} 
                          onClick={() => setCurrentTheme('dark')}
                          className="w-32"
                        >
                          Dark
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Primary Color</h3>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={themeColors[currentTheme].primary}
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                primary: e.target.value
                              }
                            })}
                            className="w-10 h-10 rounded overflow-hidden"
                          />
                          <Input 
                            value={themeColors[currentTheme].primary} 
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                primary: e.target.value
                              }
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Used for main actions and highlighting</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Secondary Color</h3>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={themeColors[currentTheme].secondary}
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                secondary: e.target.value
                              }
                            })}
                            className="w-10 h-10 rounded overflow-hidden"
                          />
                          <Input 
                            value={themeColors[currentTheme].secondary} 
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                secondary: e.target.value
                              }
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Used for secondary elements</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Accent Color</h3>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={themeColors[currentTheme].accent}
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                accent: e.target.value
                              }
                            })}
                            className="w-10 h-10 rounded overflow-hidden"
                          />
                          <Input 
                            value={themeColors[currentTheme].accent} 
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                accent: e.target.value
                              }
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Used for accenting UI elements</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Background Color</h3>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={themeColors[currentTheme].background}
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                background: e.target.value
                              }
                            })}
                            className="w-10 h-10 rounded overflow-hidden"
                          />
                          <Input 
                            value={themeColors[currentTheme].background} 
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                background: e.target.value
                              }
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Main background</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Text Color</h3>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={themeColors[currentTheme].text}
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                text: e.target.value
                              }
                            })}
                            className="w-10 h-10 rounded overflow-hidden"
                          />
                          <Input 
                            value={themeColors[currentTheme].text} 
                            onChange={(e) => setThemeColors({
                              ...themeColors,
                              [currentTheme]: {
                                ...themeColors[currentTheme],
                                text: e.target.value
                              }
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Main text color</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md mt-6">
                      <h3 className="text-lg font-medium mb-4">Theme Preview</h3>
                      <div 
                        className="p-4 rounded-lg mb-4" 
                        style={{ 
                          backgroundColor: themeColors[currentTheme].background,
                          color: themeColors[currentTheme].text
                        }}
                      >
                        <h4 className="font-medium mb-2" style={{ color: themeColors[currentTheme].text }}>Preview Content</h4>
                        <p className="text-sm mb-4" style={{ color: themeColors[currentTheme].text }}>This is how your content will look.</p>
                        <div className="flex space-x-2">
                          <button 
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: themeColors[currentTheme].primary }}
                          >
                            Primary Button
                          </button>
                          <button 
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: themeColors[currentTheme].secondary }}
                          >
                            Secondary
                          </button>
                          <button 
                            className="px-3 py-1 rounded text-white"
                            style={{ backgroundColor: themeColors[currentTheme].accent }}
                          >
                            Accent
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setThemeColors(defaultThemes)}
                  >
                    Reset to Default
                  </Button>
                  <Button onClick={applyThemeChanges}>
                    Apply Theme
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI CONFIGURATION TAB */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot size={20} />
                <span>AI Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure AI assistants for each business unit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Global AI Providers</h3>
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
                  <h3 className="text-lg font-medium mb-3">Business Unit AI Configurations</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {mockUnits.map(unit => (
                      <div key={unit.id} className="border rounded-lg p-4 dark:border-gray-700">
                        <h4 className="font-medium text-xl mb-3">{unit.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          {aiAssistantTypes.map(type => (
                            <div key={type.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{type.name}</h5>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                  onClick={() => configureAI(unit.id, type.id)}
                                >
                                  <SettingsIcon size={16} />
                                </Button>
                              </div>
                              <div className="mt-3 flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm">Active</span>
                              </div>
                              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                {unit.id === 'finance' && type.id === 'data' ? 
                                  'Custom model configured with financial analysis focus' : 
                                  'Using default configuration'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Knowledge Base Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Organization Knowledge Base</label>
                      <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Drag and drop files here or click to browse
                        </p>
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">
                          Supports PDF, DOCX, TXT (Max 25MB)
                        </p>
                        <Button size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Files
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-4
