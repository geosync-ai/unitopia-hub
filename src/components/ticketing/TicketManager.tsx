import React, { useState } from 'react';
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
  PlusSquare
} from 'lucide-react';
import TicketCard, { TicketCardProps } from './TicketCard';
import TicketDialog, { TicketData } from './TicketDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Type for the board data structure
interface BoardData {
  [key: string]: TicketCardProps[]; 
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
  const [targetColumnForNewTicket, setTargetColumnForNewTicket] = useState<string | null>(null); // State for target column
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null); // ID of column being renamed
  const [editingColumnName, setEditingColumnName] = useState<string>(''); // Temp value for rename input

  const columns = buckets;

  const sensors = useSensors(
    useSensor(PointerSensor),
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

  // Handler to open dialog for creating a new ticket (general)
  const handleCreateTicket = () => {
    setEditingTicket(null); // Create new, default status (usually 'todo')
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
        // Map assignee if necessary
        // assigneeId: ticket.assignee ? ticket.assignee.id : null, 
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
    setFilters(initialFilters);
    setActiveFilters([]);
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

  const handleDragStart = (event: DragEndEvent) => {
      const { active } = event;
      const itemInfo = findTicketAndColumn(String(active.id)); // Ensure ID is string
      setActiveDragItem(itemInfo ? itemInfo.ticket : null);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = String(active.id); // Ensure ID is string
    const overId = String(over.id);    // Ensure ID is string

    if (activeId === overId) return;

    const activeItemInfo = findTicketAndColumn(activeId);
    if (!activeItemInfo) return;

    const { columnId: activeColumnId, index: activeIndex } = activeItemInfo;
    
    let targetColumnId: BoardColumnId;
    let targetIndex: number;

    const overItemInfo = findTicketAndColumn(overId);
    if (overItemInfo) {
      targetColumnId = overItemInfo.columnId;
      targetIndex = overItemInfo.index;
    } else {
      const isColumnId = columns.some(c => c.id === overId);
      if (isColumnId) {
        targetColumnId = overId;
        targetIndex = boardData[targetColumnId]?.length || 0;
      } else {
        return;
      }
    }

    setBoardData((prev) => {
      const newBoard = { ...prev }; // Shallow copy
      const activeItems = [...(newBoard[activeColumnId] || [])]; // Copy source array
      const targetItems = activeColumnId === targetColumnId ? activeItems : [...(newBoard[targetColumnId] || [])]; // Copy target array if different
      
      const [movedItem] = activeItems.splice(activeIndex, 1);
      if (!movedItem) return prev; // Should not happen if logic is correct

      movedItem.status = targetColumnId; // Update status

      // Insert into target array
      targetItems.splice(targetIndex, 0, movedItem);

      // Update board state
      newBoard[activeColumnId] = activeItems;
      newBoard[targetColumnId] = targetItems;

      console.log(`Moved ${movedItem.id} to ${targetColumnId} at index ${targetIndex}`);
      return newBoard;
    });
  };

  const filteredBoardData = getFilteredTickets();

  return (
    <div className="p-4 space-y-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-4">
        {/* Left Side: View Mode Toggle */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} defaultValue="board">
          <ToggleGroupItem value="board" aria-label="Board view">
            <Columns className="h-4 w-4 mr-2" /> Board
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Right Side: Search, Filters, Actions */}
        <div className="flex items-center gap-2">
           {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2 py-1 h-9 w-[200px] lg:w-[250px]" // Adjusted padding and height
            />
          </div>

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9"> {/* Adjusted size */}
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.priority.map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter.id}
                  checked={filter.checked}
                  onCheckedChange={(checked) => handleFilterChange('priority', filter.id, checked)}
                >
                  {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
              {/* Add more filter sections (e.g., Assignee) if needed */}
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full justify-center">
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Group Button (Renamed from Add Bucket) */}
          <Button variant="outline" size="sm" className="h-9" onClick={addBucket}> {/* Adjusted size */}
             <PlusSquare className="h-4 w-4 mr-2" /> Add group
          </Button>
        </div>
      </div>

      {/* Removed old header/toolbar section */}
      {/* <div className="flex justify-between items-center mb-4"> ... old structure ... </div> */}

      {/* Board/Grid View */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        {viewMode === 'board' && (
          <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-320px)]">
            {columns.map((column) => (
              <div 
                key={column.id} 
                id={column.id} 
                className="w-72 md:w-80 lg:w-96 bg-gray-100 dark:bg-gray-800/60 rounded-lg shadow-sm flex flex-col flex-shrink-0"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700/80 flex justify-between items-center sticky top-0 bg-gray-100 dark:bg-gray-800/90 rounded-t-lg z-10">
                  <div 
                    className="flex items-center gap-2 flex-grow mr-2" 
                    onDoubleClick={() => {
                       // Prevent double-click from triggering drag-and-drop
                       if (renamingColumnId === column.id) return;
                       handleColumnHeaderDoubleClick(column.id, column.title);
                    }}
                  >
                    {renamingColumnId === column.id ? (
                      <Input
                        type="text"
                        value={editingColumnName}
                        onChange={(e) => setEditingColumnName(e.target.value)}
                        onBlur={() => handleColumnRename(column.id)} // Save on blur
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleColumnRename(column.id); // Save on Enter
                          } else if (e.key === 'Escape') {
                            setRenamingColumnId(null); // Cancel on Escape
                          }
                        }}
                        className="h-7 px-1 text-sm font-semibold uppercase tracking-wide" // Match styling
                        autoFocus // Focus the input when it appears
                      />
                    ) : (
                      // Original Title Display
                      <h3 
                        className="font-semibold text-sm uppercase tracking-wide cursor-pointer" 
                        title="Double-click to rename"
                      >
                        {column.title}
                      </h3>
                    )}
                    <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                      {filteredBoardData[column.id]?.length || 0}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" // Smaller icon button
                    onClick={() => handleCreateTicketInColumn(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add ticket to {column.title}</span>
                  </Button>
                </div>
                
                {/* Cards Container - Apply SortableContext for cards within this column */}
                <div className="p-2 flex-1 overflow-y-auto">
                  <SortableContext
                    items={(filteredBoardData[column.id] || []).map(ticket => ticket.id)} // Map IDs for SortableContext
                    strategy={verticalListSortingStrategy}
                  >
                    {(filteredBoardData[column.id] || []).map((ticket) => (
                      <TicketCard 
                        key={ticket.id}
                        {...ticket}
                        onEdit={() => handleEditTicket(ticket.id)} // Correct onEdit prop
                      />
                    ))}
                    
                    {/* Placeholder if column is empty */}
                    {(filteredBoardData[column.id] || []).length === 0 && (
                       <div className="flex items-center justify-center h-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-md mt-2">
                         <p className="text-sm text-gray-500 dark:text-gray-400">No tickets</p>
                       </div>
                     )}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             <SortableContext
                items={Object.values(filteredBoardData).flatMap(tickets => tickets.map(ticket => ticket.id))}
                strategy={rectSortingStrategy}
              >
                {Object.values(filteredBoardData).flatMap(tickets => 
                  tickets.map(ticket => (
                     <TicketCard 
                        key={ticket.id}
                        {...ticket}
                        onEdit={() => handleEditTicket(ticket.id)} // Correct onEdit prop
                        className="h-full"
                      />
                  ))
                )}
             </SortableContext>
            {Object.values(filteredBoardData).flat().length === 0 && (
                 <div className="col-span-full flex items-center justify-center h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                   <p className="text-gray-500 dark:text-gray-400">No tickets match your filters</p>
                 </div>
               )}
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem ? (
            <TicketCard 
              {...activeDragItem}
              className="opacity-80 rotate-3 pointer-events-none"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Ticket Create/Edit Dialog */}
      {isDialogOpen && (
        <TicketDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setTargetColumnForNewTicket(null); // Reset target column on close
          }}
          onSubmit={handleTicketSubmit}
          initialData={editingTicket}
          statuses={columns.map(col => ({ id: col.id, name: col.title }))} // Ensure col.id is string
          defaultStatus={targetColumnForNewTicket} // Pass target column status
        />
      )}
    </div>
  );
};

export default TicketManager; 