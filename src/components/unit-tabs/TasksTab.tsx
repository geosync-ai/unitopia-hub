import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  LayoutGrid, 
  Filter, 
  Search,
  Trash2,
  Kanban,
  List,
  CalendarIcon,
} from 'lucide-react';
import TaskCard from '@/components/unit-tabs/TaskCard';
import TaskDialog from '@/components/unit-tabs/TaskDialog';
import { StaffMember } from '@/types/staff';
import { Objective, Kra } from '@/types';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
import { useToast } from "@/hooks/use-toast";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate: string;
  assignedTo?: string;
  startDate?: Date;
  projectId?: string;
  projectName?: string;
  completionPercentage?: number;
  completed?: boolean;
}

interface BoardData {
  [key: string]: Task[]; 
}

interface Bucket {
  id: string;
  title: string;
}

interface ItemToDelete {
  type: 'task' | 'group';
  id: string;
  name?: string;
}

type BoardColumnId = string;
type ViewMode = 'board' | 'grid' | 'list';

const initialBuckets = [
  { id: 'todo', title: 'TO DO' },
  { id: 'in-progress', title: 'IN PROGRESS' },
  { id: 'review', title: 'REVIEW' },
  { id: 'done', title: 'DONE' }
];

const BoardLane = ({ 
  id, 
  title,
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  onDeleteGroup,
  isOver = false,
  onRenameGroup,
  onToggleComplete,
  onPriorityChange,
  onAssigneeChange,
  onStatusChange,
  dropTargetInfo,
  staffMembers
}: { 
  id: string; 
  title: string; 
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isOver?: boolean;
  onRenameGroup: (groupId: string, newTitle: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  onAssigneeChange: (id: string, assignee: StaffMember) => void;
  onStatusChange: (id: string, status: string) => void;
  dropTargetInfo: {
    columnId: string | null;
    overItemId: string | null;
    isBottomHalf: boolean;
  };
  staffMembers: StaffMember[];
}) => {
  const { setNodeRef } = useDroppable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-3 font-medium flex items-center justify-between bg-muted/50 dark:bg-muted/30">
        <h3>{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="ml-2">{tasks.length}</Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={onAddTask}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => onDeleteGroup(id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div ref={setNodeRef} className="p-2 flex-grow overflow-y-auto min-h-[200px] space-y-3">
        <SortableContext items={incompleteTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {incompleteTasks.map((task) => {
            const assignee = staffMembers.find(s => s.email === task.assignee);
            return (
            <TaskCard
              key={task.id}
              {...task}
              assignee={assignee}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
              onComplete={onToggleComplete}
              onPriorityChange={onPriorityChange}
              onAssigneeChange={onAssigneeChange}
              onStatusChange={onStatusChange}
            />
          )})}
        </SortableContext>
      </div>
    </div>
  );
};

const TaskGridView: React.FC<{
  tasks: BoardData;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  onAssigneeChange: (id: string, assignee: StaffMember) => void;
  onStatusChange: (id: string, status: string) => void;
  staffMembers: StaffMember[];
}> = ({ tasks, onEditTask, onDeleteTask, onToggleComplete, onPriorityChange, onAssigneeChange, onStatusChange, staffMembers }) => {
  const allTasks = useMemo(() => {
    const flattened: Task[] = [];
    Object.values(tasks).forEach(columnTasks => {
      flattened.push(...columnTasks);
    });
    return flattened;
  }, [tasks]);

  if (allTasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {allTasks.map((task) => {
        const assignee = staffMembers.find(s => s.email === task.assignee);
        return (
          <TaskCard
            key={task.id}
            {...task}
            assignee={assignee}
            onEdit={() => onEditTask(task.id)}
            onDelete={() => onDeleteTask(task.id)}
            onComplete={onToggleComplete}
            onPriorityChange={onPriorityChange}
            onAssigneeChange={onAssigneeChange}
            onStatusChange={onStatusChange}
          />
        );
      })}
    </div>
  );
};

const TaskListView: React.FC<{
  tasks: BoardData;
  buckets: Bucket[];
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  onAssigneeChange: (id: string, assignee: StaffMember) => void;
  onStatusChange: (id: string, status: string) => void;
  staffMembers: StaffMember[];
}> = ({ tasks, buckets, onEditTask, onDeleteTask, onToggleComplete, onPriorityChange, onAssigneeChange, onStatusChange, staffMembers }) => {
  const allTasks = useMemo(() => {
    const flattened: (Task & { columnId: string, columnTitle: string })[] = [];
    Object.entries(tasks).forEach(([columnId, columnTasks]) => {
      const bucketTitle = buckets.find(b => b.id === columnId)?.title || columnId;
      columnTasks.forEach(task => {
        flattened.push({
          ...task,
          columnId,
          columnTitle: bucketTitle,
        });
      });
    });
    return flattened.sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || buckets.findIndex(bucket => bucket.id === a.columnId) - buckets.findIndex(bucket => bucket.id === b.columnId));
  }, [tasks, buckets]);

  if (allTasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks found</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-xs font-medium text-left p-3 text-muted-foreground w-10"></th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground">Title</th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground">Status</th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground">Priority</th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground">Due Date</th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground">Assignee</th>
            <th className="text-xs font-medium text-left p-3 text-muted-foreground w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allTasks.map((task) => {
            const assignee = staffMembers.find(s => s.email === task.assignee);
            return (
              <tr key={task.id} className={cn("border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50", task.completed && "bg-gray-50 dark:bg-gray-800/50")}>
                <td className="p-3 text-center">
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-muted-foreground hover:text-primary" onClick={() => onToggleComplete(task.id, !task.completed)}>
                    {task.completed ? <Kanban className="h-4 w-4 text-green-600" /> : <List className="h-4 w-4" />}
                  </Button>
                </td>
                <td className="p-3">
                  <div className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}>{task.title}</div>
                  {task.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</div>}
                </td>
                <td className="p-3"><Badge variant="outline">{task.columnTitle}</Badge></td>
                <td className="p-3"><Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'outline'}>{task.priority}</Badge></td>
                <td className="p-3">{task.dueDate}</td>
                <td className="p-3">{assignee?.name || 'Unassigned'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => onEditTask(task.id)}><List className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600" onClick={() => onDeleteTask(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface NewTasksTabProps {
  tasks: Task[];
  kras: Kra[]; // Add kras to props
  addTask: (task: Omit<Task, 'id'>) => void;
  editTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  error?: Error | null;
  onRetry?: () => void;
  staffMembers: StaffMember[];
  objectives?: Objective[];
  setEditingTask: (task: Task | null) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  viewMode: ViewMode;
}

export const TasksTab: React.FC<NewTasksTabProps> = ({ 
  tasks, 
  kras, 
  addTask, 
  editTask, 
  deleteTask, 
  staffMembers, 
  objectives,
  setEditingTask,
  setIsDialogOpen,
  viewMode
}) => {
  const [boardData, setBoardData] = useState<BoardData>({});
  const [taskBuckets, setTaskBuckets] = useState(initialBuckets);
  const [kraBuckets, setKraBuckets] = useState<Bucket[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<Task | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Process KRAs
    const processedKraBuckets = kras.map(kra => ({ id: kra.id.toString(), title: kra.title.toUpperCase() }));
    setKraBuckets(processedKraBuckets);

    // Initialize board data structure
    const newBoardData: BoardData = {};

    // Populate tasks
    initialBuckets.forEach(bucket => {
      newBoardData[bucket.id] = tasks.filter(task => task.status === bucket.id);
    });

    // Populate KRAs and their KPIs
    processedKraBuckets.forEach(bucket => {
      const kra = kras.find(k => k.id.toString() === bucket.id);
      newBoardData[bucket.id] = kra ? (kra.unitKpis || []).map(kpi => ({
        id: kpi.id.toString(),
        title: kpi.name,
        description: kpi.description || '',
        status: 'todo', // Default status for KPIs
        priority: 'medium',
        assignee: kpi.assignees ? (Array.isArray(kpi.assignees) ? kpi.assignees[0]?.email : kpi.assignees) : '',
        dueDate: kpi.target_date || '',
      })) : [];
    });
    
    setBoardData(newBoardData);
  }, [tasks, kras]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;
      const activeTask = tasks.find(t => t.id === activeId);
      if (activeTask) {
        editTask(activeId, { status: overId as Task['status'] });
      }
    }
    setActiveDragItem(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveDragItem(task);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setItemToDelete({ type: 'task', id: taskId, name: task.title });
    }
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteTask(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 flex flex-col overflow-hidden">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div className="flex-1 p-4 overflow-auto max-h-[calc(100vh-220px)]">
            {viewMode === 'board' ? (
              <div className="flex gap-8 h-full">
                {/* Tasks/Operations Section */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold tracking-tight mb-4 shrink-0">Tasks/Operations</h2>
                  <div className="flex space-x-4">
                    {taskBuckets.map(bucket => (
                      <BoardLane
                        key={bucket.id}
                        id={bucket.id}
                        title={bucket.title}
                        tasks={boardData[bucket.id] || []}
                        staffMembers={staffMembers}
                        onAddTask={handleCreateTask}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onDeleteGroup={() => {}}
                        onRenameGroup={() => {}}
                        onToggleComplete={() => {}}
                        onPriorityChange={() => {}}
                        onAssigneeChange={() => {}}
                        onStatusChange={() => {}}
                        dropTargetInfo={{ columnId: null, overItemId: null, isBottomHalf: false }}
                      />
                    ))}
                  </div>
                </div>

                {/* KRA Section */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold tracking-tight mb-4 shrink-0">Key Result Areas (KRAs)</h2>
                  <div className="flex space-x-4">
                    {kraBuckets.map(bucket => (
                      <BoardLane
                        key={bucket.id}
                        id={bucket.id}
                        title={bucket.title}
                        tasks={boardData[bucket.id] || []}
                        staffMembers={staffMembers}
                        onAddTask={handleCreateTask}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onDeleteGroup={() => {}}
                        onRenameGroup={() => {}}
                        onToggleComplete={() => {}}
                        onPriorityChange={() => {}}
                        onAssigneeChange={() => {}}
                        onStatusChange={() => {}}
                        dropTargetInfo={{ columnId: null, overItemId: null, isBottomHalf: false }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <TaskGridView
                tasks={boardData}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={() => {}}
                onPriorityChange={() => {}}
                onAssigneeChange={() => {}}
                onStatusChange={() => {}}
                staffMembers={staffMembers}
              />
            ) : (
              <TaskListView
                tasks={boardData}
                buckets={taskBuckets}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={() => {}}
                onPriorityChange={() => {}}
                onAssigneeChange={() => {}}
                onStatusChange={() => {}}
                staffMembers={staffMembers}
              />
            )}
          </div>
          <DragOverlay>
            {activeDragItem ? <TaskCard {...activeDragItem} assignee={staffMembers.find(s => s.email === activeDragItem.assignee)} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TasksTab;
