import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Edit, Eye, FileText, Filter, Plus, Trash2, User as UserIcon,
  Kanban,
  List
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
import { 
  useTasksData, 
  useProjectsData, 
  useRisksData, 
  useKRAsData,
  useSupabaseData
} from '@/hooks/useSupabaseData';
import { OrganizationUnit, Objective, Kra, Kpi, KRA } from '@/types';
import { useStaffByDepartment } from '@/hooks/useStaffByDepartment';
import { StaffMember } from '@/types/staff';
import { objectivesService } from '@/integrations/supabase/unitService';
import DivisionStaffMap from '@/utils/divisionStaffMap';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Import tab components
import TaskDialog from '@/components/unit-tabs/TaskDialog';
import { TasksTab, Task } from '@/components/unit-tabs/TasksTab';
import { ProjectsTab } from '@/components/unit-tabs/ProjectsTab';
import { RisksTab } from '@/components/unit-tabs/RisksTab';
import { OverviewTab } from '@/components/unit-tabs/OverviewTab';
import { ReportsTab } from '@/components/unit-tabs/ReportsTab';

// Define status options for dropdowns
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

type ViewMode = 'board' | 'grid' | 'list';

// Define structure for unit data (now representing departments)
interface UnitData {
  id: string; // Use department name as ID
  name: string;
}

interface IdentifiableWithStringId {
  id?: string; // Ensure id is always string for this hook context
  assigned_to_email?: string | null;
}

