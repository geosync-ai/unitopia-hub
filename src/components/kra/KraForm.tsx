'use client'; // If using Next.js App Router

import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
// --- Imports for Multi-Select ---
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
// --- End Imports for Multi-Select ---
import { CalendarIcon, PlusCircle, Trash2, XIcon, ChevronsUpDown, CheckIcon } from 'lucide-react'; // Added XIcon, ChevronsUpDown, CheckIcon
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { kraSchema, KraFormData, KpiFormData, SelectOption, UserOption } from './types';
import { getSupabaseClient } from '@/integrations/supabase/supabaseClient'; // Import Supabase client


// --- Mock Data (Keep for Objectives, Units, Statuses for now) ---
const mockObjectives: SelectOption[] = [
  { value: 'obj1', label: 'Increase Revenue' },
  { value: 'obj2', label: 'Improve Efficiency' },
  { value: 'obj3', label: 'Enhance Customer Satisfaction' },
];

const mockUnits: SelectOption[] = [
  { value: 'unit1', label: 'Sales' },
  { value: 'unit2', label: 'Marketing' },
  { value: 'unit3', label: 'Engineering' },
];

// --- Remove Mock Users --- 
/*
const mockUsers: UserOption[] = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Alice Smith' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f1234567890a', name: 'Bob Johnson' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-1234567890ab', name: 'Charlie Brown' },
  { id: 'd4e5f6a7-b8c9-0123-def0-1234567890abc', name: 'David Lee' },
  { id: 'e5f6a7b8-c9d0-1234-ef01-234567890abcd', name: 'Eve Williams' },
];
*/

