import React, { useEffect } from 'react';
import { Kra, User, Objective } from '@/types/kpi';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Assuming a DatePicker component exists or using Input type="date" for now
// import DatePicker from '@/components/ui/date-picker';
// Assuming a MultiSelect component exists for assignees or using a placeholder
// import MultiSelect from '@/components/ui/multi-select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // For conditional classes
import { Badge } from "@/components/ui/badge";
import { StaffMember } from '@/types/staff'; // Import StaffMember
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'; // Corrected auth hook import
import { useStaffByDepartment } from '@/hooks/useStaffByDepartment'; // Import hook to get user's department

interface KraFormSectionProps {
  formData: Partial<Kra>;
  onChange: (field: keyof Kra, value: any) => void;
  users?: User[]; // List of users for assignee selection
  staffMembers?: StaffMember[]; // Add staffMembers prop
  objectives?: Objective[]; // List of objectives for dropdown
  units?: { id: string; name: string }[]; // Now expects { id: "Dept Name", name: "Dept Name" }
  existingKraTitles?: string[]; // Add prop for existing titles
  isAddingNew: boolean; // Add prop to know if we are adding a new KRA
}

// Simple MultiSelectChip component placeholder for Assignees
const AssigneeSelector: React.FC<{ users: User[]; selectedUsers: User[]; onChange: (users: User[]) => void }> = ({ users, selectedUsers, onChange }) => {
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
       <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pr-1">
            <Avatar className="h-5 w-5 mr-1">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.initials || user.name[0]}</AvatarFallback>
            </Avatar>
            {user.name}
            <button
              onClick={() => handleRemove(user.id)}
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRemove(user.id);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
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
            className="w-full justify-between"
          >
            Select Assignees...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name} // Use name for search/filtering
                    onSelect={() => handleSelect(user)}
                    disabled={!!selectedUsers.find(u => u.id === user.id)} // Disable if already selected
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                       <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.initials || user.name[0]}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedUsers.find(u => u.id === user.id) ? "opacity-100" : "opacity-0"
                      )}
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


const KraFormSection: React.FC<KraFormSectionProps> = ({
  formData,
  onChange,
  users = [],
  staffMembers = [], // Add default value
  objectives = [],
  units = [], // Receives derived department list
  existingKraTitles = [], // Accept prop
  isAddingNew, // Destructure the new prop
}) => {

  const { user } = useSupabaseAuth(); // Corrected auth hook usage
  // Get current user's department directly from the hook
  const { currentUserDepartment } = useStaffByDepartment(); 

  // Effect to pre-fill unit (department) when adding a new KRA
  useEffect(() => {
    console.log("[KraFormSection useEffect] Running. isAddingNew:", isAddingNew);
    if (isAddingNew && currentUserDepartment && units.length > 0) {
      console.log("[KraFormSection useEffect] User department:", currentUserDepartment);
      // Check if the unit field is currently empty before setting
      // Use 'unit' field which should store the department name string
      if (!formData.unit) { 
         console.log(`[KraFormSection useEffect] Setting unit to: ${currentUserDepartment}`);
         // Set the department name string directly
         onChange('unit', currentUserDepartment); 
      }
    }
    // Update dependencies
  }, [isAddingNew, currentUserDepartment, units, onChange, formData.unit]); 

  // Helper to handle date input changes (assuming YYYY-MM-DD format)
  const handleDateChange = (field: 'startDate' | 'targetDate', value: string) => {
    // Basic validation or formatting can be added here if needed
    onChange(field, value);
  };

  const [inputValue, setInputValue] = React.useState(formData.title || '');

  // Reset input value when formData.title changes (e.g., when editing)
  useEffect(() => {
      setInputValue(formData.title || '');
  }, [formData.title]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">KRA Information</h3>
      {/* KRA Title Combobox */}
      <div className="grid gap-1.5">
        <Label htmlFor="kra-title">KRA Title *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-label="Select or type a KRA title"
              className={cn(
                "w-full justify-between",
                !formData.title && "text-muted-foreground"
              )}
            >
              {formData.title || "Select or type a KRA title..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command 
              // Filter based on typed value, but allow typing new values
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase())) return 1
                return 0
              }}
            >
              <CommandInput
                placeholder="Search or type new title..."
                value={inputValue}
                onValueChange={(search) => {
                   setInputValue(search);
                   onChange('title', search);
                }}
              />
              <CommandList>
                <CommandEmpty>No existing KRAs found. Type to create new.</CommandEmpty>
                <CommandGroup>
                  {existingKraTitles.map((title) => (
                    <CommandItem
                      key={title}
                      value={title}
                      onSelect={(currentValue) => {
                        // Also trim when selecting an existing value to be safe
                        const trimmedValue = currentValue.trim();
                        onChange('title', trimmedValue === formData.title ? '' : trimmedValue)
                        // Optionally close popover on select: document.getElementById('kra-title')?.parentElement?.parentElement?.['aria-expanded'] = false;
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.title === title ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Objective & Unit (Side by side on larger screens) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Objective Dropdown */}
        <div className="grid gap-1.5">
          <Label htmlFor="kra-objective">Objective *</Label>
          <Select
            value={formData.objectiveId?.toString() || ''}
            onValueChange={(value) => onChange('objectiveId', value)}
            required
          >
            <SelectTrigger id="kra-objective">
              <SelectValue placeholder="Select an objective" />
            </SelectTrigger>
            <SelectContent>
              {objectives.length > 0 ? (
                objectives.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id.toString()}>{obj.title}</SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No objectives defined.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Unit Dropdown (now Departments) */}
        <div className="grid gap-1.5">
          <Label htmlFor="kra-unit">Unit / Department *</Label>
          <Select
            // Use unit field (department name string) for value
            value={formData.unit || ''} 
            onValueChange={(value) => onChange('unit', value)}
            disabled={isAddingNew && !!currentUserDepartment} // Disable if adding new and we have current department
            required
          >
            <SelectTrigger id="kra-unit">
              <SelectValue placeholder="Select a unit/department" />
            </SelectTrigger>
            <SelectContent>
              {units.length > 0 ? (
                // units prop now contains { id: "Dept Name", name: "Dept Name" }
                units.map((unit) => (
                  // Use unit.name (department name) for key and value
                  <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No units/departments defined.</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignees Multi-select - REMOVED */}
      {/* <div className="grid gap-1.5">
        <Label htmlFor="kra-assignees">Assignees</Label>
        <AssigneeSelector
           users={users}
           selectedUsers={formData.assignees || []}
           onChange={(selected) => onChange('assignees', selected)}
         />
      </div> */}

       {/* KRA Comments */}
       <div className="grid gap-1.5">
        <Label htmlFor="kra-comments">Comments (Optional)</Label>
        <Textarea
          id="kra-comments"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Add any overall notes for this KRA..."
          rows={3}
        />
      </div>

    </div>
  );
};

export default KraFormSection; 