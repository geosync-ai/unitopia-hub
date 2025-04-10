import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BarChart2, Target, Clock, Flag, 
  CheckCircle, AlertTriangle, Briefcase, Settings, Cloud
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line
} from 'recharts';
import { SetupWizard } from '@/components/setup-wizard/SetupWizard';
import { SetupWizardState as FullSetupWizardState } from '@/hooks/useSetupWizard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Risk {
  id: string;
  title: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface KRA {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface OverviewTabSetupProps {
  showSetupWizard: boolean;
  setShowSetupWizard: (show: boolean) => void;
}

interface OverviewTabProps {
  projects: Project[];
  tasks: Task[];
  risks: Risk[];
  kras: KRA[];
  setupState: FullSetupWizardState;
}

// Add a new component for the OneDrive switch dialog
const SwitchToOneDriveDialog = ({ isOpen, onClose, onSwitch }) => {
  const [folderName, setFolderName] = useState('Unit Dashboard');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSwitch(folderName);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch to OneDrive Storage</DialogTitle>
          <DialogDescription>
            Create a new OneDrive folder to store your data in. This will move your data from local storage to OneDrive.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="col-span-4">
                Folder Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="col-span-4"
                required
                minLength={3}
                maxLength={64}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Cloud className="mr-2 h-4 w-4" />
              Create Folder & Switch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  projects, 
  tasks, 
  risks, 
  kras, 
  setupState 
}) => {
  const [selectedInsight, setSelectedInsight] = useState('overview');
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const reviewTasks = tasks.filter(task => task.status === 'review').length;

  const activeProjects = projects.filter(project => project.status === 'in-progress').length;
  const completedProjects = projects.filter(project => project.status === 'completed').length;
  const plannedProjects = projects.filter(project => project.status === 'planned').length;
  const onHoldProjects = projects.filter(project => project.status === 'on-hold').length;

  const activeRisks = risks.filter(risk => 
    ['identified', 'analyzing', 'mitigating', 'monitoring'].includes(risk.status)
  ).length;

  // Sample chart data
  const taskStatusData = [
    { name: 'To Do', value: todoTasks, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks, color: '#fbbf24' },
    { name: 'Review', value: reviewTasks, color: '#f59e0b' },
    { name: 'Done', value: completedTasks, color: '#34d399' }
  ];

  const projectStatusData = [
    { name: 'Planned', value: plannedProjects, color: '#3b82f6' },
    { name: 'In Progress', value: activeProjects, color: '#fbbf24' },
    { name: 'Completed', value: completedProjects, color: '#34d399' },
    { name: 'On Hold', value: onHoldProjects, color: '#ef4444' }
  ];

  // Monthly task completion sample data
  const monthlyCompletionData = [
    { name: 'Jan', completed: 5, added: 8 },
    { name: 'Feb', completed: 7, added: 6 },
    { name: 'Mar', completed: 10, added: 12 },
    { name: 'Apr', completed: 8, added: 5 },
    { name: 'May', completed: 12, added: 9 },
    { name: 'Jun', completed: 15, added: 10 }
  ];

  // Check if we're using local storage mode
  const isLocalStorage = localStorage.getItem('unitopia_storage_type') === 'local' || 
    (setupState.csvConfig?.fileIds && Object.values(setupState.csvConfig?.fileIds).some(id => 
      typeof id === 'string' && String(id).startsWith('local-')
    ));
  
  // Handler for initiating the switch to OneDrive
  const handleCreateOneDriveFolder = async (folderName) => {
    try {
      // Check if we have the Microsoft Graph hook available
      if (!window.msalInstance) {
        toast.error('Microsoft authentication is not available');
        return;
      }
      
      // Create a folder in OneDrive
      toast.info('Creating OneDrive folder...');
      
      // Get a token
      const accounts = window.msalInstance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        toast.error('No Microsoft account found. Please sign in first.');
        return;
      }
      
      const response = await window.msalInstance.acquireTokenSilent({
        scopes: ['Files.ReadWrite.All'],
        account: accounts[0]
      });
      
      // Create the folder directly using fetch
      const result = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      });
      
      if (!result.ok) {
        const errorText = await result.text();
        toast.error(`Failed to create folder: ${result.status} ${result.statusText}`);
        console.error('Error creating folder:', errorText);
        return;
      }
      
      const folderData = await result.json();
      
      // Switch to OneDrive mode
      const switchResult = await setupState.switchToOneDrive({
        folderId: folderData.id,
        folderName: folderData.name
      });
      
      if (switchResult) {
        toast.success(`Switched to OneDrive folder: ${folderData.name}`);
      }
    } catch (error) {
      console.error('Error switching to OneDrive:', error);
      toast.error(`Failed to switch to OneDrive: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup File Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setupState.setShowSetupWizard(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Setup File
        </Button>
      </div>

      {/* Setup Wizard Modal */}
      <SetupWizard
        isOpen={setupState.showSetupWizard}
        onClose={() => setupState.setShowSetupWizard(false)}
        onComplete={() => {
          setupState.setShowSetupWizard(false);
          // Here you would typically refresh the data or update the UI
        }}
        setSetupMethod={setupState.setSetupMethod}
        setOneDriveConfig={setupState.setOneDriveConfig}
        setObjectives={setupState.setObjectives}
        handleSetupCompleteFromHook={setupState.handleSetupComplete}
        updateExcelConfig={setupState.updateExcelConfig}
        excelConfig={setupState.excelConfig}
        oneDriveConfig={setupState.oneDriveConfig}
        setupMethodProp={setupState.setupMethod}
        objectivesProp={setupState.objectives}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed, {inProgressTasks} in progress
            </p>
            <Progress className="h-2 mt-2" value={(completedTasks / tasks.length) * 100 || 0} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active, {completedProjects} completed
            </p>
            <Progress className="h-2 mt-2" value={(completedProjects / projects.length) * 100 || 0} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRisks}</div>
            <p className="text-xs text-muted-foreground">
              {risks.length - activeRisks} resolved
            </p>
            <Progress 
              className="h-2 mt-2" 
              value={((risks.length - activeRisks) / risks.length) * 100 || 0} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KRA Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kras.reduce((acc, kra) => acc + kra.progress, 0) / kras.length || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {kras.filter(kra => kra.status === 'closed').length} completed
            </p>
            <Progress 
              className="h-2 mt-2" 
              value={kras.reduce((acc, kra) => acc + kra.progress, 0) / kras.length || 0} 
            />
          </CardContent>
        </Card>

        {/* Add storage information card with storage type and switch button */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Storage Type</p>
                <p className="text-xl font-bold flex items-center">
                  {isLocalStorage ? (
                    <>
                      <span className="text-amber-500">Local Storage</span>
                      <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-blue-500">OneDrive</span>
                      <Cloud className="ml-2 h-4 w-4 text-blue-500" />
                    </>
                  )}
                </p>
              </div>
              
              {isLocalStorage && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSwitchDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Cloud className="h-4 w-4" />
                  <span>Switch to OneDrive</span>
                </Button>
              )}
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                {isLocalStorage 
                  ? "Your data is currently stored in your browser's local storage. This data will be lost if you clear your browser data."
                  : "Your data is stored in Microsoft OneDrive and will be preserved even if you clear your browser data."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Overview of tasks by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Overview of projects by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Projects">
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Task Trends</CardTitle>
          <CardDescription>Tasks completed vs. new tasks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#34d399" 
                  activeDot={{ r: 8 }} 
                  name="Completed Tasks"
                />
                <Line 
                  type="monotone" 
                  dataKey="added" 
                  stroke="#3b82f6" 
                  name="New Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Add the dialog component */}
      <SwitchToOneDriveDialog 
        isOpen={showSwitchDialog}
        onClose={() => setShowSwitchDialog(false)}
        onSwitch={handleCreateOneDriveFolder}
      />
    </div>
  );
}; 