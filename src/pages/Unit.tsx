import React, { useState, useEffect } from 'react';
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
import { AlertTriangle, CheckCircle, Clock, Target, Calendar, User, BarChart2, Flag, Filter, Plus, Edit, Trash2, Briefcase, FileText, Download, ArrowUp, ArrowDown, MoreHorizontal, Upload, Play, ArrowRight } from 'lucide-react';
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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useToast } from "@/components/ui/use-toast";

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

// Mock data for the application
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Modernize company website with new branding",
    status: "in-progress",
    startDate: new Date("2023-01-15"),
    endDate: new Date("2023-06-30"),
    manager: "Jane Smith",
    budget: 75000,
    budgetSpent: 45000,
    progress: 60,
    risks: [],
    tasks: []
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Create a mobile app for customer engagement",
    status: "planned",
    startDate: new Date("2023-07-01"),
    endDate: new Date("2023-12-31"),
    manager: "John Doe",
    budget: 120000,
    budgetSpent: 0,
    progress: 0,
    risks: [],
    tasks: []
  }
];

const mockRisks: Risk[] = [
  {
    id: "1",
    title: "Budget Overrun",
    description: "Project expenses exceed allocated budget",
    impact: "high",
    likelihood: "medium",
    status: "mitigating",
    category: "Financial",
    projectId: "1",
    projectName: "Website Redesign",
    owner: "Finance Team",
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-03-15")
  },
  {
    id: "2",
    title: "Resource Shortage",
    description: "Insufficient developer resources to meet timeline",
    impact: "medium",
    likelihood: "high",
    status: "identified",
    category: "Resource",
    projectId: "1",
    projectName: "Website Redesign",
    owner: "Project Manager",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2023-02-15")
  }
];

