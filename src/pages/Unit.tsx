import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CalendarIcon, ChevronDownIcon, Inbox, LayoutGrid, Loader2,
  Mail, MoreVertical, Settings, MoreHorizontal, 
  AlertTriangle, CheckCircle, Clock, Target, Calendar, BarChart2, 
  Flag, Briefcase, Download, ArrowUp, ArrowDown, Upload, Play, ArrowRight,
  Edit, Eye, FileText, Filter, Plus, Trash2, User
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import KRATimeline from '@/components/KRATimeline';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
  Cell,
  ResponsiveContainer,
  Line,
  PieChart as RechartsPieChart,
  BarChart,
  LineChart
} from 'recharts';
import { useToast } from "@/components/ui/use-toast";
import KRATimelineTab from '@/components/KRATimelineTab';
import KRAInsightsTab from '@/components/KRAInsightsTab';

// Import unit-tabs components
import { KRAsTab } from '@/components/unit-tabs/KRAsTab';

// Import modal components
import AddTaskModal from '@/components/unit-tabs/modals/AddTaskModal';
import EditTaskModal from '@/components/unit-tabs/modals/EditTaskModal';
import DeleteModal from '@/components/unit-tabs/modals/DeleteModal';
import AddProjectModal from '@/components/unit-tabs/modals/AddProjectModal';
import EditProjectModal from '@/components/unit-tabs/modals/EditProjectModal';
import AddRiskModal from '@/components/unit-tabs/modals/AddRiskModal';
import EditRiskModal from '@/components/unit-tabs/modals/EditRiskModal';
import DeleteRiskModal from '@/components/unit-tabs/modals/DeleteRiskModal';
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';

// Import custom hooks for state management
import { useKraState } from '@/hooks/useKraState';

// Import tab components
import { TasksTab } from '@/components/unit-tabs/TasksTab';
import { ProjectsTab } from '@/components/unit-tabs/ProjectsTab';
import { RisksTab } from '@/components/unit-tabs/RisksTab';
import { AssetsTab } from '@/components/unit-tabs/AssetsTab';
import { OverviewTab } from '@/components/unit-tabs/OverviewTab';
import { useSetupWizard } from '@/hooks/useSetupWizard';
import { mockTasks, mockProjects, mockRisks, mockAssets } from '@/mockData/mockData';
import { SetupWizard } from '@/components/setup-wizard/SetupWizard';
import { useAuth } from "@/hooks/useAuth";
import { OneDriveConfig, CsvConfig } from '@/components/setup-wizard/types';
import { useCsvEntityData } from '@/hooks/useCsvEntityData';
import { 
  useTasksData, 
  useProjectsData, 
  useRisksData, 
  useAssetsData, 
  useKRAsData 
} from '@/hooks/useSupabaseData';
import { OrganizationUnit } from '@/types';
import { useStaffByDepartment } from '@/hooks/useStaffByDepartment';
import { StaffMember } from '@/types/staff';
import { Objective } from '@/types/kpi';
import { User } from '@/hooks/useAuth';

// Define hooks for state management
const useTaskState = (initialTasks = []) => {
  const [tasks, setTasks] = useState(initialTasks);

  const addTask = useCallback((task) => {
    const newTask = { ...task, id: Date.now().toString() };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const editTask = useCallback((id, updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updatedTask } : task
    ));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  return { tasks, addTask, editTask, deleteTask };
};

const useProjectState = (initialProjects = []) => {
  const [projects, setProjects] = useState(initialProjects);

  const addProject = useCallback((project) => {
    const newProject = { 
      ...project, 
      id: Date.now().toString(),
      risks: [],
      tasks: []
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const editProject = useCallback((id, updatedProject) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updatedProject } : project
    ));
  }, []);

  const deleteProject = useCallback((id) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  }, []);

  return { projects, addProject, editProject, deleteProject };
};

