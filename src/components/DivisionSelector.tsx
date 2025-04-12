import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Division } from '@/types';
import divisionService from '@/integrations/supabase/divisionService';

const DivisionSelector = () => {
  const { user, selectedDivision, setSelectedDivision } = useAuth();
  const [open, setOpen] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    const loadDivisions = async () => {
      if (user?.id) {
        try {
          // First try to fetch from Supabase
          const divs = await divisionService.getUserDivisions(user.id);
          setDivisions(divs);
          
          // If no division is selected and we have divisions, select the first one
          if (!selectedDivision && divs.length > 0) {
            setSelectedDivision(divs[0].id);
          }
        } catch (error) {
          console.error('Error loading divisions:', error);
        }
      }
    };
    
    loadDivisions();
  }, [user?.id, selectedDivision, setSelectedDivision]);

  // If user has no divisions or only one division, don't show the selector
  if (!divisions.length || divisions.length === 1) {
    return null;
  }

  const selectedDivisionName = divisions.find(d => d.id === selectedDivision)?.name || 'Select Division';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between mr-2"
        >
          {selectedDivisionName}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search division..." className="h-9" />
          <CommandEmpty>No division found.</CommandEmpty>
          <CommandGroup>
            {divisions.map((division) => (
              <CommandItem
                key={division.id}
                value={division.id}
                onSelect={(currentValue) => {
                  setSelectedDivision(currentValue);
                  localStorage.setItem('selectedDivision', currentValue);
                  setOpen(false);
                }}
              >
                {division.name}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedDivision === division.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DivisionSelector; 