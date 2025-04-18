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
  Edit, Eye, FileText, Filter, Plus, Trash2, User as UserIcon
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
  useKRAsData 
} from '@/hooks/useSupabaseData';
import { OrganizationUnit } from '@/types';
import { useStaffByDepartment } from '@/hooks/useStaffByDepartment';
import { StaffMember } from '@/types/staff';
import { Objective, Kra } from '@/types/kpi';
import { unitService } from '@/integrations/supabase/unitService'; // Import the unitService
import DivisionStaffMap from '@/utils/divisionStaffMap'; // Import DivisionStaffMap
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'; // Import the correct auth hook

// Import tab components
import { TasksTab } from '@/components/unit-tabs/TasksTab';
import { ProjectsTab } from '@/components/unit-tabs/ProjectsTab';
import { RisksTab } from '@/components/unit-tabs/RisksTab';
import { OverviewTab } from '@/components/unit-tabs/OverviewTab';

// Define status options for dropdowns
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

// Define structure for unit data (now representing departments)
interface UnitData {
  id: string; // Use department name as ID
  name: string;
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
  // Destructure currentUserDepartment from the hook
  const { staffMembers, currentUserDepartment } = useStaffByDepartment(); 
  const { toast } = useToast();

  // Initialize data states first
  const taskState = useTasksData();
  const projectState = useProjectsData();
  const riskState = useRisksData();
  const kraState = useKRAsData();

  // --- Remove State for All Units from DB ---
  // const [allUnitsData, setAllUnitsData] = useState<UnitData[]>([]);
  // const [unitsLoading, setUnitsLoading] = useState<boolean>(true);
  // const [unitsError, setUnitsError] = useState<Error | null>(null);

  // Active Tab State for the main page sections
  const [activeTab, setActiveTab] = useState<string>("overview");
  // Active Tab State for the KRAs section specifically
  const [kraSectionTab, setKraSectionTab] = useState<string>("kpis");

  // Objective State Management - Initialize as empty array
  const [objectivesData, setObjectivesData] = useState<Objective[]>([]); 
  const [objectivesLoading, setObjectivesLoading] = useState<boolean>(true); 
  const [objectivesError, setObjectivesError] = useState<Error | null>(null); 

  // --- Derive Departments from DivisionStaffMap ---
  const derivedUnits = useMemo((): UnitData[] => {
    try {
      const allStaff = DivisionStaffMap.getAllStaff();
      const departmentNames = allStaff.map(staff => staff.department).filter(Boolean); // Get all department names, remove falsy values
      const uniqueDepartmentNames = Array.from(new Set(departmentNames));
      // console.log("[Unit.tsx] Derived unique departments:", uniqueDepartmentNames); // Remove log
      return uniqueDepartmentNames.map(name => ({ id: name, name: name }));
    } catch (error) {
        console.error("Error deriving units from DivisionStaffMap:", error);
        return []; // Return empty array on error
    }
  }, []); // Empty dependency array, derived once