// Type assertion helper if needed, but often casting directly is fine
function ensureStringId<T extends { id?: string | number }>(item: T): T & { id?: string } {
  return { ...item, id: item.id?.toString() };
}

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
  const { user } = useSupabaseAuth();
  const { staffMembers, currentUserDepartment } = useStaffByDepartment();
  const { toast } = useToast();

  // Initialize data states first
  const taskState = useTasksData();
  const projectState = useProjectsData();
  const riskState = useRisksData();
  const kraState = useKRAsData();
  const kpiState = useSupabaseData<Kpi & IdentifiableWithStringId>('kpis');

  // Active Tab State for the main page sections
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [kraSectionTab, setKraSectionTab] = useState<string>("kpis"); // Renamed from kraSectionTab
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Objective State Management
  const [objectivesData, setObjectivesData] = useState<Objective[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState<boolean>(true);
  const [objectivesError, setObjectivesError] = useState<Error | null>(null);

  // --- Objective Fetching Logic (Moved Up) ---
  const fetchObjectives = useCallback(async () => {
     setObjectivesLoading(true);
     setObjectivesError(null);
     try {
       const fetchedObjectives = await objectivesService.getObjectives();
       const objectivesWithStringIds = fetchedObjectives.map(obj => ensureStringId(obj));
       setObjectivesData(objectivesWithStringIds);
     } catch (error) {
       setObjectivesError(error instanceof Error ? error : new Error('Failed to load objectives'));
       toast({ title: "Error Loading Objectives", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
     } finally {
       setObjectivesLoading(false);
     }
  }, [toast]);

  // --- Function to refresh all relevant data ---
  const handleRefreshAllData = useCallback(() => {
    fetchObjectives();
    kraState.refresh?.();
    kpiState.refresh?.();
    taskState.refresh?.();
    projectState.refresh?.();
    riskState.refresh?.();
  }, [fetchObjectives, kraState.refresh, kpiState.refresh, taskState.refresh, projectState.refresh, riskState.refresh]);

  // --- Modified Objective Handlers (Moved Down) ---
  const handleSaveObjective = useCallback(async (objective: Objective) => {
    const objectiveWithStringId = ensureStringId(objective);
    setObjectivesData(prev => {
      const existingIndex = prev.findIndex(o => o.id === objectiveWithStringId.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = objectiveWithStringId;
        return updated;
      } else {
        return [...prev, objectiveWithStringId];
      }
    });
    await fetchObjectives(); // Re-fetch after saving locally for potential updates from DB
  }, [fetchObjectives]);

  const handleDeleteObjective = useCallback(async (objectiveId: string | number) => {
    try {
      await objectivesService.deleteObjective(String(objectiveId));
      toast({ title: "Objective Deleted", description: `Objective ID ${objectiveId} deleted successfully.` });
      handleRefreshAllData(); // Refresh all data after deletion
    } catch (error) {
      toast({ title: "Error Deleting Objective", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
    }
  }, [toast, handleRefreshAllData, fetchObjectives]); // Added fetchObjectives just in case, though handleRefresh calls it

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleTaskSubmit = (taskData: Partial<Task>) => {
    if (editingTask) {
      taskState.update(editingTask.id, taskData);
    } else {
      taskState.add(taskData as Omit<Task, 'id'>);
    }
    setIsDialogOpen(false);
  };

  // --- Derive Departments from DivisionStaffMap ---
  const derivedUnits = useMemo((): UnitData[] => {
    try {
      const allStaff = DivisionStaffMap.getAllStaff();
      // Safely access department with type check
      const departmentNames = allStaff
        .map(staff => ('department' in staff ? staff.department : null))
        .filter(Boolean) as string[];
      const uniqueDepartmentNames = Array.from(new Set(departmentNames));
      return uniqueDepartmentNames.map(name => ({ id: name, name: name }));
    } catch (error) {
        console.error("Error deriving units from DivisionStaffMap:", error);
        return [];
    }
  }, []);

  // --- Effect to load data on mount ---
  useEffect(() => {
    fetchObjectives();
    taskState.refresh?.();
    projectState.refresh?.();
    riskState.refresh?.();
    kraState.refresh?.();
    kpiState.refresh?.();
  }, [fetchObjectives, taskState.refresh, projectState.refresh, riskState.refresh, kraState.refresh, kpiState.refresh]);

  // --- Combine KRAs and KPIs --- 
  const combinedKrasForTabs = useMemo(() => {
    const kras = kraState.data || [];
    const kpis = kpiState.data || [];

    const kpisByKraId = kpis.reduce((acc, kpi) => {
      const kraId = kpi.kra_id;
      if (kraId) {
        if (!acc[kraId]) {
          acc[kraId] = [];
        }
        acc[kraId].push(kpi);
      }
      return acc;
    }, {} as Record<string | number, Kpi[]>);

    return kras.map((kra): Kra => {
      const kpisForKra: Kpi[] = kpisByKraId[kra.id] || [];
      return {
        ...kra,
        unitKpis: kpisForKra,
      };
    });
  }, [kraState.data, kpiState.data]);

  const combinedKrasForOverview = useMemo(() => {
    return (kraState.data || []).map((kra): KRA => {
      const objective = objectivesData.find(o => o.id === kra.objective_id);
      return {
        id: kra.id.toString(),
        name: kra.title,
        objectiveId: kra.objective_id?.toString() ?? '',
        objectiveName: objective?.title ?? 'N/A',
        department: kra.department ?? 'N/A',
        responsible: kra.owner?.name ?? 'N/A',
        startDate: kra.startDate ? new Date(kra.startDate) : new Date(),
        endDate: kra.targetDate ? new Date(kra.targetDate) : new Date(),
        progress: 0, // Default value
        status: 'open', // Default value
        kpis: [], // Default value
        createdAt: kra.createdAt ?? new Date().toISOString(),
        updatedAt: kra.updatedAt ?? new Date().toISOString(),
        title: kra.title,
        objective_id: kra.objective_id,
        unit: kra.unit,
        unitId: kra.unitId,
        targetDate: kra.targetDate,
        unitKpis: [],
        owner: kra.owner,
        ownerId: kra.ownerId,
        unitObjectives: kra.unitObjectives,
      };
    });
  }, [kraState.data, objectivesData]);

  // Determine if data loading is complete
  const isDataLoading = objectivesLoading || taskState.loading || projectState.loading || riskState.loading || kraState.loading || kpiState.loading;
  // Determine if there was an error
  const hasDataLoadingError = objectivesError || taskState.error || projectState.error || riskState.error || kraState.error || kpiState.error;

  // Main content rendering
  return (
    <PageLayout>
      {user && (user.user_metadata?.unitName || user.user_metadata?.divisionName) && (
        <div className="mb-4 text-sm text-muted-foreground">
          {/* Display user's actual department if available from hook */} 
          Unit/Department: {currentUserDepartment || user.user_metadata?.unitName || user.user_metadata?.divisionName || 'N/A'}
        </div>
      )}

      {isDataLoading && (
         <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> Loading Unit Data...</div>
      )}
      {hasDataLoadingError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Data Loading Error</CardTitle>
            <CardDescription className="text-destructive">
              There was an error loading some unit data. Please check the data sources or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {objectivesError && <p>Objectives Error: {objectivesError.message}</p>}
            {taskState.error && <p>Tasks Error: {taskState.error.message}</p>}
            {projectState.error && <p>Projects Error: {projectState.error.message}</p>}
            {riskState.error && <p>Risks Error: {riskState.error.message}</p>}
            {kraState.error && <p>KRAs Error: {kraState.error.message}</p>}
            {kpiState.error && <p>KPIs Error: {kpiState.error.message}</p>}
          </CardContent>
        </Card>
      )}

      {!isDataLoading && !hasDataLoadingError && (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks/Daily Operations</TabsTrigger>
              <TabsTrigger value="kras-objectives">KRAs & Objectives</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            {activeTab === 'tasks' && (
              <div className="flex items-center gap-4">
                <Input 
                  placeholder="Search tasks..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="max-w-sm"
                />
                 <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'board' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('board')}
                    className="h-8 px-2"
                  >
                    <Kanban className="h-4 w-4 mr-1" />
                    Board
                  </Button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-2"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Grid
                  </Button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-2"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
                <Button onClick={handleCreateTask}>
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
              </div>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewTab
              projects={projectState.data}
              tasks={taskState.data}
              risks={riskState.data}
              // kras={combinedKrasForOverview} // Pass raw KRAs for debugging
              kras={combinedKrasForOverview} // Pass the combined data structure
              objectives={objectivesData}
            />
          </TabsContent>

          {/* Tasks/Daily Operations Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <TasksTab
              tasks={taskState.data.filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))}
              addTask={taskState.add}
              editTask={taskState.update}
              deleteTask={taskState.remove}
              error={taskState.error}
              onRetry={taskState.refresh}
              staffMembers={staffMembers}
              objectives={objectivesData}
              setEditingTask={setEditingTask}
              setIsDialogOpen={setIsDialogOpen}
              viewMode={viewMode}
            />
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
              objectives={objectivesData}
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
              staffMembers={staffMembers}
              projects={projectState.data}
              objectives={objectivesData}
            />
          </TabsContent>

          {/* KRAs & Objectives Tab */}
          <TabsContent value="kras-objectives" className="space-y-6">
            <KRAsTab
              kras={combinedKrasForTabs}
              objectivesData={objectivesData}
              onSaveObjective={handleSaveObjective}
              onDeleteObjective={handleDeleteObjective}
              units={derivedUnits}
              staffMembers={staffMembers}
              onDataRefresh={handleRefreshAllData}
              activeTab={kraSectionTab}
              onTabChange={setKraSectionTab}
            />
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsTab
              tasks={taskState.data}
              kras={combinedKrasForTabs}
              projects={projectState.data}
              risks={riskState.data}
              objectives={objectivesData}
            />
          </TabsContent>
        </Tabs>
      )}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        staffMembers={staffMembers}
        buckets={[]}
      />
    </PageLayout>
  );
};

export default Unit;
