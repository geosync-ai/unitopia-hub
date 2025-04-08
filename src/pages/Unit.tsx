import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import KRATimeline from '@/components/KRATimeline';
import { AlertTriangle, CheckCircle, Clock, Target, Calendar, User, BarChart2, Flag, Filter, Plus, Edit, Trash2, Briefcase, FileText, Download, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

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
  status: string;
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
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  startDate: Date;
  dueDate: Date;
  projectId: string;
  projectName: string;
  completionPercentage: number;
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
  | 'not-started' | 'in-progress' | 'completed' | 'blocked'
  | 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved'
  | 'planned' | 'in-progress' | 'completed' | 'on-hold';

// StatusBadge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    // Cast status to the union type for proper type checking
    const statusValue = status as StatusType;
    
    switch (statusValue) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
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
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    // Cast status to the union type for proper type checking
    const statusValue = status as StatusType;
    
    switch (statusValue) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
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
      case 'blocked':
        return 'Blocked';
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
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' }
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

const Unit = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAiChat, setShowAiChat] = useState(false);
  
  // Dialog states
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showKraDialog, setShowKraDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  
  // Filter states
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
  const [taskProjectFilter, setTaskProjectFilter] = useState("all");
  
  // Filter states for KRAs
  const [kraStatusFilter, setKraStatusFilter] = useState("all");
  const [kraDepartmentFilter, setKraDepartmentFilter] = useState("all");

  // Filter states for projects
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectManagerFilter, setProjectManagerFilter] = useState("all");

  // Filter states for risks
  const [riskStatusFilter, setRiskStatusFilter] = useState("all");
  const [riskImpactFilter, setRiskImpactFilter] = useState("all");
  const [riskProjectFilter, setRiskProjectFilter] = useState("all");
  
  // Filter states for assets
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("all");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // KRA edit states (already added)
  // ... existing code ...
  
  // Project edit states
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Project status options (standardized)
  const projectStatusOptions = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'started', label: 'Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  // Helper function to render project status badges
  const renderProjectStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'planned':
        return <Badge className="bg-gray-500">Planned</Badge>;
      case 'on-hold':
        return <Badge className="bg-amber-500">On Hold</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Function to update project status
  const handleProjectStatusChange = (projectId: string, newStatus: string) => {
    // In a real app, this would update the backend
    console.log(`Updating project ${projectId} to status: ${newStatus}`);
    setEditingProjectId(null);
  };

  // Mock KRA data
  const mockKRAs: KRA[] = [
    {
      id: '1',
      name: 'Increase Market Share',
      objectiveId: '1',
      objectiveName: 'Market Expansion',
      department: 'Sales',
      responsible: 'John Doe',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      progress: 75,
      status: 'in-progress',
      kpis: [
        {
          id: '1',
          name: 'Market Share Percentage',
          date: new Date('2024-06-30'),
          startDate: new Date('2024-01-15'), // Add start date
          target: '25%',
          actual: '18%',
          status: 'in-progress',
          description: 'Measure of market penetration',
          notes: 'Current trend indicates we may exceed target'
        },
        {
          id: '2',
          name: 'New Customer Acquisition',
          date: new Date('2024-09-30'),
          startDate: new Date('2024-02-01'), // Add start date
          target: '1000',
          actual: '750',
          status: 'started',
          description: 'Total number of new customers',
          notes: 'Acquisition rate slowing in Q3'
        }
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'Improve Customer Satisfaction',
      objectiveId: '2',
      objectiveName: 'Customer Experience',
      department: 'Customer Service',
      responsible: 'Jane Smith',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-31'),
      progress: 60,
      status: 'in-progress',
      kpis: [
        {
          id: '3',
          name: 'Customer Satisfaction Score',
          date: new Date('2024-07-15'),
          startDate: new Date('2024-02-15'), // Add start date
          target: '90/100',
          actual: '85/100',
          status: 'in-progress',
          description: 'Average score from customer surveys',
          notes: 'Scores improving month over month'
        },
        {
          id: '4',
          name: 'Response Time',
          date: new Date('2024-05-01'),
          startDate: new Date('2024-03-01'), // Add start date
          target: '2 hours',
          actual: '2.5 hours',
          status: 'overdue',
          description: 'Average time to respond to customer inquiries',
          notes: 'Need additional resources to meet target'
        }
      ],
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z'
    }
  ];

  // Mock Projects data
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Digital Transformation Initiative',
      description: 'Comprehensive overhaul of digital systems and processes',
      status: 'in-progress',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-11-30'),
      manager: 'Michael Johnson',
      budget: 500000,
      budgetSpent: 250000,
      progress: 48,
      risks: [
        {
          id: '1',
          title: 'Integration Compatibility',
          description: 'Legacy systems may have compatibility issues with new solutions',
          impact: 'high',
          likelihood: 'medium',
          status: 'mitigating',
          category: 'Technical',
          projectId: '1',
          projectName: 'Digital Transformation Initiative',
          owner: 'Michael Johnson',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-03-10')
        },
        {
          id: '2',
          title: 'Resource Constraints',
          description: 'IT team may not have sufficient resources to implement all changes on schedule',
          impact: 'medium',
          likelihood: 'high',
          status: 'analyzing',
          category: 'Resource',
          projectId: '1',
          projectName: 'Digital Transformation Initiative',
          owner: 'Sarah Williams',
          createdAt: new Date('2024-02-05'),
          updatedAt: new Date('2024-03-15')
        }
      ],
      tasks: [
        {
          id: '1',
          title: 'Conduct system audit',
          description: 'Evaluate all existing systems and identify upgrade requirements',
          status: 'completed',
          priority: 'high',
          assignedTo: 'Sarah Wong',
          startDate: new Date('2024-01-20'),
          dueDate: new Date('2024-02-15'),
          projectId: '1',
          projectName: 'Digital Transformation Initiative',
          completionPercentage: 100
        },
        {
          id: '2',
          title: 'Design new architecture',
          description: 'Create architectural blueprints for the new digital ecosystem',
          status: 'in-progress',
          priority: 'high',
          assignedTo: 'David Chen',
          startDate: new Date('2024-03-15'),
          dueDate: new Date('2024-04-30'),
          projectId: '1',
          projectName: 'Digital Transformation Initiative',
          completionPercentage: 75
        },
        {
          id: '3',
          title: 'Vendor selection',
          description: 'Evaluate and select technology vendors for key components',
          status: 'in-progress',
          priority: 'medium',
          assignedTo: 'Michael Johnson',
          startDate: new Date('2024-04-01'),
          dueDate: new Date('2024-05-15'),
          projectId: '1',
          projectName: 'Digital Transformation Initiative',
          completionPercentage: 50
        }
      ]
    },
    {
      id: '2',
      name: 'Customer Portal Upgrade',
      description: 'Enhance customer self-service capabilities and user experience',
      status: 'in-progress',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-31'),
      manager: 'Lisa Chen',
      budget: 250000,
      budgetSpent: 100000,
      progress: 35,
      risks: [
        {
          id: '3',
          title: 'User Adoption',
          description: 'Customers may resist changes to familiar interface',
          impact: 'medium',
          likelihood: 'medium',
          status: 'identified',
          category: 'Change Management',
          projectId: '2',
          projectName: 'Customer Portal Upgrade',
          owner: 'David Chen',
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-10')
        }
      ],
      tasks: [
        {
          id: '4',
          title: 'User research',
          description: 'Conduct interviews and surveys with current portal users',
          status: 'completed',
          priority: 'high',
          assignedTo: 'Emma Richards',
          startDate: new Date('2024-02-05'),
          dueDate: new Date('2024-03-01'),
          projectId: '2',
          projectName: 'Customer Portal Upgrade',
          completionPercentage: 100
        },
        {
          id: '5',
          title: 'UI/UX design',
          description: 'Create design mockups for new portal interface',
          status: 'in-progress',
          priority: 'high',
          assignedTo: 'James Wilson',
          startDate: new Date('2024-03-05'),
          dueDate: new Date('2024-04-15'),
          projectId: '2',
          projectName: 'Customer Portal Upgrade',
          completionPercentage: 80
        },
        {
          id: '6',
          title: 'Backend development',
          description: 'Implement API changes to support new features',
          status: 'not-started',
          priority: 'medium',
          assignedTo: 'Robert Kim',
          startDate: new Date('2024-05-01'),
          dueDate: new Date('2024-05-30'),
          projectId: '2',
          projectName: 'Customer Portal Upgrade',
          completionPercentage: 0
        }
      ]
    }
  ];

  // Define mock risks data
  const mockRisks: Risk[] = [
    {
      id: '1',
      title: 'Budget Overrun',
      description: 'Project may exceed allocated budget',
      impact: 'high',
      likelihood: 'medium',
      status: 'mitigating',
      category: 'financial',
      projectId: '1',
      projectName: 'Digital Transformation Initiative',
      owner: 'Michael Johnson',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-03-15')
    },
    {
      id: '2',
      title: 'Resource Shortage',
      description: 'Insufficient skilled resources available',
      impact: 'medium',
      likelihood: 'high',
      status: 'identified',
      category: 'operational',
      projectId: '1',
      projectName: 'Digital Transformation Initiative',
      owner: 'Sarah Williams',
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05')
    },
    {
      id: '3',
      title: 'Stakeholder Buy-in',
      description: 'Key stakeholders may resist changes',
      impact: 'critical',
      likelihood: 'medium',
      status: 'analyzing',
      category: 'external',
      projectId: '2',
      projectName: 'Customer Portal Upgrade',
      owner: 'David Chen',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-10')
    },
    {
      id: '4',
      title: 'Technology Compatibility',
      description: 'New systems may not integrate well with legacy systems',
      impact: 'medium',
      likelihood: 'high',
      status: 'monitoring',
      category: 'technical',
      projectId: '2',
      projectName: 'Customer Portal Upgrade',
      owner: 'Emily Roberts',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-03-05')
    }
  ];

  // Define mock documents data
  const mockDocuments = [
    {
      id: '1',
      name: 'Project Charter',
      category: 'Planning',
      status: 'approved',
      dateAdded: '2024-01-15',
      owner: 'Michael Johnson'
    },
    {
      id: '2',
      name: 'Requirements Specification',
      category: 'Technical',
      status: 'draft',
      dateAdded: '2024-02-01',
      owner: 'Sarah Williams'
    },
    {
      id: '3',
      name: 'Design Document',
      category: 'Technical',
      status: 'in-review',
      dateAdded: '2024-02-20',
      owner: 'David Chen'
    },
    {
      id: '4',
      name: 'Test Plan',
      category: 'QA',
      status: 'approved',
      dateAdded: '2024-03-05',
      owner: 'Emily Roberts'
    }
  ];
  
  // For demonstration, creating a simple array of tasks
  const allTasks: Task[] = mockProjects.flatMap(project => 
    project.tasks || []
  );
  
  // For demonstration, creating a simple array of risks
  const allRisks: Risk[] = mockProjects.flatMap(project => 
    project.risks || []
  ).concat(mockRisks);

  // Mock User Assets data
  const mockUserAssets: UserAsset[] = [
    {
      id: '1',
      name: 'MacBook Pro',
      type: 'laptop',
      serialNumber: 'MBP20240001',
      assignedTo: 'John Doe',
      department: 'IT',
      purchaseDate: new Date('2023-06-15'),
      warrantyExpiry: new Date('2026-06-15'),
      status: 'active',
      notes: 'Primary development machine'
    },
    {
      id: '2',
      name: 'iPhone 15',
      type: 'mobile',
      serialNumber: 'IP20240002',
      assignedTo: 'Jane Smith',
      department: 'Sales',
      purchaseDate: new Date('2023-10-01'),
      warrantyExpiry: new Date('2025-10-01'),
      status: 'active',
      notes: 'Company phone with data plan'
    }
  ];

  // Helper function to render task status badges with standardized statuses
  const renderTaskStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'not-started':
        return <Badge className="bg-gray-500">Not Started</Badge>;
      case 'blocked':
        return <Badge className="bg-red-500">Blocked</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Helper function to render asset status badges
  const renderAssetStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-500">Maintenance</Badge>;
      case 'retired':
        return <Badge className="bg-gray-500">Retired</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Filter tasks based on selected filters
  const filteredTasks = allTasks.filter(task => {
    const statusMatch = taskStatusFilter === "all" || task.status === taskStatusFilter;
    const priorityMatch = taskPriorityFilter === "all" || task.priority === taskPriorityFilter;
    const projectMatch = taskProjectFilter === "all" || task.projectId === taskProjectFilter;
    return statusMatch && priorityMatch && projectMatch;
  });

  // Get unique project IDs and names for filter
  const uniqueProjects = Array.from(new Set(mockProjects.map(project => project.id)))
    .map(id => {
      const project = mockProjects.find(p => p.id === id);
      return { id, name: project?.name };
    });

  // Filter KRAs based on selected filters
  const filteredKRAs = mockKRAs.filter(kra => {
    const statusMatch = kraStatusFilter === "all" || kra.status === kraStatusFilter;
    const departmentMatch = kraDepartmentFilter === "all" || kra.department === kraDepartmentFilter;
    return statusMatch && departmentMatch;
  });

  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(mockKRAs.map(kra => kra.department)));

  // Filter projects based on selected filters
  const filteredProjects = mockProjects.filter(project => {
    const statusMatch = projectStatusFilter === "all" || project.status === projectStatusFilter;
    const managerMatch = projectManagerFilter === "all" || project.manager === projectManagerFilter;
    return statusMatch && managerMatch;
  });

  // Get unique project managers for filter
  const uniqueManagers = Array.from(new Set(mockProjects.map(project => project.manager)));

  // Filter risks based on selected filters
  const filteredRisks = allRisks.filter(risk => {
    const statusMatch = riskStatusFilter === "all" || risk.status === riskStatusFilter;
    const impactMatch = riskImpactFilter === "all" || risk.impact === riskImpactFilter;
    const projectMatch = riskProjectFilter === "all" || risk.projectId === riskProjectFilter;
    return statusMatch && impactMatch && projectMatch;
  });
  
  // Filter assets based on selected filters
  const filteredAssets = mockUserAssets.filter(asset => {
    const typeMatch = assetTypeFilter === "all" || asset.type === assetTypeFilter;
    const statusMatch = assetStatusFilter === "all" || asset.status === assetStatusFilter;
    return typeMatch && statusMatch;
  });

  // Status data for donut chart
  const statusDistribution = [
    { name: "Completed", value: allTasks.filter(task => task.status === 'completed').length, color: "#10b981" },
    { name: "In Progress", value: allTasks.filter(task => task.status === 'in-progress').length, color: "#3b82f6" },
    { name: "Not Started", value: allTasks.filter(task => task.status === 'not-started').length, color: "#9ca3af" },
    { name: "Blocked", value: allTasks.filter(task => task.status === 'blocked').length, color: "#ef4444" }
  ];
  
  // Project progress data for bar chart
  const projectProgressData = mockProjects.map(project => ({
    name: project.name,
    progress: project.progress
  }));

  // Update task status function
  const handleStatusChange = (entityId: string, newStatus: string, entityType?: string) => {
    // In a real app, this would update the backend
    console.log(`Updating ${entityType || 'task'} ${entityId} status to ${newStatus}`);
    // For the mock data, we can update it here
    // This is just a simulation and would need actual API calls in a real app
  };

  // Risk edit states
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [riskToEdit, setRiskToEdit] = useState<Risk | null>(null);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);

  // Risk status options (standardized)
  const riskStatusOptions = [
    { value: 'identified', label: 'Identified' },
    { value: 'analyzing', label: 'Analyzing' },
    { value: 'mitigating', label: 'Mitigating' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'resolved', label: 'Resolved' }
  ];

  // Risk impact options
  const riskImpactOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Risk likelihood options
  const riskLikelihoodOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  // Risk category options
  const riskCategoryOptions = [
    { value: 'financial', label: 'Financial' },
    { value: 'operational', label: 'Operational' },
    { value: 'technical', label: 'Technical' },
    { value: 'external', label: 'External' },
    { value: 'compliance', label: 'Compliance' }
  ];

  // Function to update risk status
  const handleRiskStatusChange = (riskId: string, newStatus: string) => {
    // In a real app, this would update the backend
    console.log(`Updating risk ${riskId} to status: ${newStatus}`);
    setEditingRiskId(null);
  };

  // Helper function to handle edits for different entity types
  const handleEdit = (id: string, type: string) => {
    console.log(`Editing ${type} with id ${id}`);
    // Implementation would depend on the entity type
  };

  // Helper function to handle deletion for different entity types
  const handleDelete = (id: string, type: string) => {
    console.log(`Deleting ${type} with id ${id}`);
    // Implementation would depend on the entity type
  };

  // State for KPI edit/delete
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [kpiToEdit, setKpiToEdit] = useState<KPI | null>(null);
  const [kpiToDelete, setKpiToDelete] = useState<KPI | null>(null);

  // KPI status options
  const kpiStatusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'started', label: 'Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'not-yet-started', label: 'Not yet Started' },
    { value: 'overdue', label: 'Overdue' }
  ];

  // Function to update KPI status
  const handleKpiStatusChange = (kpiId: string, newStatus: string) => {
    // In a real app, this would update the backend
    console.log(`Updating KPI ${kpiId} to status: ${newStatus}`);
    setEditingKpiId(null);
  };

  // Helper function to handle KPI edit
  const handleKpiEdit = (kpi: KPI) => {
    setKpiToEdit(kpi);
  };

  // Helper function to handle KPI delete
  const handleKpiDelete = (kpi: KPI) => {
    setKpiToDelete(kpi);
  };

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
              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Projects
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockProjects.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {mockProjects.filter(p => p.status === 'completed').length} completed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Risks
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockRisks.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {mockRisks.filter(r => r.impact === 'high' || r.impact === 'critical').length} high/critical
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      KPIs
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      18 on track
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Documents
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">42</div>
                    <p className="text-xs text-muted-foreground">
                      12 new this month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Status Donut Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status</CardTitle>
                    <CardDescription>
                      Distribution of projects by current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Planned', value: mockProjects.filter(p => p.status === 'planned').length, color: '#94a3b8' },
                              { name: 'In Progress', value: mockProjects.filter(p => p.status === 'in-progress').length, color: '#f59e0b' },
                              { name: 'Completed', value: mockProjects.filter(p => p.status === 'completed').length, color: '#22c55e' },
                              { name: 'On Hold', value: mockProjects.filter(p => p.status === 'on-hold').length, color: '#3b82f6' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            innerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: 'Planned', value: mockProjects.filter(p => p.status === 'planned').length, color: '#94a3b8' },
                              { name: 'In Progress', value: mockProjects.filter(p => p.status === 'in-progress').length, color: '#f59e0b' },
                              { name: 'Completed', value: mockProjects.filter(p => p.status === 'completed').length, color: '#22c55e' },
                              { name: 'On Hold', value: mockProjects.filter(p => p.status === 'on-hold').length, color: '#3b82f6' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Risk Impact Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>
                      Number of risks by impact level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Low', value: mockRisks.filter(r => r.impact === 'low').length, color: '#22c55e' },
                            { name: 'Medium', value: mockRisks.filter(r => r.impact === 'medium').length, color: '#f59e0b' },
                            { name: 'High', value: mockRisks.filter(r => r.impact === 'high').length, color: '#ef4444' },
                            { name: 'Critical', value: mockRisks.filter(r => r.impact === 'critical').length, color: '#7f1d1d' }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Number of Risks">
                            {[
                              { name: 'Low', value: mockRisks.filter(r => r.impact === 'low').length, color: '#22c55e' },
                              { name: 'Medium', value: mockRisks.filter(r => r.impact === 'medium').length, color: '#f59e0b' },
                              { name: 'High', value: mockRisks.filter(r => r.impact === 'high').length, color: '#ef4444' },
                              { name: 'Critical', value: mockRisks.filter(r => r.impact === 'critical').length, color: '#7f1d1d' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates across projects, risks, and documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[
                      { 
                        id: 1, 
                        type: 'project', 
                        title: 'Infrastructure Upgrade Project', 
                        action: 'status-update', 
                        details: 'Status changed to In Progress', 
                        timestamp: '2 hours ago',
                        icon: <Briefcase className="h-4 w-4" />
                      },
                      { 
                        id: 2, 
                        type: 'risk', 
                        title: 'Supply Chain Disruption', 
                        action: 'new-risk', 
                        details: 'New risk identified with High impact', 
                        timestamp: '1 day ago',
                        icon: <AlertTriangle className="h-4 w-4" />
                      },
                      { 
                        id: 3, 
                        type: 'document', 
                        title: 'Annual Business Plan', 
                        action: 'new-version', 
                        details: 'New version uploaded (v2.3)', 
                        timestamp: '2 days ago',
                        icon: <FileText className="h-4 w-4" />
                      },
                      { 
                        id: 4, 
                        type: 'kpi', 
                        title: 'Operational Efficiency', 
                        action: 'measurement', 
                        details: 'New measurement recorded: 87%', 
                        timestamp: '3 days ago',
                        icon: <Target className="h-4 w-4" />
                      }
                    ].map(activity => (
                      <div key={activity.id} className="flex">
                        <div className="relative mr-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            {activity.icon}
                          </div>
                          {activity.id !== 4 && (
                            <div className="absolute bottom-0 left-0 right-0 top-9 flex justify-center">
                              <div className="w-px bg-border" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.details}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tasks Tab - renamed to Tasks/Daily Operations */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Tasks/Daily Operations</CardTitle>
                      <CardDescription>Tasks across all projects</CardDescription>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex gap-2">
                        <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Filter Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Filter Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={taskProjectFilter} onValueChange={setTaskProjectFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter Project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {uniqueProjects.map(project => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                        <DialogTrigger asChild>
                          <Button className="gap-1">
                            <Plus className="h-4 w-4" /> Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                            <DialogDescription>
                              Create a new task for a project. Fill in all the details below.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-title" className="text-right">
                                Title
                              </Label>
                              <Input id="task-title" placeholder="Task title" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-description" className="text-right">
                                Description
                              </Label>
                              <Textarea id="task-description" placeholder="Task description" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-project" className="text-right">
                                Project
                              </Label>
                              <Select>
                                <SelectTrigger id="task-project" className="col-span-3">
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockProjects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-assignee" className="text-right">
                                Assigned To
                              </Label>
                              <Input id="task-assignee" placeholder="Name of assignee" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-status" className="text-right">
                                Status
                              </Label>
                              <Select>
                                <SelectTrigger id="task-status" className="col-span-3">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not-started">Not Started</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-priority" className="text-right">
                                Priority
                              </Label>
                              <Select>
                                <SelectTrigger id="task-priority" className="col-span-3">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-start-date" className="text-right">
                                Start Date
                              </Label>
                              <Input id="task-start-date" type="date" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-due-date" className="text-right">
                                Due Date
                              </Label>
                              <Input id="task-due-date" type="date" className="col-span-3" />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
                            <Button type="submit">Save Task</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.projectName}</TableCell>
                          <TableCell>{task.assignedTo}</TableCell>
                          <TableCell>
                            <Badge className={
                              task.priority === 'high' ? 'bg-red-500' : 
                              task.priority === 'medium' ? 'bg-amber-500' : 
                              'bg-green-500'
                            }>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {editingTaskId === task.id ? (
                              <Select 
                                defaultValue={task.status}
                                onValueChange={(value) => {
                                  handleStatusChange(task.id, value);
                                  setEditingTaskId(null);
                                }}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div 
                                className="cursor-pointer" 
                                onClick={() => setEditingTaskId(task.id)}
                              >
                                {renderTaskStatusBadge(task.status)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{task.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{task.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs mb-1">{task.completionPercentage}%</span>
                              <div className="w-full bg-gray-200 h-2 rounded-full">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{width: `${task.completionPercentage}%`}}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setTaskToEdit(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setTaskToDelete(task)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Edit Task Dialog */}
              <Dialog open={taskToEdit !== null} onOpenChange={(open) => !open && setTaskToEdit(null)}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                      Update the task details below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {taskToEdit && (
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-title" className="text-right">
                          Title
                        </Label>
                        <Input 
                          id="edit-task-title" 
                          defaultValue={taskToEdit.title} 
                          className="col-span-3" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-description" className="text-right">
                          Description
                        </Label>
                        <Textarea 
                          id="edit-task-description" 
                          defaultValue={taskToEdit.description} 
                          className="col-span-3" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-project" className="text-right">
                          Project
                        </Label>
                        <Select defaultValue={taskToEdit.projectId}>
                          <SelectTrigger id="edit-task-project" className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProjects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-assignee" className="text-right">
                          Assigned To
                        </Label>
                        <Input 
                          id="edit-task-assignee" 
                          defaultValue={taskToEdit.assignedTo} 
                          className="col-span-3" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-status" className="text-right">
                          Status
                        </Label>
                        <Select defaultValue={taskToEdit.status}>
                          <SelectTrigger id="edit-task-status" className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-priority" className="text-right">
                          Priority
                        </Label>
                        <Select defaultValue={taskToEdit.priority}>
                          <SelectTrigger id="edit-task-priority" className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-start-date" className="text-right">
                          Start Date
                        </Label>
                        <Input 
                          id="edit-task-start-date" 
                          type="date" 
                          defaultValue={taskToEdit.startDate.toISOString().split('T')[0]} 
                          className="col-span-3" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-due-date" className="text-right">
                          Due Date
                        </Label>
                        <Input 
                          id="edit-task-due-date" 
                          type="date" 
                          defaultValue={taskToEdit.dueDate.toISOString().split('T')[0]} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTaskToEdit(null)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete Task Confirmation Dialog */}
              <Dialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {taskToDelete && (
                      <p className="font-medium">{taskToDelete.title}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        // In a real app, this would call an API to delete the task
                        console.log(`Deleting task: ${taskToDelete?.id}`);
                        setTaskToDelete(null);
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* KRAs Tab */}
            <TabsContent value="kras">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Key Result Areas</CardTitle>
                      <CardDescription>Strategic objectives and KPIs</CardDescription>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex gap-2">
                        <Select value={kraStatusFilter} onValueChange={setKraStatusFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Filter Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={kraDepartmentFilter} onValueChange={setKraDepartmentFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {uniqueDepartments.map(department => (
                              <SelectItem key={department} value={department}>{department}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Dialog open={showKraDialog} onOpenChange={setShowKraDialog}>
                        <DialogTrigger asChild>
                          <Button className="gap-1">
                            <Plus className="h-4 w-4" /> Add KRA
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add New Key Result Area</DialogTitle>
                            <DialogDescription>
                              Create a new KRA with associated KPIs. Fill in the details below.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-name" className="text-right">
                                Name
                              </Label>
                              <Input id="kra-name" placeholder="KRA name" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-objective" className="text-right">
                                Objective
                              </Label>
                              <Input id="kra-objective" placeholder="Objective name" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-department" className="text-right">
                                Department
                              </Label>
                              <Input id="kra-department" placeholder="Department" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-responsible" className="text-right">
                                Responsible
                              </Label>
                              <Input id="kra-responsible" placeholder="Person responsible" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-start-date" className="text-right">
                                Start Date
                              </Label>
                              <Input id="kra-start-date" type="date" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-end-date" className="text-right">
                                End Date
                              </Label>
                              <Input id="kra-end-date" type="date" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="kra-status" className="text-right">
                                Status
                              </Label>
                              <Select>
                                <SelectTrigger id="kra-status" className="col-span-3">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="border-t pt-4 mt-2">
                              <h4 className="font-medium mb-2">Initial KPI</h4>
                              
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="kpi-name" className="text-right">
                                  KPI Name
                                </Label>
                                <Input id="kpi-name" placeholder="KPI name" className="col-span-3" />
                              </div>
                              
                              <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label htmlFor="kpi-target" className="text-right">
                                  Target
                                </Label>
                                <Input id="kpi-target" placeholder="Target value" className="col-span-3" />
                              </div>
                              
                              <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label htmlFor="kpi-date" className="text-right">
                                  Due Date
                                </Label>
                                <Input id="kpi-date" type="date" className="col-span-3" />
                              </div>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowKraDialog(false)}>Cancel</Button>
                            <Button type="submit">Save KRA</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="kraKpi" className="w-full">
                    <TabsList className="mb-6 w-full justify-start">
                      <TabsTrigger value="kraKpi">KRAs/KPIs</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                      <TabsTrigger value="kraStats">KRA Statistics</TabsTrigger>
                    </TabsList>
                    
                    {/* KRAs/KPIs Tab - Table View */}
                    <TabsContent value="kraKpi">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Objective</TableHead>
                            <TableHead>KRA</TableHead>
                            <TableHead>KPI</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Actual</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Responsible</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockKRAs.flatMap(kra => 
                            kra.kpis.map(kpi => (
                              <TableRow key={`${kra.id}-${kpi.id}`}>
                                <TableCell className="font-medium">{kra.objectiveName}</TableCell>
                                <TableCell>{kra.name}</TableCell>
                                <TableCell>{kpi.name}</TableCell>
                                <TableCell>{kpi.target}</TableCell>
                                <TableCell>{kpi.actual}</TableCell>
                                <TableCell>
                                  {editingKpiId === kpi.id ? (
                                    <Select 
                                      defaultValue={kpi.status}
                                      onValueChange={(value) => {
                                        handleKpiStatusChange(kpi.id, value);
                                        setEditingKpiId(null);
                                      }}
                                    >
                                      <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {kpiStatusOptions.map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div 
                                      className="cursor-pointer" 
                                      onClick={() => setEditingKpiId(kpi.id)}
                                    >
                                      <Badge className={
                                        kpi.status === 'completed' ? 'bg-green-500' : 
                                        kpi.status === 'in-progress' ? 'bg-blue-500' : 
                                        kpi.status === 'started' ? 'bg-amber-500' : 
                                        kpi.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                                      }>
                                        {kpi.status}
                                      </Badge>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{kpi.startDate.toLocaleDateString()}</TableCell>
                                <TableCell>{kpi.date.toLocaleDateString()}</TableCell>
                                <TableCell>{kra.department}</TableCell>
                                <TableCell>{kra.responsible}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleKpiEdit(kpi)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleKpiDelete(kpi)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    {/* Insights Tab */}
                    <TabsContent value="insights">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>KPI Status Distribution</CardTitle>
                            <CardDescription>Distribution of KPI statuses across all KRAs</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {['on-track', 'at-risk', 'behind'].map(status => {
                                const count = mockKRAs.flatMap(kra => kra.kpis).filter(kpi => kpi.status === status).length;
                                const totalKpis = mockKRAs.flatMap(kra => kra.kpis).length;
                                const percentage = Math.round((count / totalKpis) * 100);
                                
                                return (
                                  <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="capitalize">{status.replace('-', ' ')}</span>
                                      <span>{percentage}% ({count} KPIs)</span>
                                    </div>
                                    <Progress 
                                      value={percentage} 
                                      className={
                                        status === 'on-track' ? 'bg-green-100' : 
                                        status === 'at-risk' ? 'bg-amber-100' : 
                                        'bg-red-100'
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>KRA Progress Overview</CardTitle>
                            <CardDescription>Overall progress of Key Result Areas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {mockKRAs.map(kra => (
                                <div key={kra.id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{kra.name}</span>
                                    <span>{kra.progress}%</span>
                                  </div>
                                  <Progress 
                                    value={kra.progress} 
                                    className={
                                      kra.progress >= 75 ? 'bg-green-100' : 
                                      kra.progress >= 50 ? 'bg-amber-100' : 
                                      'bg-red-100'
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Department Performance</CardTitle>
                            <CardDescription>KRA progress by department</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {Array.from(new Set(mockKRAs.map(kra => kra.department))).map(department => {
                                const departmentKras = mockKRAs.filter(kra => kra.department === department);
                                const avgProgress = Math.round(
                                  departmentKras.reduce((sum, kra) => sum + kra.progress, 0) / departmentKras.length
                                );
                                
                                return (
                                  <div key={department} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{department}</span>
                                      <span>{avgProgress}%</span>
                                    </div>
                                    <Progress 
                                      value={avgProgress} 
                                      className={
                                        avgProgress >= 75 ? 'bg-green-100' : 
                                        avgProgress >= 50 ? 'bg-amber-100' : 
                                        'bg-red-100'
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Key Insights</CardTitle>
                            <CardDescription>Critical observations from KRA data</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">Strong Performance</p>
                                  <p className="text-sm text-muted-foreground">Market Share KRA is ahead of schedule at 75% completion</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">Areas of Concern</p>
                                  <p className="text-sm text-muted-foreground">Customer Acquisition KPI is at risk of missing its target</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">Opportunities</p>
                                  <p className="text-sm text-muted-foreground">Customer Satisfaction scores are trending upward month over month</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">Action Required</p>
                                  <p className="text-sm text-muted-foreground">Response Time KPI needs additional resources to meet target</p>
                                </div>
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* KRA Statistics Tab - Original Content */}
                    <TabsContent value="kraStats">
                      <KRATimeline kras={filteredKRAs} />
                      
                      <div className="grid grid-cols-1 gap-6 mt-6">
                        {filteredKRAs.map((kra) => (
                          <Card key={kra.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle>{kra.name}</CardTitle>
                                  <CardDescription>Objective: {kra.objectiveName}</CardDescription>
                                </div>
                                <Badge className={kra.status === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'}>
                                  {kra.status === 'in-progress' ? 'In Progress' : kra.status === 'open' ? 'Open' : 'Closed'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm text-gray-500">Progress: {kra.progress}%</span>
                                  <span className="text-sm text-gray-500">{kra.responsible}</span>
                                </div>
                                <Progress value={kra.progress} className="mb-6" />
                                
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Key Performance Indicators</h4>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Plus className="h-3 w-3" /> Add KPI
                                  </Button>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>KPI</TableHead>
                                      <TableHead>Target</TableHead>
                                      <TableHead>Actual</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Start Date</TableHead>
                                      <TableHead>Due Date</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {kra.kpis.map((kpi) => (
                                      <TableRow key={kpi.id}>
                                        <TableCell className="font-medium">{kpi.name}</TableCell>
                                        <TableCell>{kpi.target}</TableCell>
                                        <TableCell>{kpi.actual}</TableCell>
                                        <TableCell>
                                          <Badge className={
                                            kpi.status === 'on-track' ? 'bg-green-500' : 
                                            kpi.status === 'at-risk' ? 'bg-amber-500' : 
                                            kpi.status === 'behind' ? 'bg-red-500' : 'bg-gray-500'
                                          }>
                                            {kpi.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{kpi.startDate.toLocaleDateString()}</TableCell>
                                        <TableCell>{kpi.date.toLocaleDateString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* KPI Edit Dialog */}
            <Dialog open={kpiToEdit !== null} onOpenChange={(open) => !open && setKpiToEdit(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit KPI</DialogTitle>
                  <DialogDescription>
                    Update the KPI details below.
                  </DialogDescription>
                </DialogHeader>
                
                {kpiToEdit && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-name" className="text-right">
                        Name
                      </Label>
                      <Input 
                        id="edit-kpi-name" 
                        defaultValue={kpiToEdit.name} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-description" className="text-right">
                        Description
                      </Label>
                      <Textarea 
                        id="edit-kpi-description" 
                        defaultValue={kpiToEdit.description} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-target" className="text-right">
                        Target
                      </Label>
                      <Input 
                        id="edit-kpi-target" 
                        defaultValue={kpiToEdit.target} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-actual" className="text-right">
                        Actual
                      </Label>
                      <Input 
                        id="edit-kpi-actual" 
                        defaultValue={kpiToEdit.actual} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-status" className="text-right">
                        Status
                      </Label>
                      <Select defaultValue={kpiToEdit.status}>
                        <SelectTrigger id="edit-kpi-status" className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kpiStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-start-date" className="text-right">
                        Start Date
                      </Label>
                      <Input 
                        id="edit-kpi-start-date" 
                        type="date" 
                        defaultValue={kpiToEdit.startDate.toISOString().split('T')[0]} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-due-date" className="text-right">
                        Due Date
                      </Label>
                      <Input 
                        id="edit-kpi-due-date" 
                        type="date" 
                        defaultValue={kpiToEdit.date.toISOString().split('T')[0]} 
                        className="col-span-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-kpi-notes" className="text-right">
                        Notes
                      </Label>
                      <Textarea 
                        id="edit-kpi-notes" 
                        defaultValue={kpiToEdit.notes} 
                        className="col-span-3" 
                      />
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setKpiToEdit(null)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Delete KPI Confirmation Dialog */}
            <Dialog open={kpiToDelete !== null} onOpenChange={(open) => !open && setKpiToDelete(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this KPI? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {kpiToDelete && (
                    <p className="font-medium">{kpiToDelete.name}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setKpiToDelete(null)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      // In a real app, this would call an API to delete the KPI
                      console.log(`Deleting KPI: ${kpiToDelete?.id}`);
                      setKpiToDelete(null);
                    }}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Projects</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.id}</TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{project.description}</TableCell>
                          <TableCell>
                            <Select defaultValue={project.status}>
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{project.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{project.endDate.toLocaleDateString()}</TableCell>
                          <TableCell>{project.manager}</TableCell>
                          <TableCell>{project.budget}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Risk Register</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Risk
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Likelihood</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRisks.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell>{risk.id}</TableCell>
                          <TableCell>{risk.title}</TableCell>
                          <TableCell>{risk.category}</TableCell>
                          <TableCell>{risk.projectName}</TableCell>
                          <TableCell>
                            <Badge className={
                              risk.impact === 'low' ? 'bg-green-100 text-green-800' :
                              risk.impact === 'medium' ? 'bg-amber-100 text-amber-800' :
                              risk.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              risk.likelihood === 'low' ? 'bg-green-100 text-green-800' :
                              risk.likelihood === 'medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {risk.likelihood.charAt(0).toUpperCase() + risk.likelihood.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{risk.projectName}</TableCell>
                          <TableCell>{risk.owner}</TableCell>
                          <TableCell>
                            <StatusDropdown 
                              currentStatus={risk.status} 
                              onStatusChange={(status) => handleStatusChange(risk.id, status, 'risk')}
                              options={[
                                { value: 'identified', label: 'Identified' },
                                { value: 'analyzing', label: 'Analyzing' },
                                { value: 'mitigating', label: 'Mitigating' },
                                { value: 'monitoring', label: 'Monitoring' },
                                { value: 'resolved', label: 'Resolved' },
                              ]}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(risk.id, 'risk')}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(risk.id, 'risk')}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Documents</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.id}</TableCell>
                          <TableCell>{doc.name}</TableCell>
                          <TableCell>{doc.category}</TableCell>
                          <TableCell>
                            <Select defaultValue={doc.status}>
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{doc.dateAdded}</TableCell>
                          <TableCell>{doc.owner}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(doc.id, 'document')}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, 'document')}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* User Asset Management Tab */}
            <TabsContent value="assets">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>User Asset Management</CardTitle>
                      <CardDescription>Track and manage all user assigned assets</CardDescription>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex gap-2">
                        <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Filter Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="laptop">Laptop</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={assetStatusFilter} onValueChange={setAssetStatusFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
                        <DialogTrigger asChild>
                          <Button className="gap-1">
                            <Plus className="h-4 w-4" /> Add Asset
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Add New Asset</DialogTitle>
                            <DialogDescription>
                              Register a new asset and assign it to a user.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-name" className="text-right">
                                Name
                              </Label>
                              <Input id="asset-name" placeholder="Asset name" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-type" className="text-right">
                                Type
                              </Label>
                              <Select>
                                <SelectTrigger id="asset-type" className="col-span-3">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="laptop">Laptop</SelectItem>
                                  <SelectItem value="mobile">Mobile</SelectItem>
                                  <SelectItem value="tablet">Tablet</SelectItem>
                                  <SelectItem value="software">Software</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-serial" className="text-right">
                                Serial Number
                              </Label>
                              <Input id="asset-serial" placeholder="Serial number" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-assigned" className="text-right">
                                Assigned To
                              </Label>
                              <Input id="asset-assigned" placeholder="Assigned user" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-department" className="text-right">
                                Department
                              </Label>
                              <Input id="asset-department" placeholder="Department" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-purchase" className="text-right">
                                Purchase Date
                              </Label>
                              <Input id="asset-purchase" type="date" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-warranty" className="text-right">
                                Warranty Expiry
                              </Label>
                              <Input id="asset-warranty" type="date" className="col-span-3" />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-status" className="text-right">
                                Status
                              </Label>
                              <Select>
                                <SelectTrigger id="asset-status" className="col-span-3">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="asset-notes" className="text-right">
                                Notes
                              </Label>
                              <Textarea id="asset-notes" placeholder="Additional notes" className="col-span-3" />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssetDialog(false)}>Cancel</Button>
                            <Button type="submit">Save Asset</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warranty Expiry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell className="capitalize">{asset.type}</TableCell>
                          <TableCell>{asset.serialNumber}</TableCell>
                          <TableCell>{asset.assignedTo}</TableCell>
                          <TableCell>{asset.department}</TableCell>
                          <TableCell>{renderAssetStatusBadge(asset.status)}</TableCell>
                          <TableCell>{asset.warrantyExpiry.toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* AI Chat Assistant */}
        {showAiChat && (
          <div className="w-80 bg-card rounded-lg shadow-lg border overflow-hidden flex flex-col transition-all">
            <div className="p-4 bg-muted">
              <h3 className="font-semibold">AI Insights Assistant</h3>
              <p className="text-xs text-muted-foreground">Ask questions about your data</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-background h-[500px]">
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">How can I help you understand your dashboard data today?</p>
                </div>
                {/* Chat messages would appear here */}
              </div>
            </div>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask a question..." 
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Unit; 