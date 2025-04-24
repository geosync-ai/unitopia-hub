import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  LayoutGrid, 
  Columns, 
  Filter, 
  SlidersHorizontal, 
  Check,
  Calendar as CalendarIcon,
  Search,
  X,
  PlusSquare,
  Trash2,
  Bell,
  Moon,
  Sun,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Grid3X3,
  AlertTriangle,
  Ticket,
  Kanban,
  LayoutIcon,
  Grid2X2Icon,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import TicketCard from './TicketCard';
import TicketDialog from './TicketDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  rectSwappingStrategy
} from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import ThemeToggle from '../layout/ThemeToggle';
import { useToast } from "@/hooks/use-toast";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Add UserNav component directly in this file
const UserNav: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Type for the board data structure
interface BoardData {
  [key: string]: TicketCardProps[]; 
}

// Define the Bucket interface
interface Bucket {
  id: string;
  title: string;
}

// Fix the TicketCardProps interface to include all required properties
interface TicketCardProps {
  id: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  assignee?: {
    name: string;
    avatarFallback: string;
    avatarImage?: string;
  };
  dueDate?: string;
  commentsCount?: number;
  status?: string;
  type?: string;
  createdAt?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// Define interface for ticket data
interface TicketData {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority: "High" | "Medium" | "Low";
  type?: string;
  assigneeId?: string;
  createdAt?: string;
  dueDate?: Date | null;
}

// Ensure all IDs are strings in initial data
const initialBoardData: BoardData = {
  todo: [
    { id: 'TKT-001', title: 'Implement user authentication', description: 'Set up login...', priority: 'High', dueDate: 'Jul 25', assignee: { name: 'Alice', avatarFallback: 'A' }, status: 'todo' },
    { id: 'TKT-002', title: 'Design database schema', description: 'Define tables...', priority: 'Medium', commentsCount: 2, status: 'todo' },
  ],
  inprogress: [
    { id: 'TKT-003', title: 'Develop Ticket Board UI', description: 'Create Kanban...', priority: 'Medium', assignee: { name: 'Bob', avatarFallback: 'B' }, commentsCount: 5, dueDate: 'Jul 28', status: 'inprogress' },
  ],
  done: [
    { id: 'TKT-004', title: 'Setup project repository', priority: 'Low', assignee: { name: 'Charlie', avatarFallback: 'C' }, dueDate: 'Jul 20', status: 'done' },
  ]
};

// Define column type based on sample data keys
type BoardColumnId = string; // Ensure column IDs are treated as strings

// Ensure bucket IDs are strings
const initialBuckets = [
  { id: 'todo', title: 'TO DO' },
  { id: 'inprogress', title: 'IN PROGRESS' },
  { id: 'done', title: 'DONE' }
];

// Ensure filter IDs are strings
const initialFilters = {
  priority: [
    { id: 'high', label: 'High Priority', checked: false },
    { id: 'medium', label: 'Medium Priority', checked: false },
    { id: 'low', label: 'Low Priority', checked: false },
  ],
  assignee: [
    { id: 'alice', label: 'Alice', checked: false },
    { id: 'bob', label: 'Bob', checked: false },
    { id: 'charlie', label: 'Charlie', checked: false },
  ]
};

// View modes
type ViewMode = 'board' | 'grid';

// Type for item to delete
interface ItemToDelete {
  type: 'ticket' | 'group';
  id: string;
  name?: string; // For display in confirmation
}

// Add these components to replace the Board/Grid views
const BoardLane = ({ 
  id, 
  title,
  tickets, 
  onAddTicket, 
  onEditTicket, 
  onDeleteTicket,
  isOver = false
}: { 
  id: string; 
  title: string; 
  tickets: TicketCardProps[];
  onAddTicket: () => void;
  onEditTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  isOver?: boolean;
}) => {
  const { setNodeRef, isOver: columnIsOver } = useDroppable({ id });
  const isColumnOver = isOver || columnIsOver;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-3 font-medium flex items-center justify-between bg-muted/50 dark:bg-muted/30">
        <h3>{title}</h3>
        <Badge variant="outline" className="ml-2">{tickets.length}</Badge>
      </div>
      <div 
        className={cn(
          "p-2 flex-grow overflow-y-auto min-h-[200px]",
          isColumnOver && tickets.length === 0 && "border-2 border-dashed border-primary/50 rounded-md",
          isColumnOver && "bg-primary/10 transition-colors duration-200"
        )} 
        ref={setNodeRef}
      >
        <SortableContext items={tickets.map(ticket => ticket.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              id={ticket.id}
              title={ticket.title}
              description={ticket.description}
              assignee={ticket.assignee}
              priority={ticket.priority}
              dueDate={ticket.dueDate}
              commentsCount={ticket.commentsCount}
              status={ticket.status}
              onEdit={() => onEditTicket(ticket.id)}
              onDelete={() => onDeleteTicket(ticket.id)}
            />
          ))}
        </SortableContext>
        {isColumnOver && tickets.length === 0 && (
          <div className="flex items-center justify-center h-24 rounded-md">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/20"></div>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-muted-foreground mt-2"
          onClick={onAddTicket}
        >
          <Plus className="mr-1 h-4 w-4" /> Add ticket
        </Button>
      </div>
    </div>
  );
};

// Improve the GridView implementation
const GridView: React.FC<{
  tickets: BoardData;
  onEditTicket: (id: string) => void;
  onDeleteTicket: (id: string) => void;
}> = ({ tickets, onEditTicket, onDeleteTicket }) => {
  // Flatten all tickets from all columns
  const allTickets = useMemo(() => {
    const flattened: TicketCardProps[] = [];
    Object.entries(tickets).forEach(([statusId, columnTickets]) => {
      columnTickets.forEach(ticket => {
        flattened.push({
          ...ticket,
          status: statusId
        });
      });
    });
    return flattened;
  }, [tickets]);

  if (allTickets.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tickets found</div>;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            id={ticket.id}
            title={ticket.title}
            description={ticket.description || ""}
            priority={ticket.priority as "High" | "Medium" | "Low"}
            assignee={ticket.assignee}
            dueDate={ticket.dueDate}
            commentsCount={ticket.commentsCount}
            status={ticket.status}
            onEdit={() => onEditTicket(ticket.id)}
            onDelete={() => onDeleteTicket(ticket.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Add SortableTicket component for the grid view
const SortableTicket = ({ id, ...props }: TicketCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard id={id} {...props} />
    </div>
  );
};

// Add NotificationBell component
const NotificationBell = () => {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: "Notifications",
      description: "You have no new notifications",
    });
  };
  
  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      <Bell className="h-5 w-5" />
    </Button>
  );
};

