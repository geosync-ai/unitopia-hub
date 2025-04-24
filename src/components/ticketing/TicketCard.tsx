import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MessageSquare, User, AlertCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  className?: string;
  isDragOverlay?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors = {
  Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
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
  className,
  isDragOverlay = false,
  onClick,
  onEdit,
  onDelete
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
    // Don't trigger click when clicking edit button
    if ((e.target as HTMLElement).closest('.edit-button') || (e.target as HTMLElement).closest('.delete-button')) {
      return;
    }
    
    // If a general onClick is provided for the card, call it
    if (onClick) onClick();
  };

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
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight flex-grow mr-1">{title}</CardTitle>
          
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
            {priority && (
              <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal border", priorityColors[priority])}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {priority}
              </Badge>
            )}
            {dueDate && (
              <div className="flex items-center">
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