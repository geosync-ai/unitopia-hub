// src/components/kpi/KpiInputBlock.tsx
import React from 'react';
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

interface KpiInputBlockProps {
  kpiIndex: number;
  formData: Partial<Kpi>;
  onChange: (field: keyof Kpi, value: any) => void;
  onRemove: (index: number) => void;
  isOnlyBlock?: boolean; // Optional: To disable remove on the last block
  users?: User[]; // Add users prop for assignee selection
}

// --- Assignee Selector Component (copied/adapted from KraFormSection) ---
const AssigneeSelector: React.FC<{ users: User[]; selectedUsers: User[]; onChange: (users: User[]) => void }> = ({ users = [], selectedUsers = [], onChange }) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      onChange([...selectedUsers, user]);
    }
    setOpen(false);
  };

  const handleRemove = (userId: string | number) => {
    onChange(selectedUsers.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-2">
       <div className="flex flex-wrap gap-1">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pr-1 h-6">
            <Avatar className="h-5 w-5 mr-1">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
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
            {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "Select Assignees..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search user..." className="text-xs" />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => handleSelect(user)}
                    disabled={!!selectedUsers.find(u => u.id === user.id)}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                       <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.initials || user.name[0]}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                    <Check
                      className={cn("h-3 w-3", selectedUsers.find(u => u.id === user.id) ? "opacity-100" : "opacity-0")}
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

const KpiInputBlock: React.FC<KpiInputBlockProps> = ({ kpiIndex, formData, onChange, onRemove, isOnlyBlock, users = [] }) => {
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
            <Input
              id={`kpi-target-date-${kpiIndex}`}
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => onChange('targetDate', e.target.value)}
              min={formData.startDate || ''} // Prevent target date before start date
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

        {/* Add Assignee Selector */}
        <div className="grid gap-1.5">
          <Label htmlFor={`kpi-assignees-${kpiIndex}`}>Assignees</Label>
          <AssigneeSelector
            users={users} // Pass users list
            selectedUsers={formData.assignees || []}
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