// src/components/kpi/KpiInputBlock.tsx
import React, { useState, useEffect } from 'react';
import { Kpi, User } from '@/types/kpi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StaffMember } from '@/types/staff';

interface KpiInputBlockProps {
  kpiIndex: number;
  formData: Partial<Kpi>;
  onChange: (field: keyof Kpi, value: any) => void;
  onRemove: (index: number) => void;
  isOnlyBlock?: boolean; // Optional: To disable remove on the last block
  users?: User[]; // Add users prop for assignee selection
  staffMembers?: StaffMember[]; // Add staffMembers prop
}

// --- Assignee Selector Component (copied/adapted from KraFormSection) ---
const AssigneeSelector: React.FC<{
    staffMembers: StaffMember[]; // Use StaffMember
    selectedAssignees: User[]; // Keep User[] for formData.assignees for now, or update Kpi type
    onChange: (assignees: User[]) => void;
}> = ({ staffMembers = [], selectedAssignees = [], onChange }) => {
  const [open, setOpen] = React.useState(false);

  // Convert StaffMember to User format if needed for selection/storage
  // This depends on whether Kpi type's assignees is User[] or StaffMember[]
  // Assuming Kpi uses User[] for now based on previous code.
  const handleSelect = (staff: StaffMember) => {
    // Convert StaffMember to User if necessary before adding
    const userToAdd: User = { // This conversion might be lossy or need adjustments
      id: staff.id,
      name: staff.name,
      email: staff.email,
      initials: staff.name.split(' ').map(n => n[0]).join(''), // Basic initials generation
      // Add other fields if User type requires them and they exist on StaffMember
    };

    if (!selectedAssignees.find(u => u.id === userToAdd.id)) {
      onChange([...selectedAssignees, userToAdd]);
    }
    setOpen(false);
  };

  const handleRemove = (userId: string | number) => {
    onChange(selectedAssignees.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-2">
       <div className="flex flex-wrap gap-1">
        {/* Display selected assignees (assuming User type) */}
        {selectedAssignees.map((user) => (
          <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pr-1 h-6">
            <Avatar className="h-5 w-5 mr-1">
              {/* Use user.avatarUrl if available, else fallback */}
              <AvatarImage src={(user as any).avatarUrl} alt={user.name} />
              <AvatarFallback>{user.initials || user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{user.name}</span>
            <button
              onClick={() => handleRemove(user.id)}
              className="ml-0.5 rounded-full outline-none ring-offset-background focus:ring-1 focus:ring-ring focus:ring-offset-1"
              onKeyDown={(e) => { if (e.key === "Enter") { handleRemove(user.id); } }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              aria-label={`Remove ${user.name}`}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-xs"
          >
            {selectedAssignees.length > 0 ? `${selectedAssignees.length} selected` : "Select Assignees..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search staff..." className="text-xs" />
            <CommandList>
              <CommandEmpty>No staff found.</CommandEmpty>
              <CommandGroup>
                {/* List StaffMembers for selection */}
                {staffMembers.map((staff) => (
                  <CommandItem
                    key={staff.id}
                    value={staff.name}
                    onSelect={() => handleSelect(staff)}
                    disabled={!!selectedAssignees.find(u => u.id === staff.id)}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                       <Avatar className="h-5 w-5">
                         {/* Use staff.pictureUrl if available, else fallback */}
                        <AvatarImage src={staff.pictureUrl} alt={staff.name} />
                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {staff.name} ({staff.title})
                    </div>
                    <Check
                      className={cn("h-3 w-3", selectedAssignees.find(u => u.id === staff.id) ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
// --- End Assignee Selector ---

// Helper function to get quarter from date string (YYYY-MM-DD)
const getQuarter = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const month = date.getMonth(); // 0-indexed (0 = January)
    if (month <= 2) return 'Q1';
    if (month <= 5) return 'Q2';
    if (month <= 8) return 'Q3';
    return 'Q4';
  } catch {
    return '-';
  }
};

const KpiInputBlock: React.FC<KpiInputBlockProps> = ({ kpiIndex, formData, onChange, onRemove, isOnlyBlock, users = [], staffMembers = [] }) => {
  const statuses: Kpi['status'][] = ['Not Started', 'On Track', 'In Progress', 'At Risk', 'On Hold', 'Completed'];
  const [calculatedQuarter, setCalculatedQuarter] = useState<string>(() => getQuarter(formData.targetDate));

  // Update quarter when targetDate changes
  useEffect(() => {
    setCalculatedQuarter(getQuarter(formData.targetDate));
  }, [formData.targetDate]);

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

        {/* KPI Start Date & Target Date (Side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`kpi-start-date-${kpiIndex}`}>Start Date</Label>
            <Input
              id={`kpi-start-date-${kpiIndex}`}
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => onChange('startDate', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`kpi-target-date-${kpiIndex}`}>Target Date</Label>
            <div className="flex items-center gap-2">
              <Input
                id={`kpi-target-date-${kpiIndex}`}
                type="date"
                value={formData.targetDate || ''}
                onChange={(e) => onChange('targetDate', e.target.value)}
                min={formData.startDate || ''} // Prevent target date before start date
                className="flex-1"
              />
              {/* Display Calculated Quarter */}
              <Badge variant="outline" className="h-9 px-3 whitespace-nowrap">
                  {calculatedQuarter}
              </Badge>
            </div>
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

        {/* Add Assignee Selector */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-assignees-${kpiIndex}`}>Assignees</Label>
          <AssigneeSelector
            staffMembers={staffMembers} // Pass staffMembers list
            selectedAssignees={formData.assignees || []} // Assignees are still User[] in Kpi type for now
            onChange={(selected) => onChange('assignees', selected)}
          />
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