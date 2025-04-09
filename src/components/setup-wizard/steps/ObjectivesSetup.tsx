import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Objective {
  id: string;
  name: string;
  status: string;
  assignee: string;
  duration: string;
  kpis: KPI[];
}

interface KPI {
  id: string;
  name: string;
  status: string;
  assignee: string;
  duration: string;
}

interface ObjectivesSetupProps {
  onComplete: (objectives: Objective[]) => void;
}

export const ObjectivesSetup: React.FC<ObjectivesSetupProps> = ({ onComplete }) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const addObjective = () => {
    const newObjective: Objective = {
      id: Date.now().toString(),
      name: '',
      status: 'Not Started',
      assignee: '',
      duration: '',
      kpis: []
    };
    setObjectives([...objectives, newObjective]);
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };

  const addKPI = (objectiveId: string) => {
    const newKPI: KPI = {
      id: Date.now().toString(),
      name: '',
      status: 'Not Started',
      assignee: '',
      duration: ''
    };
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { ...obj, kpis: [...obj.kpis, newKPI] }
        : obj
    ));
  };

  const removeKPI = (objectiveId: string, kpiId: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { ...obj, kpis: obj.kpis.filter(kpi => kpi.id !== kpiId) }
        : obj
    ));
  };

  const updateObjective = (id: string, field: keyof Objective, value: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === id 
        ? { ...obj, [field]: value }
        : obj
    ));
  };

  const updateKPI = (objectiveId: string, kpiId: string, field: keyof KPI, value: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? {
            ...obj,
            kpis: obj.kpis.map(kpi =>
              kpi.id === kpiId
                ? { ...kpi, [field]: value }
                : kpi
            )
          }
        : obj
    ));
  };

  const handleComplete = () => {
    onComplete(objectives);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configure Objectives and KRAs</h3>
        <p className="text-sm text-muted-foreground">
          Add your objectives and their associated KRAs. All fields are optional.
        </p>
      </div>

      <div className="space-y-4">
        {objectives.map((objective) => (
          <Card key={objective.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Objective</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(objective.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${objective.id}`}>Name</Label>
                  <Input
                    id={`name-${objective.id}`}
                    value={objective.name}
                    onChange={(e) => updateObjective(objective.id, 'name', e.target.value)}
                    placeholder="Enter objective name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`status-${objective.id}`}>Status</Label>
                  <Select
                    value={objective.status}
                    onValueChange={(value) => updateObjective(objective.id, 'status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`assignee-${objective.id}`}>Assignee</Label>
                  <Input
                    id={`assignee-${objective.id}`}
                    value={objective.assignee}
                    onChange={(e) => updateObjective(objective.id, 'assignee', e.target.value)}
                    placeholder="Enter assignee"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`duration-${objective.id}`}>Duration</Label>
                  <Input
                    id={`duration-${objective.id}`}
                    value={objective.duration}
                    onChange={(e) => updateObjective(objective.id, 'duration', e.target.value)}
                    placeholder="Enter duration"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">KRAs</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addKPI(objective.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add KRA
                  </Button>
                </div>

                {objective.kpis.map((kpi) => (
                  <Card key={kpi.id} className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h6 className="font-medium">KRA</h6>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKPI(objective.id, kpi.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`kpi-name-${kpi.id}`}>Name</Label>
                          <Input
                            id={`kpi-name-${kpi.id}`}
                            value={kpi.name}
                            onChange={(e) => updateKPI(objective.id, kpi.id, 'name', e.target.value)}
                            placeholder="Enter KRA name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`kpi-status-${kpi.id}`}>Status</Label>
                          <Select
                            value={kpi.status}
                            onValueChange={(value) => updateKPI(objective.id, kpi.id, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`kpi-assignee-${kpi.id}`}>Assignee</Label>
                          <Input
                            id={`kpi-assignee-${kpi.id}`}
                            value={kpi.assignee}
                            onChange={(e) => updateKPI(objective.id, kpi.id, 'assignee', e.target.value)}
                            placeholder="Enter assignee"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`kpi-duration-${kpi.id}`}>Duration</Label>
                          <Input
                            id={`kpi-duration-${kpi.id}`}
                            value={kpi.duration}
                            onChange={(e) => updateKPI(objective.id, kpi.id, 'duration', e.target.value)}
                            placeholder="Enter duration"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={addObjective}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Objective
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => onComplete([])}
        >
          Skip
        </Button>
        <Button
          onClick={handleComplete}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}; 