const useRiskState = (initialRisks = []) => {
  const [risks, setRisks] = useState(initialRisks);

  const addRisk = useCallback((risk) => {
    const newRisk = { 
      ...risk, 
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setRisks(prev => [...prev, newRisk]);
  }, []);

  const editRisk = useCallback((id, updatedRisk) => {
    setRisks(prev => prev.map(risk => 
      risk.id === id ? { ...risk, ...updatedRisk, updatedAt: new Date() } : risk
    ));
  }, []);

  const deleteRisk = useCallback((id) => {
    setRisks(prev => prev.filter(risk => risk.id !== id));
  }, []);

  return { risks, addRisk, editRisk, deleteRisk };
};

const useAssetState = (initialAssets = []) => {
  const [assets, setAssets] = useState(initialAssets);

  const addAsset = useCallback((asset) => {
    const newAsset = { ...asset, id: Date.now().toString() };
    setAssets(prev => [...prev, newAsset]);
  }, []);

  const editAsset = useCallback((id, updatedAsset) => {
    setAssets(prev => prev.map(asset => 
      asset.id === id ? { ...asset, ...updatedAsset } : asset
    ));
  }, []);

  const deleteAsset = useCallback((id) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);

  return { assets, addAsset, editAsset, deleteAsset };
};

// Define Risk interface with all required properties
interface Risk {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high' | 'very-high';
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved';
  category: string;
  projectId: string;
  projectName: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate: string;
  // Keep existing properties
  assignedTo?: string;
  startDate?: Date;
  projectId?: string;
  projectName?: string;
  completionPercentage?: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  startDate: Date;
  endDate: Date;
  manager: string;
  budget: number;
  budgetSpent: number;
  progress: number;
  risks: Risk[];
  tasks: Task[];
}

interface UserAsset {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other';
  serialNumber: string;
  assignedTo: string;
  department: string;
  purchaseDate: Date;
  warrantyExpiry: Date;
  status: 'active' | 'maintenance' | 'retired';
  notes: string;
}

// Define a type for all possible status values
type StatusType = 
  | 'todo' | 'in-progress' | 'review' | 'done'
  | 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved'
  | 'planned' | 'in-progress' | 'completed' | 'on-hold';

// Mock data for KRAs and KPIs
const mockKras = [
  {
    id: "1",
    name: "Improve Customer Satisfaction",
    objectiveId: "1",
    objectiveName: "Enhance User Experience",
    department: "Customer Service",
    responsible: "Jane Smith",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    progress: 65,
    status: "in-progress",
    kpis: [
      {
        id: "1",
        name: "Customer Satisfaction Score",
        date: new Date("2023-06-01"),
        startDate: new Date("2023-01-01"),
        target: "90%",
        actual: "85%",
        status: "at-risk",
        description: "Monthly customer satisfaction survey results",
        notes: "Trending upward but still below target"
      },
      {
        id: "2",
        name: "Support Response Time",
        date: new Date("2023-06-01"),
        startDate: new Date("2023-01-01"),
        target: "< 4 hours",
        actual: "3.5 hours",
        status: "on-track",
        description: "Average time to respond to support tickets",
        notes: "Consistently meeting target"
      }
    ],
    createdAt: "2023-01-01",
    updatedAt: "2023-06-01"
  },
  {
    id: "2",
    name: "Increase Market Share",
    objectiveId: "2",
    objectiveName: "Business Growth",
    department: "Marketing",
    responsible: "John Doe",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    progress: 40,
    status: "in-progress",
    kpis: [
      {
        id: "3",
        name: "Market Share Percentage",
        date: new Date("2023-06-01"),
        startDate: new Date("2023-01-01"),
        target: "25%",
        actual: "22%",
        status: "at-risk",
        description: "Percentage of total market",
        notes: "Growth slower than projected"
      }
    ],
    createdAt: "2023-01-01",
    updatedAt: "2023-06-01"
  }
];

// Define a utility function for StatusBadge since there are import conflicts
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // Implementation of StatusBadge component
  const getStatusColor = () => {
    // Cast status to the union type for proper type checking
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'identified':
        return 'bg-purple-100 text-purple-800';
      case 'analyzing':
        return 'bg-indigo-100 text-indigo-800';
      case 'mitigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'monitoring':
        return 'bg-teal-100 text-teal-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      case 'on-track':
        return 'bg-green-100 text-green-800';
      case 'at-risk':
        return 'bg-amber-100 text-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'done':
        return 'Done';
      case 'identified':
        return 'Identified';
      case 'analyzing':
        return 'Analyzing';
      case 'mitigating':
        return 'Mitigating';
      case 'monitoring':
        return 'Monitoring';
      case 'resolved':
        return 'Resolved';
      case 'planned':
        return 'Planned';
      case 'on-hold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
      case 'open':
        return 'Open';
      case 'closed':
        return 'Closed';
      case 'active':
        return 'Active';
      case 'maintenance':
        return 'Maintenance';
      case 'retired':
        return 'Retired';
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return typeof status === 'string' 
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : 'Unknown';
    }
  };

  return (
    <Badge className={`${getStatusColor()} hover:${getStatusColor()}`}>
      {getStatusLabel()}
    </Badge>
  );
};

// Define status options for dropdowns
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