const kpiStatusOptions: SelectOption[] = [
    { value: 'Not Started', label: 'Not Started' },
// ... existing code ...
// --- End Mock Data ---


interface KraFormProps {
  onSubmit: (data: KraFormData) => void;
  initialData?: Partial<KraFormData>; // For editing
  isLoading?: boolean;
}

// Define a type that matches the structure expected from Supabase
// Adjust `full_name` if your column is named differently
interface FetchedUser {
    id: string;
    full_name: string | null; // Assuming name can be nullable
}

export function KraForm({ onSubmit, initialData, isLoading = false }: KraFormProps) {
  // --- State for fetched users ---
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  // --- End State --- 

  const form = useForm<KraFormData>({
    resolver: zodResolver(kraSchema),
    defaultValues: initialData || {
      kra_title: '',
      objective: '',
      unit: '',
      start_date: undefined,
      target_date: undefined,
      assignees: [], // Initialize as empty array for multi-select
      kpis: [{ // Start with one empty KPI block
        kpi_name: '',
        target: undefined,
        actual: undefined,
        status: 'Not Started',
        comments: '',
      }],
    },
  });

  // --- Fetch Users Effect ---
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setErrorUsers(null);
      try {
        const supabase = getSupabaseClient();
        // IMPORTANT: Adjust 'profiles' and 'id, full_name' if your table/columns differ
        const { data, error } = await supabase
          .from('profiles') // Assumed table name
          .select('id, full_name'); // Assumed columns

        if (error) {
          throw error;
        }

        // Transform fetched data to match UserOption structure
        const formattedUsers: UserOption[] = (data as FetchedUser[])?.map(user => ({
          id: user.id,
          name: user.full_name || `User ${user.id.substring(0, 6)}` // Fallback name
        })) || [];

        setUsers(formattedUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setErrorUsers(`Failed to load users: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);
  // --- End Fetch Users Effect ---

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'kpis',
  });

  const handleFormSubmit = (data: KraFormData) => {
    console.log('Form Data:', data);
    onSubmit(data);
  };


  // TODO: Implement multi-select component for assignees if needed
  // For now, using a simple Select for demonstration (selects only one)
  // You might need a library like react-select or build a custom multi-select
  // Shadcn examples often use Command with Popover for multi-select.
  // ^^^ This comment block can be removed now.

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Section 1: KRA Details */}
        <div className="space-y-4 p-6 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">KRA Details</h2>

          {/* KRA Title */}
          <FormField
// ... existing code ...
          />

          {/* Objective */}
          <FormField
// ... existing code ...
          />

          {/* Unit */}
          <FormField
// ... existing code ...
          />

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Start Date */}
             <FormField
// ... existing code ...
            />

            {/* Target Date */}
            <FormField
// ... existing code ...
            />
          </div>

          {/* --- Assignees Multi-Select (using fetched users) --- */}
          <FormField
            control={form.control}
            name="assignees"
            render={({ field }) => {
              // Use fetched users state
              const selectedUsers = useMemo(
                () => users.filter(user => field.value?.includes(user.id)),
                [field.value, users] // Add users to dependency array
              );

              const handleSelect = (userId: string) => {
                const currentSelection = field.value || [];
                const newSelection = currentSelection.includes(userId)
                  ? currentSelection.filter(id => id !== userId) // Deselect
                  : [...currentSelection, userId]; // Select
                field.onChange(newSelection);
              };

              return (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  {isLoadingUsers && <p className="text-sm text-muted-foreground">Loading users...</p>}
                  {errorUsers && <p className="text-sm text-destructive">{errorUsers}</p>}
                  <Popover>
                    <PopoverTrigger asChild disabled={isLoadingUsers || !!errorUsers}> // Disable trigger if loading/error
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-auto min-h-10", // Adjusted height classes
                            !field.value?.length && "text-muted-foreground"
                          )}
                        >
                          <div className="flex gap-1 flex-wrap">
                            {selectedUsers.length > 0 ? (
                              selectedUsers.map(user => (
                                <Badge
                                  variant="secondary"
                                  key={user.id}
                                  className="mr-1 mb-1" // Added margin bottom
                                  onClick={(e) => {
                                    e.preventDefault(); // Prevent popover opening on badge click
                                    handleSelect(user.id);
                                  }}
                                >
                                  {user.name}
                                  <XIcon className="ml-1 h-3 w-3 cursor-pointer" />
                                </Badge>
                              ))
                            ) : (
                              <span>Select assignees...</span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search assignees..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {/* Map over fetched users state */}
                            {users.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.name} // Use name for filtering in CommandInput
                                onSelect={() => handleSelect(user.id)}
                                disabled={isLoadingUsers} // Optionally disable items while loading
                              >
                                <div className="flex items-center w-full">
                                  <span className="flex-1">{user.name}</span>
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      field.value?.includes(user.id)
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible"
                                    )}
                                  >
                                    {/* Checkmark can be added here if desired */}
                                    {field.value?.includes(user.id) && <CheckIcon className="h-4 w-4" />}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select one or more users responsible for this KRA.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          {/* --- End Assignees Multi-Select --- */}
        </div>

        {/* Section 2: KPI Inputs */}
        <div className="space-y-4 p-6 border rounded-md">
            {/* ... Add KPI Button ... */} 

            {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-md relative space-y-3 mb-4">
                 {/* ... KPI Title & Delete Button ... */} 

                {/* KPI Name */} 
                <FormField
// ... existing code ...
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Target */} 
                     <FormField
                        control={form.control}
                        name={`kpis.${index}.target`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target</FormLabel>
                            <FormControl>
                            {/* Ensure value is number or undefined */}
                            <Input type="number" placeholder="Target number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {/* Actual */} 
                     <FormField
                        control={form.control}
                        name={`kpis.${index}.actual`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Actual <span className='text-muted-foreground text-xs'>(Optional)</span></FormLabel>
                            <FormControl>
                             {/* Ensure value is number or null */}
                             <Input type="number" placeholder="Actual number (optional)" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} />
                             </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                {/* Status */} 
                <FormField
// ... existing code ...
                />

                {/* Comments */} 
                <FormField
                    control={form.control}
                    name={`kpis.${index}.comments`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Comments <span className='text-muted-foreground text-xs'>(Optional)</span></FormLabel>
                        <FormControl>
                        {/* Ensure value is string or empty string */}
                        <Textarea placeholder="Optional comments" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
            ))}
             {/* ... KPI Array Validation messages ... */} 
        </div>

        <Button type="submit" disabled={isLoading || isLoadingUsers}> {/* Also disable submit if users are loading */} 
          {isLoading ? 'Submitting...' : (initialData ? 'Update KRA' : 'Create KRA')}
        </Button>
      </form>
    </Form>
  );
}

// Add default export if needed, or ensure it's exported correctly for usage
// export default KraForm; // Uncomment if this is the standard export pattern 