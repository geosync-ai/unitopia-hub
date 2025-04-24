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
  X
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

// Type for the board data structure
interface BoardData {
  [key: string]: TicketCardProps[]; 
}

// Initial Sample Data with unique IDs and status matching the column key
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
type BoardColumnId = keyof BoardData;

// Additional columns for organization
const initialBuckets = [
  { id: 'todo', title: 'TO DO' },
  { id: 'inprogress', title: 'IN PROGRESS' },
  { id: 'done', title: 'DONE' }
];

// Filter options
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

  const columns = buckets;

  const sensors = useSensors(
    useSensor(PointerSensor),
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
    setEditingTicket(null); // Ensure we are creating, not editing
    setIsDialogOpen(true);
  };

  // Updated handleEditTicket
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
    setSearchQuery('');
  };
  
  // Add new bucket/column
  const addBucket = () => {
    const id = `bucket-${Date.now()}`;
    const newBucket = { id, title: 'New Bucket' };
    setBuckets([...buckets, newBucket]);
    setBoardData(prev => ({ ...prev, [id]: [] }));
  };

  // Placeholder drag handlers - needs implementation
  const handleDragStart = (event: DragEndEvent) => {
      const { active } = event;
      const itemInfo = findTicketAndColumn(active.id as string);
      setActiveDragItem(itemInfo ? itemInfo.ticket : null);
  }

  // Implemented Drag End Logic
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return; // Dropped on itself

    const activeItemInfo = findTicketAndColumn(activeId);
    if (!activeItemInfo) return;

    const { columnId: activeColumnId, index: activeIndex } = activeItemInfo;
    
    let targetColumnId: BoardColumnId;
    let targetIndex: number;

    const overItemInfo = findTicketAndColumn(overId);
    if (overItemInfo) { // Dropped onto another ticket
      targetColumnId = overItemInfo.columnId;
      targetIndex = overItemInfo.index;
    } else { // Check if dropped onto a column area
      const isColumnId = columns.some(c => c.id === overId);
      if (isColumnId) {
        targetColumnId = overId as BoardColumnId;
        targetIndex = boardData[targetColumnId].length; // Append to end
      } else {
        return; // Invalid drop target
      }
    }

    setBoardData((prev) => {
      const activeItems = prev[activeColumnId];
      const [movedItem] = activeItems.splice(activeIndex, 1);
      movedItem.status = targetColumnId; // Update status

      let newBoard = { ...prev };

      if (activeColumnId === targetColumnId) { // Moved within the same column
        activeItems.splice(targetIndex, 0, movedItem);
        newBoard[activeColumnId] = [...activeItems]; // Ensure new array instance
      } else { // Moved to a different column
        const targetItems = [...prev[targetColumnId]];
        targetItems.splice(targetIndex, 0, movedItem);
        newBoard = {
          ...prev,
          [activeColumnId]: [...activeItems], // New array for source
          [targetColumnId]: targetItems,    // New array for target
        };
      }
      // TODO: API call to update ticket status and potentially order
      console.log(`Moved ${movedItem.id} to ${targetColumnId} at index ${targetIndex}`);
      return newBoard;
    });
  };

  const filteredBoardData = getFilteredTickets();

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-220px)]">
        {/* Header with actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Ticket Board</h2>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
              <ToggleGroupItem value="board" aria-label="Board View">
                <Columns className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid View">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] flex items-center justify-center text-primary-foreground">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="font-semibold text-xs">Priority</DropdownMenuLabel>
                {filters.priority.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => 
                      handleFilterChange('priority', item.id, checked)
                    }
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="font-semibold text-xs">Assignee</DropdownMenuLabel>
                {filters.assignee.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => 
                      handleFilterChange('assignee', item.id, checked)
                    }
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
                
                {activeFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full justify-start text-muted-foreground text-xs"
                    >
                      Clear all filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleCreateTicket}>
              <Plus className="mr-2 h-4 w-4" /> Create Ticket
            </Button>
            
            <Button variant="outline" size="icon" onClick={addBucket}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Board View */}
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
                  <h3 className="font-semibold text-sm uppercase tracking-wide">{column.title}</h3>
                  <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                    {filteredBoardData[column.id]?.length || 0}
                  </span>
                </div>
                
                {/* Cards Container */}
                <div className="p-2 flex-1 overflow-y-auto">
                  <SortableContext
                    items={filteredBoardData[column.id]?.map(ticket => ticket.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredBoardData[column.id]?.map((ticket) => (
                      <TicketCard 
                        key={ticket.id}
                        {...ticket}
                        onEdit={() => handleEditTicket(ticket.id)}
                      />
                    ))}
                    
                    {!filteredBoardData[column.id]?.length && (
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

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              <SortableContext
                items={Object.values(filteredBoardData).flatMap(tickets => 
                  tickets.map(ticket => ticket.id)
                )}
                strategy={rectSortingStrategy}
              >
                {Object.entries(filteredBoardData).flatMap(([columnId, tickets]) => 
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="h-full">
                      <TicketCard 
                        {...ticket}
                        onEdit={() => handleEditTicket(ticket.id)}
                        className="h-full"
                      />
                    </div>
                  ))
                )}
              </SortableContext>
              
              {Object.values(filteredBoardData).flat().length === 0 && (
                <div className="col-span-full flex items-center justify-center h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                  <p className="text-gray-500 dark:text-gray-400">No tickets match your filters</p>
                </div>
              )}
            </div>
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
      </div>

      {/* Ticket Dialog */}
      {isDialogOpen && (
        <TicketDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleTicketSubmit}
          initialData={editingTicket}
          statuses={columns.map(col => ({ id: col.id, name: col.title }))}
        />
      )}
    </DndContext>
  );
};

export default TicketManager; 