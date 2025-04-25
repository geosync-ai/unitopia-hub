import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MessageSquare, User, AlertCircle, MoreVertical, Edit, Trash2, Circle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format, isBefore, parseISO, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger click when clicking buttons
    if (
      (e.target as HTMLElement).closest('.edit-button') || 
      (e.target as HTMLElement).closest('.delete-button') ||
      (e.target as HTMLElement).closest('.complete-button')
    ) {
      return;
    }
    
    // If a general onClick is provided for the card, call it
    if (onClick) onClick();
  };

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

  return (
    <div 
      ref={!isDragOverlay ? setNodeRef : undefined} 
      style={isDragOverlay ? undefined : style} 
      {...(!isDragOverlay ? attributes : {})} 
      {...(!isDragOverlay ? listeners : {})} 
      className={cn(
        "relative", 
        isOver && "mt-4 before:content-[''] before:absolute before:left-0 before:right-0 before:top-[-8px] before:h-1 before:bg-primary before:rounded-full",
        className
      )}
    >
      <Card 
        className={cn(
          "mb-3 cursor-grab hover:shadow-md transition-shadow duration-200 border dark:border-gray-700",
          isDragging && "shadow-lg ring-2 ring-primary",
          isOver && "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800",
          isDragOverlay && "shadow-xl rotate-3 cursor-grabbing",
          isDueDatePassed && "border-red-500 dark:border-red-600",
          completed && "opacity-80 bg-gray-50 dark:bg-gray-800/50",
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
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
            <CardTitle className={cn("text-sm font-medium leading-tight flex-grow mr-1", completed && "line-through text-muted-foreground")}>{title}</CardTitle>
          </div>
          
          <div className="flex items-center flex-shrink-0">
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
                <Edit className="h-3.5 w-3.5" />
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
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        {description && (
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          </CardContent>
        )}
        
        <CardFooter className="p-3 pt-1 flex justify-between items-center text-xs text-muted-foreground">
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
              <div className={cn("flex items-center", isDueDatePassed && "text-red-600 dark:text-red-500 font-semibold")}>
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                <span>{dueDate}</span>
              </div>
            )}
            {commentsCount > 0 && (
              <div className="flex items-center">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span>{commentsCount}</span>
              </div>
            )}
          </div>
          
          {assignee && (
            <Avatar className="h-6 w-6">
              {assignee.avatarImage && <AvatarImage src={assignee.avatarImage} alt={assignee.name} />}
              <AvatarFallback className="text-xs">{assignee.avatarFallback}</AvatarFallback>
            </Avatar>
          )}
          {!assignee && (
             <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
             </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TicketCard; 