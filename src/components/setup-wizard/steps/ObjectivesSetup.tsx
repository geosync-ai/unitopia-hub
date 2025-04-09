import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Objective {
  id: string;
  title: string;
  kpis: string[];
  tasks: string[];
}

interface ObjectivesSetupProps {
  onComplete: (objectives: Objective[]) => void;
}

export const ObjectivesSetup: React.FC<ObjectivesSetupProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: '1', title: '', kpis: [''], tasks: [''] }
  ]);

  const handleAddObjective = () => {
    setObjectives([
      ...objectives,
      {
        id: Date.now().toString(),
        title: '',
        kpis: [''],
        tasks: ['']
      }
    ]);
  };

  const handleRemoveObjective = (id: string) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter(obj => obj.id !== id));
    }
  };

  const handleUpdateObjective = (id: string, field: keyof Objective, value: any) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === id) {
        return { ...obj, [field]: value };
      }
      return obj;
    }));
  };

  const handleAddKPI = (objectiveId: string) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        return { ...obj, kpis: [...obj.kpis, ''] };
      }
      return obj;
    }));
  };

  const handleRemoveKPI = (objectiveId: string, index: number) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        const newKpis = [...obj.kpis];
        newKpis.splice(index, 1);
        return { ...obj, kpis: newKpis };
      }
      return obj;
    }));
  };

  const handleAddTask = (objectiveId: string) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        return { ...obj, tasks: [...obj.tasks, ''] };
      }
      return obj;
    }));
  };

  const handleRemoveTask = (objectiveId: string, index: number) => {
    setObjectives(objectives.map(obj => {
      if (obj.id === objectiveId) {
        const newTasks = [...obj.tasks];
        newTasks.splice(index, 1);
        return { ...obj, tasks: newTasks };
      }
      return obj;
    }));
  };

  const handleComplete = () => {
    // Validate that all required fields are filled
    const isValid = objectives.every(obj => 
      obj.title.trim() !== '' && 
      obj.kpis.some(kpi => kpi.trim() !== '') &&
      obj.tasks.some(task => task.trim() !== '')
    );

    if (isValid) {
      onComplete(objectives);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configure Objectives</h3>
        <p className="text-sm text-muted-foreground">
          Define your unit's objectives, KPIs, and associated tasks
        </p>
      </div>

      <div className="space-y-4">
        {objectives.map((objective, index) => (
          <Card key={objective.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Objective {index + 1}</Label>
                {objectives.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveObjective(objective.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Input
                placeholder="Enter objective title"
                value={objective.title}
                onChange={(e) => handleUpdateObjective(objective.id, 'title', e.target.value)}
              />

              <div className="space-y-2">
                <Label>KPIs</Label>
                {objective.kpis.map((kpi, kpiIndex) => (
                  <div key={kpiIndex} className="flex gap-2">
                    <Input
                      placeholder="Enter KPI"
                      value={kpi}
                      onChange={(e) => {
                        const newKpis = [...objective.kpis];
                        newKpis[kpiIndex] = e.target.value;
                        handleUpdateObjective(objective.id, 'kpis', newKpis);
                      }}
                    />
                    {objective.kpis.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveKPI(objective.id, kpiIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddKPI(objective.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add KPI
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Tasks</Label>
                {objective.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="flex gap-2">
                    <Input
                      placeholder="Enter task"
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...objective.tasks];
                        newTasks[taskIndex] = e.target.value;
                        handleUpdateObjective(objective.id, 'tasks', newTasks);
                      }}
                    />
                    {objective.tasks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTask(objective.id, taskIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTask(objective.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={handleAddObjective}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Objective
        </Button>

        <Button
          onClick={handleComplete}
          className="w-full"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
}; 