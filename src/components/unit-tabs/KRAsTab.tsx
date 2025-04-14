import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Edit, Plus, Trash2, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import KRATimelineTab from '@/components/KRATimelineTab';
import KRAInsightsTab from '@/components/KRAInsightsTab';
import KpiModal from '@/components/kpi/KpiModal';
import { Kra, Kpi, User, Objective } from '@/types/kpi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

// --- Mock Data --- Placeholder - Replace with data fetching logic
const mockUsers: User[] = [
  { id: 1, name: 'Jane Smith', initials: 'JS', avatarUrl: 'https://via.placeholder.com/30/FFA500/FFFFFF?text=JS' },
  { id: 2, name: 'John Doe', initials: 'JD', avatarUrl: 'https://via.placeholder.com/30/007BFF/FFFFFF?text=JD' },
  { id: 3, name: 'Alice Green', initials: 'AG', avatarUrl: 'https://via.placeholder.com/30/28A745/FFFFFF?text=AG' },
];

const mockObjectives: Objective[] = [
  { id: 'obj1', name: 'Enhance User Experience', description: 'Improve overall user satisfaction and ease of use.' },
  { id: 'obj2', name: 'Business Growth', description: 'Increase market share and revenue.' },
  { id: 'obj3', name: 'Increase Efficiency', description: 'Streamline internal processes.' },
];

const mockKpis1: Kpi[] = [
  { id: 'kpi1', name: 'Customer Satisfaction Score', target: 90, actual: 85, status: 'At Risk', startDate: '2023-01-01', targetDate: '2023-06-01', assignees: [mockUsers[0]], comments: 'Survey results pending' },
  { id: 'kpi2', name: 'Support Response Time', target: 4, actual: 3.5, status: 'On Track', startDate: '2023-01-05', targetDate: '2023-03-31', assignees: [mockUsers[0]] },
];

const mockKpis2: Kpi[] = [
  { id: 'kpi3', name: 'Market Share Percentage', target: 25, actual: 22, status: 'At Risk', startDate: '2023-01-01', targetDate: '2023-06-01', assignees: [mockUsers[1]] },
];

const mockKpis3: Kpi[] = [
  { id: 'kpi4', name: 'New Feature Adoption Rate', target: 60, actual: 65, status: 'Completed', startDate: '2023-03-15', targetDate: '2023-07-31', assignees: [mockUsers[2]] },
  { id: 'kpi5', name: 'Documentation Accuracy', target: 95, actual: 90, status: 'In Progress', startDate: '2023-04-01', targetDate: '2023-09-15', assignees: [mockUsers[1], mockUsers[2]] },
];

const mockKras: Kra[] = [
  {
    id: 'kra1',
    title: 'Improve Customer Satisfaction',
    objective: 'Enhance User Experience',
    unit: 'Customer Service',
    startDate: '2023-01-01',
    targetDate: '2023-06-01',
    kpis: mockKpis1,
    comments: 'Initial focus on support improvements.'
  },
  {
    id: 'kra2',
    title: 'Increase Market Share',
    objective: 'Business Growth',
    unit: 'Marketing',
    startDate: '2023-01-01',
    targetDate: '2023-06-01',
    kpis: mockKpis2,
  },
   {
    id: 'kra3',
    title: 'Product Development Cycle',
    objective: 'Increase Efficiency',
    unit: 'Engineering',
    startDate: '2023-03-15',
    targetDate: '2023-09-15',
    kpis: mockKpis3,
    comments: 'Focus on agile practices adoption.'
  },
];
// --- End Mock Data ---

// Helper function to format dates (DD MMM YYYY)
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date';
  }
};

// Helper function to get quarter from date string (YYYY-MM-DD)
const getQuarter = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const month = date.getMonth(); // 0-indexed (0 = January)
    if (month <= 2) return 'Q1';
    if (month <= 5) return 'Q2';
    if (month <= 8) return 'Q3';
    return 'Q4';
  } catch {
    return '-';
  }
};

