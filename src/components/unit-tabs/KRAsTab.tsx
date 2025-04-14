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
import { Kra, Kpi, User } from '@/types/kpi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

// --- Mock Data --- Placeholder - Replace with data fetching logic
const mockUsers: User[] = [
  { id: 1, name: 'Jane Smith', initials: 'JS', avatarUrl: 'https://via.placeholder.com/30/FFA500/FFFFFF?text=JS' },
  { id: 2, name: 'John Doe', initials: 'JD', avatarUrl: 'https://via.placeholder.com/30/007BFF/FFFFFF?text=JD' },
  { id: 3, name: 'Alice Green', initials: 'AG', avatarUrl: 'https://via.placeholder.com/30/28A745/FFFFFF?text=AG' },
];

const mockKpis1: Kpi[] = [
  { id: 'kpi1', name: 'Customer Satisfaction Score', target: 90, actual: 85, status: 'At Risk', comments: 'Survey results pending' },
  { id: 'kpi2', name: 'Support Response Time', target: 4, actual: 3.5, status: 'On Track' },
];

const mockKpis2: Kpi[] = [
  { id: 'kpi3', name: 'Market Share Percentage', target: 25, actual: 22, status: 'At Risk' },
];

const mockKpis3: Kpi[] = [
  { id: 'kpi4', name: 'New Feature Adoption Rate', target: 60, actual: 65, status: 'Completed' },
  { id: 'kpi5', name: 'Documentation Accuracy', target: 95, actual: 90, status: 'In Progress' },
];

const mockKras: Kra[] = [
  {
    id: 'kra1',
    title: 'Improve Customer Satisfaction',
    objective: 'Enhance User Experience',
    unit: 'Customer Service',
    startDate: '2023-01-01',
    targetDate: '2023-06-01',
    assignees: [mockUsers[0]],
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
    assignees: [mockUsers[1]],
    kpis: mockKpis2,
  },
   {
    id: 'kra3',
    title: 'Product Development Cycle',
    objective: 'Increase Efficiency',
    unit: 'Engineering',
    startDate: '2023-03-15',
    targetDate: '2023-09-15',
    assignees: [mockUsers[1], mockUsers[2]],
    kpis: mockKpis3,
    comments: 'Focus on agile practices adoption.'
  },
];
// --- End Mock Data ---

// Helper function to format dates (replace with a date library like date-fns or moment if available)
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // Format as DD MMM YYYY
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date';
  }
};

// Helper to calculate sums
const sumTargets = (kpis: Kpi[]) => kpis.reduce((sum, kpi) => sum + (Number(kpi.target) || 0), 0);
const sumActuals = (kpis: Kpi[]) => kpis.reduce((sum, kpi) => sum + (Number(kpi.actual) || 0), 0);

// Helper to determine overall KRA status based on KPIs
const getKraStatus = (kpis: Kpi[]): Kpi['status'] => {
  if (!kpis || kpis.length === 0) return 'Not Started';
  if (kpis.some(kpi => kpi.status === 'At Risk')) return 'At Risk';
  if (kpis.every(kpi => kpi.status === 'Completed')) return 'Completed';
   if (kpis.some(kpi => kpi.status === 'On Hold')) return 'On Hold';
  if (kpis.some(kpi => kpi.status === 'In Progress')) return 'In Progress';
  if (kpis.some(kpi => kpi.status === 'On Track')) return 'On Track'; // Should be before In Progress if desired
  return 'Not Started'; // Default
};

// Map KRA status to Badge variants
const getStatusVariant = (status: Kpi['status']): "default" | "secondary" | "destructive" | "outline" => {
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
  // kraId: string; // Filtering by KRA ID might be less common here, focus on properties
  department: string;
  status: string; // Matches Kpi['status'] | 'all'
  responsible: string; // Assignee name or ID
}