  // --- Objective Fetching Logic --- 
  const fetchObjectives = useCallback(async () => {
    setObjectivesLoading(true);
    setObjectivesError(null);
    try {
      const fetchedObjectives = await unitService.getAllObjectives();
      setObjectivesData(fetchedObjectives);
    } catch (error) {
      setObjectivesError(error instanceof Error ? error : new Error('Failed to load objectives'));
      toast({ title: "Error Loading Objectives", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setObjectivesLoading(false);
    }
  }, [toast]); // Dependency array includes toast

  // --- REMOVE Unit Fetching Logic --- 
  // const fetchAllUnits = useCallback(async () => { /* ... */ }, [toast]);

  // --- Modified Objective Handlers --- 
  const handleSaveObjective = useCallback(async (objective: Objective) => {
    // This function is now primarily called AFTER a successful save in KRAsTab
    // We just need to update the local state and potentially re-fetch for consistency
    setObjectivesData(prev => {
      const existingIndex = prev.findIndex(o => o.id === objective.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = objective;
        return updated;
      } else {
        return [...prev, objective]; // Add the new objective with the real ID from DB
      }
    });
    // Option 2: Re-fetch all objectives (ensures consistency)
    await fetchObjectives(); 

  }, [fetchObjectives]); // Depend on fetchObjectives

  // Function to refresh all relevant data
  const handleRefreshAllData = useCallback(() => {
    fetchObjectives();
    // fetchAllUnits(); // Remove unit refresh
    kraState.refresh?.();
    taskState.refresh?.(); // Refresh tasks too if needed
    projectState.refresh?.(); // Refresh projects too if needed
    riskState.refresh?.(); // Refresh risks too if needed
  }, [fetchObjectives, kraState.refresh, taskState.refresh, projectState.refresh, riskState.refresh]); // Update dependencies

  const handleDeleteObjective = useCallback(async (objectiveId: string | number) => {
    try {
      // Assume unitService has a deleteObjective method
      await unitService.deleteObjective(String(objectiveId)); 
      toast({ title: "Objective Deleted", description: `Objective ID ${objectiveId} deleted successfully.` });
      handleRefreshAllData(); // Refresh data after successful deletion
    } catch (error) {
      toast({ 
        title: "Error Deleting Objective", 
        description: error instanceof Error ? error.message : "An unexpected error occurred.", 
        variant: "destructive" 
      });
    }
  }, [toast, handleRefreshAllData]);

  // Effect to load data on mount
  useEffect(() => {
    fetchObjectives(); // Fetch objectives on mount
    // fetchAllUnits(); // Remove unit fetch
    taskState.refresh?.();
    projectState.refresh?.();
    riskState.refresh?.();
    kraState.refresh?.();
  }, [fetchObjectives, taskState.refresh, projectState.refresh, riskState.refresh, kraState.refresh]); // Update dependencies

  // Determine if data loading is complete - Remove unitsLoading
  const isDataLoading = objectivesLoading || taskState.loading || projectState.loading || riskState.loading || kraState.loading;
  // Remove unitsError
  const hasDataLoadingError = objectivesError || taskState.error || projectState.error || riskState.error || kraState.error;

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
            {/* Remove unitsError display */}
            {objectivesError && <p>Objectives Error: {objectivesError.message}</p>}
            {taskState.error && <p>Tasks Error: {taskState.error.message}</p>}
            {projectState.error && <p>Projects Error: {projectState.error.message}</p>}
            {riskState.error && <p>Risks Error: {riskState.error.message}</p>}
            {kraState.error && <p>KRAs Error: {kraState.error.message}</p>}
          </CardContent>
        </Card>
      )}

      {!isDataLoading && !hasDataLoadingError && (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks/Daily Operations</TabsTrigger>
            <TabsTrigger value="kras">KRAs</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewTab
              projects={projectState.data}
              tasks={taskState.data}
              risks={riskState.data}
              kras={kraState.data || []}
              objectives={objectivesData} // Pass REAL objectivesData
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
              objectives={objectivesData} // Pass REAL objectivesData
            />
          </TabsContent>

          {/* KRAs Tab */}
          <TabsContent value="kras" className="space-y-6">
            <KRAsTab
              kras={kraState.data || []} 
              objectivesData={objectivesData} 
              onSaveObjective={handleSaveObjective} 
              onDeleteObjective={handleDeleteObjective}
              // --- MODIFIED --- Pass the derived department list
              units={derivedUnits} 
              staffMembers={staffMembers} 
              onDataRefresh={handleRefreshAllData} 
              activeTab={kraSectionTab} 
              onTabChange={setKraSectionTab} 
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
              objectives={objectivesData} // Pass REAL objectivesData
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
              staffMembers={staffMembers} // Pass staffMembers
              projects={projectState.data} 
              objectives={objectivesData} // Pass REAL objectivesData
            />
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
};

export default Unit;