// StatusDropdown Component
const StatusDropdown: React.FC<{ 
  currentStatus: string, 
  onStatusChange: (newStatus: string) => void,
  options?: Array<{ value: string, label: string }>,
}> = ({ 
  currentStatus, 
  onStatusChange,
  options = statusOptions,
}) => {
  return (
    <Select defaultValue={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// --- Mock Data --- Placeholder - Replace with data fetching logic
const mockObjectives: Objective[] = [
  { id: 'obj1', name: 'Enhance User Experience', description: 'Improve overall user satisfaction and ease of use.' },
  { id: 'obj2', name: 'Business Growth', description: 'Increase market share and revenue.' },
  { id: 'obj3', name: 'Increase Efficiency', description: 'Streamline internal processes.' },
];
// --- End Mock Data ---

// Define the main Unit component
const Unit = () => {
  const { user } = useAuth(); // Get user from useAuth
  const { staffMembers } = useStaffByDepartment(user?.unitId || user?.divisionId || ''); // Use unitId or divisionId
  const { toast } = useToast();

  // Setup Wizard State
  const setupWizard = useSetupWizard(); // Contains isSetupComplete, config, completeSetup etc.

  // Data states using Supabase hooks (or local state if not using Supabase yet)
  const taskState = useTasksData(setupWizard.config?.tasks?.filePath, setupWizard.config?.tasks?.source);
  const projectState = useProjectsData(setupWizard.config?.projects?.filePath, setupWizard.config?.projects?.source);
  const riskState = useRisksData(setupWizard.config?.risks?.filePath, setupWizard.config?.risks?.source);
  const assetState = useAssetsData(setupWizard.config?.assets?.filePath, setupWizard.config?.assets?.source);
  const kraState = useKRAsData(setupWizard.config?.kras?.filePath, setupWizard.config?.kras?.source); // Assuming this hook exists

  // Active Tab State
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Objective State Management
  const [objectivesData, setObjectivesData] = useState<Objective[]>(mockObjectives); // Initialize with mock data or fetched data

  const handleSaveObjective = useCallback((objective: Objective) => {
    setObjectivesData(prev => {
      const existingIndex = prev.findIndex(o => o.id === objective.id);
      if (existingIndex > -1) {
        // Update existing objective
        const updatedObjectives = [...prev];
        updatedObjectives[existingIndex] = objective;
        return updatedObjectives;
      } else {
        // Add new objective (generate ID if necessary)
        const newObjective = { ...objective, id: objective.id || `obj-${Date.now()}` };
        return [...prev, newObjective];
      }
    });
    // Optional: Add API call here to save to backend/Supabase
    toast({ title: "Objective saved successfully." });
  }, [toast]);

  const handleDeleteObjective = useCallback((objectiveId: string | number) => {
    setObjectivesData(prev => prev.filter(o => o.id !== objectiveId));
    // Optional: Add API call here to delete from backend/Supabase
    toast({ title: "Objective deleted successfully.", variant: "destructive" });
  }, [toast]);

  // Effect to load data or check setup status
  useEffect(() => {
    if (!setupWizard.isSetupComplete) {
      // Don't load data if setup isn't complete
      return;
    }
    // Trigger refresh/fetch for all data sources if needed when setup is complete
     taskState.refresh();
     projectState.refresh();
     riskState.refresh();
     assetState.refresh();
     kraState.refresh();
     // Fetch initial objectives from backend if needed
     // fetchObjectives().then(setObjectivesData);
  }, [setupWizard.isSetupComplete, taskState.refresh, projectState.refresh, riskState.refresh, assetState.refresh, kraState.refresh]); // Add other dependencies like refresh functions

  // Determine if data loading is complete (adjust based on actual hooks)
  const isDataLoading = taskState.isLoading || projectState.isLoading || riskState.isLoading || assetState.isLoading || kraState.isLoading;
  // Corrected variable name
  const hasDataLoadingError = taskState.error || projectState.error || riskState.error || assetState.error || kraState.error;

  // Decide what to render based on setup state
  // Let's assume useSetupWizard provides a way to know if it's loading its own state
  // if (setupWizard.isInitializing) { // hypothetical property
  //   return <PageLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> Loading Setup...</div></PageLayout>;
  // }

  if (!setupWizard.isSetupComplete) {
    // Render the SetupWizard component if setup is not complete
    // Pass necessary props based on SetupWizard's definition
    return (
      <SetupWizard
        // Assuming SetupWizard needs these props based on its definition
        isOpen={true} // Keep it open until setup is complete
        onClose={() => { /* Decide if closing is allowed before completion */ }}
        onComplete={setupWizard.completeSetup} // Function to mark setup as complete
        // Pass other config/state management props from setupWizard hook as needed
        initialConfig={setupWizard.config}
        setSetupMethod={setupWizard.setSetupMethod}
        setOneDriveConfig={setupWizard.setOneDriveConfig}
        setCsvConfig={setupWizard.setCsvConfig}
        updateCsvConfig={setupWizard.updateCsvConfig}
        csvConfig={setupWizard.csvConfig}
        oneDriveConfig={setupWizard.oneDriveConfig}
        setupMethodProp={setupWizard.setupMethod}
        // ... potentially pass setters for objectives, kras, kpis if setup modifies them directly
      />
    );
  }

  // Main content rendering after setup is complete
  // Use the PageLayout without title/subtitle props, assuming it handles title internally
  return (
    <PageLayout>
      {/* Display Department/Unit Name somewhere if needed, maybe in a header inside PageLayout */}
      {user && (user.unitName || user.divisionName) && (
        <div className="mb-4 text-sm text-muted-foreground">
          Unit/Division: {user.unitName || user.divisionName}
        </div>
      )}

      {isDataLoading && (
         <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> Loading Unit Data...</div>
      )}
      {hasDataLoadingError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Data Loading Error</CardTitle>
            <CardDescription className="text-destructive">
              There was an error loading some unit data. Please check the data sources or try again later.
              {/* Consider adding a retry button */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Optionally list specific errors */}
            {taskState.error && <p>Tasks Error: {taskState.error}</p>}
            {projectState.error && <p>Projects Error: {projectState.error}</p>}
            {riskState.error && <p>Risks Error: {riskState.error}</p>}
            {assetState.error && <p>Assets Error: {assetState.error}</p>}
            {kraState.error && <p>KRAs Error: {kraState.error}</p>}
          </CardContent>
        </Card>
      )}

      {!isDataLoading && !hasDataLoadingError && (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks/Daily Operations</TabsTrigger>
            <TabsTrigger value="kras">KRAs</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="assets">User Asset Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewTab
              projects={projectState.data}
              tasks={taskState.data}
              risks={riskState.data}
              kras={kraState.kras} // Pass KRAs data (adjust based on hook structure)
              setupState={setupWizard} // Pass setup state if OverviewTab needs it
              objectives={objectivesData} // Pass objectives
            />
          </TabsContent>

          {/* Tasks/Daily Operations Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <TasksTab
              tasks={taskState.data}
              addTask={taskState.add}
              editTask={taskState.update}
              deleteTask={taskState.remove}
              error={taskState.error}
              onRetry={taskState.refresh}
              staffMembers={staffMembers}
              objectives={objectivesData} // Pass objectives if needed by Task modals/views
            />
          </TabsContent>

          {/* KRAs Tab */}
          <TabsContent value="kras" className="space-y-6">
            <KRAsTab
              kras={kraState.kras || []} // Pass KRAs data, ensure it's an array
              objectivesData={objectivesData} // Pass objectives state
              onSaveObjective={handleSaveObjective} // Pass save handler
              onDeleteObjective={handleDeleteObjective} // Pass delete handler
              // Pass other needed props like users, units, etc. if KRAsTab needs them directly
              // Example: users={mockUsers} // Replace with actual user data if available
              units={kraState.units || []} // Pass units derived from KRAs or fetched separately
              staffMembers={staffMembers} // Pass staff members if needed for assignees
            />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <ProjectsTab
              projects={projectState.data}
              addProject={projectState.add}
              editProject={projectState.update}
              deleteProject={projectState.remove}
              error={projectState.error}
              onRetry={projectState.refresh}
              staffMembers={staffMembers}
              objectives={objectivesData} // Pass objectives if needed by Project modals/views
            />
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <RisksTab
              risks={riskState.data}
              addRisk={riskState.add}
              editRisk={riskState.update}
              deleteRisk={riskState.remove}
              error={riskState.error}
              onRetry={riskState.refresh}
              staffMembers={staffMembers}
              projects={projectState.data} // Pass projects for linking risks
              objectives={objectivesData} // Pass objectives if needed by Risk modals/views
            />
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <AssetsTab
              assets={assetState.data}
              addAsset={assetState.add}
              editAsset={assetState.update}
              deleteAsset={assetState.remove}
              error={assetState.error}
              onRetry={assetState.refresh}
              staffMembers={staffMembers}
              // Pass objectives if needed by Asset modals/views (less likely)
            />
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
};

export default Unit;
