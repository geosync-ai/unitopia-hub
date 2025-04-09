import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// KRA type likely not needed here as we use KRAInput
// import { KRA } from '@/types';

// Define the input structure for a KRA during setup
interface KRAInput {
  id: string;
  name: string;
  department: string;
  responsible: string;
  startDate: string;
  endDate: string;
  kpis: KPIInput[];
}

// Define the input structure for a KPI during setup
interface KPIInput {
  id: string;
  name: string;
  target: string;
  actual: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  description: string;
  notes: string;
}

// Define the input structure for an Objective during setup
interface ObjectiveInput {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface KRASetupProps {
  onComplete: (kras: KRAInput[]) => void;
}

// Correct the component definition
export const ObjectivesSetup: React.FC<KRASetupProps> = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState('objectives');
  const [objectives, setObjectives] = useState<ObjectiveInput[]>([]);
  const [kras, setKras] = useState<KRAInput[]>([]);
  const [expandedKraId, setExpandedKraId] = useState<string | null>(null);

  // Add a new objective
  const addObjective = () => {
    const newObjective: ObjectiveInput = {
      id: `objective-${Date.now()}`,
      name: '',
      description: '',
      startDate: '',
      endDate: ''
    };
    setObjectives([...objectives, newObjective]);
  };

  // Remove an objective
  const removeObjective = (id: string) => {
    setObjectives(objectives.filter(objective => objective.id !== id));
  };

  // Update an objective
  const updateObjective = (id: string, field: keyof ObjectiveInput, value: string) => {
    setObjectives(objectives.map(objective => 
      objective.id === id 
        ? { ...objective, [field]: value }
        : objective
    ));
  };

  // Add a new KRA
  const addKra = () => {
    const newKra: KRAInput = {
      id: `kra-setup-${Date.now()}`,
      name: '',
      department: '',
      responsible: '',
      startDate: '',
      endDate: '',
      kpis: []
    };
    setKras([...kras, newKra]);
  };

  // Remove a KRA
  const removeKra = (id: string) => {
    setKras(kras.filter(kra => kra.id !== id));
  };

  // Update a KRA
  const updateKra = (id: string, field: keyof KRAInput, value: string) => {
    setKras(kras.map(kra => 
      kra.id === id 
        ? { ...kra, [field]: value }
        : kra
    ));
  };

  // Add a KPI to a KRA
  const addKpi = (kraId: string) => {
    const newKpi: KPIInput = {
      id: `kpi-${Date.now()}`,
      name: '',
      target: '',
      actual: '',
      status: 'on-track',
      description: '',
      notes: ''
    };
    
    setKras(kras.map(kra => 
      kra.id === kraId 
        ? { ...kra, kpis: [...kra.kpis, newKpi] }
        : kra
    ));
  };

  // Remove a KPI from a KRA
  const removeKpi = (kraId: string, kpiId: string) => {
    setKras(kras.map(kra => 
      kra.id === kraId 
        ? { ...kra, kpis: kra.kpis.filter(kpi => kpi.id !== kpiId) }
        : kra
    ));
  };

  // Update a KPI
  const updateKpi = (kraId: string, kpiId: string, field: keyof KPIInput, value: string) => {
    setKras(kras.map(kra => 
      kra.id === kraId 
        ? { 
            ...kra, 
            kpis: kra.kpis.map(kpi => 
              kpi.id === kpiId 
                ? { ...kpi, [field]: value }
                : kpi
            )
          }
        : kra
    ));
  };

  // Toggle KRA expansion
  const toggleKraExpansion = (kraId: string) => {
    setExpandedKraId(expandedKraId === kraId ? null : kraId);
  };