// StatusBadge Component for displaying status with appropriate colors
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTeamViewSwitcher, setShowTeamViewSwitcher] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Convert mock data to state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [kras, setKras] = useState<KRA[]>([]);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  
  // Edit and delete modal states
  const [showEditKpiModal, setShowEditKpiModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<(KPI & { kraId?: string }) | null>(null);
  const [showDeleteKpiModal, setShowDeleteKpiModal] = useState(false);
  const [deletingKpi, setDeletingKpi] = useState<(KPI & { kraId?: string }) | null>(null);
  
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [showEditRiskModal, setShowEditRiskModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [showDeleteRiskModal, setShowDeleteRiskModal] = useState(false);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);

  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<UserAsset | null>(null);
  const [showDeleteAssetModal, setShowDeleteAssetModal] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<UserAsset | null>(null);
  
  // Setup Wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupMethod, setSetupMethod] = useState<'document' | 'manual' | 'demo'>('document');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    objectives: [{ id: '1', title: '', description: '' }],
    kras: [{ id: '1', name: '', objectiveId: '1', responsible: '' }],
    kpis: [{ id: '1', name: '', kraId: '1', target: '', actual: '' }],
    tasks: [{ id: '1', title: '', assignedTo: '', dueDate: '' }],
    projects: [{ 
      id: '1', 
      name: '', 
      description: '', 
      status: 'planned', 
      startDate: '', 
      endDate: '', 
      manager: '', 
      budget: 0, 
      budgetSpent: 0, 
      progress: 0
    }],
    risks: [{ 
      id: '1', 
      title: '', 
      description: '', 
      impact: 'medium', 
      likelihood: 'medium', 
      status: 'identified', 
      category: '', 
      projectId: '1', 
      projectName: '', 
      owner: '' 
    }],
    assets: [{ 
      id: '1', 
      name: '', 
      type: 'laptop', 
      serialNumber: '', 
      assignedTo: '', 
      department: '', 
      purchaseDate: '', 
      warrantyExpiry: '', 
      status: 'active', 
      notes: '' 
    }]
  });
  
  // Initialize data from mock data
  useEffect(() => {
    try {
      setProjects(mockProjects || []);
      setTasks(mockTasks || []);
      setRisks(mockRisks || []);
      setKras(mockKRAs || []);
      setAssets(mockAssets || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing data:", err);
      setError("Failed to initialize dashboard data");
      setIsLoading(false);
    }
  }, []);
  
  // Function to handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(filesArray);
      
      // Simulate AI processing of documents
      setTimeout(() => {
        setExtractedData({
          objectives: [
            { id: '1', title: 'Improve Customer Satisfaction', description: 'Enhance customer experience across all touchpoints' },
            { id: '2', title: 'Increase Operational Efficiency', description: 'Streamline processes to reduce costs and improve productivity' }
          ],
          kras: [
            { id: '1', name: 'Customer Service Excellence', objectiveId: '1', responsible: 'Customer Service Team' },
            { id: '2', name: 'Process Optimization', objectiveId: '2', responsible: 'Operations Team' }
          ],
          kpis: [
            { id: '1', name: 'Customer Satisfaction Score', kraId: '1', target: '90%', actual: '85%' },
            { id: '2', name: 'Average Response Time', kraId: '1', target: '24 hours', actual: '28 hours' },
            { id: '3', name: 'Process Cycle Time', kraId: '2', target: '3 days', actual: '4 days' }
          ],
          tasks: [
            { id: '1', title: 'Implement Customer Feedback System', assignedTo: 'Jane Smith', dueDate: '2023-12-15' },
            { id: '2', title: 'Train Customer Service Representatives', assignedTo: 'John Doe', dueDate: '2023-11-30' },
            { id: '3', title: 'Map Current Process Flows', assignedTo: 'Alex Wong', dueDate: '2023-12-05' }
          ],
          projects: [
            { 
              id: '1', 
              name: 'Website Redesign', 
              description: 'Modernize company website with new branding', 
              status: 'in-progress', 
              startDate: '2023-01-15', 
              endDate: '2023-06-30', 
              manager: 'Jane Smith', 
              budget: 75000, 
              budgetSpent: 45000, 
              progress: 60
            },
            { 
              id: '2', 
              name: 'Mobile App Development', 
              description: 'Create a mobile app for customer engagement', 
              status: 'planned', 
              startDate: '2023-07-01', 
              endDate: '2023-12-31', 
              manager: 'John Doe', 
              budget: 120000, 
              budgetSpent: 0, 
              progress: 0
            }
          ],
          risks: [
            { 
              id: '1', 
              title: 'Budget Overrun', 
              description: 'Project expenses exceed allocated budget', 
              impact: 'high', 
              likelihood: 'medium', 
              status: 'mitigating', 
              category: 'Financial', 
              projectId: '1', 
              projectName: 'Website Redesign', 
              owner: 'Finance Team'
            },
            { 
              id: '2', 
              title: 'Resource Shortage', 
              description: 'Insufficient developer resources to meet timeline', 
              impact: 'medium', 
              likelihood: 'high', 
              status: 'identified', 
              category: 'Resource', 
              projectId: '1', 
              projectName: 'Website Redesign', 
              owner: 'Project Manager'
            }
          ],
          assets: [
            { 
              id: '1', 
              name: 'MacBook Pro 16"', 
              type: 'laptop', 
              serialNumber: 'MP123456789', 
              assignedTo: 'John Smith', 
              department: 'Engineering', 
              purchaseDate: '2022-06-15', 
              warrantyExpiry: '2025-06-15', 
              status: 'active', 
              notes: '16GB RAM, 1TB SSD'
            },
            { 
              id: '2', 
              name: 'iPhone 14 Pro', 
              type: 'mobile', 
              serialNumber: 'IP987654321', 
              assignedTo: 'Jane Doe', 
              department: 'Marketing', 
              purchaseDate: '2022-09-20', 
              warrantyExpiry: '2024-09-20', 
              status: 'active', 
              notes: '256GB, Graphite'
            }
          ]
        });
      }, 3000);
    }
  };
  
  // Function to load demo data
  const loadDemoData = () => {
    const demoData = {
      objectives: [
        { id: '1', title: 'Improve Customer Satisfaction', description: 'Enhance customer experience across all touchpoints' },
        { id: '2', title: 'Increase Operational Efficiency', description: 'Streamline processes to reduce costs and improve productivity' },
        { id: '3', title: 'Expand Market Reach', description: 'Develop new markets and customer segments' },
        { id: '4', title: 'Enhance Product Innovation', description: 'Develop new products and features that meet evolving customer needs' },
        { id: '5', title: 'Strengthen Team Capabilities', description: 'Invest in employee development and organizational learning' }
      ],
      kras: [
        { id: '1', name: 'Customer Service Excellence', objectiveId: '1', responsible: 'Customer Service Team' },
        { id: '2', name: 'Process Optimization', objectiveId: '2', responsible: 'Operations Team' },
        { id: '3', name: 'Digital Marketing', objectiveId: '3', responsible: 'Marketing Team' },
        { id: '4', name: 'Product Development Lifecycle', objectiveId: '4', responsible: 'Product Team' },
        { id: '5', name: 'Learning & Development', objectiveId: '5', responsible: 'HR Team' }
      ],
      kpis: [
        { id: '1', name: 'Customer Satisfaction Score', kraId: '1', target: '90%', actual: '85%' },
        { id: '2', name: 'Average Response Time', kraId: '1', target: '24 hours', actual: '28 hours' },
        { id: '3', name: 'Process Cycle Time', kraId: '2', target: '3 days', actual: '4 days' },
        { id: '4', name: 'Cost per Operation', kraId: '2', target: '$15', actual: '$17.50' },
        { id: '5', name: 'Social Media Engagement', kraId: '3', target: '25,000 interactions', actual: '22,500 interactions' },
        { id: '6', name: 'Market Share Growth', kraId: '3', target: '15%', actual: '12%' },
        { id: '7', name: 'New Product Launch Timeline', kraId: '4', target: '6 months', actual: '7 months' },
        { id: '8', name: 'Feature Adoption Rate', kraId: '4', target: '60%', actual: '55%' },
        { id: '9', name: 'Training Hours per Employee', kraId: '5', target: '40 hours', actual: '32 hours' },
        { id: '10', name: 'Employee Satisfaction Score', kraId: '5', target: '85%', actual: '80%' }
      ],
      tasks: [
        { id: '1', title: 'Implement Customer Feedback System', assignedTo: 'Jane Smith', dueDate: '2023-12-15', startDate: '2023-11-01', status: 'in-progress', completionPercentage: 65, priority: 'high', description: 'Set up automated customer feedback collection and analysis', projectId: '1', projectName: 'Website Redesign' },
        { id: '2', title: 'Train Customer Service Representatives', assignedTo: 'John Doe', dueDate: '2023-11-30', startDate: '2023-11-15', status: 'not-started', completionPercentage: 0, priority: 'medium', description: 'Conduct training sessions on new customer service protocols', projectId: '1', projectName: 'Website Redesign' },
        { id: '3', title: 'Map Current Process Flows', assignedTo: 'Alex Wong', dueDate: '2023-12-05', startDate: '2023-11-10', status: 'completed', completionPercentage: 100, priority: 'medium', description: 'Document and analyze existing operational processes', projectId: '2', projectName: 'Mobile App Development' },
        { id: '4', title: 'Develop Social Media Campaign', assignedTo: 'Sarah Johnson', dueDate: '2023-12-20', startDate: '2023-11-25', status: 'not-started', completionPercentage: 0, priority: 'high', description: 'Create and execute a targeted social media marketing campaign', projectId: '3', projectName: 'Market Expansion Initiative' },
        { id: '5', title: 'Conduct User Research', assignedTo: 'Michael Chen', dueDate: '2023-12-10', startDate: '2023-11-20', status: 'in-progress', completionPercentage: 40, priority: 'high', description: 'Interview customers to gather insights for product development', projectId: '4', projectName: 'Product Innovation Lab' }
      ],
      projects: [
        { 
          id: '1', 
          name: 'Website Redesign', 
          description: 'Modernize company website with new branding', 
          status: 'in-progress', 
          startDate: '2023-01-15', 
          endDate: '2023-06-30', 
          manager: 'Jane Smith', 
          budget: 75000, 
          budgetSpent: 45000, 
          progress: 60,
          risks: [],
          tasks: []
        },
        { 
          id: '2', 
          name: 'Mobile App Development', 
          description: 'Create a mobile app for customer engagement', 
          status: 'planned', 
          startDate: '2023-07-01', 
          endDate: '2023-12-31', 
          manager: 'John Doe', 
          budget: 120000, 
          budgetSpent: 0, 
          progress: 0,
          risks: [],
          tasks: []
        },
        { 
          id: '3', 
          name: 'Market Expansion Initiative', 
          description: 'Enter new geographic markets in the Asia-Pacific region', 
          status: 'in-progress', 
          startDate: '2023-03-01', 
          endDate: '2024-02-28', 
          manager: 'Michael Chen', 
          budget: 250000, 
          budgetSpent: 75000, 
          progress: 30,
          risks: [],
          tasks: []
        },
        { 
          id: '4', 
          name: 'Product Innovation Lab', 
          description: 'Develop next-generation product features through rapid prototyping', 
          status: 'in-progress', 
          startDate: '2023-02-15', 
          endDate: '2023-08-30', 
          manager: 'Lisa Wong', 
          budget: 180000, 
          budgetSpent: 110000, 
          progress: 70,
          risks: [],
          tasks: []
        },
        { 
          id: '5', 
          name: 'Customer Loyalty Program', 
          description: 'Design and implement a rewards program for repeat customers', 
          status: 'planned', 
          startDate: '2023-09-01', 
          endDate: '2024-03-31', 
          manager: 'Robert Johnson', 
          budget: 95000, 
          budgetSpent: 0, 
          progress: 0,
          risks: [],
          tasks: []
        }
      ],
      risks: [
        { 
          id: '1', 
          title: 'Budget Overrun', 
          description: 'Project expenses exceed allocated budget', 
          impact: 'high', 
          likelihood: 'medium', 
          status: 'mitigating', 
          category: 'Financial', 
          projectId: '1', 
          projectName: 'Website Redesign', 
          owner: 'Finance Team',
          createdAt: new Date('2023-02-10'),
          updatedAt: new Date('2023-03-15')
        },
        { 
          id: '2', 
          title: 'Resource Shortage', 
          description: 'Insufficient developer resources to meet timeline', 
          impact: 'medium', 
          likelihood: 'high', 
          status: 'identified', 
          category: 'Resource', 
          projectId: '1', 
          projectName: 'Website Redesign', 
          owner: 'Project Manager',
          createdAt: new Date('2023-02-15'),
          updatedAt: new Date('2023-02-15')
        },
        { 
          id: '3', 
          title: 'Regulatory Compliance', 
          description: 'New regulations in target markets may affect expansion', 
          impact: 'critical', 
          likelihood: 'medium', 
          status: 'analyzing', 
          category: 'Legal', 
          projectId: '3', 
          projectName: 'Market Expansion Initiative', 
          owner: 'Legal Department',
          createdAt: new Date('2023-03-10'),
          updatedAt: new Date('2023-03-25')
        },
        { 
          id: '4', 
          title: 'Technology Integration Issues', 
          description: 'Challenges in integrating new systems with legacy infrastructure', 
          impact: 'high', 
          likelihood: 'high', 
          status: 'mitigating', 
          category: 'Technical', 
          projectId: '2', 
          projectName: 'Mobile App Development', 
          owner: 'IT Department',
          createdAt: new Date('2023-04-05'),
          updatedAt: new Date('2023-04-20')
        },
        { 
          id: '5', 
          title: 'Market Acceptance', 
          description: 'New product features may not meet market expectations', 
          impact: 'medium', 
          likelihood: 'medium', 
          status: 'monitoring', 
          category: 'Market', 
          projectId: '4', 
          projectName: 'Product Innovation Lab', 
          owner: 'Product Manager',
          createdAt: new Date('2023-03-01'),
          updatedAt: new Date('2023-04-15')
        }
      ],
      assets: [
        { 
          id: '1', 
          name: 'MacBook Pro 16"', 
          type: 'laptop', 
          serialNumber: 'MP123456789', 
          assignedTo: 'John Smith', 
          department: 'Engineering', 
          purchaseDate: '2022-06-15', 
          warrantyExpiry: '2025-06-15', 
          status: 'active', 
          notes: '16GB RAM, 1TB SSD'
        },
        { 
          id: '2', 
          name: 'iPhone 14 Pro', 
          type: 'mobile', 
          serialNumber: 'IP987654321', 
          assignedTo: 'Jane Doe', 
          department: 'Marketing', 
          purchaseDate: '2022-09-20', 
          warrantyExpiry: '2024-09-20', 
          status: 'active', 
          notes: '256GB, Graphite'
        },
        { 
          id: '3', 
          name: 'Dell XPS 15', 
          type: 'laptop', 
          serialNumber: 'DX567890123', 
          assignedTo: 'Michael Chen', 
          department: 'Sales', 
          purchaseDate: '2022-04-10', 
          warrantyExpiry: '2025-04-10', 
          status: 'active', 
          notes: '32GB RAM, 2TB SSD'
        },
        { 
          id: '4', 
          name: 'Adobe Creative Cloud', 
          type: 'software', 
          serialNumber: 'AC789012345', 
          assignedTo: 'Design Team', 
          department: 'Marketing', 
          purchaseDate: '2023-01-15', 
          warrantyExpiry: '2024-01-15', 
          status: 'active', 
          notes: '10 user license'
        },
        { 
          id: '5', 
          name: 'Surface Pro 8', 
          type: 'tablet', 
          serialNumber: 'SP234567890', 
          assignedTo: 'Lisa Wong', 
          department: 'Product', 
          purchaseDate: '2022-11-05', 
          warrantyExpiry: '2024-11-05', 
          status: 'active', 
          notes: '16GB RAM, 512GB SSD, with keyboard and pen'
        }
      ]
    };
    
    // Set the demo data to be used in the wizard and update mockData for immediate dashboard display
    setExtractedData(demoData);
    
    // Move to next step
    setSetupStep(2);
  };
  
  // Functions for handling setup wizard steps
  const handleNextStep = () => {
    if (setupStep < 4) {
      setSetupStep(prev => prev + 1);
    } else {
      // Handle form submission - in a real app, this would likely involve API calls
      setShowSetupWizard(false);
      
      // Use either extracted data or manually entered data
      const finalData = extractedData || formData;
      
      // Update state with the final data for dashboard display
      // Convert all string dates to Date objects as needed
      if (finalData.projects?.length > 0) {
        const processedProjects = finalData.projects.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          risks: [],
          tasks: []
        }));
        
        // Update the projects data using state setter
        setProjects(processedProjects);
      }
      
      if (finalData.tasks?.length > 0) {
        const processedTasks = finalData.tasks.map((t: any) => ({
          ...t,
          startDate: t.startDate ? new Date(t.startDate) : new Date(),
          dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
          completionPercentage: t.completionPercentage || 0,
          status: t.status || 'not-started',
          priority: t.priority || 'medium',
          description: t.description || '',
          projectId: t.projectId || '',
          projectName: t.projectName || ''
        }));
        
        // Update the tasks data using state setter
        setTasks(processedTasks);
      }
      
      if (finalData.risks?.length > 0) {
        const processedRisks = finalData.risks.map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
        }));
        
        // Update the risks data using state setter
        setRisks(processedRisks);
      }
      
      if (finalData.assets?.length > 0) {
        const processedAssets = finalData.assets.map((asset: any) => ({
          ...asset,
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(),
          warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : new Date(),
          status: asset.status || 'active'
        }));
        
        // Update the assets data using state setter
        setAssets(processedAssets);
      }
      
      if (finalData.kras?.length > 0 && finalData.kpis?.length > 0) {
        // Process KRAs and their associated KPIs
        const processedKRAs = finalData.kras.map((kra: any) => {
          // Prepare timeline data
          const startDate = new Date();
          const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          
          // Generate status data for KPIs
          const statusOptions = ['on-track', 'at-risk', 'behind', 'completed'];
          
          // Find KPIs associated with this KRA
          const kraKPIs = finalData.kpis.filter((kpi: any) => kpi.kraId === kra.id).map((kpi: any) => {
            // Generate a random status for demo data
            const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            
            return {
              ...kpi,
              date: new Date(),
              startDate: new Date(),
              status: kpi.status || randomStatus,
              description: kpi.description || '',
              notes: kpi.notes || ''
            };
          });
          
          return {
            ...kra,
            objectiveName: finalData.objectives.find((o: any) => o.id === kra.objectiveId)?.title || '',
            department: kra.department || '',
            startDate,
            endDate,
            progress: Math.floor(Math.random() * 100),
            status: 'in-progress' as 'in-progress',
            kpis: kraKPIs,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
        
        // Update the KRAs data using state setter
        setKras(processedKRAs);
      }
      
      // Reset the extracted data to clear the wizard if reopened
      setExtractedData(null);
      
      // Here you would update your application state with the new data
      console.log('Setup completed with data:', finalData);
      
      // Show a success message
      toast({
        title: "Setup Completed",
        description: "Your unit data has been successfully configured and applied to all tabs.",
      });
      
      // Set the active tab to KRAs to showcase the configured sub-tabs
      setActiveTab("kras");
    }
  };
  
  const handlePrevStep = () => {
    if (setupStep > 1) {
      setSetupStep(prev => prev - 1);
    }
  };

  // Mock data for tasks
  const mockTasks: Task[] = [
    {
      id: "1",
      title: "Design Homepage Wireframes",
      description: "Create wireframes for the new homepage design",
      status: "completed",
      priority: "high",
      assignedTo: "Sarah Johnson",
      startDate: new Date("2023-01-20"),
      dueDate: new Date("2023-02-05"),
      projectId: "1",
      projectName: "Website Redesign",
      completionPercentage: 100
    },
    {
      id: "2",
      title: "Develop Backend API",
      description: "Create RESTful API endpoints for the website",
      status: "in-progress",
      priority: "high",
      assignedTo: "Mike Chen",
      startDate: new Date("2023-02-10"),
      dueDate: new Date("2023-03-15"),
      projectId: "1",
      projectName: "Website Redesign",
      completionPercentage: 65
    },
    {
      id: "3",
      title: "QA Testing",
      description: "Perform quality assurance testing on new features",
      status: "not-started",
      priority: "medium",
      assignedTo: "Lisa Wong",
      startDate: new Date("2023-03-20"),
      dueDate: new Date("2023-04-05"),
      projectId: "1",
      projectName: "Website Redesign",
      completionPercentage: 0
    }
  ];

  // Mock data for KRAs and KPIs
  const mockKRAs: KRA[] = [
    {
      id: "1",
      name: "Customer Satisfaction",
      objectiveId: "1",
      objectiveName: "Improve Customer Experience",
      department: "Customer Service",
      responsible: "CS Manager",
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
      progress: 70,
      status: "in-progress",
      kpis: [
        {
          id: "1",
          name: "Customer Satisfaction Score",
          date: new Date("2023-01-01"),
          startDate: new Date("2023-01-01"),
          target: "85%",
          actual: "78%",
          status: "in-progress",
          description: "Monthly survey results",
          notes: "Trending upward"
        },
        {
          id: "2",
          name: "Customer Retention Rate",
          date: new Date("2023-01-01"),
          startDate: new Date("2023-01-01"),
          target: "90%",
          actual: "87%",
          status: "in-progress",
          description: "Percentage of customers retained",
          notes: "Increased from 85% last quarter"
        }
      ],
      createdAt: "2023-01-01",
      updatedAt: "2023-03-15"
    },
    {
      id: "2",
      name: "Operational Efficiency",
      objectiveId: "2",
      objectiveName: "Streamline Operations",
      department: "Operations",
      responsible: "Ops Director",
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
      progress: 45,
      status: "in-progress",
      kpis: [
        {
          id: "3",
          name: "Process Cycle Time",
          date: new Date("2023-01-01"),
          startDate: new Date("2023-01-01"),
          target: "3 days",
          actual: "4.5 days",
          status: "in-progress",
          description: "Average time to complete core process",
          notes: "Implementing automation to reduce time"
        }
      ],
      createdAt: "2023-01-01",
      updatedAt: "2023-02-28"
    }
  ];

  // Mock user assets
  const mockAssets: UserAsset[] = [
    {
      id: "1",
      name: "MacBook Pro 16\"",
      type: "laptop",
      serialNumber: "MP123456789",
      assignedTo: "John Smith",
      department: "Engineering",
      purchaseDate: new Date("2022-06-15"),
      warrantyExpiry: new Date("2025-06-15"),
      status: "active",
      notes: "16GB RAM, 1TB SSD"
    },
    {
      id: "2",
      name: "iPhone 14 Pro",
      type: "mobile",
      serialNumber: "IP987654321",
      assignedTo: "Jane Doe",
      department: "Marketing",
      purchaseDate: new Date("2022-09-20"),
      warrantyExpiry: new Date("2024-09-20"),
      status: "active",
      notes: "256GB, Graphite"
    }
  ];

  // Add a helper function to update form data
  const updateFormField = (
    category: string,
    index: number,
    field: string,
    value: any
  ) => {
    if (extractedData) {
      const updatedCategory = [...extractedData[category]];
      updatedCategory[index] = {
        ...updatedCategory[index],
        [field]: value
      };
      setExtractedData({ ...extractedData, [category]: updatedCategory });
    } else {
      const updatedCategory = [...formData[category]];
      updatedCategory[index] = {
        ...updatedCategory[index],
        [field]: value
      };
      setFormData({ ...formData, [category]: updatedCategory });
    }
  };

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
              {/* Run Setup Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    setShowSetupWizard(true);
                    setSetupStep(1);
                    setExtractedData(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" /> Run Setup
                </Button>
              </div>
              
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
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {projects.filter(p => p.status === 'completed').length} completed
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
                    <div className="text-2xl font-bold">{risks.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {risks.filter(r => r.impact === 'high' || r.impact === 'critical').length} high/critical
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
                              { name: 'Planned', value: projects.filter(p => p.status === 'planned').length, color: '#94a3b8' },
                              { name: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, color: '#f59e0b' },
                              { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#22c55e' },
                              { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, color: '#3b82f6' }
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
                            {
                              [
                                { name: 'Planned', color: '#94a3b8' },
                                { name: 'In Progress', color: '#f59e0b' },
                                { name: 'Completed', color: '#22c55e' },
                                { name: 'On Hold', color: '#3b82f6' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))
                            }
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tasks by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Progress</CardTitle>
                    <CardDescription>
                      Current task status breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Not Started', value: tasks.filter(t => t.status === 'not-started').length, color: '#94a3b8' },
                            { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#f59e0b' },
                            { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#22c55e' },
                            { name: 'Blocked', value: tasks.filter(t => t.status === 'blocked').length, color: '#ef4444' }
                          ]}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Tasks" radius={[0, 6, 6, 0]}>
                            {[
                              { name: 'Not Started', color: '#94a3b8' },
                              { name: 'In Progress', color: '#f59e0b' },
                              { name: 'Completed', color: '#22c55e' },
                              { name: 'Blocked', color: '#ef4444' }
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
              
              {/* Recent Activity and Timeline */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates across projects and tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-full">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Task Completed</p>
                          <p className="text-sm text-muted-foreground">Design Homepage Wireframes</p>
                          <p className="text-xs text-muted-foreground">2 hours ago by Sarah Johnson</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-amber-100 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Task In Progress</p>
                          <p className="text-sm text-muted-foreground">Develop Backend API</p>
                          <p className="text-xs text-muted-foreground">Yesterday by Mike Chen</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-red-100 p-2 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">New Risk Identified</p>
                          <p className="text-sm text-muted-foreground">Resource Shortage</p>
                          <p className="text-xs text-muted-foreground">3 days ago by Project Manager</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>KRA Timeline</CardTitle>
                    <CardDescription>Key result areas progress tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <KRATimeline kras={kras} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Tasks/Daily Operations Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Tasks / Daily Operations</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Task List</CardTitle>
                  <CardDescription>
                    View and manage tasks across all projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{task.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <StatusDropdown 
                              currentStatus={task.status} 
                              onStatusChange={(status) => {
                                // Handle status change
                                const updatedTasks = tasks.map(t => 
                                  t.id === task.id ? {...t, status: status as any} : t
                                );
                                setTasks(updatedTasks);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              task.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : task.priority === 'medium' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.assignedTo}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={task.completionPercentage} className="w-[60px]" />
                              <span>{task.completionPercentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.projectName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowEditTaskModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDeletingTask(task);
                                  setShowDeleteTaskModal(true);
                                }}
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

              {/* Edit Task Modal */}
              <Dialog open={showEditTaskModal} onOpenChange={setShowEditTaskModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  {editingTask && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-title" className="text-right">Title</Label>
                        <Input 
                          id="task-title" 
                          value={editingTask.title} 
                          onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-description" className="text-right">Description</Label>
                        <Textarea 
                          id="task-description" 
                          value={editingTask.description} 
                          onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-assigned" className="text-right">Assigned To</Label>
                        <Input 
                          id="task-assigned" 
                          value={editingTask.assignedTo} 
                          onChange={(e) => setEditingTask({...editingTask, assignedTo: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="task-start-date" className="text-right">Start Date</Label>
                          <Input 
                            id="task-start-date" 
                            type="date"
                            value={editingTask.startDate.toISOString().split('T')[0]}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              startDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="task-due-date" className="text-right">Due Date</Label>
                          <Input 
                            id="task-due-date" 
                            type="date"
                            value={editingTask.dueDate.toISOString().split('T')[0]}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              dueDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-status" className="text-right">Status</Label>
                        <Select 
                          value={editingTask.status}
                          onValueChange={(value) => setEditingTask({...editingTask, status: value as any})}
                        >
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
                        <Label htmlFor="task-priority" className="text-right">Priority</Label>
                        <Select 
                          value={editingTask.priority}
                          onValueChange={(value) => setEditingTask({...editingTask, priority: value as any})}
                        >
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
                        <Label htmlFor="task-completion" className="text-right">Completion %</Label>
                        <Input 
                          id="task-completion" 
                          type="number"
                          min="0"
                          max="100"
                          value={editingTask.completionPercentage} 
                          onChange={(e) => setEditingTask({
                            ...editingTask, 
                            completionPercentage: parseInt(e.target.value) || 0
                          })}
                          className="col-span-3" 
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          // Save the edited task
                          setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
                          setShowEditTaskModal(false);
                          
                          toast({
                            title: "Task Updated",
                            description: "The task has been successfully updated.",
                          });
                        }}>Save Changes</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete Task Modal */}
              <Dialog open={showDeleteTaskModal} onOpenChange={setShowDeleteTaskModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Delete Task</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteTaskModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (deletingTask) {
                          setTasks(tasks.filter(t => t.id !== deletingTask.id));
                          setShowDeleteTaskModal(false);
                          
                          toast({
                            title: "Task Deleted",
                            description: "The task has been successfully deleted.",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* KRAs Tab */}
            <TabsContent value="kras" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Key Result Areas</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add KRA
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>KRAs / KPIs</CardTitle>
                  <CardDescription>
                    Track performance against key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="kpis">
                    <TabsList className="mb-4">
                      <TabsTrigger value="kpis">KPIs</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="kpis">
                      {kras.map((kra) => (
                        <div key={kra.id} className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{kra.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {kra.objectiveName} • {kra.department} • {kra.responsible}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={kra.status} />
                              <Progress value={kra.progress} className="w-[100px]" />
                              <span className="text-sm">{kra.progress}%</span>
                            </div>
                          </div>
                          
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>KPI</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Actual</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {kra.kpis.map((kpi) => (
                                <TableRow key={kpi.id}>
                                  <TableCell className="font-medium">{kpi.name}</TableCell>
                                  <TableCell>{kpi.startDate.toLocaleDateString()}</TableCell>
                                  <TableCell>{kpi.date.toLocaleDateString()}</TableCell>
                                  <TableCell>{kpi.target}</TableCell>
                                  <TableCell>{kpi.actual}</TableCell>
                                  <TableCell>
                                    <StatusDropdown 
                                      currentStatus={kpi.status} 
                                      onStatusChange={(status) => {
                                        // Handle status change
                                        const updatedKras = kras.map(k => {
                                          if (k.id === kra.id) {
                                            const updatedKpis = k.kpis.map(p => 
                                              p.id === kpi.id ? {...p, status} : p
                                            );
                                            return {...k, kpis: updatedKpis};
                                          }
                                          return k;
                                        });
                                        setKras(updatedKras);
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          // Show edit modal with this KPI's data
                                          setEditingKpi({...kpi, kraId: kra.id});
                                          setShowEditKpiModal(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          // Show delete confirmation modal for this KPI
                                          setDeletingKpi({...kpi, kraId: kra.id});
                                          setShowDeleteKpiModal(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <KRATimeline kras={kras} />
                    </TabsContent>
                    
                    <TabsContent value="insights">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>KRA Progress Overview</CardTitle>
                              <CardDescription>Performance across all KRAs</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={kras.map(kra => ({
                                    name: kra.name,
                                    progress: kra.progress
                                  }))}
                                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                                  <YAxis label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }} />
                                  <Tooltip />
                                  <Bar dataKey="progress" fill="#3b82f6">
                                    {kras.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#10b981'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>KPI Status Distribution</CardTitle>
                              <CardDescription>Status of all KPIs across KRAs</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'On Track', value: kras.flatMap(k => k.kpis).filter(k => k.status === 'on-track').length, color: '#3b82f6' },
                                      { name: 'At Risk', value: kras.flatMap(k => k.kpis).filter(k => k.status === 'at-risk').length, color: '#f59e0b' },
                                      { name: 'Behind', value: kras.flatMap(k => k.kpis).filter(k => k.status === 'behind').length, color: '#ef4444' },
                                      { name: 'Completed', value: kras.flatMap(k => k.kpis).filter(k => k.status === 'completed').length, color: '#10b981' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {[
                                      { name: 'On Track', color: '#3b82f6' },
                                      { name: 'At Risk', color: '#f59e0b' },
                                      { name: 'Behind', color: '#ef4444' },
                                      { name: 'Completed', color: '#10b981' }
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>KPIs Trending Analysis</CardTitle>
                            <CardDescription>Tracking performance over time</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { name: 'Jan', average: 65 },
                                  { name: 'Feb', average: 70 },
                                  { name: 'Mar', average: 72 },
                                  { name: 'Apr', average: 68 },
                                  { name: 'May', average: 75 },
                                  { name: 'Jun', average: 80 }
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="average" stroke="#3b82f6" name="Avg KPI Performance %" />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* Edit KPI Modal */}
              <Dialog open={showEditKpiModal} onOpenChange={setShowEditKpiModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit KPI</DialogTitle>
                  </DialogHeader>
                  {editingKpi && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kpi-name" className="text-right">Name</Label>
                        <Input 
                          id="kpi-name" 
                          value={editingKpi.name} 
                          onChange={(e) => setEditingKpi({...editingKpi, name: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kpi-target" className="text-right">Target</Label>
                        <Input 
                          id="kpi-target" 
                          value={editingKpi.target} 
                          onChange={(e) => setEditingKpi({...editingKpi, target: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kpi-actual" className="text-right">Actual</Label>
                        <Input 
                          id="kpi-actual" 
                          value={editingKpi.actual} 
                          onChange={(e) => setEditingKpi({...editingKpi, actual: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="kpi-status" className="text-right">Status</Label>
                        <Select 
                          value={editingKpi.status}
                          onValueChange={(value) => setEditingKpi({...editingKpi, status: value})}
                        >
                          <SelectTrigger id="kpi-status" className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-track">On Track</SelectItem>
                            <SelectItem value="at-risk">At Risk</SelectItem>
                            <SelectItem value="behind">Behind</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          // Save the edited KPI
                          const updatedKras = kras.map(k => {
                            if (k.id === editingKpi.kraId) {
                              const updatedKpis = k.kpis.map(p => 
                                p.id === editingKpi.id ? {
                                  ...editingKpi,
                                  kraId: undefined // Remove the temporary kraId we added
                                } : p
                              );
                              return {...k, kpis: updatedKpis};
                            }
                            return k;
                          });
                          setKras(updatedKras);
                          setShowEditKpiModal(false);
                          
                          toast({
                            title: "KPI Updated",
                            description: "The KPI has been successfully updated.",
                          });
                        }}>Save Changes</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete KPI Modal */}
              <Dialog open={showDeleteKpiModal} onOpenChange={setShowDeleteKpiModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Delete KPI</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this KPI? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteKpiModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        // Delete the KPI
                        const updatedKras = kras.map(k => {
                          if (k.id === deletingKpi?.kraId) {
                            const updatedKpis = k.kpis.filter(p => p.id !== deletingKpi.id);
                            return {...k, kpis: updatedKpis};
                          }
                          return k;
                        });
                        setKras(updatedKras);
                        setShowDeleteKpiModal(false);
                        
                        toast({
                          title: "KPI Deleted",
                          description: "The KPI has been successfully deleted.",
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Projects</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Project
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project List</CardTitle>
                  <CardDescription>
                    View and manage unit projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <StatusBadge status={project.status} />
                          </TableCell>
                          <TableCell>{project.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{project.endDate.toLocaleDateString()}</TableCell>
                          <TableCell>{project.manager}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={project.progress} className="w-[60px]" />
                              <span>{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>${project.budget.toLocaleString()} (${project.budgetSpent.toLocaleString()} spent)</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingProject(project);
                                  setShowEditProjectModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDeletingProject(project);
                                  setShowDeleteProjectModal(true);
                                }}
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

              {/* Edit Project Modal */}
              <Dialog open={showEditProjectModal} onOpenChange={setShowEditProjectModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                  </DialogHeader>
                  {editingProject && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-name" className="text-right">Name</Label>
                        <Input 
                          id="project-name" 
                          value={editingProject.name} 
                          onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-description" className="text-right">Description</Label>
                        <Textarea 
                          id="project-description" 
                          value={editingProject.description} 
                          onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-manager" className="text-right">Manager</Label>
                        <Input 
                          id="project-manager" 
                          value={editingProject.manager} 
                          onChange={(e) => setEditingProject({...editingProject, manager: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="project-start-date" className="text-right">Start Date</Label>
                          <Input 
                            id="project-start-date" 
                            type="date"
                            value={editingProject.startDate.toISOString().split('T')[0]}
                            onChange={(e) => setEditingProject({
                              ...editingProject, 
                              startDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="project-end-date" className="text-right">End Date</Label>
                          <Input 
                            id="project-end-date" 
                            type="date"
                            value={editingProject.endDate.toISOString().split('T')[0]}
                            onChange={(e) => setEditingProject({
                              ...editingProject, 
                              endDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-status" className="text-right">Status</Label>
                        <Select 
                          value={editingProject.status}
                          onValueChange={(value) => setEditingProject({...editingProject, status: value as any})}
                        >
                          <SelectTrigger id="project-status" className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-budget" className="text-right">Budget ($)</Label>
                        <Input 
                          id="project-budget" 
                          type="number"
                          min="0"
                          value={editingProject.budget} 
                          onChange={(e) => setEditingProject({
                            ...editingProject, 
                            budget: parseFloat(e.target.value) || 0
                          })}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-spent" className="text-right">Budget Spent ($)</Label>
                        <Input 
                          id="project-spent" 
                          type="number"
                          min="0"
                          value={editingProject.budgetSpent} 
                          onChange={(e) => setEditingProject({
                            ...editingProject, 
                            budgetSpent: parseFloat(e.target.value) || 0
                          })}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project-progress" className="text-right">Progress (%)</Label>
                        <Input 
                          id="project-progress" 
                          type="number"
                          min="0"
                          max="100"
                          value={editingProject.progress} 
                          onChange={(e) => setEditingProject({
                            ...editingProject, 
                            progress: parseInt(e.target.value) || 0
                          })}
                          className="col-span-3" 
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          // Save the edited project
                          setProjects(projects.map(p => p.id === editingProject.id ? editingProject : p));
                          setShowEditProjectModal(false);
                          
                          toast({
                            title: "Project Updated",
                            description: "The project has been successfully updated.",
                          });
                        }}>Save Changes</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete Project Modal */}
              <Dialog open={showDeleteProjectModal} onOpenChange={setShowDeleteProjectModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks and risks.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteProjectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (deletingProject) {
                          // Delete the project
                          setProjects(projects.filter(p => p.id !== deletingProject.id));
                          
                          // Also remove associated tasks and risks
                          setTasks(tasks.filter(t => t.projectId !== deletingProject.id));
                          setRisks(risks.filter(r => r.projectId !== deletingProject.id));
                          
                          setShowDeleteProjectModal(false);
                          
                          toast({
                            title: "Project Deleted",
                            description: "The project and its associated items have been successfully deleted.",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Risks</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Risk
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Risk Register</CardTitle>
                  <CardDescription>
                    Track and manage project risks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Likelihood</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {risks.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell className="font-medium">{risk.title}</TableCell>
                          <TableCell>{risk.projectName}</TableCell>
                          <TableCell>{risk.category}</TableCell>
                          <TableCell>
                            <Badge className={
                              risk.impact === 'critical' 
                                ? 'bg-red-100 text-red-800' 
                                : risk.impact === 'high' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : risk.impact === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                            }>
                              {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              risk.likelihood === 'very-high' 
                                ? 'bg-red-100 text-red-800' 
                                : risk.likelihood === 'high' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : risk.likelihood === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                            }>
                              {risk.likelihood.replace('-', ' ').split(' ').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusDropdown 
                              currentStatus={risk.status} 
                              onStatusChange={(status) => {
                                // Handle status change
                                const updatedRisks = risks.map(r => 
                                  r.id === risk.id ? {...r, status: status as any} : r
                                );
                                setRisks(updatedRisks);
                              }}
                              options={[
                                { value: 'identified', label: 'Identified' },
                                { value: 'analyzing', label: 'Analyzing' },
                                { value: 'mitigating', label: 'Mitigating' },
                                { value: 'monitoring', label: 'Monitoring' },
                                { value: 'resolved', label: 'Resolved' }
                              ]}
                            />
                          </TableCell>
                          <TableCell>{risk.owner}</TableCell>
                          <TableCell>{risk.updatedAt.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingRisk(risk);
                                  setShowEditRiskModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDeletingRisk(risk);
                                  setShowDeleteRiskModal(true);
                                }}
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

              {/* Edit Risk Modal */}
              <Dialog open={showEditRiskModal} onOpenChange={setShowEditRiskModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Risk</DialogTitle>
                  </DialogHeader>
                  {editingRisk && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-title" className="text-right">Title</Label>
                        <Input 
                          id="risk-title" 
                          value={editingRisk.title} 
                          onChange={(e) => setEditingRisk({...editingRisk, title: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-description" className="text-right">Description</Label>
                        <Textarea 
                          id="risk-description" 
                          value={editingRisk.description} 
                          onChange={(e) => setEditingRisk({...editingRisk, description: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-category" className="text-right">Category</Label>
                        <Input 
                          id="risk-category" 
                          value={editingRisk.category} 
                          onChange={(e) => setEditingRisk({...editingRisk, category: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-owner" className="text-right">Owner</Label>
                        <Input 
                          id="risk-owner" 
                          value={editingRisk.owner} 
                          onChange={(e) => setEditingRisk({...editingRisk, owner: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-project" className="text-right">Project</Label>
                        <Select 
                          value={editingRisk.projectId}
                          onValueChange={(value) => {
                            const project = projects.find(p => p.id === value);
                            setEditingRisk({
                              ...editingRisk, 
                              projectId: value,
                              projectName: project ? project.name : ''
                            });
                          }}
                        >
                          <SelectTrigger id="risk-project" className="col-span-3">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-impact" className="text-right">Impact</Label>
                        <Select 
                          value={editingRisk.impact}
                          onValueChange={(value) => setEditingRisk({...editingRisk, impact: value as any})}
                        >
                          <SelectTrigger id="risk-impact" className="col-span-3">
                            <SelectValue placeholder="Select impact" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-likelihood" className="text-right">Likelihood</Label>
                        <Select 
                          value={editingRisk.likelihood}
                          onValueChange={(value) => setEditingRisk({...editingRisk, likelihood: value as any})}
                        >
                          <SelectTrigger id="risk-likelihood" className="col-span-3">
                            <SelectValue placeholder="Select likelihood" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="very-high">Very High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="risk-status" className="text-right">Status</Label>
                        <Select 
                          value={editingRisk.status}
                          onValueChange={(value) => setEditingRisk({...editingRisk, status: value as any})}
                        >
                          <SelectTrigger id="risk-status" className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identified</SelectItem>
                            <SelectItem value="analyzing">Analyzing</SelectItem>
                            <SelectItem value="mitigating">Mitigating</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          // Update the updatedAt date to now
                          const updatedRisk = {
                            ...editingRisk,
                            updatedAt: new Date()
                          };
                          
                          // Save the edited risk
                          setRisks(risks.map(r => r.id === updatedRisk.id ? updatedRisk : r));
                          setShowEditRiskModal(false);
                          
                          toast({
                            title: "Risk Updated",
                            description: "The risk has been successfully updated.",
                          });
                        }}>Save Changes</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete Risk Modal */}
              <Dialog open={showDeleteRiskModal} onOpenChange={setShowDeleteRiskModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Delete Risk</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this risk? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteRiskModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (deletingRisk) {
                          setRisks(risks.filter(r => r.id !== deletingRisk.id));
                          setShowDeleteRiskModal(false);
                          
                          toast({
                            title: "Risk Deleted",
                            description: "The risk has been successfully deleted.",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Assets Tab */}
            <TabsContent value="assets" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Asset Management</h2>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Asset
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Asset Inventory</CardTitle>
                  <CardDescription>
                    Track and manage user assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Warranty Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}</TableCell>
                          <TableCell>{asset.serialNumber}</TableCell>
                          <TableCell>{asset.assignedTo}</TableCell>
                          <TableCell>{asset.department}</TableCell>
                          <TableCell>{asset.purchaseDate.toLocaleDateString()}</TableCell>
                          <TableCell>{asset.warrantyExpiry.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              asset.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : asset.status === 'maintenance' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }>
                              {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingAsset(asset);
                                  setShowEditAssetModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDeletingAsset(asset);
                                  setShowDeleteAssetModal(true);
                                }}
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

              {/* Edit Asset Modal */}
              <Dialog open={showEditAssetModal} onOpenChange={setShowEditAssetModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                  </DialogHeader>
                  {editingAsset && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset-name" className="text-right">Name</Label>
                        <Input 
                          id="asset-name" 
                          value={editingAsset.name} 
                          onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset-type" className="text-right">Type</Label>
                        <Select 
                          value={editingAsset.type}
                          onValueChange={(value) => setEditingAsset({...editingAsset, type: value as any})}
                        >
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
                        <Label htmlFor="asset-serial" className="text-right">Serial Number</Label>
                        <Input 
                          id="asset-serial" 
                          value={editingAsset.serialNumber} 
                          onChange={(e) => setEditingAsset({...editingAsset, serialNumber: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset-assigned" className="text-right">Assigned To</Label>
                        <Input 
                          id="asset-assigned" 
                          value={editingAsset.assignedTo} 
                          onChange={(e) => setEditingAsset({...editingAsset, assignedTo: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset-department" className="text-right">Department</Label>
                        <Input 
                          id="asset-department" 
                          value={editingAsset.department} 
                          onChange={(e) => setEditingAsset({...editingAsset, department: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="asset-purchase-date" className="text-right">Purchase Date</Label>
                          <Input 
                            id="asset-purchase-date" 
                            type="date"
                            value={editingAsset.purchaseDate.toISOString().split('T')[0]}
                            onChange={(e) => setEditingAsset({
                              ...editingAsset, 
                              purchaseDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor="asset-warranty" className="text-right">Warranty Expiry</Label>
                          <Input 
                            id="asset-warranty" 
                            type="date"
                            value={editingAsset.warrantyExpiry.toISOString().split('T')[0]}
                            onChange={(e) => setEditingAsset({
                              ...editingAsset, 
                              warrantyExpiry: new Date(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset-status" className="text-right">Status</Label>
                        <Select 
                          value={editingAsset.status}
                          onValueChange={(value) => setEditingAsset({...editingAsset, status: value as any})}
                        >
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
                        <Label htmlFor="asset-notes" className="text-right">Notes</Label>
                        <Textarea 
                          id="asset-notes" 
                          value={editingAsset.notes} 
                          onChange={(e) => setEditingAsset({...editingAsset, notes: e.target.value})}
                          className="col-span-3" 
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          // Save the edited asset
                          setAssets(assets.map(a => a.id === editingAsset.id ? editingAsset : a));
                          setShowEditAssetModal(false);
                          
                          toast({
                            title: "Asset Updated",
                            description: "The asset has been successfully updated.",
                          });
                        }}>Save Changes</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete Asset Modal */}
              <Dialog open={showDeleteAssetModal} onOpenChange={setShowDeleteAssetModal}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Delete Asset</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this asset? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteAssetModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (deletingAsset) {
                          setAssets(assets.filter(a => a.id !== deletingAsset.id));
                          setShowDeleteAssetModal(false);
                          
                          toast({
                            title: "Asset Deleted",
                            description: "The asset has been successfully deleted.",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

      {/* Setup Wizard Dialog */}
      <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {setupStep === 1 && "Setup Wizard: Choose Data Input Method"}
              {setupStep === 2 && "Setup Wizard: Objectives & KRAs"}
              {setupStep === 3 && "Setup Wizard: KPIs & Tasks"}
              {setupStep === 4 && "Setup Wizard: Review & Confirm"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === 1 && "Choose how you would like to populate your unit data."}
              {setupStep === 2 && "Define your objectives and key result areas."}
              {setupStep === 3 && "Set up your KPIs and related tasks."}
              {setupStep === 4 && "Review all information before finalizing."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Step 1: Choose Input Method */}
            {setupStep === 1 && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-primary" onClick={() => setSetupMethod('document')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" /> Upload Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Upload documents containing unit objectives, KRAs, KPIs, and tasks. Our AI will extract and organize the data for you.
                    </p>
                    {setupMethod === 'document' && (
                      <div className="mt-4">
                        <Input 
                          type="file" 
                          multiple 
                          onChange={handleFileUpload}
                          className="mt-2"
                        />
                        {uploadedFiles.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Uploaded Files:</p>
                            <ul className="text-sm mt-1">
                              {uploadedFiles.map((file, index) => (
                                <li key={index}>{file.name}</li>
                              ))}
                            </ul>
                            <div className="mt-2">
                              <p className="text-sm">Processing documents... {extractedData ? 'Complete!' : 'Please wait...'}</p>
                              {!extractedData && <Progress value={45} className="mt-1" />}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:border-primary" onClick={() => {
                  setSetupMethod('manual');
                  setSetupStep(2);
                }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" /> Manual Input
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Manually enter your unit data step by step including objectives, KRAs, KPIs, and tasks.
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary" onClick={() => {
                  setSetupMethod('demo');
                  loadDemoData();
                }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" /> Use Demo Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use pre-populated demonstration data to quickly set up and explore the dashboard functionality.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Step 2: Objectives & KRAs */}
            {setupStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Objectives</h3>
                  {(extractedData?.objectives || formData.objectives).map((objective: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`objective-title-${index}`} className="text-right">
                          Title
                        </Label>
                        <Input 
                          id={`objective-title-${index}`} 
                          value={objective.title} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`objective-description-${index}`} className="text-right">
                          Description
                        </Label>
                        <Textarea 
                          id={`objective-description-${index}`} 
                          value={objective.description} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newObjectives = [...(extractedData?.objectives || formData.objectives)];
                      newObjectives.push({ id: Date.now().toString(), title: '', description: '' });
                      if (extractedData) {
                        setExtractedData({...extractedData, objectives: newObjectives});
                      } else {
                        setFormData({...formData, objectives: newObjectives});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Objective
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Result Areas (KRAs)</h3>
                  {(extractedData?.kras || formData.kras).map((kra: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`kra-name-${index}`} className="text-right">
                          Name
                        </Label>
                        <Input 
                          id={`kra-name-${index}`} 
                          value={kra.name} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`kra-objective-${index}`} className="text-right">
                          Objective
                        </Label>
                        <Select defaultValue={kra.objectiveId}>
                          <SelectTrigger id={`kra-objective-${index}`} className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(extractedData?.objectives || formData.objectives).map((objective: any) => (
                              <SelectItem key={objective.id} value={objective.id}>
                                {objective.title || 'Untitled Objective'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`kra-responsible-${index}`} className="text-right">
                          Responsible
                        </Label>
                        <Input 
                          id={`kra-responsible-${index}`} 
                          value={kra.responsible} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newKras = [...(extractedData?.kras || formData.kras)];
                      newKras.push({ 
                        id: Date.now().toString(), 
                        name: '', 
                        objectiveId: (extractedData?.objectives || formData.objectives)[0]?.id || '1',
                        responsible: '' 
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, kras: newKras});
                      } else {
                        setFormData({...formData, kras: newKras});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add KRA
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: KPIs & Tasks */}
            {setupStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Performance Indicators (KPIs)</h3>
                  {(extractedData?.kpis || formData.kpis).map((kpi: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`kpi-name-${index}`} className="text-right">
                          Name
                        </Label>
                        <Input 
                          id={`kpi-name-${index}`} 
                          value={kpi.name} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`kpi-kra-${index}`} className="text-right">
                          KRA
                        </Label>
                        <Select defaultValue={kpi.kraId}>
                          <SelectTrigger id={`kpi-kra-${index}`} className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(extractedData?.kras || formData.kras).map((kra: any) => (
                              <SelectItem key={kra.id} value={kra.id}>
                                {kra.name || 'Untitled KRA'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`kpi-target-${index}`} className="text-right">
                            Target
                          </Label>
                          <Input 
                            id={`kpi-target-${index}`} 
                            value={kpi.target} 
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`kpi-actual-${index}`} className="text-right">
                            Actual
                          </Label>
                          <Input 
                            id={`kpi-actual-${index}`} 
                            value={kpi.actual} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newKpis = [...(extractedData?.kpis || formData.kpis)];
                      newKpis.push({ 
                        id: Date.now().toString(), 
                        name: '', 
                        kraId: (extractedData?.kras || formData.kras)[0]?.id || '1',
                        target: '',
                        actual: '' 
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, kpis: newKpis});
                      } else {
                        setFormData({...formData, kpis: newKpis});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add KPI
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Tasks</h3>
                  {(extractedData?.tasks || formData.tasks).map((task: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`task-title-${index}`} className="text-right">
                          Title
                        </Label>
                        <Input 
                          id={`task-title-${index}`} 
                          value={task.title} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`task-assigned-${index}`} className="text-right">
                          Assigned To
                        </Label>
                        <Input 
                          id={`task-assigned-${index}`} 
                          value={task.assignedTo} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`task-start-${index}`} className="text-right">
                          Start Date
                        </Label>
                        <Input 
                          id={`task-start-${index}`} 
                          type="date"
                          value={task.startDate} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`task-due-${index}`} className="text-right">
                          Due Date
                        </Label>
                        <Input 
                          id={`task-due-${index}`} 
                          type="date"
                          value={task.dueDate} 
                          className="col-span-3" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`task-status-${index}`} className="text-right">
                          Status
                        </Label>
                        <Select defaultValue={task.status || 'not-started'}>
                          <SelectTrigger id={`task-status-${index}`} className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newTasks = [...(extractedData?.tasks || formData.tasks)];
                      newTasks.push({ 
                        id: Date.now().toString(), 
                        title: '', 
                        assignedTo: '',
                        startDate: '',
                        dueDate: '',
                        status: 'not-started',
                        priority: 'medium',
                        description: '',
                        projectId: '',
                        projectName: '',
                        completionPercentage: 0
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, tasks: newTasks});
                      } else {
                        setFormData({...formData, tasks: newTasks});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Projects</h3>
                  {(extractedData?.projects || formData.projects).map((project: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`project-name-${index}`} className="text-right">
                          Name
                        </Label>
                        <Input 
                          id={`project-name-${index}`} 
                          value={project.name} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('projects', index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`project-desc-${index}`} className="text-right">
                          Description
                        </Label>
                        <Textarea 
                          id={`project-desc-${index}`} 
                          value={project.description} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('projects', index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`project-manager-${index}`} className="text-right">
                          Manager
                        </Label>
                        <Input 
                          id={`project-manager-${index}`} 
                          value={project.manager} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('projects', index, 'manager', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`project-start-${index}`} className="text-right">
                            Start Date
                          </Label>
                          <Input 
                            id={`project-start-${index}`} 
                            type="date"
                            value={project.startDate}
                            onChange={(e) => updateFormField('projects', index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`project-end-${index}`} className="text-right">
                            End Date
                          </Label>
                          <Input 
                            id={`project-end-${index}`} 
                            type="date"
                            value={project.endDate}
                            onChange={(e) => updateFormField('projects', index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`project-status-${index}`} className="text-right">
                          Status
                        </Label>
                        <Select 
                          defaultValue={project.status || 'planned'}
                          onValueChange={(value) => updateFormField('projects', index, 'status', value)}
                        >
                          <SelectTrigger id={`project-status-${index}`} className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newProjects = [...(extractedData?.projects || formData.projects)];
                      newProjects.push({ 
                        id: Date.now().toString(), 
                        name: '', 
                        description: '', 
                        status: 'planned', 
                        startDate: '', 
                        endDate: '', 
                        manager: '', 
                        budget: 0, 
                        budgetSpent: 0, 
                        progress: 0,
                        risks: [],
                        tasks: []
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, projects: newProjects});
                      } else {
                        setFormData({...formData, projects: newProjects});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Project
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Risks</h3>
                  {(extractedData?.risks || formData.risks).map((risk: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`risk-title-${index}`} className="text-right">
                          Title
                        </Label>
                        <Input 
                          id={`risk-title-${index}`} 
                          value={risk.title} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('risks', index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`risk-desc-${index}`} className="text-right">
                          Description
                        </Label>
                        <Textarea 
                          id={`risk-desc-${index}`} 
                          value={risk.description} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('risks', index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`risk-project-${index}`} className="text-right">
                          Project
                        </Label>
                        <Select defaultValue={risk.projectId}>
                          <SelectTrigger id={`risk-project-${index}`} className="col-span-3">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {(extractedData?.projects || formData.projects).map((project: any) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name || 'Untitled Project'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`risk-owner-${index}`} className="text-right">
                          Owner
                        </Label>
                        <Input 
                          id={`risk-owner-${index}`} 
                          value={risk.owner} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('risks', index, 'owner', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`risk-impact-${index}`} className="text-right">
                            Impact
                          </Label>
                          <Select defaultValue={risk.impact || 'medium'}>
                            <SelectTrigger id={`risk-impact-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`risk-likelihood-${index}`} className="text-right">
                            Likelihood
                          </Label>
                          <Select defaultValue={risk.likelihood || 'medium'}>
                            <SelectTrigger id={`risk-likelihood-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very-high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`risk-status-${index}`} className="text-right">
                          Status
                        </Label>
                        <Select defaultValue={risk.status || 'identified'}>
                          <SelectTrigger id={`risk-status-${index}`} className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identified</SelectItem>
                            <SelectItem value="analyzing">Analyzing</SelectItem>
                            <SelectItem value="mitigating">Mitigating</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newRisks = [...(extractedData?.risks || formData.risks)];
                      newRisks.push({ 
                        id: Date.now().toString(), 
                        title: '', 
                        description: '', 
                        impact: 'medium', 
                        likelihood: 'medium', 
                        status: 'identified', 
                        category: '', 
                        projectId: (extractedData?.projects || formData.projects)[0]?.id || '', 
                        projectName: (extractedData?.projects || formData.projects)[0]?.name || '', 
                        owner: '' 
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, risks: newRisks});
                      } else {
                        setFormData({...formData, risks: newRisks});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Risk
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Assets</h3>
                  {(extractedData?.assets || formData.assets).map((asset: any, index: number) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`asset-name-${index}`} className="text-right">
                          Name
                        </Label>
                        <Input 
                          id={`asset-name-${index}`} 
                          value={asset.name} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('assets', index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`asset-type-${index}`} className="text-right">
                          Type
                        </Label>
                        <Select defaultValue={asset.type || 'laptop'}>
                          <SelectTrigger id={`asset-type-${index}`} className="col-span-3">
                            <SelectValue />
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
                        <Label htmlFor={`asset-serial-${index}`} className="text-right">
                          Serial Number
                        </Label>
                        <Input 
                          id={`asset-serial-${index}`} 
                          value={asset.serialNumber} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('assets', index, 'serialNumber', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`asset-assigned-${index}`} className="text-right">
                          Assigned To
                        </Label>
                        <Input 
                          id={`asset-assigned-${index}`} 
                          value={asset.assignedTo} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('assets', index, 'assignedTo', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`asset-department-${index}`} className="text-right">
                          Department
                        </Label>
                        <Input 
                          id={`asset-department-${index}`} 
                          value={asset.department} 
                          className="col-span-3"
                          onChange={(e) => updateFormField('assets', index, 'department', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`asset-purchase-${index}`} className="text-right">
                            Purchase Date
                          </Label>
                          <Input 
                            id={`asset-purchase-${index}`} 
                            type="date"
                            value={asset.purchaseDate} 
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={`asset-warranty-${index}`} className="text-right">
                            Warranty Expiry
                          </Label>
                          <Input 
                            id={`asset-warranty-${index}`} 
                            type="date"
                            value={asset.warrantyExpiry} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`asset-notes-${index}`} className="text-right">
                          Notes
                        </Label>
                        <Textarea 
                          id={`asset-notes-${index}`} 
                          value={asset.notes} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      const newAssets = [...(extractedData?.assets || formData.assets)];
                      newAssets.push({ 
                        id: Date.now().toString(), 
                        name: '', 
                        type: 'laptop', 
                        serialNumber: '', 
                        assignedTo: '', 
                        department: '', 
                        purchaseDate: '', 
                        warrantyExpiry: '', 
                        status: 'active', 
                        notes: '' 
                      });
                      if (extractedData) {
                        setExtractedData({...extractedData, assets: newAssets});
                      } else {
                        setFormData({...formData, assets: newAssets});
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Asset
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 4: Review & Confirm */}
            {setupStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please review the information below before finalizing your setup.
                  </p>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Objectives</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.objectives || formData.objectives).map((obj: any, i: number) => (
                            <li key={i} className="text-sm">{obj.title || 'Untitled Objective'}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Key Result Areas</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.kras || formData.kras).map((kra: any, i: number) => (
                            <li key={i} className="text-sm">{kra.name || 'Untitled KRA'}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">KPIs</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.kpis || formData.kpis).map((kpi: any, i: number) => (
                            <li key={i} className="text-sm">{kpi.name || 'Untitled KPI'}: Target {kpi.target}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Tasks</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.tasks || formData.tasks).map((task: any, i: number) => (
                            <li key={i} className="text-sm">{task.title || 'Untitled Task'} (Assigned to: {task.assignedTo})</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Projects</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.projects || formData.projects).map((project: any, i: number) => (
                            <li key={i} className="text-sm">{project.name || 'Untitled Project'} (Status: {project.status})</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Risks</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.risks || formData.risks).map((risk: any, i: number) => (
                            <li key={i} className="text-sm">{risk.title || 'Untitled Risk'} (Impact: {risk.impact})</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base">Assets</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {(extractedData?.assets || formData.assets).map((asset: any, i: number) => (
                            <li key={i} className="text-sm">{asset.name || 'Untitled Asset'} ({asset.type})</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            {setupStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
            )}
            <div>
              <Button variant="outline" onClick={() => setShowSetupWizard(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleNextStep}>
                {setupStep < 4 ? (
                  <><span>Next</span> <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  'Finish Setup'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Unit; 