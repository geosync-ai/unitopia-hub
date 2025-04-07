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
import { ArrowUp, ArrowDown, Minus, Target, Flag, Award, BarChart2, TrendingUp, Clock, Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, AlertCircle, Download, Brain, List, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, PieChart, LineChart, AreaChart } from '@/components/charts';

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
  target: string;
  current: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
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
        { id: 1, name: "New Market Entry", target: "3", current: "2", status: "on-track", progress: 66 },
        { id: 2, name: "Market Share Growth", target: "15%", current: "10%", status: "on-track", progress: 67 },
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
        { id: 3, name: "New Products Launched", target: "5", current: "3", status: "needs-attention", progress: 60 },
        { id: 4, name: "R&D Investment", target: "$2M", current: "$1.5M", status: "on-track", progress: 75 },
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
        { id: 5, name: "Automation Coverage", target: "80%", current: "65%", status: "on-track", progress: 81 },
        { id: 6, name: "Cost Reduction", target: "10%", current: "7%", status: "needs-attention", progress: 70 },
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
        { id: 7, name: "Customer Satisfaction Score", target: "90%", current: "92%", status: "on-track", progress: 100 },
        { id: 8, name: "Response Time", target: "< 24h", current: "18h", status: "on-track", progress: 100 },
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
        { id: 9, name: "Patents Filed", target: "10", current: "7", status: "on-track", progress: 70 },
        { id: 10, name: "Innovation Projects", target: "15", current: "12", status: "on-track", progress: 80 },
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
        { id: 11, name: "Market Share", target: "25%", current: "22%", status: "on-track", progress: 88 },
        { id: 12, name: "Brand Recognition", target: "85%", current: "78%", status: "needs-attention", progress: 92 },
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
        { id: 13, name: "Inventory Turnover", target: "8x", current: "6.5x", status: "needs-attention", progress: 81 },
        { id: 14, name: "Logistics Costs", target: "-15%", current: "-10%", status: "on-track", progress: 67 },
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
        { id: 15, name: "Training Hours", target: "40", current: "25", status: "needs-attention", progress: 63 },
        { id: 16, name: "Employee Satisfaction", target: "85%", current: "82%", status: "on-track", progress: 96 },
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
        { id: 17, name: "Carbon Reduction", target: "20%", current: "12%", status: "on-track", progress: 60 },
        { id: 18, name: "Recycling Rate", target: "75%", current: "68%", status: "needs-attention", progress: 91 },
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
        { id: 19, name: "Digital Adoption", target: "90%", current: "75%", status: "on-track", progress: 83 },
        { id: 20, name: "Process Digitization", target: "70%", current: "55%", status: "needs-attention", progress: 79 },
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
        { id: 21, name: "Customer Satisfaction Score", target: "90%", current: "92%", status: "on-track", progress: 100 },
        { id: 22, name: "Response Time", target: "< 24h", current: "18h", status: "on-track", progress: 100 },
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
      target: kpiForm.target || '',
      current: kpiForm.current || '',
      status: kpiForm.status as 'on-track' | 'needs-attention' | 'at-risk' || 'on-track',
      progress: progress
    };
    
    // Update KRA with new KPI
    const updatedKRA = {
      ...selectedKRA,
      kpis: [...selectedKRA.kpis, newKPI],
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
    toast.success("KPI added successfully");
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
  
  const handleDeleteKRA = (id: number) => {
    // Remove from state
    setKras(kras.filter(k => k.id !== id));
    
    // Show success message
    toast.success("KRA deleted successfully");
  };
  
  const handleDeleteKPI = (kraId: number, kpiId: number) => {
    // Find KRA
    const kra = kras.find(k => k.id === kraId);
    if (!kra) return;
    
    // Update KRA with KPI removed
    const updatedKRA = {
      ...kra,
      kpis: kra.kpis.filter(k => k.id !== kpiId),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    // Update state
    setKras(kras.map(k => k.id === kraId ? updatedKRA : k));
    
    // Show success message
    toast.success("KPI deleted successfully");
  };
  
  const handleDeleteObjective = (id: number) => {
    // Check if objective is linked to any KRAs
    const linkedKRAs = kras.filter(k => k.objectiveId === id);
    if (linkedKRAs.length > 0) {
      toast.error("Cannot delete objective that is linked to KRAs");
      return;
    }
    
    // Remove from state
    setObjectives(objectives.filter(o => o.id !== id));
    
    // Show success message
    toast.success("Objective deleted successfully");
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>KRA Name/ID</TableHead>
          <TableHead>Objective Linked</TableHead>
          <TableHead>KPIs</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
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
              <div className="space-y-1">
                {kra.kpis.map((kpi) => (
                  <div key={kpi.id} className="flex items-center gap-2">
                    <span>{kpi.name}:</span>
                    <div className="flex items-center gap-1">
                      {getKPIStatusIcon(kpi.status)}
                      <span className="text-xs">{kpi.current} / {kpi.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {getStatusBadge(kra.status)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {!isClosed && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEditKRA(kra)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCloseKRA(kra)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteKRA(kra.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                {isClosed && (
                  <Button variant="outline" size="sm" disabled>
                    <XCircle className="h-4 w-4 mr-1" />
                    Closed
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  
  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Unit Performance Dashboard</h1>
        <p className="text-gray-500">Track and manage unit-level KRAs, KPIs, and objectives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
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

        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
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
              <CardTitle>Manage Data</CardTitle>
              <CardDescription>Add, edit, or delete KRAs, KPIs, and Objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex space-x-2 mb-4">
                  <Button 
                    variant={activeForm === 'kra' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setActiveForm('kra')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    KRAs
                  </Button>
                  <Button 
                    variant={activeForm === 'kpi' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setActiveForm('kpi')}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    KPIs
                  </Button>
                  <Button 
                    variant={activeForm === 'objective' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setActiveForm('objective')}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Objectives
                  </Button>
                </div>
                
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                {activeForm === 'kra' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kra-name">KRA Name</Label>
                      <Input 
                        id="kra-name" 
                        value={kraForm.name} 
                        onChange={(e) => setKraForm({...kraForm, name: e.target.value})}
                        placeholder="Enter KRA name" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="objective">Linked Objective</Label>
                      <Select 
                        value={kraForm.objectiveId?.toString() || ''} 
                        onValueChange={(value) => setKraForm({...kraForm, objectiveId: parseInt(value)})}
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
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={kraForm.status} 
                        onValueChange={(value) => setKraForm({...kraForm, status: value as 'open' | 'in-progress' | 'closed'})}
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
                    
                    <Button onClick={handleAddKRA} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add KRA
                    </Button>
                    
                    <div className="space-y-2">
                      <Label>Existing KRAs</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {kras.map((kra) => (
                          <div 
                            key={kra.id} 
                            className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="text-sm truncate">{kra.name}</div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteKRA(kra.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeForm === 'kpi' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kra-select">Select KRA</Label>
                      <Select 
                        value={selectedKRA?.id.toString() || ''} 
                        onValueChange={(value) => setSelectedKRA(kras.find(k => k.id === parseInt(value)) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select KRA" />
                        </SelectTrigger>
                        <SelectContent>
                          {kras.map((kra) => (
                            <SelectItem key={kra.id} value={kra.id.toString()}>
                              {kra.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kpi-name">KPI Name</Label>
                      <Input 
                        id="kpi-name" 
                        value={kpiForm.name} 
                        onChange={(e) => setKpiForm({...kpiForm, name: e.target.value})}
                        placeholder="Enter KPI name" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kpi-target">Target</Label>
                      <Input 
                        id="kpi-target" 
                        value={kpiForm.target} 
                        onChange={(e) => setKpiForm({...kpiForm, target: e.target.value})}
                        placeholder="Enter target value" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kpi-current">Current</Label>
                      <Input 
                        id="kpi-current" 
                        value={kpiForm.current} 
                        onChange={(e) => setKpiForm({...kpiForm, current: e.target.value})}
                        placeholder="Enter current value" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kpi-status">Status</Label>
                      <Select 
                        value={kpiForm.status} 
                        onValueChange={(value) => setKpiForm({...kpiForm, status: value as 'on-track' | 'needs-attention' | 'at-risk'})}
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
                    
                    <Button 
                      onClick={handleAddKPI} 
                      className="w-full"
                      disabled={!selectedKRA}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add KPI
                    </Button>
                    
                    {selectedKRA && (
                      <div className="space-y-2">
                        <Label>KPIs for {selectedKRA.name}</Label>
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {selectedKRA.kpis.map((kpi) => (
                            <div 
                              key={kpi.id} 
                              className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="text-sm truncate">{kpi.name}</div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteKPI(selectedKRA.id, kpi.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeForm === 'objective' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="objective-name">Objective Name</Label>
                      <Input 
                        id="objective-name" 
                        value={objectiveForm.name} 
                        onChange={(e) => setObjectiveForm({...objectiveForm, name: e.target.value})}
                        placeholder="Enter objective name" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="objective-description">Description</Label>
                      <Textarea 
                        id="objective-description" 
                        value={objectiveForm.description} 
                        onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                        placeholder="Enter objective description" 
                      />
                    </div>
                    
                    <Button onClick={handleAddObjective} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Objective
                    </Button>
                    
                    <div className="space-y-2">
                      <Label>Existing Objectives</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {objectives.map((objective) => (
                          <div 
                            key={objective.id} 
                            className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="text-sm truncate">{objective.name}</div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteObjective(objective.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
    </PageLayout>
  );
};

export default Unit; 