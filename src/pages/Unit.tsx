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
import { ArrowUp, ArrowDown, Minus, Target, Flag, Award, BarChart2, TrendingUp, Clock, Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, AlertCircle, Download, Brain, List, Settings, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, PieChart, LineChart, AreaChart } from '@/components/charts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Upload } from 'lucide-react';

// Types
interface KRA {
  id: number;
  name: string;
  objectiveId: number;
  objectiveName: string;
  kpis: KPI[];
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface KPI {
  id: number;
  name: string;
  description: string;
  department: string;
  strategicObjective: string;
  kra: string;
  target: string;
  measurementUnit: string;
  baselineValue: string;
  frequency: string;
  dataSource: string;
  responsibleOfficer: string;
  current: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  startDate: string;
  endDate: string;
  comments: string;
  progress: number;
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

const Unit = () => {
  // State
  const [activeTab, setActiveTab] = useState('active-kras');
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
    objectiveId: 0,
    kpis: [],
    status: 'open'
  });
  
  const [kpiForm, setKpiForm] = useState<Partial<KPI>>({
    name: '',
    target: '',
    current: '',
    status: 'on-track',
    progress: 0
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
      id: 1, 
      name: "Market Expansion Strategy", 
      objectiveId: 1,
      objectiveName: "Expand Market Presence",
      kpis: [
        { 
          id: 1, 
          name: "New Market Entry", 
          description: "Number of new markets successfully entered",
          department: "Sales",
          strategicObjective: "Expand geographic presence",
          kra: "Market Expansion",
          target: "3", 
          measurementUnit: "Markets",
          baselineValue: "0",
          frequency: "Quarterly",
          dataSource: "Sales Reports",
          responsibleOfficer: "Sales Director",
          current: "2", 
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "On track to meet target by Q4",
          progress: 66 
        }
      ],
      status: "in-progress",
      createdAt: "2023-01-15",
      updatedAt: "2023-06-20"
    },
    { 
      id: 2, 
      name: "Product Innovation Pipeline", 
      objectiveId: 2,
      objectiveName: "Enhance Product Portfolio",
      kpis: [
        { 
          id: 2, 
          name: "New Products Launched", 
          description: "Number of new products launched to market",
          department: "Product Development",
          strategicObjective: "Enhance Product Portfolio",
          kra: "Product Innovation",
          target: "5", 
          current: "3", 
          measurementUnit: "Products",
          baselineValue: "2",
          frequency: "Quarterly",
          dataSource: "Product Launch Reports",
          responsibleOfficer: "Product Manager",
          status: "needs-attention", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Behind schedule due to resource constraints",
          progress: 60 
        }
      ],
      status: "open",
      createdAt: "2023-02-10",
      updatedAt: "2023-06-15"
    },
    { 
      id: 3, 
      name: "Process Automation Initiative", 
      objectiveId: 3,
      objectiveName: "Operational Excellence",
      kpis: [
        { 
          id: 3, 
          name: "Automation Coverage", 
          description: "Percentage of processes automated",
          department: "IT",
          strategicObjective: "Operational Excellence",
          kra: "Process Automation",
          target: "80%", 
          current: "65%", 
          measurementUnit: "Percentage",
          baselineValue: "50%",
          frequency: "Monthly",
          dataSource: "Process Audit Reports",
          responsibleOfficer: "IT Director",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Making good progress with new automation tools",
          progress: 81 
        }
      ],
      status: "in-progress",
      createdAt: "2023-03-05",
      updatedAt: "2023-06-18"
    },
    { 
      id: 4, 
      name: "Customer Service Improvement", 
      objectiveId: 5,
      objectiveName: "Customer Satisfaction",
      kpis: [
        { 
          id: 4, 
          name: "Customer Satisfaction Score", 
          description: "Overall customer satisfaction rating",
          department: "Customer Service",
          strategicObjective: "Customer Satisfaction",
          kra: "Customer Service",
          target: "90%", 
          current: "92%", 
          measurementUnit: "Percentage",
          baselineValue: "85%",
          frequency: "Monthly",
          dataSource: "Customer Surveys",
          responsibleOfficer: "Customer Service Manager",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Exceeding target, excellent performance",
          progress: 100 
        }
      ],
      status: "closed",
      createdAt: "2022-11-20",
      updatedAt: "2023-05-30"
    },
    { 
      id: 5, 
      name: "Innovation Lab Development", 
      objectiveId: 6,
      objectiveName: "Innovation Pipeline",
      kpis: [
        { 
          id: 5, 
          name: "Patents Filed", 
          description: "Number of patents filed for new innovations",
          department: "R&D",
          strategicObjective: "Innovation Pipeline",
          kra: "Innovation Lab",
          target: "10", 
          current: "7", 
          measurementUnit: "Patents",
          baselineValue: "5",
          frequency: "Annually",
          dataSource: "Patent Office Records",
          responsibleOfficer: "R&D Director",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "On track to meet annual target",
          progress: 70 
        }
      ],
      status: "in-progress",
      createdAt: "2023-04-12",
      updatedAt: "2023-06-22"
    },
    { 
      id: 6, 
      name: "Market Leadership Campaign", 
      objectiveId: 7,
      objectiveName: "Market Leadership",
      kpis: [
        { 
          id: 6, 
          name: "Market Share", 
          description: "Percentage of market share in primary segments",
          department: "Marketing",
          strategicObjective: "Market Leadership",
          kra: "Market Leadership",
          target: "25%", 
          current: "22%", 
          measurementUnit: "Percentage",
          baselineValue: "20%",
          frequency: "Quarterly",
          dataSource: "Market Research Reports",
          responsibleOfficer: "Marketing Director",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Steady growth in market share",
          progress: 88 
        }
      ],
      status: "in-progress",
      createdAt: "2023-05-08",
      updatedAt: "2023-06-19"
    },
    { 
      id: 7, 
      name: "Supply Chain Optimization", 
      objectiveId: 8,
      objectiveName: "Operational Efficiency",
      kpis: [
        { 
          id: 7, 
          name: "Inventory Turnover", 
          description: "Number of times inventory is sold and replaced",
          department: "Operations",
          strategicObjective: "Operational Efficiency",
          kra: "Supply Chain",
          target: "8x", 
          current: "6.5x", 
          measurementUnit: "Ratio",
          baselineValue: "5x",
          frequency: "Quarterly",
          dataSource: "Inventory Management System",
          responsibleOfficer: "Operations Manager",
          status: "needs-attention", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Inventory turnover below target, optimization needed",
          progress: 81 
        }
      ],
      status: "open",
      createdAt: "2023-06-01",
      updatedAt: "2023-06-15"
    },
    { 
      id: 8, 
      name: "Employee Development Program", 
      objectiveId: 9,
      objectiveName: "Employee Engagement",
      kpis: [
        { 
          id: 8, 
          name: "Training Hours", 
          description: "Average training hours per employee",
          department: "HR",
          strategicObjective: "Employee Engagement",
          kra: "Employee Development",
          target: "40", 
          current: "25", 
          measurementUnit: "Hours",
          baselineValue: "15",
          frequency: "Quarterly",
          dataSource: "HR Management System",
          responsibleOfficer: "HR Manager",
          status: "needs-attention", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Training hours below target, additional programs needed",
          progress: 63 
        }
      ],
      status: "in-progress",
      createdAt: "2023-05-15",
      updatedAt: "2023-06-20"
    },
    { 
      id: 9, 
      name: "Green Initiative", 
      objectiveId: 10,
      objectiveName: "Sustainability Goals",
      kpis: [
        { 
          id: 9, 
          name: "Carbon Reduction", 
          description: "Percentage reduction in carbon emissions",
          department: "Operations",
          strategicObjective: "Sustainability Goals",
          kra: "Green Initiative",
          target: "20%", 
          current: "12%", 
          measurementUnit: "Percentage",
          baselineValue: "0%",
          frequency: "Annually",
          dataSource: "Environmental Reports",
          responsibleOfficer: "Sustainability Manager",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Carbon reduction initiatives progressing well",
          progress: 60 
        }
      ],
      status: "open",
      createdAt: "2023-06-05",
      updatedAt: "2023-06-18"
    },
    { 
      id: 10, 
      name: "Digital Transformation", 
      objectiveId: 3,
      objectiveName: "Operational Excellence",
      kpis: [
        { 
          id: 10, 
          name: "Digital Adoption", 
          description: "Percentage of employees using digital tools",
          department: "IT",
          strategicObjective: "Operational Excellence",
          kra: "Digital Transformation",
          target: "90%", 
          current: "75%", 
          measurementUnit: "Percentage",
          baselineValue: "60%",
          frequency: "Monthly",
          dataSource: "IT Usage Analytics",
          responsibleOfficer: "IT Director",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Digital adoption increasing steadily",
          progress: 83 
        }
      ],
      status: "in-progress",
      createdAt: "2023-04-20",
      updatedAt: "2023-06-21"
    },
  ]);
  
  // Mock data for closed KRAs
  const [closedKras, setClosedKras] = useState<KRA[]>([
    { 
      id: 11, 
      name: "Customer Service Improvement", 
      objectiveId: 5,
      objectiveName: "Customer Satisfaction",
      kpis: [
        { 
          id: 11, 
          name: "Customer Satisfaction Score", 
          description: "Overall customer satisfaction rating",
          department: "Customer Service",
          strategicObjective: "Customer Satisfaction",
          kra: "Customer Service",
          target: "90%", 
          current: "92%", 
          measurementUnit: "Percentage",
          baselineValue: "85%",
          frequency: "Monthly",
          dataSource: "Customer Surveys",
          responsibleOfficer: "Customer Service Manager",
          status: "on-track", 
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          comments: "Exceeding target, excellent performance",
          progress: 100 
        }
      ],
      status: "closed",
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
    const objective = objectives.find(obj => obj.id === kraForm.objectiveId);
    
    // Create new KRA
    const newKRA: KRA = {
      id: Math.max(...kras.map(k => k.id), ...closedKras.map(k => k.id)) + 1,
      name: kraForm.name || '',
      objectiveId: kraForm.objectiveId || 0,
      objectiveName: objective?.name || '',
      kpis: kraForm.kpis || [],
      status: kraForm.status as 'open' | 'in-progress' | 'closed' || 'open',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    // Add to state
    setKras([...kras, newKRA]);
    
    // Reset form
    setKraForm({
      name: '',
      objectiveId: 0,
      kpis: [],
      status: 'open'
    });
    setFormError(null);
    
    // Show success message
    toast.success("KRA added successfully");
  };
  
  const handleAddKPI = () => {
    // Validate form
    if (!kpiForm.name || !kpiForm.target || !selectedKRA) {
      setFormError("KPI Name, Target, and KRA selection are required");
      return;
    }
    
    // Calculate progress
    const current = parseFloat(kpiForm.current || '0');
    const target = parseFloat(kpiForm.target || '0');
    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    
    // Create new KPI
    const newKPI: KPI = {
      id: Math.max(...kras.flatMap(k => k.kpis).map(k => k.id), ...closedKras.flatMap(k => k.kpis).map(k => k.id)) + 1,
      name: kpiForm.name || '',
      description: "",
      department: "",
      strategicObjective: "",
      kra: selectedKRA.name,
      target: kpiForm.target || '',
      measurementUnit: "",
      baselineValue: "",
      frequency: "Monthly",
      dataSource: "",
      responsibleOfficer: "",
      current: kpiForm.current || '',
      status: kpiForm.status as 'on-track' | 'needs-attention' | 'at-risk' || 'on-track',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      comments: "",
      progress: progress
    };
    
    // Update KRA with new KPI (replace existing KPI)
    const updatedKRA = {
      ...selectedKRA,
      kpis: [newKPI], // Replace all KPIs with just this one
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    // Update state
    setKras(kras.map(k => k.id === selectedKRA.id ? updatedKRA : k));
    
    // Reset form
    setKpiForm({
      name: '',
      target: '',
      current: '',
      status: 'on-track',
      progress: 0
    });
    setFormError(null);
    
    // Show success message
    toast.success("KPI updated successfully");
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

  const handleDeleteKRA = (kraId: number) => {
    if (window.confirm('Are you sure you want to delete this KRA?')) {
      setKras(kras.filter(k => k.id !== kraId));
      toast.success('KRA deleted successfully');
    }
  };

  const handleMoveKRA = (kraId: number, newObjectiveId: number) => {
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
          id: 1,
          name: 'Increase Market Share',
          objectiveId: 1,
          objectiveName: 'Market Leadership',
          status: 'in-progress',
          kpis: [
            {
              id: 1,
              name: 'Market Share',
              description: "Percentage of market share in primary segments",
              department: "Marketing",
              strategicObjective: "Market Leadership",
              kra: "Increase Market Share",
              current: '15',
              target: '20',
              measurementUnit: "Percentage",
              baselineValue: "10%",
              frequency: "Quarterly",
              dataSource: "Market Research Reports",
              responsibleOfficer: "Marketing Director",
              status: 'on-track',
              startDate: "2023-01-01",
              endDate: "2023-12-31",
              comments: "Steady growth in market share",
              progress: 75
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Improve Customer Satisfaction',
          objectiveId: 2,
          objectiveName: 'Customer Excellence',
          status: 'open',
          kpis: [
            {
              id: 2,
              name: 'NPS Score',
              description: "Net Promoter Score measuring customer loyalty",
              department: "Customer Service",
              strategicObjective: "Customer Excellence",
              kra: "Improve Customer Satisfaction",
              current: '0',
              target: '8',
              measurementUnit: "Score",
              baselineValue: "-2",
              frequency: "Quarterly",
              dataSource: "Customer Surveys",
              responsibleOfficer: "Customer Service Manager",
              status: 'needs-attention',
              startDate: "2023-01-01",
              endDate: "2023-12-31",
              comments: "NPS score needs improvement",
              progress: 0
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
  
  // Render functions
  const renderKRATable = (kras: KRA[], isClosed = false) => (
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
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>KRA Name/ID</TableHead>
            <TableHead>Objective Linked</TableHead>
            <TableHead>KPI</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kras.map((kra) => (
            <TableRow key={kra.id}>
              <TableCell className="font-medium">
                <div>{kra.name}</div>
                <div className="text-xs text-gray-500">ID: {kra.id}</div>
              </TableCell>
              <TableCell>
                <div>{kra.objectiveName}</div>
                <div className="text-xs text-gray-500">ID: {kra.objectiveId}</div>
              </TableCell>
              <TableCell>
                {kra.kpis.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span>{kra.kpis[0].name}:</span>
                    <div className="flex items-center gap-1">
                      {getKPIStatusIcon(kra.kpis[0].status)}
                      <span className="text-xs">{kra.kpis[0].current} / {kra.kpis[0].target}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No KPI</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(kra.status)}
              </TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
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
                  <TabsTrigger value="active-kras">Active KRAs</TabsTrigger>
                  <TabsTrigger value="closed-kras">Closed KRAs</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
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

        {/* Floating toggle button when sidebar is collapsed */}
        {isSidebarCollapsed && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed right-4 top-20 z-10 shadow-md"
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
                          objectiveId: parseInt(value),
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