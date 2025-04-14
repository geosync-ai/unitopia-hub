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
import { StaffMember } from '@/types/staff';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient';
import { useToast } from "@/components/ui/use-toast";

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
    objectiveId: 'obj1',
    unit: 'Customer Service',
    startDate: '2023-01-01',
    targetDate: '2023-06-01',
    kpis: mockKpis1,
    comments: 'Initial focus on support improvements.',
    department: 'Customer Service',
    status: 'on-track',
    owner: mockUsers[0],
  },
  {
    id: 'kra2',
    title: 'Increase Market Share',
    objectiveId: 'obj2',
    unit: 'Marketing',
    startDate: '2023-01-01',
    targetDate: '2023-06-01',
    kpis: mockKpis2,
    department: 'Marketing',
    status: 'at-risk',
    owner: mockUsers[1],
  },
   {
    id: 'kra3',
    title: 'Product Development Cycle',
    objectiveId: 'obj3',
    unit: 'Engineering',
    startDate: '2023-03-15',
    targetDate: '2023-09-15',
    kpis: mockKpis3,
    comments: 'Focus on agile practices adoption.',
    department: 'Engineering',
    status: 'pending',
    owner: mockUsers[2],
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
    kra: Kra & { objectiveName?: string };
    kpi: Kpi;
    isFirstKpiOfKra: boolean;
    kraRowSpan: number;
}

// Define Props for KRAsTab
interface KRAsTabProps {
  kras: Kra[];
  objectivesData: Objective[];
  onSaveObjective: (objective: Objective) => void;
  onDeleteObjective: (objectiveId: string | number) => void;
  units: string[];
  staffMembers?: StaffMember[];
}