  // Handle completion
  const handleComplete = () => {
    // Link KRAs to objectives if available
    const krasWithObjectives = kras.map(kra => {
      // If we have objectives, link the first one as default
      if (objectives.length > 0) {
        return {
          ...kra,
          objectiveId: objectives[0].id,
          objectiveName: objectives[0].name
        };
      }
      return kra;
    });
    
    onComplete(krasWithObjectives);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configure Objectives, KRAs, and KPIs</h3>
        <p className="text-sm text-muted-foreground">
          Define your unit's objectives, key result areas (KRAs), and key performance indicators (KPIs)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="kras">KRAs & KPIs</TabsTrigger>
        </TabsList>
        
        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-4">
          <div className="space-y-4">
            {objectives.map((objective) => (
              <Card key={objective.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Objective Details</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjective(objective.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Objective Name */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`name-${objective.id}`}>Objective Name</Label>
                      <Input
                        id={`name-${objective.id}`}
                        value={objective.name}
                        onChange={(e) => updateObjective(objective.id, 'name', e.target.value)}
                        placeholder="e.g., Enhance User Experience"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`description-${objective.id}`}>Description</Label>
                      <Input
                        id={`description-${objective.id}`}
                        value={objective.description}
                        onChange={(e) => updateObjective(objective.id, 'description', e.target.value)}
                        placeholder="Describe the objective"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${objective.id}`}>Start Date</Label>
                      <Input
                        id={`startDate-${objective.id}`}
                        type="date"
                        value={objective.startDate}
                        onChange={(e) => updateObjective(objective.id, 'startDate', e.target.value)}
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`endDate-${objective.id}`}>End Date</Label>
                      <Input
                        id={`endDate-${objective.id}`}
                        type="date"
                        value={objective.endDate}
                        onChange={(e) => updateObjective(objective.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addObjective} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </TabsContent>
        
        {/* KRAs & KPIs Tab */}
        <TabsContent value="kras" className="space-y-4">
          <div className="space-y-4">
            {kras.map((kra) => (
              <Card key={kra.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">KRA Details</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKraExpansion(kra.id)}
                      >
                        {expandedKraId === kra.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeKra(kra.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KRA Name */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`name-${kra.id}`}>KRA Name</Label>
                      <Input
                        id={`name-${kra.id}`}
                        value={kra.name}
                        onChange={(e) => updateKra(kra.id, 'name', e.target.value)}
                        placeholder="e.g., Improve Customer Satisfaction"
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <Label htmlFor={`department-${kra.id}`}>Department</Label>
                      <Input
                        id={`department-${kra.id}`}
                        value={kra.department}
                        onChange={(e) => updateKra(kra.id, 'department', e.target.value)}
                        placeholder="e.g., Customer Service"
                      />
                    </div>

                    {/* Responsible */}
                    <div className="space-y-2">
                      <Label htmlFor={`responsible-${kra.id}`}>Responsible</Label>
                      <Input
                        id={`responsible-${kra.id}`}
                        value={kra.responsible}
                        onChange={(e) => updateKra(kra.id, 'responsible', e.target.value)}
                        placeholder="e.g., Jane Smith"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${kra.id}`}>Start Date</Label>
                      <Input
                        id={`startDate-${kra.id}`}
                        type="date"
                        value={kra.startDate}
                        onChange={(e) => updateKra(kra.id, 'startDate', e.target.value)}
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`endDate-${kra.id}`}>End Date</Label>
                      <Input
                        id={`endDate-${kra.id}`}
                        type="date"
                        value={kra.endDate}
                        onChange={(e) => updateKra(kra.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* KPIs Section - Only shown when expanded */}
                  {expandedKraId === kra.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium">Key Performance Indicators (KPIs)</h5>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addKpi(kra.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add KPI
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {kra.kpis.map((kpi) => (
                          <Card key={kpi.id} className="p-3">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h6 className="font-medium">KPI Details</h6>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeKpi(kra.id, kpi.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* KPI Name */}
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`kpi-name-${kpi.id}`}>KPI Name</Label>
                                  <Input
                                    id={`kpi-name-${kpi.id}`}
                                    value={kpi.name}
                                    onChange={(e) => updateKpi(kra.id, kpi.id, 'name', e.target.value)}
                                    placeholder="e.g., Customer Satisfaction Score"
                                  />
                                </div>

                                {/* Target */}
                                <div className="space-y-2">
                                  <Label htmlFor={`kpi-target-${kpi.id}`}>Target</Label>
                                  <Input
                                    id={`kpi-target-${kpi.id}`}
                                    value={kpi.target}
                                    onChange={(e) => updateKpi(kra.id, kpi.id, 'target', e.target.value)}
                                    placeholder="e.g., 90%"
                                  />
                                </div>

                                {/* Actual */}
                                <div className="space-y-2">
                                  <Label htmlFor={`kpi-actual-${kpi.id}`}>Actual</Label>
                                  <Input
                                    id={`kpi-actual-${kpi.id}`}
                                    value={kpi.actual}
                                    onChange={(e) => updateKpi(kra.id, kpi.id, 'actual', e.target.value)}
                                    placeholder="e.g., 85%"
                                  />
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                  <Label htmlFor={`kpi-status-${kpi.id}`}>Status</Label>
                                  <Select 
                                    value={kpi.status} 
                                    onValueChange={(value) => updateKpi(kra.id, kpi.id, 'status', value)}
                                  >
                                    <SelectTrigger id={`kpi-status-${kpi.id}`}>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="on-track">On Track</SelectItem>
                                      <SelectItem value="at-risk">At Risk</SelectItem>
                                      <SelectItem value="behind">Behind</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Description */}
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`kpi-description-${kpi.id}`}>Description</Label>
                                  <Input
                                    id={`kpi-description-${kpi.id}`}
                                    value={kpi.description}
                                    onChange={(e) => updateKpi(kra.id, kpi.id, 'description', e.target.value)}
                                    placeholder="Describe the KPI"
                                  />
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`kpi-notes-${kpi.id}`}>Notes</Label>
                                  <Input
                                    id={`kpi-notes-${kpi.id}`}
                                    value={kpi.notes}
                                    onChange={(e) => updateKpi(kra.id, kpi.id, 'notes', e.target.value)}
                                    placeholder="Additional notes"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addKra} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add KRA
          </Button>
        </TabsContent>
      </Tabs>

      <Button onClick={handleComplete} className="w-full">
        Confirm and Continue
      </Button>
    </div>
  );
}; // Ensure the component closing brace is correct 