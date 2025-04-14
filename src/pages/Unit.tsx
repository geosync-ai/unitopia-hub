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

// Define the main Unit component
const Unit = () => {
  const { isAuthenticated, user, login, businessUnits, selectedUnit, setSelectedUnit, fetchUserUnits } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTeamViewSwitcher, setShowTeamViewSwitcher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<OrganizationUnit[]>([]);
  const initializedRef = useRef(false);
  const wizardShownRef = useRef(false);
  const { toast } = useToast();

  // Initialize setup wizard with required state
  const setupWizard = useSetupWizard({
    projectState: null, // Will be passed as null to use CSV data instead
    taskState: null,
    riskState: null,
    assetState: null,
    kraState: null
  });

  // Use Supabase data hooks for tasks, projects, risks, and assets
  const taskState = useTasksData();
  const projectState = useProjectsData();
  const riskState = useRisksData();
  const assetState = useAssetsData();
  
  // Keep the existing KRA state for now, could be migrated later
  const kraState = useKraState();

  const { staffMembers, loading: staffLoading, error: staffError } = useStaffByDepartment();

  // Load user's units when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserUnits().then(units => {
        setAvailableUnits(units);
        
        // If there's no selected unit but we have units, select the first one
        if (!selectedUnit && units.length > 0) {
          setSelectedUnit(units[0].id);
        }
      });
    }
  }, [isAuthenticated, user, fetchUserUnits]);

  // IMPORTANT: Changed this to only show setup wizard when explicitly requested
  // Memoize the setup check to prevent unnecessary re-renders
  const checkSetupNeeded = useCallback(() => {
    // Only return true if the user has explicitly clicked the setup button
    return false; // Don't auto-show the wizard
  }, []);

  // Fetch data when authenticated - only get mock data if setup is not complete
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching data, setup complete:", setupWizard.isSetupComplete);
        console.log("Storage type:", localStorage.getItem('unitopia_storage_type'));
        console.log("CSV Config:", setupWizard.csvConfig);

        // Check if setup is complete - if not, we'll use mock data
        if (!setupWizard.isSetupComplete) {
          console.log("Setup not complete, loading mock data");
          // Filter mock data by user for demo purposes
          const userTasks = mockTasks.filter(task => task.assignee === user.email);
          const userProjects = mockProjects.filter(project => project.manager === user.email);
          const userRisks = mockRisks.filter(risk => risk.owner === user.email);
          const userAssets = mockAssets.filter(asset => asset.assignedTo === user.email);

          // Set as initial data in localStorage for demo
          localStorage.setItem('unitopia_tasks', JSON.stringify(userTasks));
          localStorage.setItem('unitopia_projects', JSON.stringify(userProjects));
          localStorage.setItem('unitopia_risks', JSON.stringify(userRisks));
          localStorage.setItem('unitopia_assets', JSON.stringify(userAssets));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, toast, setupWizard.isSetupComplete, setupWizard.csvConfig]);

  // Add effect to log data after it's loaded
  useEffect(() => {
    console.log("Task data:", taskState.data);
    console.log("Project data:", projectState.data);
    console.log("Risk data:", riskState.data);
    console.log("Asset data:", assetState.data);
    console.log("KRA data:", kraState.kras);
  }, [taskState.data, projectState.data, riskState.data, assetState.data, kraState.kras]);

  // Initialize data from mock data and setup wizard
  useEffect(() => {
    // Ensure we only run this once
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    try {
      // Important: Only show wizard if explicitly requested
      // Don't auto-show the wizard anymore

      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing data:", err);
      setError("Failed to initialize dashboard data");
      setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this only runs once

  // Handle setup wizard completion
  const handleSetupComplete = useCallback(() => {
    setShowSetupWizard(false);
    toast({
      title: "Setup Complete",
      description: "Your dashboard has been successfully configured.",
    });

    // Don't force a refresh of the page
    // window.location.reload();
  }, [toast]);

  // Handle setup wizard close with confirmation if data has been entered
  const handleSetupClose = useCallback(() => {
    // Check if setup is complete - don't show confirmation if setup is completed
    if (setupWizard.isSetupComplete) {
      setShowSetupWizard(false);
      return;
    }
    
    // Only show confirmation dialog if setup is NOT complete and data has been entered
    const hasSetupData = setupWizard.objectives?.length > 0 || 
                        setupWizard.oneDriveConfig !== null;
    
    if (hasSetupData) {
      if (window.confirm('Are you sure you want to close the setup? Your progress will be lost.')) {
        setShowSetupWizard(false);
      }
    } else {
      setShowSetupWizard(false);
    }
  }, [setupWizard.objectives, setupWizard.oneDriveConfig, setupWizard.isSetupComplete]);
  
  // Improved version of handleSkipOneDriveSetup that provides better user feedback
  const handleSkipOneDriveSetup = useCallback(() => {
    // Check if we're already using OneDrive
    const isUsingOneDrive = setupWizard.oneDriveConfig !== null && !setupWizard.oneDriveConfig.isTemporary;
    
    // Set up with local storage instead
    localStorage.setItem('unitopia_storage_type', 'local');
    
    // Create some default objectives and KRAs if there aren't any
    const hasExistingObjectives = setupWizard.objectives?.length > 0;
    const hasExistingKRAs = setupWizard.kras?.length > 0;
    
    if (!hasExistingObjectives) {
      const defaultObjectives = [
        {
          id: '1',
          name: 'Default Objective',
          description: 'This is a default objective created when skipping OneDrive setup',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Store in localStorage
      localStorage.setItem('unitopia_objectives', JSON.stringify(defaultObjectives));
      
      // Update state
      setupWizard.setObjectives(defaultObjectives);
    }
    
    if (!hasExistingKRAs) {
      const defaultKras = [
        {
          id: '1',
          name: 'Default KRA',
          objectiveId: '1',
          objectiveName: 'Default Objective',
          department: 'IT',
          responsible: 'Admin User',
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          progress: 0,
          status: 'open',
          kpis: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Store in localStorage
      localStorage.setItem('unitopia_kras', JSON.stringify(defaultKras));
      
      // Update state
      setupWizard.setKRAs(defaultKras);
    }
    
    // Always ensure KPIs are initialized
    if (!localStorage.getItem('unitopia_kpis')) {
      localStorage.setItem('unitopia_kpis', JSON.stringify([]));
    }
    
    if (!setupWizard.kpis) {
      setupWizard.setKPIs([]);
    }
    
    // Complete setup
    setupWizard.handleSetupComplete();
    
    // Hide setup wizard
    setShowSetupWizard(false);
    
    // Provide feedback based on previous state
    if (isUsingOneDrive) {
      toast({
        title: "Switched to Local Storage",
        description: "Your unit is now using local browser storage instead of OneDrive.",
      });
    } else {
      toast({
        title: "Setup Completed",
        description: "Your unit has been set up with local storage.",
      });
    }
    
    // Force a refresh with slight delay to ensure state is updated
    setTimeout(() => {
      // window.location.reload();
    }, 500);
  }, [setupWizard, toast]);

  // Add authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      login('admin@app.com', 'admin');
    }
  }, [isAuthenticated, login]);

  // Add effect to check if the setupWizard is initialized correctly
  useEffect(() => {
    console.log("Setup Wizard State:", {
      isSetupComplete: setupWizard.isSetupComplete,
      csvConfig: setupWizard.csvConfig ? {
        folderId: setupWizard.csvConfig.folderId,
        fileNames: setupWizard.csvConfig.fileNames,
        fileIds: setupWizard.csvConfig.fileIds
      } : null,
      oneDriveConfig: setupWizard.oneDriveConfig
    });
  }, [setupWizard]);

  // If not authenticated, show loading state
  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
            <p className="text-muted-foreground">Please wait while we verify your credentials</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If loading, show appropriate message - combine Supabase loading states
  const isDataLoading = taskState.loading || projectState.loading || riskState.loading || assetState.loading;
  
  if (isLoading || isDataLoading) {
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

  // If error in any of the Supabase data hooks
  const dataError = taskState.error || projectState.error || riskState.error || assetState.error;
  if (error || dataError) {
    const errorMessage = error || (dataError ? dataError.message : null);
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2 text-red-600">Error Loading Dashboard</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
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
            <div className="flex gap-2 items-center">
              {/* Unit Selector */}
              {availableUnits.length > 0 && (
                <Select
                  value={selectedUnit || undefined}
                  onValueChange={value => setSelectedUnit(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSetupWizard(true)}
                className="flex items-center gap-2"
              >
                Setup
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAiChat(!showAiChat)}
                className="flex items-center gap-2"
              >
                {showAiChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
              </Button>
            </div>
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
                projects={projectState.data}
                tasks={taskState.data}
                risks={riskState.data}
                kras={kraState.kras}
                setupState={setupWizard}
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
              />
            </TabsContent>
            
            {/* KRAs Tab */}
            <TabsContent value="kras" className="space-y-6">
              {setupWizard.isSetupComplete || true ? (
                <KRAsTab />
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  Please complete the setup wizard to view KRAs.
                </div>
              )}
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
              />
            </TabsContent>
            
            {/* User Asset Management Tab */}
            <TabsContent value="assets" className="space-y-6">
              <AssetsTab 
                assets={assetState.data}
                addAsset={assetState.add}
                editAsset={assetState.update}
                deleteAsset={assetState.remove}
                error={assetState.error}
                onRetry={assetState.refresh}
              />
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
      
      {/* Setup Wizard - Only shown when the Setup button is clicked */}
      {showSetupWizard && (
        <SetupWizard
          isOpen={showSetupWizard}
          onClose={handleSetupClose}
          onComplete={handleSetupComplete}
          setSetupMethod={setupWizard.setSetupMethod}
          setOneDriveConfig={setupWizard.setOneDriveConfig}
          setObjectives={setupWizard.setObjectives}
          setKRAs={setupWizard.setKRAs}
          setKPIs={setupWizard.setKPIs}
          handleSetupCompleteFromHook={setupWizard.handleSetupComplete}
          updateCsvConfig={setupWizard.updateCsvConfig}
          setCsvConfig={setupWizard.setCsvConfig}
          csvConfig={setupWizard.csvConfig}
          oneDriveConfig={setupWizard.oneDriveConfig}
          setupMethodProp={setupWizard.setupMethod}
          objectivesProp={setupWizard.objectives}
          krasProp={setupWizard.kras}
          kpisProp={setupWizard.kpis}
          isSetupComplete={setupWizard.isSetupComplete}
        />
      )}
      
      {/* Skip OneDrive Setup Button - Only shown when SetupWizard is visible */}
      {showSetupWizard && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handleSkipOneDriveSetup}
          >
            Skip OneDrive Setup
          </Button>
        </div>
      )}
    </PageLayout>
  );
};

export default Unit;
