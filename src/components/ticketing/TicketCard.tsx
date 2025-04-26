import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, User, AlertCircle, Circle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, parseISO, isValid, addDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BaseCard } from '@/components/ui/BaseCard';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Extend props to include anything needed by useSortable or event handlers
export interface TicketCardProps {
  id: string;
  title: string;
  description?: string;
  assignee?: { name: string; avatarFallback: string; avatarImage?: string };
  priority?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  commentsCount?: number;
  status?: string;
  completed?: boolean;
  className?: string;
  isDragOverlay?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: (id: string, completed: boolean) => void;
  onPriorityChange?: (id: string, priority: 'Low' | 'Medium' | 'High') => void;
  onDueDateChange?: (id: string, dueDate: string) => void;
  onAssigneeChange?: (id: string, assignee: { name: string; avatarFallback: string }) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const priorityColors = {
  Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
};

const statusColors = {
  todo: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  inprogress: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  done: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
};

const statusLabels = {
  todo: 'New',
  inprogress: 'In Progress',
  done: 'Done'
};

const TicketCard: React.FC<TicketCardProps> = ({
  id,
  title,
  description,
  assignee,
  priority = 'Medium',
  dueDate,
  commentsCount = 0,
  status,
  completed = false,
  className,
  isDragOverlay = false,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onPriorityChange,
  onDueDateChange,
  onAssigneeChange,
  onStatusChange
}) => {
  // State for editable dropdowns
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(
    dueDate ? new Date(dueDate) : undefined
  );
  
  // Refs for dropdowns
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const dueDatePickerRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Sample assignees for dropdown
  const availableAssignees = [
    { name: 'Alice', avatarFallback: 'A' },
    { name: 'Bob', avatarFallback: 'B' },
    { name: 'Charlie', avatarFallback: 'C' },
    { name: 'Diana', avatarFallback: 'D' },
    { name: 'Emma', avatarFallback: 'E' }
  ];

  // Check if due date is passed
  const isDueDatePassed = React.useMemo(() => {
    if (!dueDate) return false;
    
    try {
      // Attempt to parse the date - format could be "MMM d" or ISO string
      let date: Date | null = null;
      
      // First check if it's already a valid ISO string
      if (dueDate.includes('-') || dueDate.includes('T')) {
        date = parseISO(dueDate);
      } else {
        // Try to parse from format like "Jul 25"
        const currentYear = new Date().getFullYear();
        const fullDateStr = `${dueDate} ${currentYear}`;
        date = new Date(fullDateStr);
      }
      
      if (!isValid(date)) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return isBefore(date, today) && !completed;
    } catch (error) {
      console.error("Error parsing date:", error);
      return false;
    }
  }, [dueDate, completed]);

  // Handle editing priority
  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPriorityDropdown(!showPriorityDropdown);
    setShowDueDatePicker(false);
    setShowAssigneeDropdown(false);
  };

