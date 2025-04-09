import React from 'react';
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
import { Edit, Plus, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import KRATimelineTab from '@/components/KRATimelineTab';
import KRAInsightsTab from '@/components/KRAInsightsTab';
import { useKraState } from '@/hooks/useKraState';
import AddKraModal from './modals/AddKraModal';
import EditKpiModal from './modals/EditKpiModal';
import DeleteKpiModal from './modals/DeleteKpiModal';

export const KRAsTab: React.FC = () => {
  const {
    kras,
    kraFilters,
    setKraFilters,
    filteredKraItems,
    resetKraFilters,
    showAddKraModal,
    setShowAddKraModal,
    showEditKpiModal,
    setShowEditKpiModal,
    showDeleteKpiModal,
    setShowDeleteKpiModal,
    editingKpi,
    setEditingKpi,
    deletingKpi,
    setDeletingKpi,
    handleAddKra,
    handleEditKpi,
    handleDeleteKpi,
    newKra,
    setNewKra
  } = useKraState();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Key Result Areas</h2>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => setShowAddKraModal(true)}
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
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <div className="bg-muted/50 p-4 rounded-md mb-4">
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="kra-filter">KRA</Label>
                  <Select 
                    defaultValue={kraFilters.kraId} 
                    onValueChange={(value) => {
                      setKraFilters({...kraFilters, kraId: value});
                    }}
                  >
                    <SelectTrigger id="kra-filter">
                      <SelectValue placeholder="Filter by KRA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All KRAs</SelectItem>
                      {kras.map(kra => (
                        <SelectItem key={kra.id} value={kra.id}>
                          {kra.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="kra-department-filter">Department</Label>
                  <Select 
                    defaultValue={kraFilters.department}
                    onValueChange={(value) => {
                      setKraFilters({...kraFilters, department: value});
                    }}
                  >
                    <SelectTrigger id="kra-department-filter">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {Array.from(new Set(kras.map(kra => kra.department))).map(department => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="kpi-status-filter">KPI Status</Label>
                  <Select 
                    defaultValue={kraFilters.kpiStatus}
                    onValueChange={(value) => {
                      setKraFilters({...kraFilters, kpiStatus: value});
                    }}
                  >
                    <SelectTrigger id="kpi-status-filter">
                      <SelectValue placeholder="Filter by KPI status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="on-track">On Track</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="behind">Behind</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="kra-responsible-filter">Responsible</Label>
                  <Select 
                    defaultValue={kraFilters.responsible}
                    onValueChange={(value) => {
                      setKraFilters({...kraFilters, responsible: value});
                    }}
                  >
                    <SelectTrigger id="kra-responsible-filter">
                      <SelectValue placeholder="Filter by responsible" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Responsible</SelectItem>
                      {Array.from(new Set(kras.map(kra => kra.responsible))).map(responsible => (
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
                  onClick={resetKraFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
            
            <TabsContent value="kpis">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">KRA</TableHead>
                    <TableHead>KPI</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKraItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No KPIs found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKraItems.map(({ kra, kpi, index }) => (
                      <TableRow key={`${kra.id}-${kpi.id}`}>
                        {index === 0 ? (
                          <TableCell 
                            className="font-medium border-r" 
                            rowSpan={kra.kpis.filter(k => 
                              kraFilters.kpiStatus === 'all' || k.status === kraFilters.kpiStatus
                            ).length || 1}
                            style={{ 
                              position: 'relative',
                              verticalAlign: 'top',
                              paddingTop: '1rem'
                            }}
                          >
                            <div className="mb-1">
                              <h3 className="text-lg font-semibold">{kra.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {kra.objectiveName} • {kra.department} • {kra.responsible}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                              <div className="flex items-center justify-between">
                                <StatusBadge status={kra.status} />
                                <span className="text-sm">{kra.progress}%</span>
                              </div>
                              <Progress value={kra.progress} className="w-full" />
                            </div>
                          </TableCell>
                        ) : null}
                        <TableCell className="font-medium">{kpi.name}</TableCell>
                        <TableCell>{kpi.startDate.toLocaleDateString()}</TableCell>
                        <TableCell>{kpi.date.toLocaleDateString()}</TableCell>
                        <TableCell>{kpi.target}</TableCell>
                        <TableCell>{kpi.actual}</TableCell>
                        <TableCell>
                          <StatusBadge status={kpi.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingKpi({...kpi, kraId: kra.id});
                                setShowEditKpiModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setDeletingKpi({...kpi, kraId: kra.id});
                                setShowDeleteKpiModal(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
      
      <AddKraModal 
        open={showAddKraModal}
        onOpenChange={setShowAddKraModal}
        newKra={newKra}
        setNewKra={setNewKra}
        onSubmit={handleAddKra}
      />
      
      {editingKpi && (
        <EditKpiModal 
          open={showEditKpiModal}
          onOpenChange={setShowEditKpiModal}
          kpi={editingKpi}
          setKpi={setEditingKpi}
          onSubmit={handleEditKpi}
        />
      )}
      
      {deletingKpi && (
        <DeleteKpiModal 
          open={showDeleteKpiModal}
          onOpenChange={setShowDeleteKpiModal}
          kpi={deletingKpi}
          onConfirm={handleDeleteKpi}
        />
      )}
    </div>
  );
};

export default KRAsTab; 