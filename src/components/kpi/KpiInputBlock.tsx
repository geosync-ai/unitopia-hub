// src/components/kpi/KpiInputBlock.tsx
import React from 'react';
import { Kpi } from '@/types/kpi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

interface KpiInputBlockProps {
  kpiIndex: number;
  formData: Partial<Kpi>;
  onChange: (field: keyof Kpi, value: any) => void;
  onRemove: (index: number) => void;
  isOnlyBlock?: boolean; // Optional: To disable remove on the last block
}

const KpiInputBlock: React.FC<KpiInputBlockProps> = ({ kpiIndex, formData, onChange, onRemove, isOnlyBlock }) => {
  const statuses: Kpi['status'][] = ['Not Started', 'On Track', 'In Progress', 'At Risk', 'On Hold', 'Completed'];

  return (
    <Card className="bg-muted/30 border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-base font-medium">KPI #{kpiIndex + 1}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(kpiIndex)}
          disabled={isOnlyBlock} // Disable remove if it's the only block
          aria-label="Remove KPI"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* KPI Name */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-name-${kpiIndex}`}>KPI Name *</Label>
          <Input
            id={`kpi-name-${kpiIndex}`}
            value={formData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Average Resolution Time"
            required
          />
        </div>

        {/* Target & Actual (Side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`kpi-target-${kpiIndex}`}>Target *</Label>
            <Input
              id={`kpi-target-${kpiIndex}`}
              type="number"
              value={formData.target ?? ''} // Use nullish coalescing for optional number
              onChange={(e) => onChange('target', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 95"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`kpi-actual-${kpiIndex}`}>Actual</Label>
            <Input
              id={`kpi-actual-${kpiIndex}`}
              type="number"
              value={formData.actual ?? ''} // Use nullish coalescing
              onChange={(e) => onChange('actual', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 92"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-status-${kpiIndex}`}>Status *</Label>
          <Select
            value={formData.status || 'Not Started'} // Default to 'Not Started'
            onValueChange={(value) => onChange('status', value as Kpi['status'])}
            required
          >
            <SelectTrigger id={`kpi-status-${kpiIndex}`}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Description Textarea */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-description-${kpiIndex}`}>Description (Optional)</Label>
          <Textarea
            id={`kpi-description-${kpiIndex}`}
            value={formData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe this KPI..."
            rows={2}
          />
        </div>

        {/* Comments Textarea */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-comments-${kpiIndex}`}>Comments (Optional)</Label>
          <Textarea
            id={`kpi-comments-${kpiIndex}`}
            value={formData.comments || ''}
            onChange={(e) => onChange('comments', e.target.value)}
            placeholder="Add any notes specific to this KPI..."
            rows={2}
          />
        </div>

      </CardContent>
    </Card>
  );
};

export default KpiInputBlock; 