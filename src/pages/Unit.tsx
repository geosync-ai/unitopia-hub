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
  impact: 'low' | 'medium' | 'high' | 'severe';
  probability: 'low' | 'medium' | 'high' | 'certain';
  status: 'open' | 'mitigating' | 'closed' | 'accepted';
  owner: string;
  dateIdentified: string;
  mitigation: string;
  kraId?: string;
  kraName?: string;
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
          date: new Date(2024, 1, 15), // Middle of Q1
          target: "5",
          actual: "3",
          status: "In Progress",
          description: "Number of new markets entered",
          notes: "Expansion plan in progress"
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
          date: new Date(2024, 4, 15), // Middle of Q2
          target: "100",
          actual: "45",
          status: "In Progress",
          description: "Percentage of systems migrated",
          notes: "Migration ongoing"
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
          date: new Date(2024, 7, 15), // Middle of Q3
          target: "98",
          actual: "95",
          status: "On Track",
          description: "Service quality score",
          notes: "Implementing new quality measures"
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
          date: new Date(2024, 10, 15), // Middle of Q4
          target: "10",
          actual: "4",
          status: "In Progress",
          description: "Number of new solutions developed",
          notes: "Research phase ongoing"
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
          unit: "percentage",
          frequency: "Monthly",
          status: "on-track",
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          notes: "Exceeding target, excellent performance"
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
  
  const handleAddKRA = () => {
    // Validate form
    if (!kraForm.name || !kraForm.objectiveId) {
      setFormError("KRA Name and Linked Objective are required");
      return;
    }
    
    // Find objective name
    const objective = objectives.find(obj => obj.id === parseInt(kraForm.objectiveId));
    
    // Create new KRA
    const newKRA: KRA = {
      id: Math.max(...kras.map(k => k.id), ...closedKras.map(k => k.id)) + 1,
      name: kraForm.name || '',
      objectiveId: kraForm.objectiveId || '',
      objectiveName: objectives.find(obj => obj.id === parseInt(kraForm.objectiveId))?.name || '',
      department: kraForm.department || '',
      responsible: kraForm.responsible || '',
      startDate: kraForm.startDate || new Date(),
      endDate: kraForm.endDate || new Date(),
      progress: 0,
      status: 'open',
      kpis: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to state
    setKras([...kras, newKRA]);
    
    // Reset form
    setKraForm({
      name: '',
      objectiveId: '',
      kpis: [],
      status: 'open'
    });
    setFormError(null);
    
    // Show success message
    toast.success("KRA added successfully");
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
    setSelectedKRADrawer(kra);
    setIsKRADrawerOpen(true);
  };

  const handleCloseKRADrawer = () => {
    setIsKRADrawerOpen(false);
    setSelectedKRADrawer(null);
  };

  const handleUpdateKRA = () => {
    if (selectedKRADrawer) {
      setKras(kras.map(k => k.id === selectedKRADrawer.id ? selectedKRADrawer : k));
      toast.success('KRA updated successfully');
      handleCloseKRADrawer();
    }
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
      const objective = objectives.find(obj => obj.id === newObjectiveId);
      if (objective) {
        const updatedKRA = {
          ...kra,
          objectiveId: newObjectiveId,
          objectiveName: objective.name
        };
        setKras(kras.map(k => k.id === kraId ? updatedKRA : k));
        toast.success('KRA moved successfully');
      }
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an Excel file
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploadingExcel(true);

    try {
      // TODO: Implement actual Excel parsing logic
      // For now, we'll simulate the upload with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock data from Excel
      const mockKRAs: KRA[] = [
        {
          id: '1',
          name: 'Increase Market Share',
          objectiveId: '1',
          objectiveName: 'Market Leadership',
          department: 'Marketing',
          responsible: 'Marketing Director',
          startDate: new Date(2023, 0, 1),
          endDate: new Date(2023, 11, 31),
          progress: 75,
          status: 'in-progress',
          kpis: [
            {
              id: '1',
              name: 'Market Share',
              target: 20,
              current: 15,
              unit: '%',
              frequency: 'Quarterly'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Improve Customer Satisfaction',
          objectiveId: '2',
          objectiveName: 'Customer Excellence',
          department: 'Customer Service',
          responsible: 'Customer Service Manager',
          startDate: new Date(2023, 0, 1),
          endDate: new Date(2023, 11, 31),
          progress: 0,
          status: 'open',
          kpis: [
            {
              id: '2',
              name: 'NPS Score',
              target: 8,
              current: 0,
              unit: 'Score',
              frequency: 'Quarterly'
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Update KRAs state with the new data
      setKras(prevKRAs => [...prevKRAs, ...mockKRAs]);
      toast.success('Excel file uploaded successfully');
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setIsUploadingExcel(false);
      // Reset the file input
      event.target.value = '';
    }
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
  const handleInlineEdit = (kraId: string, field: string, value: string) => {
    setEditingCell({ kraId, field, value });
  };

  // Add a function to save inline edits
  const saveInlineEdit = () => {
    if (!editingCell) return;
    
    const { kraId, field, value } = editingCell;
    
    // Find the KRA to update
    const kraToUpdate = kras.find(k => k.id === kraId);
    if (!kraToUpdate) return;
    
    // Create a copy of the KRA
    const updatedKRA = { ...kraToUpdate };
    
    // Update the appropriate field
    if (field === 'name') {
      updatedKRA.name = value;
    } else if (field === 'status') {
      updatedKRA.status = value as 'open' | 'in-progress' | 'closed';
    } else if (field.startsWith('kpi_')) {
      // Handle KPI field updates
      const kpiField = field.split('_')[1];
      if (updatedKRA.kpis.length > 0) {
        const updatedKPI = { ...updatedKRA.kpis[0] };
        
        if (kpiField === 'name') {
          updatedKPI.name = value;
        } else if (kpiField === 'current') {
          updatedKPI.current = value;
          // Recalculate progress
          const current = parseFloat(value);
          const target = parseFloat(updatedKPI.target);
          updatedKPI.progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        } else if (kpiField === 'target') {
          updatedKPI.target = value;
          // Recalculate progress
          const current = parseFloat(updatedKPI.current);
          const target = parseFloat(value);
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
          <h3 className="text-lg font-medium">{isClosed ? 'Closed KRAs' : 'Active KRAs'}</h3>
          {!isClosed && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => document.getElementById('excel-upload')?.click()}
                disabled={isUploadingExcel}
              >
                {isUploadingExcel ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Import from Excel</span>
                  </>
                )}
              </Button>
              <input 
                id="excel-upload" 
                type="file" 
                accept=".xlsx,.xls" 
                className="hidden" 
                onChange={handleExcelUpload} 
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setIsAddKRADialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add KRA</span>
              </Button>
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={filters.department} 
              onValueChange={(value) => setFilters({...filters, department: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Responsible Officer</Label>
            <Select 
              value={filters.responsibleOfficer} 
              onValueChange={(value) => setFilters({...filters, responsibleOfficer: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Officers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Officers</SelectItem>
                {uniqueResponsibleOfficers.map((officer) => (
                  <SelectItem key={officer} value={officer}>{officer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Progress Range</Label>
            <Select 
              value={filters.progressRange} 
              onValueChange={(value) => setFilters({...filters, progressRange: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Progress</SelectItem>
                <SelectItem value="low">Low (&lt; 50%)</SelectItem>
                <SelectItem value="medium">Medium (50% - 80%)</SelectItem>
                <SelectItem value="high">High (&gt; 80%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    {editingCell && editingCell.kraId === kra.id && editingCell.field === 'status' ? (
                      <div className="flex items-center gap-1">
                        <Select 
                          value={editingCell.value} 
                          onValueChange={(value) => setEditingCell({...editingCell, value})}
                          open={true}
                        >
                          <SelectTrigger className="h-7 py-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
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
                        onClick={() => handleInlineEdit(kra.id, 'status', kra.status)}
                      >
                        {getStatusBadge(kra.status)}
                      </div>
                    )}
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditKRA(kra)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isSidebarCollapsed ? 10 : 5} className="text-center py-6 text-gray-500">
                  No KRAs match the selected filters.
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

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-200 text-gray-800';
      case 'in-progress': return 'bg-blue-200 text-blue-800';
      case 'completed': return 'bg-green-200 text-green-800';
      case 'blocked': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
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
    if (taskFilter === 'all') return tasks;
    return tasks.filter(task => task.status === taskFilter);
  };
  
  // Add risks state
  const [risks, setRisks] = useState<Risk[]>([
    {
      id: '1',
      title: 'Regulatory changes in Indonesia market',
      description: 'New regulations may impact market entry strategy',
      impact: 'high',
      probability: 'medium',
      status: 'open',
      owner: 'Legal Department',
      dateIdentified: '2024-05-15',
      mitigation: 'Engage with local legal experts to develop compliance strategy',
      kraId: '1',
      kraName: 'Market Expansion Strategy'
    },
    {
      id: '2',
      title: 'System compatibility issues',
      description: 'Legacy systems may not be compatible with new cloud infrastructure',
      impact: 'severe',
      probability: 'high',
      status: 'mitigating',
      owner: 'IT Director',
      dateIdentified: '2024-04-10',
      mitigation: 'Develop middleware solution and phase migration approach',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    },
    {
      id: '3',
      title: 'Staff resistance to new QA procedures',
      description: 'Team members showing resistance to implementing new quality metrics',
      impact: 'medium',
      probability: 'high',
      status: 'mitigating',
      owner: 'QA Manager',
      dateIdentified: '2024-07-01',
      mitigation: 'Additional training sessions and one-on-one meetings with key influencers',
      kraId: '3',
      kraName: 'Quality Assurance Enhancement'
    },
    {
      id: '4',
      title: 'Budget constraints for innovation projects',
      description: 'Potential reduction in R&D budget may impact innovation initiatives',
      impact: 'high',
      probability: 'medium',
      status: 'open',
      owner: 'Finance Director',
      dateIdentified: '2024-06-25',
      mitigation: 'Prioritize projects with highest ROI and seek external funding options',
      kraId: '4',
      kraName: 'Innovation Pipeline'
    },
    {
      id: '5',
      title: 'Vendor reliability issues',
      description: 'Key technology vendor experiencing service disruptions',
      impact: 'medium',
      probability: 'low',
      status: 'closed',
      owner: 'Procurement Manager',
      dateIdentified: '2024-03-20',
      mitigation: 'Alternative vendor identified and transition completed',
      kraId: '2',
      kraName: 'Digital Transformation Initiative'
    }
  ]);

  const [riskForm, setRiskForm] = useState<Partial<Risk>>({
    title: '',
    description: '',
    impact: 'medium',
    probability: 'medium',
    status: 'open',
    owner: '',
    dateIdentified: new Date().toISOString().split('T')[0],
    mitigation: '',
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
      probability: riskForm.probability || 'medium',
      status: riskForm.status || 'open',
      owner: riskForm.owner || '',
      dateIdentified: riskForm.dateIdentified || new Date().toISOString().split('T')[0],
      mitigation: riskForm.mitigation || '',
      kraId: riskForm.kraId,
      kraName: riskForm.kraName
    };
    
    setRisks([...risks, newRisk]);
    setRiskForm({
      title: '',
      description: '',
      impact: 'medium',
      probability: 'medium',
      status: 'open',
      owner: '',
      dateIdentified: new Date().toISOString().split('T')[0],
      mitigation: '',
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
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskProbabilityColor = (probability: Risk['probability']) => {
    switch (probability) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'certain': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskStatusColor = (status: Risk['status']) => {
    switch (status) {
      case 'open': return 'bg-red-200 text-red-800';
      case 'mitigating': return 'bg-yellow-200 text-yellow-800';
      case 'closed': return 'bg-green-200 text-green-800';
      case 'accepted': return 'bg-blue-200 text-blue-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getRiskSeverity = (impact: Risk['impact'], probability: Risk['probability']) => {
    const impactScore = impact === 'severe' ? 4 : impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
    const probScore = probability === 'certain' ? 4 : probability === 'high' ? 3 : probability === 'medium' ? 2 : 1;
    const score = impactScore * probScore;
    
    if (score >= 12) return 'Critical';
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const getFilteredRisks = () => {
    if (riskFilter === 'all') return risks;
    return risks.filter(risk => risk.status === riskFilter);
  };
  
  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Unit Performance Dashboard</h1>
        <p className="text-gray-500">Track and manage unit-level KRAs, KPIs, and objectives</p>
      </div>

      <div className="flex gap-6">
        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-full' : 'w-3/4'}`}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Key Result Areas (KRAs)</CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={generatePDFReport} size="sm" variant="outline" className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <span>📝</span> Tasks / Daily Ops
                  </TabsTrigger>
                  <TabsTrigger value="kras" className="flex items-center gap-2">
                    <span>🎯</span> KRAs/KPIs
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center gap-2">
                    <span>📁</span> Projects
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="flex items-center gap-2">
                    <span>⚠️</span> Risks & Issues
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="flex items-center gap-2">
                    <span>📊</span> Reports
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button 
                          variant={taskFilter === 'all' ? 'default' : 'outline'} 
                          onClick={() => setTaskFilter('all')}
                          size="sm"
                        >
                          All
                        </Button>
                        <Button 
                          variant={taskFilter === 'pending' ? 'default' : 'outline'} 
                          onClick={() => setTaskFilter('pending')}
                          size="sm"
                        >
                          Pending
                        </Button>
                        <Button 
                          variant={taskFilter === 'in-progress' ? 'default' : 'outline'} 
                          onClick={() => setTaskFilter('in-progress')}
                          size="sm"
                        >
                          In Progress
                        </Button>
                        <Button 
                          variant={taskFilter === 'blocked' ? 'default' : 'outline'} 
                          onClick={() => setTaskFilter('blocked')}
                          size="sm"
                        >
                          Blocked
                        </Button>
                        <Button 
                          variant={taskFilter === 'completed' ? 'default' : 'outline'} 
                          onClick={() => setTaskFilter('completed')}
                          size="sm"
                        >
                          Completed
                        </Button>
                      </div>
                      <Button onClick={() => setIsAddTaskDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>

                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Assignee</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Related KRA</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredTasks().map(task => (
                              <TableRow key={task.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{task.title}</div>
                                    <div className="text-sm text-gray-500">{task.description}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                                    className={`rounded px-2 py-1 text-xs ${getTaskStatusColor(task.status)}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                  </select>
                                </TableCell>
                                <TableCell>
                                  <span className={`rounded px-2 py-1 text-xs ${getTaskPriorityColor(task.priority)}`}>
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>{task.assignee}</TableCell>
                                <TableCell>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {task.kraName && (
                                    <span className="text-xs rounded bg-gray-100 dark:bg-gray-800 px-2 py-1">
                                      {task.kraName}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Add Task Dialog */}
                  <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                        <DialogDescription>
                          Create a new task and assign it to a team member.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={taskForm.title || ''}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={taskForm.description || ''}
                            onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select 
                            value={taskForm.priority || 'medium'}
                            onValueChange={(value) => setTaskForm({...taskForm, priority: value as Task['priority']})}
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
                        <div className="grid gap-2">
                          <Label htmlFor="assignee">Assignee</Label>
                          <Input
                            id="assignee"
                            value={taskForm.assignee || ''}
                            onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={taskForm.dueDate || ''}
                            onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="kraId">Related KRA</Label>
                          <Select 
                            value={taskForm.kraId || ''}
                            onValueChange={(value) => {
                              const kra = [...kras, ...closedKras].find(k => k.id === value);
                              setTaskForm({
                                ...taskForm, 
                                kraId: value,
                                kraName: kra?.name || ''
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a KRA" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {[...kras, ...closedKras].map(kra => (
                                <SelectItem key={kra.id} value={kra.id}>{kra.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTask}>
                          Add Task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="kras">
                  <Tabs defaultValue="active-kras">
                    <TabsList className="mb-4">
                      <TabsTrigger value="active-kras">Active KRAs</TabsTrigger>
                      <TabsTrigger value="closed-kras">Closed KRAs</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active-kras">
                      {filteredKras.length > 0 ? (
                        renderKRATable(filteredKras)
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No active KRAs found. Click "Add KRA" to create one.
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="closed-kras">
                      {filteredClosedKras.length > 0 ? (
                        renderKRATable(filteredClosedKras, true)
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No closed KRAs found.
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="insights">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>KRA Status Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <PieChart data={kraStatusData} />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>KPI Progress</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <BarChart data={kpiProgressData} />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>KPI Trends Over Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <LineChart data={kpiTrendData} />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Objective Progress</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <AreaChart data={objectiveProgressData} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <KRATimeline kras={kras.map(kra => {
                        const timelineKra: TimelineKRA = {
                          id: kra.id,
                          name: kra.name,
                          department: kra.department,
                          responsible: kra.responsible,
                          startDate: kra.startDate,
                          endDate: kra.endDate,
                          progress: kra.progress,
                          status: kra.status,
                          kpis: kra.kpis.map(kpi => ({
                            id: kpi.id,
                            name: kpi.name,
                            date: new Date(kpi.date),
                            target: kpi.target,
                            actual: kpi.actual,
                            status: kpi.status,
                            description: kpi.description,
                            notes: kpi.notes
                          }))
                        };
                        return timelineKra as unknown as KRA; // Use a more specific type assertion
                      })} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="projects">
                  <div className="text-center py-6 text-gray-500">
                    Projects content will be displayed here.
                  </div>
                </TabsContent>

                <TabsContent value="risks">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button 
                          variant={riskFilter === 'all' ? 'default' : 'outline'} 
                          onClick={() => setRiskFilter('all')}
                          size="sm"
                        >
                          All
                        </Button>
                        <Button 
                          variant={riskFilter === 'open' ? 'default' : 'outline'} 
                          onClick={() => setRiskFilter('open')}
                          size="sm"
                        >
                          Open
                        </Button>
                        <Button 
                          variant={riskFilter === 'mitigating' ? 'default' : 'outline'} 
                          onClick={() => setRiskFilter('mitigating')}
                          size="sm"
                        >
                          Mitigating
                        </Button>
                        <Button 
                          variant={riskFilter === 'closed' ? 'default' : 'outline'} 
                          onClick={() => setRiskFilter('closed')}
                          size="sm"
                        >
                          Closed
                        </Button>
                        <Button 
                          variant={riskFilter === 'accepted' ? 'default' : 'outline'} 
                          onClick={() => setRiskFilter('accepted')}
                          size="sm"
                        >
                          Accepted
                        </Button>
                      </div>
                      <Button onClick={() => setIsAddRiskDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Risk
                      </Button>
                    </div>

                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Risk</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Impact</TableHead>
                              <TableHead>Probability</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Related KRA</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredRisks().map(risk => (
                              <TableRow key={risk.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{risk.title}</div>
                                    <div className="text-sm text-gray-500">{risk.description}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`rounded px-2 py-1 text-xs ${
                                    getRiskSeverity(risk.impact, risk.probability) === 'Critical' ? 'bg-red-100 text-red-800' :
                                    getRiskSeverity(risk.impact, risk.probability) === 'High' ? 'bg-orange-100 text-orange-800' :
                                    getRiskSeverity(risk.impact, risk.probability) === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {getRiskSeverity(risk.impact, risk.probability)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`rounded px-2 py-1 text-xs ${getRiskImpactColor(risk.impact)}`}>
                                    {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`rounded px-2 py-1 text-xs ${getRiskProbabilityColor(risk.probability)}`}>
                                    {risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <select
                                    value={risk.status}
                                    onChange={(e) => handleUpdateRiskStatus(risk.id, e.target.value as Risk['status'])}
                                    className={`rounded px-2 py-1 text-xs ${getRiskStatusColor(risk.status)}`}
                                  >
                                    <option value="open">Open</option>
                                    <option value="mitigating">Mitigating</option>
                                    <option value="closed">Closed</option>
                                    <option value="accepted">Accepted</option>
                                  </select>
                                </TableCell>
                                <TableCell>{risk.owner}</TableCell>
                                <TableCell>
                                  {risk.kraName && (
                                    <span className="text-xs rounded bg-gray-100 dark:bg-gray-800 px-2 py-1">
                                      {risk.kraName}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="sm" title="View Details">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Edit">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Add Risk Dialog */}
                  <Dialog open={isAddRiskDialogOpen} onOpenChange={setIsAddRiskDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Risk</DialogTitle>
                        <DialogDescription>
                          Identify a new risk and assign ownership for mitigation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={riskForm.title || ''}
                            onChange={(e) => setRiskForm({...riskForm, title: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={riskForm.description || ''}
                            onChange={(e) => setRiskForm({...riskForm, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="impact">Impact</Label>
                            <Select 
                              value={riskForm.impact || 'medium'}
                              onValueChange={(value) => setRiskForm({...riskForm, impact: value as Risk['impact']})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select impact" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="probability">Probability</Label>
                            <Select 
                              value={riskForm.probability || 'medium'}
                              onValueChange={(value) => setRiskForm({...riskForm, probability: value as Risk['probability']})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select probability" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="certain">Certain</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="owner">Owner</Label>
                          <Input
                            id="owner"
                            value={riskForm.owner || ''}
                            onChange={(e) => setRiskForm({...riskForm, owner: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dateIdentified">Date Identified</Label>
                          <Input
                            id="dateIdentified"
                            type="date"
                            value={riskForm.dateIdentified || ''}
                            onChange={(e) => setRiskForm({...riskForm, dateIdentified: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="mitigation">Mitigation Plan</Label>
                          <Textarea
                            id="mitigation"
                            value={riskForm.mitigation || ''}
                            onChange={(e) => setRiskForm({...riskForm, mitigation: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="kraId">Related KRA</Label>
                          <Select 
                            value={riskForm.kraId || ''}
                            onValueChange={(value) => {
                              const kra = [...kras, ...closedKras].find(k => k.id === value);
                              setRiskForm({
                                ...riskForm, 
                                kraId: value,
                                kraName: kra?.name || ''
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a KRA" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {[...kras, ...closedKras].map(kra => (
                                <SelectItem key={kra.id} value={kra.id}>{kra.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRiskDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRisk}>
                          Add Risk
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="reports">
                  <div className="text-center py-6 text-gray-500">
                    Reports content will be displayed here.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-1/4'}`}>
          <div className="sticky top-4">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI Assistant</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="ml-auto"
                  >
                    {isSidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Ask questions about KRAs, KPIs, and objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender === 'user' 
                              ? 'bg-intranet-primary text-white' 
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          {message.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask a question..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Active KRAs</div>
                    <div className="text-2xl font-bold">{kras.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Closed KRAs</div>
                    <div className="text-2xl font-bold">{closedKras.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total KPIs</div>
                    <div className="text-2xl font-bold">
                      {[...kras, ...closedKras].flatMap(k => k.kpis).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">KPIs On Track</div>
                    <div className="text-2xl font-bold text-green-600">
                      {[...kras, ...closedKras].flatMap(k => k.kpis).filter(k => k.status === 'on-track').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Improved floating toggle button when sidebar is collapsed */}
        {isSidebarCollapsed && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed right-4 top-24 z-10 shadow-md bg-white dark:bg-gray-800 border-2 border-intranet-primary"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span>Show Sidebar</span>
          </Button>
        )}
      </div>
      
      {/* PDF Report Dialog */}
      <Dialog open={isAIAnalysisOpen} onOpenChange={setIsAIAnalysisOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate PDF Report</DialogTitle>
            <DialogDescription>
              Choose whether to include AI analysis in your report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-ai"
                checked={includeAIAnalysis}
                onChange={(e) => setIncludeAIAnalysis(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="include-ai">Include AI Analysis</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIAnalysisOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generatePDFReport}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Replace Sheet with Dialog for KRA details */}
      <Dialog open={isKRADrawerOpen} onOpenChange={setIsKRADrawerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>KRA Details</DialogTitle>
            <DialogDescription>
              View and edit KRA information
            </DialogDescription>
          </DialogHeader>
          
          {selectedKRADrawer && (
            <div className="overflow-y-auto pr-2 flex-1">
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>KRA Name</Label>
                    <Input 
                      value={selectedKRADrawer.name} 
                      onChange={(e) => setSelectedKRADrawer({...selectedKRADrawer, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={selectedKRADrawer.status} 
                      onValueChange={(value) => setSelectedKRADrawer({...selectedKRADrawer, status: value as 'open' | 'in-progress' | 'closed'})}
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
                </div>
                
                <div className="space-y-2">
                  <Label>Linked Objective</Label>
                  <Select 
                    value={selectedKRADrawer.objectiveId.toString()} 
                    onValueChange={(value) => {
                      const objective = objectives.find(obj => obj.id === parseInt(value));
                      if (objective) {
                        setSelectedKRADrawer({
                          ...selectedKRADrawer,
                          objectiveId: value,
                          objectiveName: objective.name
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map((objective) => (
                        <SelectItem key={objective.id} value={objective.id.toString()}>
                          {objective.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-medium">KPI</Label>
                    {selectedKRADrawer.kpis.length === 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newKPI: KPI = {
                            id: Math.max(...kras.flatMap(k => k.kpis).map(k => k.id), ...closedKras.flatMap(k => k.kpis).map(k => k.id), 0) + 1,
                            name: "New KPI",
                            description: "",
                            department: "",
                            strategicObjective: "",
                            kra: selectedKRADrawer.name,
                            target: "0",
                            measurementUnit: "",
                            baselineValue: "",
                            frequency: "Monthly",
                            dataSource: "",
                            responsibleOfficer: "",
                            current: "0",
                            status: "on-track",
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                            comments: "",
                            progress: 0
                          };
                          setSelectedKRADrawer({
                            ...selectedKRADrawer,
                            kpis: [newKPI]
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add KPI
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-md p-4 space-y-6">
                    {selectedKRADrawer.kpis.length > 0 ? (
                      <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center">
                          <Label className="text-base">KPI Details</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => {
                              setSelectedKRADrawer({
                                ...selectedKRADrawer,
                                kpis: []
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>KPI Title</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].name} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], name: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., System Uptime Percentage"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Department / Unit</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].department} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], department: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Dept. of Finance – IT Services Unit"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea 
                            value={selectedKRADrawer.kpis[0].description} 
                            onChange={(e) => {
                              const updatedKPIs = [...selectedKRADrawer.kpis];
                              updatedKPIs[0] = {...updatedKPIs[0], description: e.target.value};
                              setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                            }}
                            placeholder="Brief explanation of what this KPI measures"
                            className="h-20"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Strategic Objective</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].strategicObjective} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], strategicObjective: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Ensure uninterrupted digital services"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>KRA (Key Result Area)</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].kra} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], kra: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Infrastructure Reliability"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Target Value / Goal</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].target} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], target: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., 99.5% uptime"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Measurement Unit</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].measurementUnit} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], measurementUnit: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Percentage, Hours"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Baseline Value (Optional)</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].baselineValue} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], baselineValue: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Last quarter: 98.2%"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Frequency of Measurement</Label>
                            <Select 
                              value={selectedKRADrawer.kpis[0].frequency} 
                              onValueChange={(value) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], frequency: value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Daily">Daily</SelectItem>
                                <SelectItem value="Weekly">Weekly</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Data Source / Method</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].dataSource} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], dataSource: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., Network Monitoring Tool Reports"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Responsible Officer</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].responsibleOfficer} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], responsibleOfficer: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., ICT Manager"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Current Value</Label>
                            <Input 
                              value={selectedKRADrawer.kpis[0].current} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], current: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                              placeholder="e.g., 98.5%"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Current Status</Label>
                            <Select 
                              value={selectedKRADrawer.kpis[0].status} 
                              onValueChange={(value) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], status: value as 'on-track' | 'needs-attention' | 'at-risk'};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="on-track">On Track</SelectItem>
                                <SelectItem value="needs-attention">Needs Attention</SelectItem>
                                <SelectItem value="at-risk">At Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Progress</Label>
                            <div className="flex items-center gap-2">
                              <Progress value={selectedKRADrawer.kpis[0].progress} className="flex-1" />
                              <span className="text-sm font-medium">{selectedKRADrawer.kpis[0].progress}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input 
                              type="date"
                              value={selectedKRADrawer.kpis[0].startDate} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], startDate: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input 
                              type="date"
                              value={selectedKRADrawer.kpis[0].endDate} 
                              onChange={(e) => {
                                const updatedKPIs = [...selectedKRADrawer.kpis];
                                updatedKPIs[0] = {...updatedKPIs[0], endDate: e.target.value};
                                setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Comments / Notes</Label>
                          <Textarea 
                            value={selectedKRADrawer.kpis[0].comments} 
                            onChange={(e) => {
                              const updatedKPIs = [...selectedKRADrawer.kpis];
                              updatedKPIs[0] = {...updatedKPIs[0], comments: e.target.value};
                              setSelectedKRADrawer({...selectedKRADrawer, kpis: updatedKPIs});
                            }}
                            placeholder="Optional field for extra detail"
                            className="h-20"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        No KPI defined. Click "Add KPI" to create one.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-lg font-medium">Dates</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                  <div>
                    <Label>Created</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedKRADrawer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedKRADrawer.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 pt-4 border-t">
            <div className="flex justify-between w-full">
              <Button 
                variant="destructive" 
                onClick={() => selectedKRADrawer && handleDeleteKRA(selectedKRADrawer.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseKRADrawer}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateKRA}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Unit; 