export const KRAsTab: React.FC<KRAsTabProps> = ({
  kras: krasFromProps,
  objectivesData,
  onSaveObjective,
  onDeleteObjective,
  units,
  staffMembers
}) => {
  const kras = krasFromProps; // Use props directly
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [editingKra, setEditingKra] = useState<Kra | undefined>(undefined);
  const [editingKpiDetails, setEditingKpiDetails] = useState<{ kraId: string; kpi: Kpi } | undefined>(undefined);
  const [filters, setFilters] = useState<KraFiltersState>({
      department: 'all',
      status: 'all',
  });
  const [activeTab, setActiveTab] = useState<string>("kpis");
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | undefined>(undefined);
  const [newObjectiveData, setNewObjectiveData] = useState<Partial<Objective>>({ name: '', description: '' });
  const { toast } = useToast();

  const departments = useMemo(() => Array.from(new Set(kras.map(kra => kra.unit || 'Unknown'))).filter(d => d !== 'Unknown'), [kras]);
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

  const processedRows = useMemo((): ProcessedRow[] => {
    let rows: ProcessedRow[] = [];
    kras.forEach(kra => {
      const objectiveName = objectivesData.find(o => o.id === kra.objectiveId)?.name || 'N/A';

      const kraKpis = kra.kpis && kra.kpis.length > 0 ? kra.kpis : [{ id: `no-kpi-${kra.id}`, name: '-' } as Kpi];

      const departmentMatch = filters.department === 'all' || kra.unit === filters.department;
      if (!departmentMatch) return;

      const filteredKpis = kraKpis.filter(kpi => filters.status === 'all' || kpi.status === filters.status);

      if (filteredKpis.length > 0) {
        const kraRowSpan = filteredKpis.length;
        filteredKpis.forEach((kpi, index) => {
          rows.push({
            kra: { ...kra, objectiveName: objectiveName },
            kpi: kpi,
            isFirstKpiOfKra: index === 0,
            kraRowSpan: kraRowSpan
          });
        });
      }
    });
    return rows;
  }, [kras, filters.department, filters.status, objectivesData]);

  const handleOpenAddKraModal = () => {
    setEditingKra(undefined);
    setEditingKpiDetails(undefined);
    setIsKpiModalOpen(true);
  };

  const handleOpenEditKraModal = (kra: Kra) => {
    const kraToEdit = kras.find(k => k.id === kra.id);
    if (kraToEdit) {
      setEditingKra(kraToEdit);
      setEditingKpiDetails(undefined);
      setIsKpiModalOpen(true);
    } else {
      console.error("Could not find KRA data to edit for ID:", kra.id);
    }
  };

  const handleOpenEditKpiModal = (kraId: string | number, kpi: Kpi) => {
    const kraToEdit = kras.find(k => k.id === kraId);
     if (kraToEdit) {
       setEditingKra(kraToEdit);
       setEditingKpiDetails({ kraId: String(kraId), kpi });
       setIsKpiModalOpen(true);
     } else {
        console.error("Could not find parent KRA for KPI editing:", kraId);
     }
  };

  const handleCloseKpiModal = () => {
    setIsKpiModalOpen(false);
    setEditingKra(undefined);
    setEditingKpiDetails(undefined);
  };

  const mapStatusToDbFormat = (status: string): string => {
    // Map UI status format to database format
    const statusMap: Record<string, string> = {
      'At Risk': 'at-risk',
      'On Track': 'on-track',
      'Off Track': 'off-track',
      'Completed': 'completed',
      'Pending': 'pending',
      'Not Started': 'pending'
    };
    return statusMap[status] || 'pending'; // Default to pending if unknown
  };

  const handleKpiFormSubmit = async (formData: any) => {
    console.log("[handleKpiFormSubmit] Received form data:", JSON.stringify(formData, null, 2));
    const supabase = getSupabaseClient();
    const isEditing = !!editingKra?.id;
    let kraId = editingKra?.id;
    let operationError = false;

    // 1. Prepare KRA Payload (Map frontend fields to DB columns)
    // Ensure formData fields match your KraFormData type
    const kraPayload: any = {
      title: formData.title,
      objective_id: formData.objectiveId || null, // Ensure null if undefined
      unit_name: formData.unit || 'Default Unit', // Map 'unit' to 'unit_name', provide default if needed
      start_date: formData.startDate || null,
      target_date: formData.targetDate || null,
      assignees: formData.assignees || [], // Default to empty array if needed
      description: formData.description || null,
      status: mapStatusToDbFormat(formData.status || 'pending')
    };
    
    // Get current division ID from localStorage
    const currentDivisionId = localStorage.getItem('current_division_id');
    if (currentDivisionId) {
      kraPayload.division_id = currentDivisionId;
    }
    
    console.log("[handleKpiFormSubmit] Prepared KRA Payload:", kraPayload);

    // --- KRA Save/Update --- 
    try {
      if (isEditing) {
        // --- Update KRA ---
        console.log(`[handleKpiFormSubmit] Updating KRA ID: ${kraId}`);
        const { error: updateKraError } = await supabase
          .from('unit_kras')
          .update(kraPayload)
          .eq('id', kraId);
        
        if (updateKraError) {
          console.error("[handleKpiFormSubmit] Error updating KRA:", updateKraError);
          toast({ title: "Error Updating KRA", description: updateKraError.message, variant: "destructive" });
          operationError = true;
          // Decide if we should stop or try to update KPIs anyway? Stop for now.
          return; 
        }
        console.log(`[handleKpiFormSubmit] KRA ID ${kraId} updated successfully.`);

      } else {
        // --- Insert KRA ---
        console.log("[handleKpiFormSubmit] Inserting new KRA");
        const { data: newKraData, error: insertKraError } = await supabase
          .from('unit_kras')
          .insert(kraPayload)
          .select('id') // Select only the ID
          .single();

        if (insertKraError) {
          console.error("[handleKpiFormSubmit] Error inserting KRA:", insertKraError);
          toast({ title: "Error Creating KRA", description: insertKraError.message, variant: "destructive" });
          operationError = true;
          return; // Stop if KRA insert fails
        }

        if (!newKraData?.id) {
          console.error("[handleKpiFormSubmit] KRA inserted but no ID returned.");
          toast({ title: "Error Creating KRA", description: "Could not get ID for the new KRA.", variant: "destructive" });
          operationError = true;
          return; 
        }

        kraId = newKraData.id; // Get the ID for linking KPIs
        console.log(`[handleKpiFormSubmit] New KRA inserted successfully. ID: ${kraId}`);
      }
    } catch (error) {
        console.error("[handleKpiFormSubmit] Unexpected error during KRA save/update:", error);
        toast({ title: "Unexpected KRA Error", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
        operationError = true;
        return;
    }

    // --- KPI Save/Update --- (Only proceed if KRA operation was successful and we have a kraId)
    if (!operationError && kraId && formData.kpis && Array.isArray(formData.kpis)) {
      console.log(`[handleKpiFormSubmit] Processing ${formData.kpis.length} KPIs for KRA ID: ${kraId}`);
      
      // If editing, first delete existing KPIs for this KRA
      if (isEditing) {
          console.log(`[handleKpiFormSubmit] Deleting existing KPIs for KRA ID: ${kraId}`);
          const { error: deleteKpiError } = await supabase
              .from('unit_kpis')
              .delete()
              .eq('kra_id', kraId);
          
          if (deleteKpiError) {
              console.error("[handleKpiFormSubmit] Error deleting existing KPIs:", deleteKpiError);
              toast({ title: "Error Updating KPIs", description: `Failed to clear old KPIs: ${deleteKpiError.message}`, variant: "destructive" });
              // Continue to attempt insert, maybe some KPIs were deleted?
          } else {
              console.log(`[handleKpiFormSubmit] Existing KPIs deleted successfully for KRA ID: ${kraId}`);
          }
      }

      // Prepare and insert KPI Payloads
      const kpiPayloads = formData.kpis.map((kpi: any) => ({
        kra_id: kraId, // Link to the parent KRA
        name: kpi.name,
        target: kpi.target || null,
        actual: kpi.actual || null, 
        status: kpi.status || 'Not Started',
        start_date: kpi.startDate || null,
        target_date: kpi.targetDate || null,
        assignees: kpi.assignees || [],
        description: kpi.description || null,
        comments: kpi.comments || null, // Assuming comments field exists in KPI form
      }));

      if (kpiPayloads.length > 0) {
          console.log("[handleKpiFormSubmit] Prepared KPI Payloads:", kpiPayloads);
          const { error: insertKpiError } = await supabase
              .from('unit_kpis')
              .insert(kpiPayloads);

          if (insertKpiError) {
              console.error("[handleKpiFormSubmit] Error inserting KPIs:", insertKpiError);
              toast({ title: "Error Saving KPIs", description: insertKpiError.message, variant: "destructive" });
              operationError = true; 
          } else {
              console.log(`[handleKpiFormSubmit] ${kpiPayloads.length} KPIs inserted successfully for KRA ID: ${kraId}`);
          }
      } else {
          console.log("[handleKpiFormSubmit] No KPIs provided in the form data.");
      }
    }

    // --- Final Steps ---
    if (!operationError) {
      toast({ title: `KRA ${isEditing ? 'Updated' : 'Created'} Successfully`, description: "KRA and associated KPIs have been saved." });
      // TODO: Trigger data refresh in parent component (Unit.tsx)
      // Example: onDataChange?.(); // If a callback prop exists
    } else {
        toast({ title: `KRA ${isEditing ? 'Update' : 'Creation'} Partially Failed`, description: "Errors occurred during saving. Check console logs.", variant: "destructive" });
    }

    handleCloseKpiModal(); // Close modal regardless of partial errors, as some operations might have succeeded
  };

  const handleDeleteKra = (kraId: string | number) => {
    console.log("Delete KRA clicked (in KRAsTab):", kraId);
  };

  const handleOpenAddObjectiveModal = () => {
    setEditingObjective(undefined);
    setNewObjectiveData({ name: '', description: '' });
    setIsObjectiveModalOpen(true);
  };

  const handleOpenEditObjectiveModal = (objective: Objective) => {
    setEditingObjective(objective);
    setNewObjectiveData({ name: objective.name, description: objective.description });
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

  const handleSaveObjective = async () => {
    const supabase = getSupabaseClient();
    const objectivePayload = {
      title: newObjectiveData.name,
      description: newObjectiveData.description,
    };

    console.log('[handleSaveObjective] Attempting to save objective. Payload:', objectivePayload);

    try {
      let savedObjectiveData;
      let error;
      let operationType: 'insert' | 'update' = 'insert';

      if (editingObjective?.id) {
        operationType = 'update';
        console.log(`[handleSaveObjective] Updating objective ID: ${editingObjective.id}`);
        const { data, error: updateError } = await supabase
          .from('unit_objectives')
          .update(objectivePayload)
          .eq('id', editingObjective.id)
          .select()
          .single();

        savedObjectiveData = data;
        error = updateError;
        console.log('[handleSaveObjective] Supabase update response:', { data, error });

      } else {
        operationType = 'insert';
        console.log('[handleSaveObjective] Inserting new objective');
        if (!objectivePayload.title || objectivePayload.title.trim() === '') {
            toast({ title: "Error", description: "Objective name cannot be empty.", variant: "destructive" });
            console.error('[handleSaveObjective] Objective title is empty, cannot insert.');
            return;
        }
        const { data, error: insertError } = await supabase
          .from('unit_objectives')
          .insert(objectivePayload)
          .select()
          .single();

        savedObjectiveData = data;
        error = insertError;
        console.log('[handleSaveObjective] Supabase insert response:', { data, error });
      }

      if (error) {
        console.error(`[handleSaveObjective] Supabase error during ${operationType}:`, error);
        toast({ 
          title: `Error ${operationType === 'insert' ? 'creating' : 'updating'} objective`, 
          description: error.message || 'An unknown database error occurred.', 
          variant: "destructive" 
        });
        return;
      }

      if (savedObjectiveData) {
        const savedObjectiveForUI: Objective = {
          id: savedObjectiveData.id,
          name: savedObjectiveData.title,
          description: savedObjectiveData.description,
        };

        console.log('[handleSaveObjective] Objective saved successfully in DB. UI State Input:', savedObjectiveForUI);
        
        onSaveObjective(savedObjectiveForUI);

        toast({ title: "Objective saved successfully." });
        handleCloseObjectiveModal();
      } else {
         console.warn('[handleSaveObjective] Supabase returned no data and no error after save operation. Check RLS select policies.');
         toast({ 
           title: "Objective Saved (potentially)", 
           description: "The operation may have succeeded, but the result couldn't be immediately retrieved. Refresh data if needed.", 
           variant: "default"
         });
         handleCloseObjectiveModal();
      }

    } catch (error) {
      console.error('[handleSaveObjective] Unexpected error saving objective:', error);
      toast({ 
        title: "Unexpected Error", 
        description: error instanceof Error ? error.message : "An unexpected error occurred during save.", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteObjective = (objectiveId: string | number) => {
    if (window.confirm("Are you sure you want to delete this objective? This might affect linked KRAs.")) {
        onDeleteObjective(objectiveId);
    }
  };

  const addButtonLabel = activeTab === 'objectives' ? 'Add Objective' : 'Add KRA';
  const handleAddButtonClick = activeTab === 'objectives' ? handleOpenAddObjectiveModal : handleOpenAddKraModal;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Key Result Areas</h2>
          <Button
            className="flex items-center gap-2"
            onClick={handleAddButtonClick}
          >
            <Plus className="h-4 w-4" /> {addButtonLabel}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KRAs / KPIs / Objectives</CardTitle>
            <CardDescription>
              Track performance, manage objectives, and view timelines.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="kpis">KPIs</TabsTrigger>
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {activeTab !== 'timeline' && activeTab !== 'insights' && (
                <div className="bg-muted/50 p-4 rounded-md mb-6 border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    {activeTab === 'kpis' && (
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
                             {units.map(unit => (
                               <SelectItem key={unit} value={unit}>
                                 {unit}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                    )}

                    {activeTab === 'kpis' && (
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
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                  </div>
                </div>
              )}

              <TabsContent value="kpis">
                <div className="overflow-x-auto border rounded-md">
                  <Table className="min-w-full table-fixed md:table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[15%] min-w-[150px]">Objective</TableHead>
                        <TableHead className="w-[15%] min-w-[180px]">KRA</TableHead>
                        <TableHead className="w-[20%] min-w-[200px]">KPI</TableHead>
                        <TableHead className="min-w-[100px]">Start Date</TableHead>
                        <TableHead className="min-w-[100px]">Target Date</TableHead>
                        <TableHead className="min-w-[80px]">Quarter</TableHead>
                        <TableHead className="min-w-[80px]">Target</TableHead>
                        <TableHead className="min-w-[80px]">Actual</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Assignees</TableHead>
                        <TableHead className="min-w-[150px]">Comments</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
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
                                  {kra.objectiveName}
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
                                {kpi.status ? (
                                    <StatusBadge status={kpi.status} />
                                 ) : (
                                    <span className="text-muted-foreground">-</span>
                                 )}
                              </TableCell>
                              <TableCell className="align-top">
                                {kpi.assignees && kpi.assignees.length > 0 ? (
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {kpi.assignees.map(assignee => (
                                      <Tooltip key={assignee.id}>
                                        <TooltipTrigger asChild>
                                          <Avatar className="h-6 w-6 border-2 border-background">
                                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                            <AvatarFallback>{assignee.initials}</AvatarFallback>
                                          </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{assignee.name}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="align-top text-xs text-muted-foreground">
                                {kpi.comments || '-'}
                              </TableCell>
                              <TableCell className="align-top text-right">
                                {isFirstKpiOfKra && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditKraModal(kra)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Edit KRA</p></TooltipContent>
                                    </Tooltip>
                                )}
                                {kpi.id && kpi.name !== '-' && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditKpiModal(kra.id, kpi)}>
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Edit KPI / Add Comment</p></TooltipContent>
                                    </Tooltip>
                                )}
                                {isFirstKpiOfKra && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteKra(kra.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Delete KRA</p></TooltipContent>
                                    </Tooltip>
                                )}
                              </TableCell>
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
                            No Objectives defined yet. Use the "Add Objective" button.
                          </TableCell>
                        </TableRow>
                      ) : (
                        objectivesData.map((objective) => (
                          <TableRow key={objective.id}>
                            <TableCell className="font-medium">{objective.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{objective.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditObjectiveModal(objective)}>
                                <Edit className="h-4 w-4" />
                              </Button>
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
          isOpen={isKpiModalOpen}
          onClose={handleCloseKpiModal}
          kraData={editingKra}
          onSubmit={handleKpiFormSubmit}
          staffMembers={staffMembers}
          objectives={objectivesData}
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