import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
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
}

interface KRASetupProps {
  onComplete: (kras: KRAInput[]) => void;
}

// Correct the component definition
export const ObjectivesSetup: React.FC<KRASetupProps> = ({ onComplete }) => {
  const [kras, setKras] = useState<KRAInput[]>([]);

  const addKra = () => {
    const newKra: KRAInput = {
      id: `kra-setup-${Date.now()}`,
      name: '',
      department: '',
      responsible: '',
      startDate: '',
      endDate: ''
    };
    setKras([...kras, newKra]);
  };

  const removeKra = (id: string) => {
    setKras(kras.filter(kra => kra.id !== id));
  };

  const updateKra = (id: string, field: keyof KRAInput, value: string) => {
    setKras(kras.map(kra => 
      kra.id === id 
        ? { ...kra, [field]: value }
        : kra
    ));
  };

  const handleComplete = () => {
    onComplete(kras);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configure Key Result Areas (KRAs)</h3>
        <p className="text-sm text-muted-foreground">
          Define the primary KRAs for your unit. Objective linking and KPIs will be managed later.
        </p>
      </div>

      <div className="space-y-4">
        {kras.map((kra) => (
          <Card key={kra.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">KRA Details</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKra(kra.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addKra} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add KRA
      </Button>

      <Button onClick={handleComplete} className="w-full">
        Confirm KRAs and Continue
      </Button>
    </div>
  );
}; // Ensure the component closing brace is correct 