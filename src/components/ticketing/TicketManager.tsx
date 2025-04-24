import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  LayoutGrid, 
  Filter, 
  Search,
  Trash2,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Kanban
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
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
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import ThemeToggle from '../layout/ThemeToggle';
import { useToast } from "@/hooks/use-toast";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

// UserNav component
const UserNav = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
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

// Type for ticket data
export interface TicketData {
  id?: string;
  title: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status?: string;
  dueDate?: Date | null;
  assigneeId?: string;
}

// Type for ticket props
export interface TicketCardProps {
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

// Type for the board data structure
interface BoardData {
  [key: string]: TicketCardProps[]; 
}

// Define the Bucket interface
interface Bucket {
  id: string;
  title: string;
}

// Type for item to delete
interface ItemToDelete {
  type: 'ticket' | 'group';
  id: string;
  name?: string; // For display in confirmation
}

// Define column type
type BoardColumnId = string;

// View modes
type ViewMode = 'board' | 'grid';

// Sample initial data
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

// Initial buckets
const initialBuckets = [
  { id: 'todo', title: 'TO DO' },
  { id: 'inprogress', title: 'IN PROGRESS' },
  { id: 'done', title: 'DONE' }
];

// Initial filters
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

// Board lane component with improved drop handling for empty groups
const BoardLane = ({ 
  id, 
  title,
  tickets, 
  onAddTicket, 
  onEditTicket, 
  onDeleteTicket,
  onDeleteGroup,
  isOver = false
}: { 
  id: string; 
  title: string; 
  tickets: TicketCardProps[];
  onAddTicket: () => void;
  onEditTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isOver?: boolean;
}) => {
  const { setNodeRef, isOver: columnIsOver } = useDroppable({ id });
  const isColumnOver = isOver || columnIsOver;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-3 font-medium flex items-center justify-between bg-muted/50 dark:bg-muted/30">
        <h3>{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="ml-2">{tickets.length}</Badge>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
            onClick={() => onDeleteGroup(id)}
            title="Delete Group"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
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

// Grid view component
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

// Main TicketManager component
const TicketManager: React.FC = () => {
  // State for the board data
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

  // Find ticket helper function
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

  // Handler to open dialog for creating a new ticket
  const handleCreateTicket = () => {
    setEditingTicket(null);
    setTargetColumnForNewTicket(null);
    setIsDialogOpen(true);
  };

  // Handler to open dialog for creating a new ticket in a specific column
  const handleCreateTicketInColumn = (columnId: string) => {
    console.log("Creating ticket in column:", columnId);
    setTargetColumnForNewTicket(columnId);
    setEditingTicket(null);
    setIsDialogOpen(true);
  };

  // Handler to edit a ticket
  const handleEditTicket = (ticketId: string) => {
    const itemInfo = findTicketAndColumn(ticketId);
    if (itemInfo) {
      const { ticket, columnId } = itemInfo;
      const ticketToEdit: TicketData = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: columnId,
        dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
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

  // Submit handler for ticket form
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
  
  // Add a new bucket/column
  const addBucket = () => {
    const newBucketId = `new-bucket-${Date.now()}`;
    const newBucket = { id: newBucketId, title: 'New Bucket' };
    setBuckets(prev => [...prev, newBucket]);
    setBoardData(prev => ({ ...prev, [newBucketId]: [] }));
  };

  // Handle column rename
  const handleColumnRename = (columnId: string) => {
    if (!editingColumnName.trim()) {
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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const itemInfo = findTicketAndColumn(String(active.id));
    setActiveDragItem(itemInfo ? itemInfo.ticket : null);
  }

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Skip if not a valid drop target
    if (activeId === overId) return;
    
    // Check if we're dragging over a column
    const isColumnDrop = columns.some(col => col.id === overId);
    if (isColumnDrop) {
      setActiveDropId(overId);
      return;
    } else {
      setActiveDropId(null);
    }
    
    // Check if we're dragging over another ticket
    const overItemInfo = findTicketAndColumn(overId);
    if (!overItemInfo) return;
    
    const activeInfo = findTicketAndColumn(activeId);
    if (!activeInfo) return;
    
    // Only react if dragging to a different column
    if (activeInfo.columnId !== overItemInfo.columnId) {
      setBoardData(prev => {
        const newBoard = { ...prev };
        
        // Remove from original column
        const sourceColumn = [...newBoard[activeInfo.columnId]];
        sourceColumn.splice(activeInfo.index, 1);
        
        // Add to the new column
        const targetColumn = [...newBoard[overItemInfo.columnId]];
        const updatedTicket = { ...activeInfo.ticket, status: overItemInfo.columnId };
        targetColumn.splice(overItemInfo.index, 0, updatedTicket);
        
        // Update the board
        newBoard[activeInfo.columnId] = sourceColumn;
        newBoard[overItemInfo.columnId] = targetColumn;
        
        return newBoard;
      });
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setActiveDropId(null); // Clear the highlight after dropping

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

  // Delete handlers
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
      const deleteId = itemToDelete.id;
      
      setBuckets(prevBuckets => {
        const newBuckets = prevBuckets.filter(bucket => bucket.id !== deleteId);
        
        setBoardData(prevBoard => {
          const newBoard = { ...prevBoard };
          delete newBoard[deleteId]; // Remove the column
          return newBoard;
        });
        
        return newBuckets;
      });
    }

    cancelDelete(); // Close dialog and reset state
  };

  // Add group handlers
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

  // Function to handle adding a ticket to a column
  const handleAddTicketToColumn = (columnId: string) => {
    setTargetColumnForNewTicket(columnId);
    setEditingTicket(null);
    setIsDialogOpen(true);
  };

  // Function to handle ticket deletion
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

  // Function to handle deleting a group
  const handleDeleteGroup = (groupId: string) => {
    const bucket = buckets.find(b => b.id === groupId);
    if (bucket) {
      handleRequestDelete({
        type: 'group',
        id: groupId,
        name: bucket.title
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with logo and controls in the same row */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Logo and title */}
          <div className="flex items-center gap-4">
            <img 
              src="/SCPNG Original Logo.png" 
              alt="SCPNG Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold">Support Ticketing System</h1>
          </div>
          
          {/* Board/Grid toggle */}
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
          
          {/* Spacer to push the next items to the right */}
          <div className="flex-1"></div>
          
          {/* Add Ticket button moved to top right */}
          <Button 
            onClick={handleCreateTicket}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
          
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
                    onDeleteGroup={handleDeleteGroup}
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

      {/* Ticket Dialog */}
      <TicketDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleTicketSubmit}
        initialData={editingTicket}
        defaultStatus={targetColumnForNewTicket || undefined}
      />

      {/* Delete Confirmation Dialog */}
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