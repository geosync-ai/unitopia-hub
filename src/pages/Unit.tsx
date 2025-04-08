import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowUp, ArrowDown, Minus, Target, Flag, Award, BarChart2, TrendingUp, Clock, Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, AlertCircle, Download, Brain, List, Settings, FileSpreadsheet, ChevronLeft, ChevronRight, Pencil, Trash, Eye, Share, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, PieChart, LineChart, AreaChart } from '@/components/charts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Upload } from 'lucide-react';
import KRATimeline from '@/components/KRATimeline';
import '@/styles/timeline.css';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

// Types
interface KPI {
  id: string;
  name: string;
  target: string | number;
  current: string | number;
  unit?: string;
  frequency?: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  description?: string;
  department?: string;
  strategicObjective?: string;
  kra?: string;
  measurementUnit?: string;
  baselineValue?: string;
  dataSource?: string;
  responsibleOfficer?: string;
  startDate?: string;
  endDate?: string;
  comments?: string;
  progress?: number;
}

interface KRA {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName?: string;
  department: string;
  responsible: string;
  startDate: Date | string;
  endDate: Date | string;
  progress: number;
  status: 'open' | 'in-progress' | 'closed';
  description?: string; // <-- Add optional description
  kpis: KPI[];
  createdAt?: string;
  updatedAt?: string;
}

interface Objective {
  id: number;
  name: string;
  description: string;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Add Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: string;
  kraId?: string;
  kraName?: string;
}

// Add Risk interface
interface Risk {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high' | 'very-high';
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved';
  owner: string;
  dateIdentified: string;
  mitigation: string;
  category: string;
  projectId?: string;
  projectName?: string;
  kraId?: string;
  kraName?: string;
}

// Add Project interface
interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed';
  budget: string;
  progress: number;
  department: string;
  kraIds: string[];
  kraNames: string[];
}

// Define Asset interface
interface Asset {
  id: string;
  name: string;
  issuedDate: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  location?: string;
  assignedTo: string; // Assuming it's assigned to the current user context, maybe simplify later
}

// Add TimelineKRA interface based on KRATimeline component
interface TimelineKPI {
  id: string;
  name: string;
  date: Date;
  target: string | number;
  actual: string | number;
  status: string;
  description?: string;
  notes?: string;
}

interface TimelineKRA {
  id: string;
  name: string;
  objectiveId: string;
  objectiveName: string;
  department: string;
  responsible: string;
  startDate: Date | string;
  endDate: Date | string;
  progress: number;
  status: string;
  kpis: TimelineKPI[];
}