export const KRAsTab: React.FC = () => {
  // Use local state management
  const [kras, setKras] = useState<Kra[]>(mockKras); // Now kras and setKras are defined here
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKra, setEditingKra] = useState<Kra | undefined>(undefined);
  const [filters, setFilters] = useState<KraFiltersState>({
    department: 'all',
    status: 'all',
    responsible: 'all',
  });

  // Memoize derived state for filters
  const departments = useMemo(() => Array.from(new Set(kras.map(kra => kra.unit || 'Unknown'))).filter(d => d !== 'Unknown'), [kras]);
  const objectives = useMemo(() => Array.from(new Set(kras.map(kra => kra.objective || 'Unknown'))).filter(o => o !== 'Unknown'), [kras]);
  // units is effectively the same as departments in this data structure
  const units = departments;

  const responsibleUsers = useMemo(() => {
    const usersSet = new Set<string>();
    kras.forEach(kra => {
      // Check if assignees is an array and not empty before mapping
      if (Array.isArray(kra.assignees)) {
        kra.assignees.forEach(u => {
          // Also check if user and user.name exist (optional but safer)
          if (u && u.name) {
             usersSet.add(u.name)
          }
        });
      }
    });
    return Array.from(usersSet);
  }, [kras]); // Rerun when kras data changes
  const statuses: (Kpi['status'] | 'all')[] = ['all', 'Not Started', 'On Track', 'In Progress', 'At Risk', 'On Hold', 'Completed'];

  const handleFilterChange = useCallback((filterName: keyof KraFiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      department: 'all',
      status: 'all',
      responsible: 'all',
    });
  }, []);

  // Apply filters
  const filteredKras = useMemo(() => {
    return kras.filter(kra => {
      const departmentMatch = filters.department === 'all' || kra.unit === filters.department;
      const responsibleMatch = filters.responsible === 'all' || kra.assignees.some(u => u.name === filters.responsible); // Match by name
      const overallStatus = getKraStatus(kra.kpis);
      const statusMatch = filters.status === 'all' || overallStatus === filters.status;

      return departmentMatch && responsibleMatch && statusMatch;
    });
  }, [kras, filters]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingKra(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kra: Kra) => {
    setEditingKra(kra);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKra(undefined);
  };

  // Form Submission (from Modal)
  const handleFormSubmit = (formData: Kra) => {
    // TODO: Add actual API call for saving/updating data
    console.log("Submitting form data:", formData);
    if (editingKra) {
      // Update existing KRA
      setKras(prevKras => prevKras.map(k => k.id === formData.id ? formData : k));
      console.log("Updated KRA:", formData.id);
    } else {
      // Add new KRA (ensure temporary ID is assigned if backend doesn't return one immediately)
      const newKraWithId = { ...formData, id: formData.id || `kra_${Date.now()}` };
      setKras(prevKras => [...prevKras, newKraWithId]);
      console.log("Added new KRA:", newKraWithId.id);
    }
    handleCloseModal();
  };

  // Deletion Handler
  const handleDeleteKra = (kraId: string | number) => {
      // TODO: Implement confirmation dialog before deleting
      if (window.confirm(`Are you sure you want to delete KRA ${kraId}? This action cannot be undone.`)) {
        console.log("Deleting KRA:", kraId); // Replace with actual API call
        setKras(prevKras => prevKras.filter(k => k.id !== kraId));
        // TODO: Show toast notification on success/failure
      }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Key Result Areas</h2>
          <Button 
            className="flex items-center gap-2" 
            onClick={handleOpenAddModal}
          >
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
                <TabsTrigger value="kpis">KRAs</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
              
              <div className="bg-muted/50 p-4 rounded-md mb-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
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
                    <Label htmlFor="kra-status-filter">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger id="kra-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kra-responsible-filter">Responsible</Label>
                    <Select
                      value={filters.responsible}
                      onValueChange={(value) => handleFilterChange('responsible', value)}
                    >
                      <SelectTrigger id="kra-responsible-filter">
                        <SelectValue placeholder="All Responsible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Responsible</SelectItem>
                        {responsibleUsers.map(responsible => (
                          <SelectItem key={responsible} value={responsible}>
                            {responsible}
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
                        <TableHead className="w-[25%]">KRA</TableHead>
                        <TableHead>KPI(s)</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignees</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKras.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center">
                            No KRAs found matching the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredKras.map((kra) => {
                          const status = getKraStatus(kra.kpis);
                          const statusVariant = getStatusVariant(status);
                          return (
                            <TableRow key={kra.id}>
                              <TableCell className="font-medium align-top">
                                {kra.title}
                                <span className="block text-xs text-muted-foreground mt-0.5">{kra.objective}</span>
                              </TableCell>
                              <TableCell className="align-top text-xs">
                                {kra.kpis && kra.kpis.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {kra.kpis.map((kpi, index) => (
                                        <span key={kpi.id || index} className="block truncate" title={kpi.name}>
                                            {kpi.name}
                                        </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell className="align-top">{formatDate(kra.startDate)}</TableCell>
                              <TableCell className="align-top">{formatDate(kra.targetDate)}</TableCell>
                              <TableCell className="align-top">{sumTargets(kra.kpis)}</TableCell>
                              <TableCell className="align-top">{sumActuals(kra.kpis)}</TableCell>
                              <TableCell className="align-top">
                                <Badge variant={statusVariant}>{status}</Badge>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex -space-x-2 overflow-hidden">
                                  {kra.assignees.map(user => (
                                    <Tooltip key={user.id}>
                                      <TooltipTrigger asChild>
                                        <Avatar className="inline-block h-7 w-7 rounded-full ring-2 ring-background">
                                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                                          <AvatarFallback>{user.initials || user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>{user.name}</TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {kra.assignees.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                {kra.comments && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="max-w-xs">{kra.comments}</p></TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell className="text-right align-top">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(kra)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit KRA</TooltipContent>
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
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline">
                <KRATimelineTab kras={filteredKras} />
              </TabsContent>
              
              <TabsContent value="insights">
                <KRAInsightsTab kras={filteredKras} />
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
          objectives={objectives}
          units={units}
        />
      </div>
    </TooltipProvider>
  );
};

export default KRAsTab; 