// Map KPI status to Badge variants (can reuse getStatusVariant logic if desired)
const getKpiStatusVariant = (status: Kpi['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Completed': return 'default';
    case 'At Risk': return 'destructive';
    case 'On Track': return 'default';
    case 'In Progress': return 'default';
    case 'On Hold': return 'secondary';
    case 'Not Started': return 'outline';
    default: return 'outline';
  }
};

// Define filters state type
interface KraFiltersState {
  department: string;
  status: string; // Filters by KPI status
}

// Define structure for the processed rows
interface ProcessedRow {
    kra: Kra;
    kpi: Kpi;
    isFirstKpiOfKra: boolean;
    kraRowSpan: number;
}

export const KRAsTab: React.FC = () => {
  // State management (kras, modal state, filters)
  const [kras, setKras] = useState<Kra[]>(mockKras);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKra, setEditingKra] = useState<Kra | undefined>(undefined);
  const [filters, setFilters] = useState<KraFiltersState>({
    department: 'all',
    status: 'all',
  });
  const [activeTab, setActiveTab] = useState<string>("kpis"); // State to track active tab
  // State for Objectives
  const [objectivesData, setObjectivesData] = useState<Objective[]>(mockObjectives);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | undefined>(undefined);
  const [newObjectiveData, setNewObjectiveData] = useState<Partial<Objective>>({ name: '', description: '' });

  // Memoize derived state for filters
  const departments = useMemo(() => Array.from(new Set(kras.map(kra => kra.unit || 'Unknown'))).filter(d => d !== 'Unknown'), [kras]);
  const objectives = useMemo(() => Array.from(new Set(kras.map(kra => kra.objective || 'Unknown'))).filter(o => o !== 'Unknown'), [kras]);
  const units = departments;
  // Filter options for KPI status
  const kpiStatuses: (Kpi['status'] | 'all')[] = ['all', 'Not Started', 'On Track', 'In Progress', 'At Risk', 'On Hold', 'Completed'];

  const handleFilterChange = useCallback((filterName: 'department' | 'status', value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      department: 'all',
      status: 'all',
    });
  }, []);

  // Pre-process KRAs into rows
  const processedRows = useMemo((): ProcessedRow[] => {
    let rows: ProcessedRow[] = [];
    kras.forEach(kra => {
      const kraKpis = kra.kpis && kra.kpis.length > 0 ? kra.kpis : [{ id: `no-kpi-${kra.id}`, name: '-' } as Kpi];

      // Filter only by department at KRA level
      const departmentMatch = filters.department === 'all' || kra.unit === filters.department;

      if (!departmentMatch) {
        return;
      }

      // Filter KPIs by status
      const filteredKpis = kraKpis.filter(kpi =>
           filters.status === 'all' || kpi.status === filters.status
      );

      if (filteredKpis.length > 0) {
          const kraRowSpan = filteredKpis.length;
          filteredKpis.forEach((kpi, index) => {
            rows.push({
              kra: kra,
              kpi: kpi,
              isFirstKpiOfKra: index === 0,
              kraRowSpan: kraRowSpan
            });
          });
      }
    });
    return rows;
  }, [kras, filters.department, filters.status]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingKra(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kra: Kra) => {
    // Find the full KRA object to edit, including all its KPIs
    const kraToEdit = kras.find(k => k.id === kra.id);
    if (kraToEdit) {
      setEditingKra(kraToEdit);
      setIsModalOpen(true);
    } else {
       console.error("Could not find KRA data to edit for ID:", kra.id)
       // Optionally show a user-facing error message
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKra(undefined);
  };

  // Form Submission / Deletion Handlers (adapt for Supabase later)
  const handleFormSubmit = (formData: Kra) => {
    console.log("Submitting form data:", formData);
    if (editingKra) {
      setKras(prevKras => prevKras.map(k => k.id === formData.id ? formData : k));
      console.log("Updated KRA:", formData.id);
    } else {
      const newKraWithId = { ...formData, id: formData.id || `kra_${Date.now()}` };
      setKras(prevKras => [...prevKras, newKraWithId]);
      console.log("Added new KRA:", newKraWithId.id);
    }
    handleCloseModal();
  };

  const handleDeleteKra = (kraId: string | number) => {
      if (window.confirm(`Are you sure you want to delete KRA ${kraId} and all its KPIs? This action cannot be undone.`)) {
        console.log("Deleting KRA:", kraId);
        setKras(prevKras => prevKras.filter(k => k.id !== kraId));
      }
  };

  // --- Objective Handlers ---
  const handleOpenAddObjectiveModal = () => {
    setEditingObjective(undefined);
    setNewObjectiveData({ name: '', description: '' }); // Clear form
    setIsObjectiveModalOpen(true);
  };

  const handleOpenEditObjectiveModal = (objective: Objective) => {
    setEditingObjective(objective);
    setNewObjectiveData({ name: objective.name, description: objective.description || '' }); // Pre-fill form
    setIsObjectiveModalOpen(true);
  };

  const handleCloseObjectiveModal = () => {
    setIsObjectiveModalOpen(false);
    setEditingObjective(undefined);
    setNewObjectiveData({ name: '', description: '' });
  };

  const handleObjectiveFormChange = (field: keyof Objective, value: string) => {
    setNewObjectiveData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveObjective = () => {
    // TODO: Add validation (e.g., name is required)
    if (!newObjectiveData.name?.trim()) {
        alert("Objective name cannot be empty."); // Replace with toast
        return;
    }

    if (editingObjective) {
      // Update existing objective
      setObjectivesData(prev => prev.map(obj =>
        obj.id === editingObjective.id ? { ...editingObjective, ...newObjectiveData } : obj
      ));
      console.log("Updated Objective:", { ...editingObjective, ...newObjectiveData });
    } else {
      // Add new objective
      const newObjective = {
        id: `obj_${Date.now()}`, // Temporary ID
        name: newObjectiveData.name.trim(),
        description: newObjectiveData.description?.trim() || undefined,
      };
      setObjectivesData(prev => [...prev, newObjective]);
      console.log("Added Objective:", newObjective);
    }
    handleCloseObjectiveModal();
  };

  const handleDeleteObjective = (objectiveId: string | number) => {
    if (window.confirm(`Are you sure you want to delete this objective? This may affect existing KRAs linked to it.`)) {
      // TODO: Add logic to check/handle KRAs linked to this objective before deletion
      console.log("Deleting Objective:", objectiveId);
      setObjectivesData(prev => prev.filter(obj => obj.id !== objectiveId));
      // TODO: Update any KRAs that were using this objective? Or prevent deletion?
    }
  };
  // --- End Objective Handlers ---

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Key Result Areas</h2>
          <Button
            className="flex items-center gap-2"
            onClick={activeTab === 'objectives' ? handleOpenAddObjectiveModal : handleOpenAddModal}
          >
            <Plus className="h-4 w-4" /> {activeTab === 'objectives' ? 'Add Objective' : 'Add KRA'}
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
            <Tabs defaultValue="kpis" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="kpis">KPIs</TabsTrigger>
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <div className="bg-muted/50 p-4 rounded-md mb-6 border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kra-department-filter">Department</Label>
                    <Select
                      value={filters.department}
                      onValueChange={(value) => handleFilterChange('department', value)}
                    >
                      <SelectTrigger id="kra-department-filter">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(department => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kpi-status-filter">KPI Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger id="kpi-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        {kpiStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
              
              <TabsContent value="kpis">
                <div className="overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[15%]">Objective</TableHead>
                        <TableHead className="w-[20%]">KRA</TableHead>
                        <TableHead className="w-[20%]">KPI</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Quarter</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignees</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="h-24 text-center">
                            No KPIs found matching the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        processedRows.map(({ kra, kpi, isFirstKpiOfKra, kraRowSpan }, rowIndex) => {
                          const kpiStatusVariant = getKpiStatusVariant(kpi.status);
                          const targetQuarter = getQuarter(kpi.targetDate);
                          return (
                            <TableRow key={`${kra.id}-${kpi.id || rowIndex}`}>
                              {isFirstKpiOfKra && (
                                <TableCell className="align-top border-r text-sm" rowSpan={kraRowSpan}>
                                  {kra.objective}
                                </TableCell>
                              )}
                              {isFirstKpiOfKra && (
                                <TableCell className="font-medium align-top border-r" rowSpan={kraRowSpan}>
                                  {kra.title}
                                </TableCell>
                              )}
                              <TableCell className="align-top text-sm">
                                {kpi.name !== '-' ? kpi.name : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="align-top text-sm">{formatDate(kpi.startDate)}</TableCell>
                              <TableCell className="align-top text-sm">{formatDate(kpi.targetDate)}</TableCell>
                              <TableCell className="align-top text-sm">{targetQuarter}</TableCell>
                              <TableCell className="align-top text-sm">{kpi.target ?? '-'}</TableCell>
                              <TableCell className="align-top text-sm">{kpi.actual ?? '-'}</TableCell>
                              <TableCell className="align-top">
                                {kpi.name !== '-' ? (
                                     <Badge variant={kpiStatusVariant}>{kpi.status}</Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="align-top">
                                {kpi.name !== '-' ? (
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {(kpi.assignees || []).map(user => (
                                      <Tooltip key={user.id}>
                                        <TooltipTrigger asChild>
                                          <Avatar className="inline-block h-6 w-6 rounded-full ring-1 ring-background">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{user.initials || user.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{user.name}</TooltipContent>
                                      </Tooltip>
                                    ))}
                                    {(kpi.assignees || []).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                                  </div>
                                ) : '-' }
                              </TableCell>
                              <TableCell className="align-top text-center">
                                {kpi.comments ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center justify-center h-6 w-6 cursor-help">
                                         <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-sm">{kpi.comments}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              {isFirstKpiOfKra && (
                                <TableCell className="text-right align-top" rowSpan={kraRowSpan}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(kra)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit KRA & KPIs</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteKra(kra.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete KRA</TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="objectives">
                <div className="overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">Objective Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right w-[15%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {objectivesData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No Objectives defined yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        objectivesData.map((objective) => (
                          <TableRow key={objective.id}>
                            <TableCell className="font-medium">{objective.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{objective.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditObjectiveModal(objective)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteObjective(objective.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline">
                <KRATimelineTab kras={kras} />
              </TabsContent>
              
              <TabsContent value="insights">
                <KRAInsightsTab kras={kras} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <KpiModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          kraData={editingKra}
          onSubmit={handleFormSubmit}
          users={mockUsers}
          objectives={objectivesData.map(o => o.name)}
          units={units}
        />

        <Dialog open={isObjectiveModalOpen} onOpenChange={handleCloseObjectiveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingObjective ? 'Edit Objective' : 'Add New Objective'}</DialogTitle>
              <DialogDescription>
                {editingObjective ? 'Update the objective details.' : 'Define a new objective for KRAs.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="objective-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="objective-name"
                  value={newObjectiveData.name || ''}
                  onChange={(e) => handleObjectiveFormChange('name', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="objective-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="objective-description"
                  value={newObjectiveData.description || ''}
                  onChange={(e) => handleObjectiveFormChange('description', e.target.value)}
                  className="col-span-3"
                  placeholder="(Optional) Describe the objective..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline">Cancel</Button>
               </DialogClose>
              <Button type="button" onClick={handleSaveObjective}>Save Objective</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default KRAsTab; 