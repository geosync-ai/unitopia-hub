import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TicketCard, { TicketCardProps } from './TicketCard'; // Import the new card component
import TicketDialog, { TicketData } from './TicketDialog'; // Import the dialog and data type
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  Active, // Import Active type
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy, // Use this for grid-like or horizontal sorting
} from '@dnd-kit/sortable';
import { format } from 'date-fns'; // Import format

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

const TicketManager: React.FC = () => {
  // State for the board data (start with sample)
  // TODO: Replace with actual data fetching and state management (e.g., Zustand, Context API)
  const [boardData, setBoardData] = useState<BoardData>(initialBoardData);

  // State for managing the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<TicketCardProps | null>(null); // State to hold the actively dragged item data

  const columns: { id: BoardColumnId; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

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

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart} // Add drag start handler
    >
      <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-220px)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Ticket Board</h2>
          <Button onClick={handleCreateTicket}>
            <Plus className="mr-2 h-4 w-4" /> Create Ticket
          </Button>
        </div>
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
                  {boardData[column.id]?.length || 0} {/* Safer access */}
                </span>
              </div>
              
              {/* Column Content (Sortable) */}
              <SortableContext 
                 items={boardData[column.id]?.map(ticket => ticket.id) || []} // Provide IDs for sorting
                 strategy={verticalListSortingStrategy} // Strategy for vertical lists
                 id={column.id}
              >
                <div className="p-3 space-y-0 overflow-y-auto flex-1">
                  {boardData[column.id]?.map((ticket) => ( // Safer access
                     <TicketCard 
                       key={ticket.id} 
                       {...ticket} 
                       id={ticket.id} 
                       onClick={() => handleEditTicket(ticket.id)} // Pass ID to handler
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {/* Drag Overlay for smooth dragging appearance */}
        <DragOverlay>
            {activeDragItem ? (
                 <TicketCard 
                    {...activeDragItem} 
                    id={activeDragItem.id} 
                />
            ) : null}
        </DragOverlay>

        <TicketDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onSubmit={handleTicketSubmit} 
          initialData={editingTicket}
        />
      </div>
    </DndContext>
  );
};

export default TicketManager; 