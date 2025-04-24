import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TicketCard from './TicketCard'; // Import the new card component

// Sample data for demonstration
const sampleBoardData = {
  todo: [
    {
      id: 'TKT-001',
      title: 'Implement user authentication',
      description: 'Set up login and registration using Supabase Auth.',
      priority: 'High' as 'High',
      dueDate: 'Jul 25',
      assignee: { name: 'Alice', avatarFallback: 'A' }
    },
    {
      id: 'TKT-002',
      title: 'Design database schema',
      description: 'Define tables for users, tickets, comments.',
      priority: 'Medium' as 'Medium',
      commentsCount: 2
    }
  ],
  inprogress: [
    {
      id: 'TKT-003',
      title: 'Develop Ticket Board UI',
      description: 'Create the Kanban board interface using Shadcn components.',
      priority: 'Medium' as 'Medium',
      assignee: { name: 'Bob', avatarFallback: 'B' },
      commentsCount: 5,
      dueDate: 'Jul 28'
    }
  ],
  done: [
    {
      id: 'TKT-004',
      title: 'Setup project repository',
      priority: 'Low' as 'Low',
      assignee: { name: 'Charlie', avatarFallback: 'C' },
      dueDate: 'Jul 20'
    }
  ]
};

const TicketManager: React.FC = () => {
  // Define columns with IDs matching the sample data keys
  const columns = [
    { id: 'todo' as keyof typeof sampleBoardData, title: 'To Do' },
    { id: 'inprogress' as keyof typeof sampleBoardData, title: 'In Progress' },
    { id: 'done' as keyof typeof sampleBoardData, title: 'Done' },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-220px)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Ticket Board</h2>
        {/* TODO: Implement Create Ticket Modal/Dialog */}
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Ticket
        </Button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-320px)]">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className="w-72 md:w-80 lg:w-96 bg-gray-100 dark:bg-gray-800/60 rounded-lg shadow-sm flex flex-col flex-shrink-0"
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700/80 flex justify-between items-center sticky top-0 bg-gray-100 dark:bg-gray-800/90 rounded-t-lg z-10">
              <h3 className="font-semibold text-sm uppercase tracking-wide">{column.title}</h3>
              <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                {sampleBoardData[column.id].length}
              </span>
            </div>
            
            {/* Column Content (Scrollable Ticket List) */}
            <div className="p-3 space-y-0 overflow-y-auto flex-1">
              {sampleBoardData[column.id].map((ticket) => (
                <TicketCard key={ticket.id} {...ticket} />
              ))}
              {/* Add Ticket Button within column (Optional) */}
              {/* 
              <Button variant="ghost" className="w-full mt-2 justify-start text-muted-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add card
              </Button>
              */}
            </div>
          </div>
        ))}
        {/* Add Column Button (Optional) */}
        {/* 
        <div className="w-72 flex-shrink-0">
           <Button variant="ghost" className="w-full bg-gray-200/50 dark:bg-gray-800/50 justify-start text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700">
             <Plus className="mr-2 h-4 w-4" /> Add another list
           </Button>
        </div>
        */}
      </div>
    </div>
  );
};

export default TicketManager; 