import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MessageSquare, User, AlertCircle, Circle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, parseISO, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BaseCard } from '@/components/ui/BaseCard';

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
  onComplete
}) => {
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
        <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal border", statusColor)}>
          {statusLabel}
        </Badge>
      )}
      {priority && (
        <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal border", priorityColors[priority])}>
          <AlertCircle className="h-3 w-3 mr-1" />
          {priority}
        </Badge>
      )}
      {dueDate && (
        <div className={cn("inline-flex items-center text-xs gap-1", 
          isDueDatePassed && "text-red-600 dark:text-red-500")}>
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{dueDate}</span>
        </div>
      )}
      {commentsCount > 0 && (
        <div className="inline-flex items-center text-xs gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentsCount}</span>
        </div>
      )}
      <div className="flex-grow"></div>
      {assignee && (
        <Avatar className="h-6 w-6">
          {assignee.avatarImage ? (
            <AvatarImage src={assignee.avatarImage} alt={assignee.name} />
          ) : (
            <AvatarFallback className="text-xs">{assignee.avatarFallback}</AvatarFallback>
          )}
        </Avatar>
      )}
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