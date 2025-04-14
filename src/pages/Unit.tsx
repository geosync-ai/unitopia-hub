import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import AddAssetModal from '@/components/unit-tabs/modals/AddAssetModal';
import EditAssetModal from '@/components/unit-tabs/modals/EditAssetModal';

// Import custom hooks for state management
import { useAuth, User } from "@/hooks/useAuth";
import { OneDriveConfig, CsvConfig } from '@/components/setup-wizard/types';
import { 
  useTasksData, 
  useProjectsData, 
  useRisksData, 
  useAssetsData, 
  useKRAsData 
} from '@/hooks/useSupabaseData';
import { OrganizationUnit } from '@/types';
import { useStaffByDepartment } from '@/hooks/useStaffByDepartment';
import { StaffMember } from '@/types/staff';
import { Objective, Kra } from '@/types/kpi';
import { unitService } from '@/integrations/supabase/unitService'; // Import the unitService

// Import tab components
import { TasksTab } from '@/components/unit-tabs/TasksTab';
import { ProjectsTab } from '@/components/unit-tabs/ProjectsTab';
import { RisksTab } from '@/components/unit-tabs/RisksTab';
import { AssetsTab } from '@/components/unit-tabs/AssetsTab';
import { OverviewTab } from '@/components/unit-tabs/OverviewTab';

// Define status options for dropdowns
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
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

// Define the main Unit component
const Unit = () => {
  const { user } = useAuth();
  const { staffMembers } = useStaffByDepartment();
  const { toast } = useToast();

  // Initialize data states first
  const taskState = useTasksData();
  const projectState = useProjectsData();
  const riskState = useRisksData();
  const assetState = useAssetsData();
  const kraState = useKRAsData();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Objective State Management - Initialize as empty array
  const [objectivesData, setObjectivesData] = useState<Objective[]>([]); 
  const [objectivesLoading, setObjectivesLoading] = useState<boolean>(true); // Add loading state
  const [objectivesError, setObjectivesError] = useState<Error | null>(null); // Add error state

  // --- Objective Fetching Logic --- 
  const fetchObjectives = useCallback(async () => {
    console.log("[Unit.tsx] Fetching objectives...");
    setObjectivesLoading(true);
    setObjectivesError(null);
    try {
      const fetchedObjectives = await unitService.getAllObjectives();
      setObjectivesData(fetchedObjectives);
      console.log("[Unit.tsx] Objectives fetched successfully:", fetchedObjectives);
    } catch (error) {
      console.error("[Unit.tsx] Failed to fetch objectives:", error);
      setObjectivesError(error instanceof Error ? error : new Error('Failed to load objectives'));
      toast({ title: "Error Loading Objectives", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setObjectivesLoading(false);
    }
  }, [toast]); // Dependency array includes toast

  // --- Modified Objective Handlers --- 
  const handleSaveObjective = useCallback(async (objective: Objective) => {
    // This function is now primarily called AFTER a successful save in KRAsTab
    // We just need to update the local state and potentially re-fetch for consistency
    console.log("[Unit.tsx] handleSaveObjective triggered. Updating local state and re-fetching.");
    // Option 1: Optimistically update state (faster UI)
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
    console.log("[Unit.tsx] Refreshing all data...");
    fetchObjectives();
    kraState.refresh?.();
    // Potentially refresh other states if KRA/Objective changes affect them
    // projectState.refresh?.(); 
    // taskState.refresh?.();
  }, [fetchObjectives, kraState.refresh]);

  const handleDeleteObjective = useCallback(async (objectiveId: string | number) => {
    console.log(`[Unit.tsx] Attempting to delete objective ID: ${objectiveId}`);
    try {
      // Assume unitService has a deleteObjective method
      await unitService.deleteObjective(String(objectiveId)); 
      toast({ title: "Objective Deleted", description: `Objective ID ${objectiveId} deleted successfully.` });
      handleRefreshAllData(); // Refresh data after successful deletion
    } catch (error) {
      console.error("[Unit.tsx] Error deleting objective:", error);
      toast({ 
        title: "Error Deleting Objective", 
        description: error instanceof Error ? error.message : "An unexpected error occurred.", 
        variant: "destructive" 
      });
    }
  }, [toast, handleRefreshAllData]);

  // Effect to load data on mount
  useEffect(() => {
    console.log("[Unit.tsx] Initial data fetch useEffect triggered.");
    fetchObjectives(); // Fetch objectives on mount
    taskState.refresh?.();
    projectState.refresh?.();
    riskState.refresh?.();
    assetState.refresh?.();
    kraState.refresh?.();
  }, [fetchObjectives, taskState.refresh, projectState.refresh, riskState.refresh, assetState.refresh, kraState.refresh]); // Dependencies remain the same

  // Determine if data loading is complete - Include objectivesLoading
  const isDataLoading = objectivesLoading || taskState.loading || projectState.loading || riskState.loading || assetState.loading || kraState.loading;
  const hasDataLoadingError = objectivesError || taskState.error || projectState.error || riskState.error || assetState.error || kraState.error;

  // Main content rendering
  return (
    <PageLayout>
      {user && (user.unitName || user.divisionName) && (
        <div className="mb-4 text-sm text-muted-foreground">
          Unit/Division: {user.unitName || user.divisionName}
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
            {/* Display error messages - Include objectivesError */}
            {objectivesError && <p>Objectives Error: {objectivesError.message}</p>}
            {taskState.error && <p>Tasks Error: {taskState.error.message}</p>}
            {projectState.error && <p>Projects Error: {projectState.error.message}</p>}
            {riskState.error && <p>Risks Error: {riskState.error.message}</p>}
            {assetState.error && <p>Assets Error: {assetState.error.message}</p>}
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
            <TabsTrigger value="assets">User Asset Management</TabsTrigger>
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
              objectivesData={objectivesData} // Pass REAL objectivesData
              onSaveObjective={handleSaveObjective} 
              onDeleteObjective={handleDeleteObjective}
              // Derive units from KRA data if kraState doesn't provide it
              units={kraState.data 
                ? Array.from(new Set((kraState.data as Kra[]).map(k => k.unit || 'Unknown')))
                    .filter(u => u !== 'Unknown')
                    .map(unitName => ({ id: unitName, name: unitName })) // Map to UnitData structure
                : []} 
              staffMembers={staffMembers} 
              onDataRefresh={handleRefreshAllData} // Pass the refresh handler
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

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <AssetsTab
              assets={assetState.data}
              addAsset={assetState.add}
              editAsset={assetState.update}
              deleteAsset={assetState.remove}
              error={assetState.error}
              onRetry={assetState.refresh}
              staffMembers={staffMembers} // Pass staffMembers
            />
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
};

export default Unit;
