import React, { useState, useEffect, useCallback } from 'react';
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

interface KPI {
  id: string;
  name: string;
  date: Date;
  startDate: Date; // Add start date
  target: string;
  actual: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  description: string;
  notes: string;
}

interface KRA {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  department: string;
  responsible: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'open' | 'in-progress' | 'closed';
  kpis: KPI[];
  createdAt: string;
  updatedAt: string;
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

// Define the main Unit component
const Unit = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTeamViewSwitcher, setShowTeamViewSwitcher] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  
  // Use custom state hooks
  const taskState = useTaskState(mockTasks);
  const projectState = useProjectState(mockProjects);
  const riskState = useRiskState(mockRisks);
  const kraState = useKraState();
  const assetState = useAssetState(mockAssets);
  
  // Initialize setup wizard state with all required state objects
  const setupState = useSetupWizard({
    projectState,
    taskState,
    riskState,
    kraState,
    assetState
  });

  // Log setupState during render
  console.log('Rendering Unit component, setupState:', setupState);

  // Initialize data from mock data
  useEffect(() => {
    try {
      // Initialize state with mock data
      mockTasks.forEach(task => taskState.addTask(task));
      mockProjects.forEach(project => projectState.addProject(project));
      mockRisks.forEach(risk => riskState.addRisk(risk));
      mockAssets.forEach(asset => assetState.addAsset(asset));
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing data:", err);
      setError("Failed to initialize dashboard data");
      setIsLoading(false);
    }
  }, []);

  // If loading or error, show appropriate message
  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading dashboard...</h2>
            <p className="text-muted-foreground">Please wait while we prepare your unit data</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2 text-red-600">Error Loading Dashboard</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 flex">
        <div className={`flex-1 transition-all duration-300 ${showAiChat ? 'mr-4' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Unit Dashboard</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAiChat(!showAiChat)}
              className="flex items-center gap-2"
            >
              {showAiChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
            </Button>
          </div>
          
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
                projects={projectState.projects}
                tasks={taskState.tasks}
                risks={riskState.risks}
                kras={kraState.kras}
                setupState={setupState}
              />
            </TabsContent>
            
            {/* Tasks/Daily Operations Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <TasksTab {...taskState} />
            </TabsContent>
            
            {/* KRAs Tab */}
            <TabsContent value="kras" className="space-y-6">
              <KRAsTab />
            </TabsContent>
            
            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <ProjectsTab {...projectState} />
            </TabsContent>
            
            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-6">
              <RisksTab {...riskState} />
            </TabsContent>
            
            {/* User Asset Management Tab */}
            <TabsContent value="assets" className="space-y-6">
              <AssetsTab {...assetState} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* AI Chat Area (conditionally rendered) */}
        {showAiChat && (
          <div className="w-1/3 max-w-md border-l pl-4">
            <div className="border rounded-lg h-[calc(100vh-160px)] flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm">How can I help you today?</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." />
                  <Button>Send</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Setup Wizard */}
      {showSetupWizard && (
        <SetupWizard
          isOpen={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          onComplete={() => {
            setShowSetupWizard(false);
            // Refresh data after setup is complete
            // TODO: Implement data refresh
          }}
          // Spread the setupState object into individual props
          {...setupState}
          // Rename handleSetupComplete from hook to avoid name collision
          handleSetupCompleteFromHook={setupState.handleSetupComplete}
        />
      )}
    </PageLayout>
  );
};

export default Unit; 