// Remove existing BoardControls component and replace with a simpler one without view toggle
const BoardControls = () => {
  return (
    <div className="mb-6 flex flex-col space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="pl-8"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              High Priority
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>
              Medium Priority
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>
              Low Priority
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              Alice
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>
              Bob
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>
              Charlie
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Sort
        </Button>
        
        <Button onClick={() => handleCreateTicket()}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>
    </div>
  );
};

// Create ViewToggle component to be used in the header
const ViewToggle: React.FC<{
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}> = ({ activeView, setActiveView }) => {
  return (
    <div className="flex items-center border rounded-md overflow-hidden">
      <Button
        variant={activeView === "board" ? "default" : "ghost"}
        size="sm"
        className="rounded-none px-3"
        onClick={() => setActiveView("board")}
      >
        <Kanban className="mr-2 h-4 w-4" />
        Board
      </Button>
      <Button
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none px-3"
        onClick={() => setActiveView("grid")}
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        Grid
      </Button>
    </div>
  );
};

const TicketManager: React.FC = () => {
  // State for the board data (start with sample)
  const [boardData, setBoardData] = useState<BoardData>(initialBoardData);
  const [buckets, setBuckets] = useState(initialBuckets);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for managing the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<TicketCardProps | null>(null);
  const [targetColumnForNewTicket, setTargetColumnForNewTicket] = useState<string | null>(null);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string>('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [activeDropId, setActiveDropId] = useState<string | null>(null);

  const { toast } = useToast();
  const columns = buckets;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find ticket helper function (ticketId is always string)
  const findTicketAndColumn = (ticketId: string): { columnId: BoardColumnId, index: number, ticket: TicketCardProps } | null => {
    for (const columnId in boardData) {
      const index = boardData[columnId as BoardColumnId].findIndex(t => t.id === ticketId);
      if (index !== -1) {
        return { 
            columnId: columnId as BoardColumnId, 
            index, 
            ticket: boardData[columnId as BoardColumnId][index]
        };
      }
    }
    return null;
  }

  // Define handler to open dialog for creating a new ticket
  const handleCreateTicket = () => {
    setEditingTicket(null);
    setIsDialogOpen(true);
  };

  // Handler to open dialog for creating a new ticket IN A SPECIFIC COLUMN (columnId is string)
  const handleCreateTicketInColumn = (columnId: string) => {
    console.log("Creating ticket in column:", columnId);
    setTargetColumnForNewTicket(columnId); // Set target column before opening
    setEditingTicket(null); // Set to null for creation mode
    setIsDialogOpen(true);
  };

  // Updated handleEditTicket (ticketId is string)
  const handleEditTicket = (ticketId: string) => {
    const itemInfo = findTicketAndColumn(ticketId);
    if (itemInfo) {
      const { ticket, columnId } = itemInfo;
      const ticketToEdit: TicketData = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: columnId, // Use the column ID as status
        dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null, // Adjust parsing if needed
      };
      setEditingTicket(ticketToEdit);
      setIsDialogOpen(true);
    } else {
      console.error("Ticket not found for editing:", ticketId);
    }
  };

  // Filter tickets
  const getFilteredTickets = () => {
    // First filter by search query if present
    let filteredData = { ...boardData };
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      Object.keys(filteredData).forEach((columnId) => {
        filteredData[columnId] = filteredData[columnId].filter((ticket) => 
          ticket.title.toLowerCase().includes(lowerQuery) || 
          (ticket.description && ticket.description.toLowerCase().includes(lowerQuery))
        );
      });
    }
    
    // Then apply additional filters if any are active
    if (activeFilters.length > 0) {
      Object.keys(filteredData).forEach((columnId) => {
        filteredData[columnId] = filteredData[columnId].filter((ticket) => {
          // Check priority filters
          const priorityFilters = filters.priority.filter(f => f.checked).map(f => f.id);
          const assigneeFilters = filters.assignee.filter(f => f.checked).map(f => f.id);
          
          // If we have priority filters and this ticket's priority doesn't match any, filter it out
          if (priorityFilters.length > 0) {
            const matchesPriority = priorityFilters.some(p => 
              ticket.priority && ticket.priority.toLowerCase() === p
            );
            if (!matchesPriority) return false;
          }
          
          // Similar for assignee filters
          if (assigneeFilters.length > 0 && ticket.assignee) {
            const matchesAssignee = assigneeFilters.some(a => 
              ticket.assignee?.name.toLowerCase() === a
            );
            if (!matchesAssignee) return false;
          }
          
          return true;
        });
      });
    }
    
    return filteredData;
  };

  // Implemented submit handler for local state
  const handleTicketSubmit = (ticketData: TicketData) => {
    console.log('Submitting ticket:', ticketData);
    setBoardData((prevBoard) => {
        const newBoard = { ...prevBoard };
        const targetColumn = (ticketData.status || 'todo') as BoardColumnId;
        if (!newBoard[targetColumn]) newBoard[targetColumn] = []; // Ensure column exists

        const cardData: TicketCardProps = {
            id: ticketData.id || `TKT-${Date.now()}`, // Use timestamp for unique ID
            title: ticketData.title,
            description: ticketData.description,
            priority: ticketData.priority,
            dueDate: ticketData.dueDate ? format(ticketData.dueDate, "MMM d") : undefined,
            status: targetColumn,
            // Map other fields if needed
        };

        if (ticketData.id) { // Update
            let updated = false;
            for (const colId in newBoard) {
                const currentColumnId = colId as BoardColumnId;
                const items = newBoard[currentColumnId];
                const itemIndex = items.findIndex(t => t.id === ticketData.id);

                if (itemIndex !== -1) {
                    if (currentColumnId === targetColumn) { // Update in same column
                        items[itemIndex] = cardData;
                    } else { // Moved to a different column
                        items.splice(itemIndex, 1); // Remove from old column
                        newBoard[targetColumn].push(cardData); // Add to new column
                    }
                    updated = true;
                    break; 
                }
            }
             if (!updated) console.error("Ticket to update not found:", ticketData.id);
        } else { // Create
             newBoard[targetColumn].push(cardData);
        }
        return newBoard;
    });
    // TODO: Add API call to persist the change
    setIsDialogOpen(false);
    setTargetColumnForNewTicket(null); // Reset target column on close
  };

  // Handle filter changes
  const handleFilterChange = (type: keyof typeof filters, id: string, checked: boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const filterIndex = newFilters[type].findIndex(f => f.id === id);
      if (filterIndex !== -1) {
        newFilters[type][filterIndex].checked = checked;
      }
      return newFilters;
    });
    
    // Update active filters list
    setActiveFilters(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(f => f !== id);
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters([]);
    setFilters(initialFilters);
  };
  
  // Add a new bucket/column
  const addBucket = () => {
    // TODO: Modify this later for inline renaming on add
    const newBucketId = `new-bucket-${Date.now()}`;
    const newBucket = { id: newBucketId, title: 'New Bucket' }; // Default name for now
    setBuckets(prev => [...prev, newBucket]);
    setBoardData(prev => ({ ...prev, [newBucketId]: [] }));
  };

  // Start renaming a column
  const handleColumnHeaderDoubleClick = (columnId: string, currentTitle: string) => {
    setRenamingColumnId(columnId);
    setEditingColumnName(currentTitle);
  };

  // Finish or cancel renaming a column
  const handleColumnRename = (columnId: string) => {
    if (!editingColumnName.trim()) {
      // If name is empty, maybe revert or show error? For now, cancel.
      setRenamingColumnId(null);
      return;
    }
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => 
        bucket.id === columnId ? { ...bucket, title: editingColumnName.trim() } : bucket
      )
    );
    setRenamingColumnId(null); // Exit renaming mode
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const itemInfo = findTicketAndColumn(String(active.id));
    setActiveDragItem(itemInfo ? itemInfo.ticket : null);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    // Check if we have a valid drop target
    if (!over || !active) {
      console.log("No valid drop target or active item");
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      console.log("Dropped on self");
      return;
    }

    // Find the active item's current position
    const activeItemInfo = findTicketAndColumn(activeId);
    if (!activeItemInfo) {
      console.error("Could not find active item info for:", activeId);
      return;
    }

    const { columnId: activeColumnId, index: activeIndex, ticket: activeTicket } = activeItemInfo;
    
    // Determine the target column
    let targetColumnId: BoardColumnId | null = null;
    
    // First check if we're dropping directly onto a column
    const isColumnDrop = columns.some(col => col.id === overId);
    if (isColumnDrop) {
      targetColumnId = overId;
      console.log("Dropped directly onto column:", targetColumnId);
    } 
    // Next check if we're dropping onto a ticket
    else {
      const overItemInfo = findTicketAndColumn(overId);
      if (overItemInfo) {
        targetColumnId = overItemInfo.columnId;
        console.log("Dropped onto ticket in column:", targetColumnId);
      } 
      // Finally check if we're dropping within a sortable context
      else if (over.data.current?.sortable?.containerId) {
        targetColumnId = String(over.data.current.sortable.containerId);
        console.log("Dropped into sortable context:", targetColumnId);
      }
    }

    // If we still couldn't determine a target column, exit
    if (!targetColumnId) {
      console.error("Could not determine target column");
      return;
    }

    // Find the target insertion index
    let targetIndex = 0;
    const overItemInfo = findTicketAndColumn(overId);
    
    // If dropping onto another ticket, place it at that position
    if (overItemInfo) {
      targetIndex = overItemInfo.index;
    } else {
      // Otherwise place at the end of the target column
      targetIndex = boardData[targetColumnId]?.length || 0;
    }

    // Make a copy of the entire board data to avoid direct mutations
    setBoardData(prevBoard => {
      // Create a new board object
      const newBoard = { ...prevBoard };
      
      // Ensure columns exist
      if (!newBoard[activeColumnId]) newBoard[activeColumnId] = [];
      if (!newBoard[targetColumnId]) newBoard[targetColumnId] = [];
      
      // Create copies of the affected arrays
      const sourceItems = [...newBoard[activeColumnId]];
      const targetItems = activeColumnId === targetColumnId 
        ? sourceItems 
        : [...newBoard[targetColumnId]];
      
      // Remove item from source
      sourceItems.splice(activeIndex, 1);
      
      // Clone the active ticket to avoid reference issues
      const ticketToMove = { ...activeTicket, status: targetColumnId };
      
      // Insert into target
      targetItems.splice(targetIndex, 0, ticketToMove);
      
      // Update the board data
      newBoard[activeColumnId] = sourceItems;
      if (activeColumnId !== targetColumnId) {
        newBoard[targetColumnId] = targetItems;
      }
      
      return newBoard;
    });
  };

  const filteredBoardData = getFilteredTickets();

  // --- Delete Handlers ---
  const handleRequestDelete = (item: ItemToDelete) => {
    setItemToDelete(item);
    setIsConfirmDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setIsConfirmDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'ticket') {
      console.log("Deleting ticket:", itemToDelete.id);
      setBoardData(prevBoard => {
        const newBoard = { ...prevBoard };
        for (const columnId in newBoard) {
          newBoard[columnId] = newBoard[columnId].filter(ticket => ticket.id !== itemToDelete.id);
        }
        return newBoard;
      });
    } else if (itemToDelete.type === 'group') {
      console.log("Deleting group:", itemToDelete.id);
      // Keep a reference to the current itemToDelete ID
      const deleteId = itemToDelete.id;
      
      // Use a single batch update function
      const updateBothStates = () => {
        // Update buckets first
        setBuckets(prevBuckets => {
          const newBuckets = prevBuckets.filter(bucket => bucket.id !== deleteId);
          
          // Then update board data - using the updated buckets info
          setBoardData(prevBoard => {
            const newBoard = { ...prevBoard };
            delete newBoard[deleteId]; // Remove the column
            return newBoard;
          });
          
          return newBuckets;
        });
      };
      
      // Execute update
      updateBothStates();
    }

    cancelDelete(); // Close dialog and reset state
  };
  // --- End Delete Handlers ---

  // --- Add Group Handlers ---
  const handleSaveNewGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return; // Don't add empty names

    // Generate a safer ID with just alphanumeric characters
    const newBucketId = `bucket-${Date.now()}`;
    const newBucket: Bucket = { id: newBucketId, title: trimmedName };

    try {
      // Update buckets state
      setBuckets(prev => [...prev, newBucket]);
      // Update board data with an empty array for the new bucket
      setBoardData(prev => ({ ...prev, [newBucketId]: [] }));
      
      // Reset state
      setIsAddingGroup(false);
      setNewGroupName('');
    } catch (error) {
      console.error("Error adding new group:", error);
      // Provide user feedback
      toast({
        title: "Error",
        description: "Failed to add new group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelAddGroup = () => {
    setIsAddingGroup(false);
    setNewGroupName('');
  };
  // --- End Add Group Handlers ---

  // Placeholder for notification click
  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "No new notifications (placeholder).",
    });
  };

  // Fix the filteredStatuses state to match the correct type (string[] instead of Record<string, any>)
  const [filteredStatuses, setFilteredStatuses] = useState<string[]>([]);

  // Add the missing handleDragOver function
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Skip if not a valid drop target
    if (activeId === overId) return;
    
    const activeInfo = findTicketAndColumn(activeId);
    if (!activeInfo) return;
    
    // Check if we're dragging over a column
    const isColumnDrop = columns.some(col => col.id === overId);
    if (isColumnDrop) {
      setActiveDropId(overId);
      return;
    } else {
      setActiveDropId(null);
    }
    
    // Check if we're dragging over another ticket
    const overInfo = findTicketAndColumn(overId);
    if (!overInfo) return;
    
    // Only react if dragging to a different column
    if (activeInfo.columnId !== overInfo.columnId) {
      setBoardData(prev => {
        const newBoard = { ...prev };
        
        // Remove from original column
        const sourceColumn = [...newBoard[activeInfo.columnId]];
        sourceColumn.splice(activeInfo.index, 1);
        
        // Add to the new column
        const targetColumn = [...newBoard[overInfo.columnId]];
        const updatedTicket = { ...activeInfo.ticket, status: overInfo.columnId };
        targetColumn.splice(overInfo.index, 0, updatedTicket);
        
        // Update the board
        newBoard[activeInfo.columnId] = sourceColumn;
        newBoard[overInfo.columnId] = targetColumn;
        
        return newBoard;
      });
    }
  };

  // Add missing boardRefs object
  const boardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // Add helper functions to get board data
  const getTicketIdsInColumn = (columnId: string): string[] => {
    return boardData[columnId]?.map(ticket => ticket.id) || [];
  };

  const getBoardColumn = (columnId: string): TicketCardProps[] => {
    return boardData[columnId] || [];
  };

  const getAllTicketIds = (): string[] => {
    return Object.values(boardData).flat().map(ticket => ticket.id);
  };

  const getAllTickets = (): TicketCardProps[] => {
    return Object.values(boardData).flat();
  };

  // Add function to get assignee by ID
  const getAssigneeById = (assigneeId: string) => {
    // This would typically come from a map of users
    // For now, just return a placeholder
    return { 
      name: "User", 
      avatarFallback: assigneeId.substring(0, 1).toUpperCase() 
    };
  };

  // Add function to handle adding a ticket to a column
  const handleAddTicketToColumn = (columnId: string) => {
    setTargetColumnForNewTicket(columnId);
    setEditingTicket(null);
    setIsDialogOpen(true);
  };

  // Add function to handle ticket deletion
  const handleDeleteTicket = (ticketId: string) => {
    const itemInfo = findTicketAndColumn(ticketId);
    if (itemInfo) {
      handleRequestDelete({ 
        type: 'ticket', 
        id: ticketId, 
        name: itemInfo.ticket.title 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex-1 flex items-center">
            <h1 className="text-xl font-semibold">Ticket Manager</h1>
            <div className="ml-4 flex">
              <Button
                variant={viewMode === "board" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("board")}
                className="rounded-r-none"
              >
                <Kanban className="h-4 w-4 mr-1" />
                Board
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
          <ThemeToggle />
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <UserNav />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Board Controls */}
        <div className="flex items-center p-4 gap-4">
          <div className="flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.priority.map(filter => (
                <DropdownMenuCheckboxItem 
                  key={filter.id}
                  checked={filter.checked}
                  onCheckedChange={(checked) => 
                    handleFilterChange('priority', filter.id, checked)
                  }
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleCreateTicket()}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Board/Grid View */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          {viewMode === "board" ? (
            <div className="px-4 pb-4 flex space-x-4 overflow-x-auto">
              {buckets.map(bucket => {
                const columnId = bucket.id;
                const columnTickets = boardData[columnId] || [];
                
                return (
                  <BoardLane
                    key={columnId}
                    id={columnId}
                    title={bucket.title}
                    tickets={columnTickets}
                    onAddTicket={() => handleAddTicketToColumn(columnId)}
                    onEditTicket={handleEditTicket}
                    onDeleteTicket={handleDeleteTicket}
                    isOver={activeDropId === columnId}
                  />
                );
              })}
              {isAddingGroup ? (
                <div className="w-80 flex-shrink-0">
                  <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-3">
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group name"
                      autoFocus
                      className="mb-2"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveNewGroup}>Save</Button>
                      <Button size="sm" variant="outline" onClick={handleCancelAddGroup}>Cancel</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="h-auto flex-shrink-0 w-80 border-dashed"
                  onClick={() => setIsAddingGroup(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              )}
            </div>
          ) : (
            <GridView 
              tickets={boardData} 
              onEditTicket={handleEditTicket} 
              onDeleteTicket={handleDeleteTicket} 
            />
          )}
          
          {/* Drag Overlay for visual feedback */}
          <DragOverlay>
            {activeDragItem && (
              <TicketCard
                id={activeDragItem.id}
                title={activeDragItem.title}
                description={activeDragItem.description}
                priority={activeDragItem.priority}
                assignee={activeDragItem.assignee}
                dueDate={activeDragItem.dueDate}
                commentsCount={activeDragItem.commentsCount}
                status={activeDragItem.status}
                className="opacity-80 w-[320px] shadow-lg"
                isDragOverlay={true}
              />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Ticket Dialog with corrected props */}
      <TicketDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleTicketSubmit}
        initialData={editingTicket}
        defaultStatus={targetColumnForNewTicket || undefined}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              {itemToDelete?.type === 'group' && ` group "${itemToDelete?.name}" and all its tickets`} 
              {itemToDelete?.type === 'ticket' && ` ticket "${itemToDelete?.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteItem} 
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TicketManager; 