  // Handle editing due date
  const handleDueDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDueDatePicker(!showDueDatePicker);
    setShowPriorityDropdown(false);
    setShowAssigneeDropdown(false);
  };

  // Handle editing assignee
  const handleAssigneeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAssigneeDropdown(!showAssigneeDropdown);
    setShowPriorityDropdown(false);
    setShowDueDatePicker(false);
  };

  // Handle changing priority
  const handleChangePriority = (newPriority: 'Low' | 'Medium' | 'High') => {
    if (onPriorityChange) {
      onPriorityChange(id, newPriority);
    }
    setShowPriorityDropdown(false);
  };

  // Handle changing due date
  const handleChangeDueDate = (date: Date | undefined) => {
    if (date && onDueDateChange) {
      onDueDateChange(id, format(date, "MMM d"));
    }
    setShowDueDatePicker(false);
  };

  // Handle changing assignee
  const handleChangeAssignee = (newAssignee: { name: string; avatarFallback: string }) => {
    if (onAssigneeChange) {
      onAssigneeChange(id, newAssignee);
    }
    setShowAssigneeDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target as Node)) &&
        (dueDatePickerRef.current && !dueDatePickerRef.current.contains(e.target as Node)) &&
        (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node))
      ) {
        setShowPriorityDropdown(false);
        setShowDueDatePicker(false);
        setShowAssigneeDropdown(false);
      }
    };
    
    if (showPriorityDropdown || showDueDatePicker || showAssigneeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriorityDropdown, showDueDatePicker, showAssigneeDropdown]);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComplete) {
      onComplete(id, !completed);
    }
  };

  const statusLabel = status ? (statusLabels[status as keyof typeof statusLabels] || status) : '';
  const statusColor = status ? (statusColors[status as keyof typeof statusColors] || '') : '';

  // Create header content - title with optional completion checkbox
  const headerContent = (
    <div className="flex items-start gap-2">
      {onComplete && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="complete-button h-5 w-5 p-0 flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary" 
                onClick={handleToggleComplete}
                onPointerDown={(e) => e.stopPropagation()}
                draggable="false"
              >
                {completed ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4" />
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{completed ? 'Mark as incomplete' : 'Mark as complete'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className={cn("text-sm font-medium leading-tight flex-grow mr-1", completed && "line-through text-muted-foreground")}>{title}</div>
    </div>
  );

  // Create header actions - edit and delete buttons
  const headerActions = (
    <>
      {onEdit && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0 edit-button text-muted-foreground hover:text-foreground" 
          onClick={(e) => {
            e.stopPropagation(); 
            onEdit();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          draggable="false"
          title="Edit Ticket"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </Button>
      )}
      {onDelete && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0 delete-button text-muted-foreground hover:text-red-600" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => {
            // Prevent drag start on button click
            e.stopPropagation();
          }}
          draggable="false"
          title="Delete Ticket"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        </Button>
      )}
    </>
  );

  // Create card content - description if exists
  const cardContent = description ? (
    <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
  ) : undefined;

  // Create footer content - badges, dates, comments, assignee
  const footerContent = (
    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
      {status && (
        <Badge 
          variant="outline" 
          className={cn("px-1.5 py-0.5 text-xs font-normal border cursor-pointer", statusColor)}
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusDropdown(!showStatusDropdown);
            setShowPriorityDropdown(false);
            setShowDueDatePicker(false);
            setShowAssigneeDropdown(false);
          }}
        >
          {statusLabel}
        </Badge>
      )}
      
      {showStatusDropdown && status && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShowStatusDropdown(false)}>
          <div 
            className="absolute z-[101] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 min-w-[120px] mt-1"
            style={{ 
              left: priorityDropdownRef.current?.getBoundingClientRect().left + 'px',
              top: (priorityDropdownRef.current?.getBoundingClientRect().bottom + 5) + 'px' 
            }}
            onClick={e => e.stopPropagation()}
          >
            {Object.keys(statusLabels).map(key => (
              <button 
                key={key}
                className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
                  "flex items-center", statusColors[key as keyof typeof statusColors] || '')}
                onClick={(e) => { 
                  e.stopPropagation();
                  if (onStatusChange) onStatusChange(id, key as any);
                  setShowStatusDropdown(false);
                }}
              >
                {statusLabels[key as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {priority && (
        <div className="relative" ref={priorityDropdownRef}>
          <Badge 
            variant="outline" 
            className={cn("px-1.5 py-0.5 text-xs font-normal border cursor-pointer", priorityColors[priority])}
            onClick={handlePriorityClick}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {priority}
          </Badge>
          
          {showPriorityDropdown && onPriorityChange && (
            <div className="fixed inset-0 z-[100]" onClick={() => setShowPriorityDropdown(false)}>
              <div 
                className="absolute z-[101] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]"
                style={{ 
                  left: priorityDropdownRef.current?.getBoundingClientRect().left + 'px',
                  top: (priorityDropdownRef.current?.getBoundingClientRect().bottom + 5) + 'px' 
                }}
                onClick={e => e.stopPropagation()}
              >
                <button 
                  className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
                    "flex items-center", priorityColors['Low'])}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleChangePriority('Low');
                  }}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Low
                </button>
                <button 
                  className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
                    "flex items-center", priorityColors['Medium'])}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleChangePriority('Medium');
                  }}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Medium
                </button>
                <button 
                  className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
                    "flex items-center", priorityColors['High'])}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleChangePriority('High');
                  }}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  High
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Due Date with dropdown calendar */}
      <div className="relative" ref={dueDatePickerRef}>
        <div 
          className={cn("inline-flex items-center text-xs gap-1 cursor-pointer", 
            isDueDatePassed && "text-red-600 dark:text-red-500")}
          onClick={handleDueDateClick}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{dueDate || 'Set date'}</span>
        </div>
        
        {showDueDatePicker && onDueDateChange && (
          <div className="fixed inset-0 z-[100]" onClick={() => setShowDueDatePicker(false)}>
            <div 
              className="absolute z-[101] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2"
              style={{ 
                left: dueDatePickerRef.current?.getBoundingClientRect().left + 'px',
                top: (dueDatePickerRef.current?.getBoundingClientRect().bottom + 5) + 'px' 
              }}
              onClick={e => e.stopPropagation()}
            >
              <Calendar
                mode="single"
                selected={tempDueDate}
                onSelect={(date) => {
                  setTempDueDate(date);
                  if (date) handleChangeDueDate(date);
                }}
                initialFocus
                className="max-w-[250px]"
              />
            </div>
          </div>
        )}
      </div>
      
      {commentsCount > 0 && (
        <div className="inline-flex items-center text-xs gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentsCount}</span>
        </div>
      )}
      
      <div className="flex-grow"></div>
      
      {/* Assignee dropdown */}
      <div className="relative" ref={assigneeDropdownRef}>
        <div onClick={handleAssigneeClick} className="cursor-pointer">
          {assignee ? (
            <Avatar className="h-6 w-6">
              {assignee.avatarImage ? (
                <AvatarImage src={assignee.avatarImage} alt={assignee.name} />
              ) : (
                <AvatarFallback className="text-xs">{assignee.avatarFallback}</AvatarFallback>
              )}
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>
        
        {showAssigneeDropdown && onAssigneeChange && (
          <div className="fixed inset-0 z-[100]" onClick={() => setShowAssigneeDropdown(false)}>
            <div 
              className="absolute z-[101] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] max-h-[180px] overflow-y-auto"
              style={{ 
                right: assigneeDropdownRef.current ? (window.innerWidth - assigneeDropdownRef.current.getBoundingClientRect().right) + 'px' : '0px',
                top: (assigneeDropdownRef.current?.getBoundingClientRect().bottom + 5) + 'px'
              }}
              onClick={e => e.stopPropagation()}
            >
              {availableAssignees.map(person => (
                <button 
                  key={person.name}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeAssignee(person);
                  }}
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarFallback className="text-xs">{person.avatarFallback}</AvatarFallback>
                  </Avatar>
                  {person.name}
                </button>
              ))}
              
              {/* Option to unassign */}
              <button 
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeAssignee({ name: '', avatarFallback: '' });
                }}
              >
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <User className="h-3 w-3" />
                </div>
                Unassign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <BaseCard
      id={id}
      headerContent={headerContent}
      headerActions={headerActions}
      cardContent={cardContent}
      footerContent={footerContent}
      onClick={onClick}
      isDragging={false}
      isDragOverlay={isDragOverlay}
      cardClassName={cn(
        // Apply overdue styling
        isDueDatePassed && "border-red-500 dark:border-red-600",
        // Apply completed styling
        completed && "opacity-80 bg-gray-50 dark:bg-gray-800/50",
        className
      )}
    />
  );
};

export default TicketCard; 