const Unit = () => {
  // State
  const [activeTab, setActiveTab] = useState('kras');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [isAddKRADialogOpen, setIsAddKRADialogOpen] = useState(false);
  const [isEditKRADialogOpen, setIsEditKRADialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(false);
  const [activeForm, setActiveForm] = useState<'kra' | 'kpi' | 'objective'>('kra');
  const [selectedKRA, setSelectedKRA] = useState<KRA | null>(null);
  const [isKRADrawerOpen, setIsKRADrawerOpen] = useState(false);
  const [selectedKRADrawer, setSelectedKRADrawer] = useState<KRA | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  
  // Filter states
  const [kraFilters, setKraFilters] = useState({ status: 'all', department: 'all', responsible: 'all' });
  const [projectFilters, setProjectFilters] = useState({ status: 'all', department: 'all', manager: 'all' });
  const [riskFilters, setRiskFilters] = useState({ status: 'all', impact: 'all', probability: 'all', owner: 'all' });
  const [taskFilters, setTaskFilters] = useState({ status: 'all', priority: 'all', assignee: 'all' });
  
  // State for editing tasks
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingKRA, setEditingKRA] = useState<KRA | null>(null); // State for KRA being edited
  const [editingProject, setEditingProject] = useState<Project | null>(null); // State for project being edited
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null); // State for risk being edited
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isEditRiskDialogOpen, setIsEditRiskDialogOpen] = useState(false);
  
  // Form state
  const [kraForm, setKraForm] = useState<Partial<KRA>>({
    name: '',
    objectiveId: '',
    kpis: [],
    status: 'open'
  });
  
  const [kpiForm, setKpiForm] = useState<Partial<KPI>>({
    name: '',
    target: '',
    current: '',
    status: 'on-track' as const,
    description: '',
    comments: ''
  });
  
  const [objectiveForm, setObjectiveForm] = useState<Partial<Objective>>({
    name: '',
    description: ''
  });
  
  // Mock data for units
  const units = [
    { id: 'all', name: 'All Units' },
    { id: 'sales', name: 'Sales' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'development', name: 'Development' },
    { id: 'support', name: 'Support' },
  ];
  
  // Mock data for objectives
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: 1, name: 'Expand Market Presence', description: 'Increase market share across Australia and expand into New Zealand and Southeast Asia.' },
    { id: 2, name: 'Enhance Product Portfolio', description: 'Develop and launch innovative products that meet evolving customer needs.' },
    { id: 3, name: 'Operational Excellence', description: 'Optimize internal processes to improve efficiency and reduce costs.' },
    { id: 4, name: 'Talent Development', description: 'Build a high-performing workforce through recruitment, training and retention.' },
    { id: 5, name: 'Customer Satisfaction', description: 'Improve customer satisfaction scores and reduce response times.' },
    { id: 6, name: 'Innovation Pipeline', description: 'Develop a robust pipeline of innovative products and services.' },
    { id: 7, name: 'Market Leadership', description: 'Achieve market leadership position in key product categories.' },
    { id: 8, name: 'Operational Efficiency', description: 'Reduce operational costs while maintaining quality standards.' },
    { id: 9, name: 'Employee Engagement', description: 'Increase employee engagement and satisfaction scores.' },
    { id: 10, name: 'Sustainability Goals', description: 'Implement sustainable practices across all operations.' },
  ]);
  
  // Mock data for KRAs
  const [kras, setKras] = useState<KRA[]>([
    {
      id: '1',
      name: "Market Expansion Strategy",
      objectiveId: '1',
      objectiveName: "Market Growth",
      department: "Sales",
      responsible: "Sales Director",
      startDate: new Date(2024, 0, 1), // Q1 start
      endDate: new Date(2024, 2, 31), // Q1 end
      progress: 75,
      status: "in-progress",
      kpis: [
        {
          id: '1',
          name: "New Market Entry",
          target: "5",
          current: "3",
          status: "needs-attention",
          description: "Number of new markets entered",
          comments: "Expansion plan in progress"
        }
      ],
      createdAt: "2024-01-01",
      updatedAt: "2024-03-15"
    },
    {
      id: '2',
      name: "Digital Transformation Initiative",
      objectiveId: '2',
      objectiveName: "Modernize Infrastructure",
      department: "IT",
      responsible: "IT Director",
      startDate: new Date(2024, 3, 1), // Q2 start
      endDate: new Date(2024, 5, 30), // Q2 end
      progress: 45,
      status: "in-progress",
      kpis: [
        {
          id: '2',
          name: "System Migration",
          target: "100",
          current: "45",
          status: "needs-attention",
          description: "Percentage of systems migrated",
          comments: "Migration ongoing"
        }
      ],
      createdAt: "2024-04-01T00:00:00Z",
      updatedAt: "2024-05-15T00:00:00Z"
    },
    {
      id: '3',
      name: "Quality Assurance Enhancement",
      objectiveId: '3',
      objectiveName: "Quality Excellence",
      department: "Quality",
      responsible: "QA Manager",
      startDate: new Date(2024, 6, 1), // Q3 start
      endDate: new Date(2024, 8, 30), // Q3 end
      progress: 60,
      status: "in-progress",
      kpis: [
        {
          id: '3',
          name: "Quality Metrics",
          target: "98",
          current: "95",
          status: "on-track",
          description: "Service quality score",
          comments: "Implementing new quality measures"
        }
      ],
      createdAt: "2024-07-01T00:00:00Z",
      updatedAt: "2024-08-15T00:00:00Z"
    },
    {
      id: '4',
      name: "Innovation Pipeline",
      objectiveId: '4',
      objectiveName: "Innovation",
      department: "R&D",
      responsible: "R&D Director",
      startDate: new Date(2024, 9, 1), // Q4 start
      endDate: new Date(2024, 11, 31), // Q4 end
      progress: 30,
      status: "in-progress",
      kpis: [
        {
          id: '4',
          name: "New Solutions",
          target: "10",
          current: "4",
          status: "needs-attention",
          description: "Number of new solutions developed",
          comments: "Research phase ongoing"
        }
      ],
      createdAt: "2024-10-01T00:00:00Z",
      updatedAt: "2024-11-15T00:00:00Z"
    }
  ]);
  
  // Mock data for closed KRAs
  const [closedKras, setClosedKras] = useState<KRA[]>([
    {
      id: '11',
      name: "Customer Service Improvement",
      objectiveId: '5',
      objectiveName: "Customer Satisfaction",
      department: "Customer Service",
      responsible: "Customer Service Manager",
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2023, 11, 31),
      progress: 100,
      status: "closed",
      kpis: [
        {
          id: '11',
          name: "Customer Satisfaction Score",
          description: "Overall customer satisfaction rating",
          target: "90",
          current: "92",
          status: "on-track",
          comments: "Exceeding target, excellent performance"
        }
      ],
      createdAt: "2022-11-20",
      updatedAt: "2023-05-30"
    },
  ]);
  
  // Filter KRAs based on selected unit
  const filteredKras = kras.filter(kra => selectedUnit === 'all' || true); // In a real app, filter by unit
  const filteredClosedKras = closedKras.filter(kra => selectedUnit === 'all' || true); // In a real app, filter by unit
  
  // Chart data
  const kraStatusData = [
    { name: "Open", value: kras.filter(k => k.status === 'open').length },
    { name: "In Progress", value: kras.filter(k => k.status === 'in-progress').length },
    { name: "Closed", value: closedKras.length }
  ];
  
  const kpiProgressData = [
    { name: "On Track", value: [...kras, ...closedKras].flatMap(k => k.kpis).filter(k => k.status === 'on-track').length },
    { name: "Needs Attention", value: [...kras, ...closedKras].flatMap(k => k.kpis).filter(k => k.status === 'needs-attention').length },
    { name: "At Risk", value: [...kras, ...closedKras].flatMap(k => k.kpis).filter(k => k.status === 'at-risk').length }
  ];
  
  // Additional chart data
  const kpiTrendData = [
    { name: 'Jan', onTrack: 5, needsAttention: 2, atRisk: 1 },
    { name: 'Feb', onTrack: 6, needsAttention: 1, atRisk: 1 },
    { name: 'Mar', onTrack: 4, needsAttention: 3, atRisk: 2 },
    { name: 'Apr', onTrack: 7, needsAttention: 2, atRisk: 0 },
    { name: 'May', onTrack: 8, needsAttention: 1, atRisk: 1 },
    { name: 'Jun', onTrack: 9, needsAttention: 1, atRisk: 0 },
  ];

  const objectiveProgressData = objectives.map(obj => ({
    name: obj.name,
    progress: Math.random() * 100 // In a real app, this would be calculated from actual data
  }));
  
  // Add new state variables for filters and sorting
  const [filters, setFilters] = useState({
    department: 'all',
    responsibleOfficer: 'all',
    status: 'all',
    progressRange: 'all',
    sortBy: 'name',
    sortDirection: 'asc' as 'asc' | 'desc'
  });

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  // Add a function to handle sorting
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Add a function to get sorted and filtered KRAs
  const getSortedAndFilteredKRAs = (kras: KRA[]) => {
    let filteredKRAs = [...kras];
    
    // Apply filters
    if (filters.department && filters.department !== 'all') {
      filteredKRAs = filteredKRAs.filter(kra => 
        kra.kpis.length > 0 && kra.kpis[0].department === filters.department
      );
    }
    
    if (filters.responsibleOfficer && filters.responsibleOfficer !== 'all') {
      filteredKRAs = filteredKRAs.filter(kra => 
        kra.kpis.length > 0 && kra.kpis[0].responsibleOfficer === filters.responsibleOfficer
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredKRAs = filteredKRAs.filter(kra => kra.status === filters.status);
    }
    
    if (filters.progressRange && filters.progressRange !== 'all') {
      filteredKRAs = filteredKRAs.filter(kra => {
        if (kra.kpis.length === 0) return false;
        
        const progress = kra.kpis[0].progress;
        
        switch (filters.progressRange) {
          case 'low':
            return progress < 50;
          case 'medium':
            return progress >= 50 && progress <= 80;
          case 'high':
            return progress > 80;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    if (sortConfig) {
      filteredKRAs.sort((a, b) => {
        let aValue: string | number | Date = '';
        let bValue: string | number | Date = '';
        
        switch (sortConfig.key) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'objective':
            aValue = a.objectiveName;
            bValue = b.objectiveName;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'progress':
            aValue = a.kpis.length > 0 ? a.kpis[0].progress : 0;
            bValue = b.kpis.length > 0 ? b.kpis[0].progress : 0;
            break;
          case 'department':
            aValue = a.kpis.length > 0 ? a.kpis[0].department : '';
            bValue = b.kpis.length > 0 ? b.kpis[0].department : '';
            break;
          case 'responsibleOfficer':
            aValue = a.kpis.length > 0 ? a.kpis[0].responsibleOfficer : '';
            bValue = b.kpis.length > 0 ? b.kpis[0].responsibleOfficer : '';
            break;
          case 'startDate':
            aValue = a.kpis.length > 0 ? new Date(a.kpis[0].startDate).getTime() : 0;
            bValue = b.kpis.length > 0 ? new Date(b.kpis[0].startDate).getTime() : 0;
            break;
          case 'endDate':
            aValue = a.kpis.length > 0 ? new Date(a.kpis[0].endDate).getTime() : 0;
            bValue = b.kpis.length > 0 ? new Date(b.kpis[0].endDate).getTime() : 0;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredKRAs;
  };

  // Add a function to get progress color
  const getProgressColor = (progress: number) => {
    if (progress < 50) return 'bg-red-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Add a function to check if KRA is overdue
  const isKRAOverdue = (kra: KRA) => {
    if (kra.kpis.length === 0) return false;
    
    const endDate = new Date(kra.kpis[0].endDate);
    const today = new Date();
    
    return endDate < today && kra.kpis[0].progress < 100;
  };

  // Add a function to check if KRA is at risk
  const isKRAAtRisk = (kra: KRA) => {
    if (kra.kpis.length === 0) return false;
    
    const endDate = new Date(kra.kpis[0].endDate);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysLeft < 30 && kra.kpis[0].progress < 50;
  };

  // Add a function to get unique departments
  const getUniqueDepartments = (kras: KRA[]) => {
    const departments = new Set<string>();
    kras.forEach(kra => {
      if (kra.kpis.length > 0 && kra.kpis[0].department) {
        departments.add(kra.kpis[0].department);
      }
    });
    return Array.from(departments);
  };

  // Add a function to get unique responsible officers
  const getUniqueResponsibleOfficers = (kras: KRA[]) => {
    const officers = new Set<string>();
    kras.forEach(kra => {
      if (kra.kpis.length > 0 && kra.kpis[0].responsibleOfficer) {
        officers.add(kra.kpis[0].responsibleOfficer);
      }
    });
    return Array.from(officers);
  };

  // Functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Closed</Badge>;
      default:
        return null;
    }
  };
  
  const getKPIStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'needs-attention':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'at-risk':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Add isAddingKRA state
  const [isAddingKRA, setIsAddingKRA] = useState(false);
  
  // Fix the handleAddKRA function to use setIsAddingKRA
  const handleAddKRA = () => {
    // Validation
    if (!kraForm.name || !kraForm.objectiveId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    // Create new KRA
    const newKRA: KRA = {
      id: String(Math.max(...kras.map(k => Number(k.id)), ...closedKras.map(k => Number(k.id))) + 1),
      name: kraForm.name || '',
      objectiveId: kraForm.objectiveId || '',
      objectiveName: objectives.find(obj => obj.id === parseInt(kraForm.objectiveId || '0'))?.name || '',
      department: kraForm.department || '',
      responsible: kraForm.responsible || '',
      startDate: kraForm.startDate ? new Date(kraForm.startDate) : new Date(),
      endDate: kraForm.endDate ? new Date(kraForm.endDate) : new Date(),
      progress: 0,
      status: 'open',
      kpis: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add the new KRA
    setKras([...kras, newKRA]);
    
    // Reset form
    setKraForm({
      name: '',
      objectiveId: '',
      department: '',
      responsible: '',
      startDate: '',
      endDate: ''
    });
    
    setIsAddingKRA(false);
    toast.success('KRA added successfully');
  };
  
  const handleAddKPI = (kraId: string, kpi: KPI) => {
    const updatedKRAs = kras.map(kra => {
      if (kra.id === kraId) {
        return {
          ...kra,
          kpis: [...kra.kpis, { ...kpi, id: String(kra.kpis.length + 1) }]
        };
      }
      return kra;
    });
    setKras(updatedKRAs);
  };
  
  const handleAddObjective = () => {
    // Validate form
    if (!objectiveForm.name) {
      setFormError("Objective Name is required");
      return;
    }
    
    // Create new Objective
    const newObjective: Objective = {
      id: Math.max(...objectives.map(o => o.id)) + 1,
      name: objectiveForm.name || '',
      description: objectiveForm.description || ''
    };
    
    // Add to state
    setObjectives([...objectives, newObjective]);
    
    // Reset form
    setObjectiveForm({
      name: '',
      description: ''
    });
    setFormError(null);
    
    // Show success message
    toast.success("Objective added successfully");
  };
  
  const handleEditKRA = (kra: KRA) => {
    setEditingKRA(kra); // Set the KRA to be edited
    setIsEditKRADialogOpen(true); // Open the dialog
  };

  const handleCloseKRADrawer = () => {
    setIsKRADrawerOpen(false);
    setSelectedKRADrawer(null);
  };

  const handleDeleteKRA = (kraId: string) => {
    if (window.confirm('Are you sure you want to delete this KRA?')) {
      setKras(kras.filter(k => k.id !== kraId));
      toast.success('KRA deleted successfully');
    }
  };

  const handleMoveKRA = (kraId: string, newObjectiveId: string) => {
    const kra = kras.find(k => k.id === kraId);
    if (kra) {
      const objective = objectives.find(obj => String(obj.id) === newObjectiveId);
      if (objective) {
        const updatedKRA = {
          ...kra,
          objectiveId: newObjectiveId,
          objectiveName: objective.name,
          updatedAt: new Date().toISOString()
        };
        
        setKras(kras.map(k => k.id === kraId ? updatedKRA : k));
        toast.success(`KRA moved to objective: ${objective.name}`);
      }
    }
  };

  // Fix the Excel upload KPIs
  const sampleKPIs = [
    {
      id: '1',
      name: 'Market Share',
      target: '20',
      current: '15',
      unit: '%',
      frequency: 'Quarterly',
      status: 'on-track',
      description: 'Market share percentage'
    },
    {
      id: '2',
      name: 'NPS Score',
      target: '8',
      current: '0',
      unit: 'Score',
      frequency: 'Quarterly',
      status: 'on-track',
      description: 'Net Promoter Score'
    }
  ];
  
  // Update Excel upload function to use proper KPI objects
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    setIsUploadingExcel(true);

    // Simulate Excel processing
    setTimeout(() => {
      // Create sample KRAs from "Excel"
      const newKRA1: KRA = {
        id: String(Math.max(...kras.map(k => Number(k.id)), ...closedKras.map(k => Number(k.id))) + 1),
        name: 'Market Growth Initiative (Imported)',
        objectiveId: '1',
        objectiveName: 'Market Growth',
        department: 'Marketing',
        responsible: 'Marketing Director',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        progress: 0,
        status: 'in-progress',
        kpis: [
          {
            id: '1',
            name: 'Market Share',
            target: '20',
            current: '15',
            unit: '%',
            frequency: 'Quarterly',
            status: 'on-track',
            description: 'Market share percentage'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newKRA2: KRA = {
        id: String(Number(newKRA1.id) + 1),
        name: 'Customer Satisfaction Program (Imported)',
        objectiveId: '5',
        objectiveName: 'Customer Satisfaction',
        department: 'Customer Service',
        responsible: 'Customer Service Manager',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        progress: 0,
        status: 'open',
        kpis: [
          {
            id: '2',
            name: 'NPS Score',
            target: '8',
            current: '0',
            unit: 'Score',
            frequency: 'Quarterly',
            status: 'on-track',
            description: 'Net Promoter Score'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setKras([...kras, newKRA1, newKRA2]);
      setIsUploadingExcel(false);
      
      // Reset file input
      event.target.value = '';
      
      toast.success('Excel data imported successfully');
    }, 2000);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      message: newMessage,
      timestamp: new Date()
    };
    
    setChatMessages([...chatMessages, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(newMessage);
      const aiMessage: ChatMessage = {
        id: chatMessages.length + 2,
        sender: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
    
    setNewMessage('');
  };
  
  const generateAIResponse = (message: string): string => {
    // Simple response generation based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('kra') && lowerMessage.includes('status')) {
      return `There are currently ${kras.length} active KRAs and ${closedKras.length} closed KRAs. ${kras.filter(k => k.status === 'in-progress').length} are in progress.`;
    } else if (lowerMessage.includes('kpi') && lowerMessage.includes('progress')) {
      const totalKPIs = [...kras, ...closedKras].flatMap(k => k.kpis).length;
      const onTrackKPIs = [...kras, ...closedKras].flatMap(k => k.kpis).filter(k => k.status === 'on-track').length;
      return `Of the ${totalKPIs} KPIs, ${onTrackKPIs} are on track (${Math.round(onTrackKPIs/totalKPIs*100)}%).`;
    } else if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      return "To add a new KRA, click the 'Add KRA' button and fill out the form with the required information.";
    } else if (lowerMessage.includes('close') || lowerMessage.includes('complete')) {
      return "To close a KRA, click the 'Close' button in the Actions column of the KRA you want to close.";
    } else {
      return "I can help you with information about KRAs, KPIs, and their statuses. You can ask me about adding, updating, or closing KRAs, or about the current progress of your objectives.";
    }
  };
  
  const generateAIAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      // In a real app, this would call an AI service
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      const analysis = `Based on the current data:
1. Overall Performance: The unit is showing strong progress with 75% of KPIs on track.
2. Key Strengths: Market expansion and product innovation are exceeding targets.
3. Areas for Improvement: Process automation needs attention to meet cost reduction goals.
4. Recommendations: 
   - Focus on accelerating automation initiatives
   - Consider reallocating resources to underperforming areas
   - Review and adjust targets for consistently overachieving metrics`;
      setAIAnalysis(analysis);
    } catch (error) {
      toast.error('Failed to generate AI analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      // In a real app, this would generate a PDF with the data and optionally include AI analysis
      toast.success('PDF report generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF report');
    }
  };
  
  // Add new state variables for inline editing
  const [editingCell, setEditingCell] = useState<{
    kraId: string;
    field: string;
    value: string;
  } | null>(null);

  // Add a function to handle inline editing
  const handleInlineEdit = (kraId: string, field: string, value: string | number) => {
    setEditingCell({
      kraId,
      field,
      value: String(value)
    });
  };

  // Add a function to save inline edits
  const saveInlineEdit = () => {
    if (!editingCell) return;
    
    const { kraId, field, value } = editingCell;
    
    // Find the KRA being edited
    const updatedKRA = kras.find(k => k.id === kraId);
    
    if (updatedKRA) {
      // Handle different fields
      if (field === 'name') {
        updatedKRA.name = value;
      } else if (field === 'status') {
        updatedKRA.status = value as any;
      } else if (field.startsWith('kpi_')) {
        // Get the KPI field (after 'kpi_')
        const kpiField = field.split('_')[1];
        
        // Find the first KPI (we're working with the first KPI for now)
        const updatedKPI = updatedKRA.kpis[0];
        
        if (updatedKPI) {
          if (kpiField === 'name') {
            updatedKPI.name = value;
          } else if (kpiField === 'current') {
            updatedKPI.current = value;
            // Recalculate progress - convert to string before using parseFloat
            const current = parseFloat(String(value));
            const target = parseFloat(String(updatedKPI.target));
            updatedKPI.progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          } else if (kpiField === 'target') {
            updatedKPI.target = value;
            // Recalculate progress - convert to string before using parseFloat
            const current = parseFloat(String(updatedKPI.current));
            const target = parseFloat(String(value));
            updatedKPI.progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          } else if (kpiField === 'department') {
            updatedKPI.department = value;
          } else if (kpiField === 'responsibleOfficer') {
            updatedKPI.responsibleOfficer = value;
          } else if (kpiField === 'startDate') {
            updatedKPI.startDate = value;
          } else if (kpiField === 'endDate') {
            updatedKPI.endDate = value;
          }
          
          updatedKRA.kpis = [updatedKPI];
        }
      }
      
      // Update the KRAs state
      setKras(kras.map(k => k.id === kraId ? updatedKRA : k));
      
      // Clear the editing cell
      setEditingCell(null);
      
      // Show success message
      toast.success('KRA updated successfully');
    }
  };

  // Add a function to cancel inline editing
  const cancelInlineEdit = () => {
    setEditingCell(null);
  };
  
  // Render functions
  const renderKRATable = (kras: KRA[], isClosed = false) => {
    const sortedAndFilteredKRAs = getSortedAndFilteredKRAs(kras);
    const uniqueDepartments = getUniqueDepartments(kras);
    const uniqueResponsibleOfficers = getUniqueResponsibleOfficers(kras);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {!isClosed && (
            <div className="flex space-x-2">
              <Button 
                variant={kraFilter === 'all' ? 'default' : 'outline'} 
                onClick={() => setKraFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button 
                variant={kraFilter === 'open' ? 'default' : 'outline'} 
                onClick={() => setKraFilter('open')}
                size="sm"
              >
                Open
              </Button>
              <Button 
                variant={kraFilter === 'in-progress' ? 'default' : 'outline'} 
                onClick={() => setKraFilter('in-progress')}
                size="sm"
              >
                In Progress
              </Button>
              <Button 
                variant={kraFilter === 'closed' ? 'default' : 'outline'} 
                onClick={() => setKraFilter('closed')}
                size="sm"
              >
                Closed
              </Button>
            </div>
          )}
          {!isClosed && (
            <Button 
              className="bg-[#781623] hover:bg-[#5d101b] text-white"
              onClick={() => setIsAddKRADialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add KRA
            </Button>
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  KRA Name/ID
                  {sortConfig?.key === 'name' && (
                    <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('objective')}
              >
                <div className="flex items-center gap-1">
                  Objective Linked
                  {sortConfig?.key === 'objective' && (
                    <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead>KPI</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortConfig?.key === 'status' && (
                    <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              {isSidebarCollapsed && (
                <>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('progress')}
                  >
                    <div className="flex items-center gap-1">
                      Progress
                      {sortConfig?.key === 'progress' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center gap-1">
                      Department
                      {sortConfig?.key === 'department' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('responsibleOfficer')}
                  >
                    <div className="flex items-center gap-1">
                      Responsible Officer
                      {sortConfig?.key === 'responsibleOfficer' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center gap-1">
                      Start Date
                      {sortConfig?.key === 'startDate' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('endDate')}
                  >
                    <div className="flex items-center gap-1">
                      End Date
                      {sortConfig?.key === 'endDate' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                </>
              )}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredKRAs.length > 0 ? (
              sortedAndFilteredKRAs.map((kra) => (
                <TableRow 
                  key={kra.id}
                  className={isKRAOverdue(kra) ? 'bg-red-50 dark:bg-red-900/20' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isKRAAtRisk(kra) && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        {editingCell && editingCell.kraId === kra.id && editingCell.field === 'name' ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit();
                                if (e.key === 'Escape') cancelInlineEdit();
                              }}
                              autoFocus
                              className="h-7 py-1"
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                            onClick={() => handleInlineEdit(kra.id, 'name', kra.name)}
                          >
                            <div>{kra.name}</div>
                            <div className="text-xs text-gray-500">ID: {kra.id}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{kra.objectiveName}</div>
                    <div className="text-xs text-gray-500">ID: {kra.objectiveId}</div>
                  </TableCell>
                  <TableCell>
                    {kra.kpis.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_name' ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit();
                                if (e.key === 'Escape') cancelInlineEdit();
                              }}
                              autoFocus
                              className="h-7 py-1"
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                            onClick={() => handleInlineEdit(kra.id, 'kpi_name', kra.kpis[0].name)}
                          >
                            <span>{kra.kpis[0].name}:</span>
                            <div className="flex items-center gap-1">
                              {getKPIStatusIcon(kra.kpis[0].status)}
                              {editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_current' ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editingCell.value}
                                    onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveInlineEdit();
                                      if (e.key === 'Escape') cancelInlineEdit();
                                    }}
                                    autoFocus
                                    className="h-7 py-1 w-16"
                                  />
                                  <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <span 
                                  className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                                  onClick={() => handleInlineEdit(kra.id, 'kpi_current', kra.kpis[0].current)}
                                >
                                  {kra.kpis[0].current} / {kra.kpis[0].target}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No KPI</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* KRA Status Dropdown - Consistent with Tasks */}
                    <select
                      value={kra.status}
                      onChange={(e) => handleUpdateKRAStatus(kra.id, e.target.value as KRA['status'])}
                      className={`rounded px-2 py-1 text-xs font-medium border ${ 
                        kra.status === 'open' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        kra.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        kra.status === 'closed' ? 'bg-green-100 text-green-800 border-green-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </TableCell>
                  {isSidebarCollapsed && (
                    <>
                      <TableCell>
                        {kra.kpis.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(kra.kpis[0].progress)}`} 
                                style={{ width: `${kra.kpis[0].progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{kra.kpis[0].progress}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kra.kpis.length > 0 ? (
                          editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_department' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                autoFocus
                                className="h-7 py-1"
                              />
                              <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                              onClick={() => handleInlineEdit(kra.id, 'kpi_department', kra.kpis[0].department)}
                            >
                              {kra.kpis[0].department}
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kra.kpis.length > 0 ? (
                          editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_responsibleOfficer' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                autoFocus
                                className="h-7 py-1"
                              />
                              <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                              onClick={() => handleInlineEdit(kra.id, 'kpi_responsibleOfficer', kra.kpis[0].responsibleOfficer)}
                            >
                              {kra.kpis[0].responsibleOfficer}
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kra.kpis.length > 0 ? (
                          editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_startDate' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                autoFocus
                                className="h-7 py-1"
                              />
                              <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                              onClick={() => handleInlineEdit(kra.id, 'kpi_startDate', kra.kpis[0].startDate)}
                            >
                              {new Date(kra.kpis[0].startDate).toLocaleDateString()}
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kra.kpis.length > 0 ? (
                          editingCell && editingCell.kraId === kra.id && editingCell.field === 'kpi_endDate' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                autoFocus
                                className="h-7 py-1"
                              />
                              <Button size="sm" variant="ghost" onClick={saveInlineEdit} className="h-7 px-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelInlineEdit} className="h-7 px-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div 
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                                onClick={() => handleInlineEdit(kra.id, 'kpi_endDate', kra.kpis[0].endDate)}
                              >
                                {new Date(kra.kpis[0].endDate).toLocaleDateString()}
                              </div>
                              {isKRAOverdue(kra) && (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {/* Consistent Actions - Edit/Delete */}
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditKRA(kra)} // Call handleEditKRA with the kra object
                        title="Edit KRA"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteKRA(kra.id)} // Keep existing delete logic link
                        className="text-red-600 hover:text-red-700"
                        title="Delete KRA"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isSidebarCollapsed ? 10 : 5} className="text-center py-4 text-gray-500">
                  No KRAs found matching the criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Add tasks state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Finalize market entry strategy for Indonesia',
      description: 'Complete market analysis and develop entry strategy document',
      status: 'in-progress',
      priority: 'high',
      assignee: 'John Smith',
      dueDate: '2024-06-30',
      kraId: '1',
      kraName: 'Market Expansion Strategy'
    },
    {
      id: '2',
      title: 'Prepare Q2 progress report',
      description: 'Compile KPI data and prepare quarterly progress report',
      status: 'pending',
      priority: 'medium',
      assignee: 'Sarah Johnson',
      dueDate: '2024-07-15',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    },
    {
      id: '3',
      title: 'Resolve system migration blocker',
      description: 'Address the data inconsistency issue blocking cloud migration',
      status: 'blocked',
      priority: 'critical',
      assignee: 'Michael Wong',
      dueDate: '2024-06-15',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    },
    {
      id: '4',
      title: 'Update quality assurance documentation',
      description: 'Revise QA procedures to include new quality metrics',
      status: 'completed',
      priority: 'medium',
      assignee: 'Lisa Chen',
      dueDate: '2024-06-10',
      kraId: '3',
      kraName: 'Quality Assurance Enhancement'
    },
    {
      id: '5',
      title: 'Coordinate innovation workshop',
      description: 'Plan and schedule innovation workshop with key stakeholders',
      status: 'in-progress',
      priority: 'high',
      assignee: 'David Miller',
      dueDate: '2024-07-05',
      kraId: '4',
      kraName: 'Innovation Pipeline'
    }
  ]);

  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    kraId: '',
    kraName: ''
  });

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

  // Task handlers
  const handleAddTask = () => {
    const newTask: Task = {
      id: String(tasks.length + 1),
      title: taskForm.title || '',
      description: taskForm.description || '',
      status: taskForm.status || 'pending',
      priority: taskForm.priority || 'medium',
      assignee: taskForm.assignee || '',
      dueDate: taskForm.dueDate || new Date().toISOString().split('T')[0],
      kraId: taskForm.kraId,
      kraName: taskForm.kraName
    };
    
    setTasks([...tasks, newTask]);
    setTaskForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      kraId: '',
      kraName: ''
    });
    setIsAddTaskDialogOpen(false);
  };

  // Handler to open edit task dialog
  const handleEditTask = (task: Task) => {
    setEditingTask(task); // Set the task to be edited
    setIsEditTaskDialogOpen(true); // Open the dialog
  };

  // Add KRA status update handler function
  const handleUpdateKRAStatus = (kraId: string, newStatus: KRA['status']) => {
    setKras(kras.map(kra => 
      kra.id === kraId ? { ...kra, status: newStatus } : kra
    ));
    toast.success('KRA status updated successfully');
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300'; // Adjusted colors for select
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTaskPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredTasks = () => {
    let items = [...tasks];
    if (taskFilters.status !== 'all') {
      items = items.filter(task => task.status === taskFilters.status);
    }
    if (taskFilters.priority !== 'all') {
      items = items.filter(task => task.priority === taskFilters.priority);
    }
    if (taskFilters.assignee !== 'all') {
      items = items.filter(task => task.assignee === taskFilters.assignee);
    }
    return items;
  };
  
  // Add risks state
  const [risks, setRisks] = useState<Risk[]>([
    {
      id: '1',
      title: 'Regulatory Compliance Risk',
      description: 'New regulations may impact market entry strategy',
      impact: 'high',
      likelihood: 'medium',
      status: 'identified', // Changed from 'open' to 'identified'
      owner: 'Legal Department',
      dateIdentified: '2024-05-15',
      mitigation: 'Engage with local legal experts to develop compliance strategy',
      category: 'Financial',
      projectId: '1',
      projectName: 'Market Expansion - Southeast Asia',
      kraId: '1',
      kraName: 'Market Expansion Strategy'
    },
    {
      id: '2',
      title: 'System compatibility issues',
      description: 'Legacy systems may not be compatible with new cloud infrastructure',
      impact: 'critical', // Changed from 'severe' to 'critical'
      likelihood: 'high',
      status: 'analyzing',
      owner: 'IT Director',
      dateIdentified: '2024-04-10',
      mitigation: 'Develop middleware solution and phase migration approach',
      category: 'Technical',
      projectId: '2',
      projectName: 'Cloud Migration Initiative',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    },
    {
      id: '3',
      title: 'Team Resistance',
      description: 'Team members showing resistance to implementing new quality metrics',
      impact: 'medium',
      likelihood: 'high',
      status: 'mitigating',
      owner: 'QA Manager',
      dateIdentified: '2024-07-01',
      mitigation: 'Additional training sessions and one-on-one meetings with key influencers',
      category: 'Operational',
      projectId: '3',
      projectName: 'Quality Management System Implementation',
      kraId: '3',
      kraName: 'Quality Assurance Enhancement'
    },
    {
      id: '4',
      title: 'Budget Constraints',
      description: 'Potential reduction in R&D budget may impact innovation initiatives',
      impact: 'high',
      likelihood: 'medium',
      status: 'identified', // Changed from 'open' to 'identified'
      owner: 'Finance Director',
      dateIdentified: '2024-06-25',
      mitigation: 'Prioritize projects with highest ROI and seek external funding options',
      category: 'Financial',
      projectId: '4',
      projectName: 'Product Innovation Lab',
      kraId: '4',
      kraName: 'Innovation Pipeline'
    },
    {
      id: '5',
      title: 'Vendor Disruption',
      description: 'Key technology vendor experiencing service disruptions',
      impact: 'medium',
      likelihood: 'low',
      status: 'resolved', // Changed from 'closed' to 'resolved'
      owner: 'Procurement Manager',
      dateIdentified: '2024-03-20',
      mitigation: 'Alternative vendor identified and transition completed',
      category: 'Operational',
      projectId: '5',
      projectName: 'Customer Service Enhancement',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    }
  ]);

  const [riskForm, setRiskForm] = useState<Partial<Risk>>({
    title: '',
    description: '',
    impact: 'medium',
    likelihood: 'medium',
    status: 'identified', // Change from 'open' to 'identified'
    owner: '',
    dateIdentified: new Date().toISOString().split('T')[0],
    mitigation: '',
    category: '',
    projectId: '',
    projectName: '',
    kraId: '',
    kraName: ''
  });

  const [isAddRiskDialogOpen, setIsAddRiskDialogOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');

  // Risk handlers
  const handleAddRisk = () => {
    const newRisk: Risk = {
      id: String(risks.length + 1),
      title: riskForm.title || '',
      description: riskForm.description || '',
      impact: riskForm.impact || 'medium',
      likelihood: riskForm.likelihood || 'medium',
      status: riskForm.status || 'identified', // Change from 'open' to 'identified'
      owner: riskForm.owner || '',
      dateIdentified: riskForm.dateIdentified || new Date().toISOString().split('T')[0],
      mitigation: riskForm.mitigation || '',
      category: riskForm.category || '',
      projectId: riskForm.projectId,
      projectName: riskForm.projectName,
      kraId: riskForm.kraId,
      kraName: riskForm.kraName
    };
    
    setRisks([...risks, newRisk]);
    setRiskForm({
      title: '',
      description: '',
      impact: 'medium',
      likelihood: 'medium',
      status: 'identified', // Change from 'open' to 'identified'
      owner: '',
      dateIdentified: new Date().toISOString().split('T')[0],
      mitigation: '',
      category: '',
      projectId: '',
      projectName: '',
      kraId: '',
      kraName: ''
    });
    setIsAddRiskDialogOpen(false);
  };

  const handleUpdateRiskStatus = (riskId: string, newStatus: Risk['status']) => {
    setRisks(risks.map(risk => 
      risk.id === riskId ? { ...risk, status: newStatus } : risk
    ));
  };

  const getRiskImpactColor = (impact: Risk['impact']) => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskProbabilityColor = (probability: Risk['likelihood']) => {
    switch (probability) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'very-high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskStatusColor = (status: Risk['status']) => {
    switch (status) {
      case 'identified': return 'bg-red-200 text-red-800';
      case 'analyzing': return 'bg-yellow-200 text-yellow-800';
      case 'mitigating': return 'bg-green-200 text-green-800';
      case 'monitoring': return 'bg-blue-200 text-blue-800';
      case 'resolved': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getRiskSeverity = (impact: Risk['impact'], probability: Risk['likelihood']) => {
    const impactScore = impact === 'critical' ? 4 : impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
    const probScore = probability === 'very-high' ? 4 : probability === 'high' ? 3 : probability === 'medium' ? 2 : 1;
    const score = impactScore * probScore;
    
    if (score >= 12) return 'Critical';
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getFilteredRisks = () => {
    let items = [...risks];
    if (riskFilters.status !== 'all') {
      items = items.filter(risk => risk.status === riskFilters.status);
    }
    if (riskFilters.impact !== 'all') {
      items = items.filter(risk => risk.impact === riskFilters.impact);
    }
    if (riskFilters.probability !== 'all') {
      items = items.filter(risk => risk.likelihood === riskFilters.probability);
    }
    if (riskFilters.owner !== 'all') {
      items = items.filter(risk => risk.owner === riskFilters.owner);
    }
    return items;
  };
  
  // Add projects state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Market Expansion - Southeast Asia',
      description: 'Project to expand market presence in Indonesia, Malaysia and Singapore',
      manager: 'John Smith',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      status: 'in-progress',
      budget: '$350,000',
      progress: 65,
      department: 'Sales',
      kraIds: ['1'],
      kraNames: ['Market Expansion Strategy']
    },
    {
      id: '2',
      name: 'Cloud Migration Initiative',
      description: 'Project to migrate all on-premise systems to cloud infrastructure',
      manager: 'Michael Wong',
      startDate: '2024-03-01',
      endDate: '2024-08-31',
      status: 'in-progress',
      budget: '$580,000',
      progress: 40,
      department: 'IT',
      kraIds: ['2'],
      kraNames: ['Digital Transformation Initiative']
    },
    {
      id: '3',
      name: 'Quality Management System Implementation',
      description: 'Implementation of new quality management system and processes',
      manager: 'Lisa Chen',
      startDate: '2024-06-01',
      endDate: '2024-09-30',
      status: 'planning',
      budget: '$120,000',
      progress: 15,
      department: 'Quality',
      kraIds: ['3'],
      kraNames: ['Quality Assurance Enhancement']
    },
    {
      id: '4',
      name: 'Product Innovation Lab',
      description: 'Establishment of innovation lab for new product development',
      manager: 'David Miller',
      startDate: '2024-08-01',
      endDate: '2025-02-28',
      status: 'planning',
      budget: '$275,000',
      progress: 5,
      department: 'R&D',
      kraIds: ['4'],
      kraNames: ['Innovation Pipeline']
    },
    {
      id: '5',
      name: 'Customer Service Enhancement',
      description: 'Project to improve customer service metrics and response times',
      manager: 'Sarah Johnson',
      startDate: '2023-05-15',
      endDate: '2023-12-15',
      status: 'completed',
      budget: '$95,000',
      progress: 100,
      department: 'Customer Service',
      kraIds: ['11'],
      kraNames: ['Customer Service Improvement']
    }
  ]);

  const [projectFilter, setProjectFilter] = useState('all');

  // Project handlers
  const getProjectStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-200 text-blue-800';
      case 'in-progress': return 'bg-yellow-200 text-yellow-800';
      case 'on-hold': return 'bg-orange-200 text-orange-800';
      case 'completed': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getFilteredProjects = () => {
    let items = [...projects];
    if (projectFilters.status !== 'all') {
      items = items.filter(project => project.status === projectFilters.status);
    }
    if (projectFilters.department !== 'all') {
      items = items.filter(project => project.department === projectFilters.department);
    }
    if (projectFilters.manager !== 'all') {
      items = items.filter(project => project.manager === projectFilters.manager);
    }
    return items;
  };

  // Add KRA filter state
  const [kraFilter, setKraFilter] = useState('all');

  // KRA filter handler
  const getFilteredKRAs = () => {
    let items = [...kras]; // Use active KRAs
    if (kraFilters.status !== 'all') {
      items = items.filter(kra => kra.status === kraFilters.status);
    }
    if (kraFilters.department !== 'all') {
      items = items.filter(kra => kra.department === kraFilters.department);
    }
    if (kraFilters.responsible !== 'all') {
      items = items.filter(kra => kra.responsible === kraFilters.responsible);
    }
    // Keep existing sort logic if needed, apply it to 'items'
    return items; 
  };
  
  // Add handleSetIsAddingKRA function
  const handleSetIsAddingKRA = (value: boolean) => {
    setIsAddingKRA(value);
  };

  // Fix Excel upload sample KPIs
  const sampleKpis = [
    {
      id: '1',
      name: 'Market Share',
      target: '20',
      current: '15',
      unit: '%',
      frequency: 'Quarterly',
      status: 'on-track',
      description: 'Market share percentage'
    },
    {
      id: '2',
      name: 'NPS Score',
      target: '8',
      current: '6',
      unit: 'Score',
      frequency: 'Quarterly',
      status: 'on-track',
      description: 'Net Promoter Score'
    }
  ];
  
  // Fix the newKPI function to ensure id is a string
  const handleNewKPI = (kraName?: string): KPI => {
    // Get highest KPI ID as a number and convert it to string for the new KPI
    const maxId = Math.max(
      ...kras.flatMap(k => k.kpis).map(k => isNaN(Number(k.id)) ? 0 : Number(k.id)),
      ...closedKras.flatMap(k => k.kpis).map(k => isNaN(Number(k.id)) ? 0 : Number(k.id)),
      0
    );
    
    return {
      id: String(maxId + 1),
      name: "New KPI",
      description: "",
      department: "",
      strategicObjective: "",
      kra: kraName || "",
      target: "0",
      measurementUnit: "",
      baselineValue: "",
      frequency: "Monthly",
      dataSource: "",
      responsibleOfficer: "",
      current: "0",
      status: "on-track" as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      comments: "",
      progress: 0
    };
  };
  
  // Add Task Dialog
  const AddTaskDialog = () => {
    const [newTask, setNewTask] = useState<Partial<Task>>({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignee: '',
      dueDate: new Date().toISOString().split('T')[0],
    });
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const taskId = String(Math.max(...tasks.map(t => Number(t.id)), 0) + 1);
      const task: Task = {
        ...newTask as Task,
        id: taskId,
      };
      setTasks([...tasks, task]);
      setIsAddTaskDialogOpen(false);
    };
  
    return (
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for tracking and management.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value: Task['status']) => setNewTask({ ...newTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: Task['priority']) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="Enter assignee name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#781623] hover:bg-[#5d101b]">Add Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Handler to save updated task
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setIsEditTaskDialogOpen(false);
    setEditingTask(null);
    toast.success('Task updated successfully');
  };

  // Handler to save updated KRA
  const handleUpdateKRA = (updatedKRA: KRA) => {
    setKras(kras.map(kra => (kra.id === updatedKRA.id ? updatedKRA : kra)));
    setClosedKras(closedKras.map(kra => (kra.id === updatedKRA.id ? updatedKRA : kra))); // Update in closed list too if applicable
    setIsEditKRADialogOpen(false);
    setEditingKRA(null);
    toast.success('KRA updated successfully');
  };

  // Edit KRA Dialog Component
  const EditKRADialog = () => {
    const [editedKra, setEditedKra] = useState<KRA | null>(editingKRA);

    useEffect(() => {
      setEditedKra(editingKRA); // Sync with external state when dialog opens
    }, [editingKRA]);

    if (!editedKra) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editedKra.name || !editedKra.objectiveId) {
        toast.error('Please fill in KRA Name and Linked Objective.');
        return;
      }
      // Update KRA using the handler function
      handleUpdateKRA({
        ...editedKra,
        updatedAt: new Date().toISOString(), // Update timestamp
        objectiveName: objectives.find(obj => String(obj.id) === editedKra.objectiveId)?.name || editedKra.objectiveName || '', // Ensure objective name is synced
      });
    };

    return (
      <Dialog open={isEditKRADialogOpen} onOpenChange={setIsEditKRADialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit KRA</DialogTitle>
            <DialogDescription>
              Update the details for this Key Result Area.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* KRA Name */}
              <div className="grid gap-2">
                <Label htmlFor="editKraName">KRA Name</Label>
                <Input
                  id="editKraName"
                  value={editedKra.name}
                  onChange={(e) => setEditedKra({ ...editedKra, name: e.target.value })}
                  placeholder="Enter KRA name"
                />
              </div>
              {/* Linked Objective */}
              <div className="grid gap-2">
                <Label htmlFor="editObjectiveId">Linked Objective</Label>
                <Select
                  value={editedKra.objectiveId}
                  onValueChange={(value) => setEditedKra({ ...editedKra, objectiveId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select linked objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((objective) => (
                      <SelectItem key={objective.id} value={String(objective.id)}>
                        {objective.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Department & Responsible */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="editDepartment">Department</Label>
                   <Input
                     id="editDepartment"
                     value={editedKra.department}
                     onChange={(e) => setEditedKra({ ...editedKra, department: e.target.value })}
                     placeholder="Enter department"
                   />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="editResponsible">Responsible</Label>
                   <Input
                     id="editResponsible"
                     value={editedKra.responsible}
                     onChange={(e) => setEditedKra({ ...editedKra, responsible: e.target.value })}
                     placeholder="Enter responsible person/role"
                   />
                 </div>
              </div>
              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={typeof editedKra.startDate === 'string' ? editedKra.startDate.split('T')[0] : (editedKra.startDate as Date).toISOString().split('T')[0]}
                    onChange={(e) => setEditedKra({ ...editedKra, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={typeof editedKra.endDate === 'string' ? editedKra.endDate.split('T')[0] : (editedKra.endDate as Date).toISOString().split('T')[0]}
                    onChange={(e) => setEditedKra({ ...editedKra, endDate: e.target.value })}
                  />
                </div>
              </div>
              {/* Status */}
              <div className="grid gap-2">
                 <Label htmlFor="editStatus">Status</Label>
                 <Select
                   value={editedKra.status}
                   onValueChange={(value: KRA['status']) => setEditedKra({ ...editedKra, status: value })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="open">Open</SelectItem>
                     <SelectItem value="in-progress">In Progress</SelectItem>
                     <SelectItem value="closed">Closed</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="editKraDescription">Description (Optional)</Label>
                <Textarea
                  id="editKraDescription"
                  value={editedKra.description || ''}
                  onChange={(e) => setEditedKra({ ...editedKra, description: e.target.value })}
                  placeholder="Enter a brief description for the KRA"
                />
              </div>
            </div>
            <DialogFooter>
               <Button variant="outline" type="button" onClick={() => setIsEditKRADialogOpen(false)}>Cancel</Button>
               <Button type="submit" className="bg-[#781623] hover:bg-[#5d101b]">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Edit Task Dialog Component
  const EditTaskDialog = () => {
    const [editedTask, setEditedTask] = useState<Task | null>(editingTask);

    useEffect(() => {
      setEditedTask(editingTask); // Sync with external state
    }, [editingTask]);

    if (!editedTask) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editedTask.title) {
        toast.error('Please enter a Task Title.');
        return;
      }
      handleUpdateTask(editedTask); // Call the existing update handler
    };

    return (
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details for this task.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Task Title */}
              <div className="grid gap-2">
                <Label htmlFor="editTaskTitle">Task Title</Label>
                <Input
                  id="editTaskTitle"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="editTaskDescription">Description</Label>
                <Textarea
                  id="editTaskDescription"
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editTaskStatus">Status</Label>
                  <Select
                    value={editedTask.status}
                    onValueChange={(value: Task['status']) => setEditedTask({ ...editedTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTaskPriority">Priority</Label>
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value: Task['priority']) => setEditedTask({ ...editedTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Assignee & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editTaskAssignee">Assignee</Label>
                  <Input
                    id="editTaskAssignee"
                    value={editedTask.assignee}
                    onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
                    placeholder="Enter assignee name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTaskDueDate">Due Date</Label>
                  <Input
                    id="editTaskDueDate"
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              {/* Related KRA (Optional - might need adjustment based on data) */}
              <div className="grid gap-2">
                <Label htmlFor="editTaskKra">Related KRA (Optional)</Label>
                <Select
                  value={editedTask.kraId || ''}
                  onValueChange={(value) => {
                     const selectedKra = kras.find(k => k.id === value);
                     setEditedTask({ ...editedTask, kraId: value, kraName: selectedKra?.name || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related KRA" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="">None</SelectItem>
                    {kras.map((kra) => (
                      <SelectItem key={kra.id} value={kra.id}>
                        {kra.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditTaskDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#781623] hover:bg-[#5d101b]">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Add function to render the tasks table
  const renderTasksTable = (tasksToRender: Task[]) => {
    const filteredTasks = getFilteredTasks(); // Use existing filter logic
    // Add sorting logic similar to KRAs if needed later
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {/* Filters for tasks can go here */}
          <Button 
            className="bg-[#781623] hover:bg-[#5d101b] text-white"
            onClick={() => setIsAddTaskDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Related KRA</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                      className={`rounded px-2 py-1 text-xs font-medium border ${getTaskStatusColor(task.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{task.kraName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditTask(task)} // Hook up the edit button
                        title="Edit Task"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Add Delete button later if needed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  No tasks found matching the criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Handler to open edit project dialog
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectDialogOpen(true);
  };

  // Handler to save updated project
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(project => (project.id === updatedProject.id ? updatedProject : project)));
    setIsEditProjectDialogOpen(false);
    setEditingProject(null);
    toast.success('Project updated successfully');
  };

  // Handler to open edit risk dialog
  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    setIsEditRiskDialogOpen(true);
  };

  // Handler to save updated risk
  const handleUpdateRisk = (updatedRisk: Risk) => {
    setRisks(risks.map(risk => (risk.id === updatedRisk.id ? updatedRisk : risk)));
    setIsEditRiskDialogOpen(false);
    setEditingRisk(null);
    toast.success('Risk updated successfully');
  };

  // Edit Project Dialog Component
  const EditProjectDialog = () => {
    const [editedProject, setEditedProject] = useState<Project | null>(editingProject);

    useEffect(() => {
      setEditedProject(editingProject); // Sync with external state
    }, [editingProject]);

    if (!editedProject) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editedProject.name || !editedProject.manager || !editedProject.department) {
        toast.error('Please fill in all required fields.');
        return;
      }
      handleUpdateProject({
        ...editedProject,
        // Ensure proper format for budget with '$' prefix
        budget: editedProject.budget.startsWith('$') ? editedProject.budget : `$${editedProject.budget}`,
      });
    };

    return (
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the details for this project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Project Name & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editProjectName">Project Name</Label>
                  <Input
                    id="editProjectName"
                    value={editedProject.name}
                    onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDepartment">Department</Label>
                  <Input
                    id="editDepartment"
                    value={editedProject.department}
                    onChange={(e) => setEditedProject({ ...editedProject, department: e.target.value })}
                    placeholder="Enter department"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editedProject.description}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  placeholder="Enter project description"
                />
              </div>

              {/* Project Manager & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editManager">Project Manager</Label>
                  <Input
                    id="editManager"
                    value={editedProject.manager}
                    onChange={(e) => setEditedProject({ ...editedProject, manager: e.target.value })}
                    placeholder="Enter project manager"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={editedProject.status}
                    onValueChange={(value: Project['status']) => setEditedProject({ ...editedProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editedProject.startDate}
                    onChange={(e) => setEditedProject({ ...editedProject, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={editedProject.endDate}
                    onChange={(e) => setEditedProject({ ...editedProject, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Budget & Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editBudget">Budget ($)</Label>
                  <Input
                    id="editBudget"
                    value={editedProject.budget.replace(/^\$/, '')} // Remove $ for editing
                    onChange={(e) => setEditedProject({ ...editedProject, budget: e.target.value })}
                    placeholder="Enter budget amount"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editProgress">Progress (%)</Label>
                  <Input
                    id="editProgress"
                    type="number"
                    min="0" max="100"
                    value={editedProject.progress}
                    onChange={(e) => setEditedProject({ ...editedProject, progress: parseInt(e.target.value) || 0 })}
                    placeholder="Enter progress percentage"
                  />
                </div>
              </div>

              {/* Related KRAs */}
              <div className="grid gap-2">
                <Label htmlFor="editRelatedKRAs">Related KRAs (Optional)</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                  {kras.map(kra => (
                    <div key={kra.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-kra-${kra.id}`}
                        checked={editedProject.kraIds?.includes(kra.id)}
                        onCheckedChange={(checked) => {
                          const currentIds = editedProject.kraIds || [];
                          const updatedIds = checked
                            ? [...currentIds, kra.id]
                            : currentIds.filter(id => id !== kra.id);
                          
                          // Update KRA names based on selected IDs
                          const updatedNames = kras
                            .filter(k => updatedIds.includes(k.id))
                            .map(k => k.name);
                          
                          setEditedProject({ 
                            ...editedProject, 
                            kraIds: updatedIds,
                            kraNames: updatedNames
                          });
                        }}
                      />
                      <Label htmlFor={`edit-kra-${kra.id}`} className="text-sm font-normal">{kra.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setIsEditProjectDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#781623] hover:bg-[#5d101b]">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Edit Risk Dialog Component
  const EditRiskDialog = () => {
    const [editedRisk, setEditedRisk] = useState<Risk | null>(editingRisk);

    useEffect(() => {
      setEditedRisk(editingRisk); // Sync with external state
    }, [editingRisk]);

    if (!editedRisk) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editedRisk.title || !editedRisk.category) {
        toast.error('Please fill in all required fields.');
        return;
      }
      handleUpdateRisk({
        ...editedRisk
      });
    };

    return (
      <Dialog open={isEditRiskDialogOpen} onOpenChange={setIsEditRiskDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
            <DialogDescription>
              Update the details for this risk.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Risk Title & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editRiskTitle">Risk Title</Label>
                  <Input
                    id="editRiskTitle"
                    value={editedRisk.title}
                    onChange={(e) => setEditedRisk({ ...editedRisk, title: e.target.value })}
                    placeholder="Enter risk title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Select
                    value={editedRisk.category}
                    onValueChange={(value: string) => setEditedRisk({ ...editedRisk, category: value })}
                  >
                    <SelectTrigger id="editCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Strategic">Strategic</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="editRiskDescription">Description</Label>
                <Textarea
                  id="editRiskDescription"
                  value={editedRisk.description}
                  onChange={(e) => setEditedRisk({ ...editedRisk, description: e.target.value })}
                  placeholder="Enter risk description"
                />
              </div>

              {/* Impact & Likelihood */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editImpact">Impact</Label>
                  <Select
                    value={editedRisk.impact}
                    onValueChange={(value: Risk['impact']) => setEditedRisk({ ...editedRisk, impact: value })}
                  >
                    <SelectTrigger id="editImpact">
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
                <div className="grid gap-2">
                  <Label htmlFor="editLikelihood">Likelihood</Label>
                  <Select
                    value={editedRisk.likelihood}
                    onValueChange={(value: Risk['likelihood']) => setEditedRisk({ ...editedRisk, likelihood: value })}
                  >
                    <SelectTrigger id="editLikelihood">
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
              </div>

              {/* Mitigation Plan */}
              <div className="grid gap-2">
                <Label htmlFor="editMitigation">Mitigation Plan</Label>
                <Textarea
                  id="editMitigation"
                  value={editedRisk.mitigation}
                  onChange={(e) => setEditedRisk({ ...editedRisk, mitigation: e.target.value })}
                  placeholder="Enter mitigation plan"
                />
              </div>

              {/* Status & Owner */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editRiskStatus">Status</Label>
                  <Select
                    value={editedRisk.status}
                    onValueChange={(value: Risk['status']) => setEditedRisk({ ...editedRisk, status: value })}
                  >
                    <SelectTrigger id="editRiskStatus">
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
                <div className="grid gap-2">
                  <Label htmlFor="editOwner">Owner</Label>
                  <Input
                    id="editOwner"
                    value={editedRisk.owner}
                    onChange={(e) => setEditedRisk({ ...editedRisk, owner: e.target.value })}
                    placeholder="Enter risk owner"
                  />
                </div>
              </div>

              {/* Related Project */}
              <div className="grid gap-2">
                <Label htmlFor="editRelatedProject">Related Project (Optional)</Label>
                <Select
                  value={editedRisk.projectId || ""}
                  onValueChange={(value: string) => {
                    const project = projects.find(p => p.id === value);
                    setEditedRisk({ 
                      ...editedRisk, 
                      projectId: value || undefined,
                      projectName: project ? project.name : undefined 
                    });
                  }}
                >
                  <SelectTrigger id="editRelatedProject">
                    <SelectValue placeholder="Select related project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setIsEditRiskDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#781623] hover:bg-[#5d101b]">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Add function to render the projects table
  const renderProjectsTable = () => {
    const filteredProjects = getFilteredProjects(); // Use existing filter logic
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {/* Filters for projects can go here */}
          <Button 
            className="bg-[#781623] hover:bg-[#5d101b] text-white"
            onClick={() => setIsAddProjectDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{project.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{project.description.substring(0, 50)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{project.manager}</TableCell>
                  <TableCell>{project.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={project.progress} className="w-[80px]" />
                      <span className="text-sm">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{project.budget}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditProject(project)}
                        title="Edit Project"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Add Delete button later if needed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  No projects found matching the criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Add function to render the risks table
  const renderRisksTable = () => {
    const filteredRisks = getFilteredRisks(); // Use existing filter logic
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {/* Filters for risks can go here */}
          <Button 
            className="bg-[#781623] hover:bg-[#5d101b] text-white"
            onClick={() => setIsAddRiskDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Likelihood</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{risk.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{risk.description.substring(0, 50)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>{risk.category}</TableCell>
                  <TableCell>
                    <select
                      value={risk.status}
                      onChange={(e) => handleUpdateRiskStatus(risk.id, e.target.value as Risk['status'])}
                      className={`rounded px-2 py-1 text-xs font-medium border ${getRiskStatusColor(risk.status)}`}
                    >
                      <option value="identified">Identified</option>
                      <option value="analyzing">Analyzing</option>
                      <option value="mitigating">Mitigating</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskImpactColor(risk.impact)}`}>
                      {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskProbabilityColor(risk.likelihood)}`}>
                      {risk.likelihood.charAt(0).toUpperCase() + risk.likelihood.slice(1).replace('-', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{risk.owner}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getRiskSeverity(risk.impact, risk.likelihood) === 'Critical' ? 'bg-red-200 text-red-800' :
                      getRiskSeverity(risk.impact, risk.likelihood) === 'High' ? 'bg-orange-200 text-orange-800' :
                      getRiskSeverity(risk.impact, risk.likelihood) === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {getRiskSeverity(risk.impact, risk.likelihood)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditRisk(risk)}
                        title="Edit Risk"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Add Delete button later if needed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                  No risks found matching the criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Unit Dashboard</h1>
        {/* Unit selector and other controls would go here */}
      </div>

      <Tabs defaultValue="kras" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="kras" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            KRAs/KPIs
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Tasks/Daily Operations
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Risks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kras">
          {renderKRATable(kras)} 
          <h2 className="text-xl font-semibold mt-6 mb-3">Closed KRAs</h2>
          {renderKRATable(closedKras, true)}
        </TabsContent>

        <TabsContent value="tasks">
          {renderTasksTable(tasks)} {/* Render the tasks table */}
        </TabsContent>

        <TabsContent value="projects">
          {renderProjectsTable()} {/* Render the projects table */}
        </TabsContent>

        <TabsContent value="risks">
          {renderRisksTable()} {/* Render the risks table */}
        </TabsContent>

        {/* Reports tab can be added later */}
        
      </Tabs>

      {/* Add dialogs referenced elsewhere */}
      {isAddTaskDialogOpen && <AddTaskDialog />}
      {isEditKRADialogOpen && <EditKRADialog />}
      {isEditTaskDialogOpen && <EditTaskDialog />}
      {isEditProjectDialogOpen && <EditProjectDialog />}
      {isEditRiskDialogOpen && <EditRiskDialog />}
    </PageLayout>
  );
};

export default Unit; 