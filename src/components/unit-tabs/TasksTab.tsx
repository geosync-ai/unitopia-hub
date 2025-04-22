import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import AddTaskModal from './modals/AddTaskModal';
import EditTaskModal from './modals/EditTaskModal';
import DeleteModal from './modals/DeleteModal';
import { StaffMember } from '@/types/staff';
import { Objective } from '@/types/kpi';

interface Task {
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
}

const taskStatuses: Task['status'][] = ['todo', 'in-progress', 'review', 'done'];
const taskPriorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];

interface TaskFiltersState {
  status: string;
  priority: string;
}

interface TasksTabProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  editTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  error?: Error | null;
  onRetry?: () => void;
  staffMembers: StaffMember[];
  objectives?: Objective[];
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, addTask, editTask, deleteTask, staffMembers, objectives }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFiltersState>({
      status: 'all',
      priority: 'all',
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
      return statusMatch && priorityMatch;
    });
  }, [tasks, filters]);

  const handleFilterChange = (filterName: keyof TaskFiltersState, value: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: 'all', priority: 'all' });
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleDelete = (task: Task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo':
        return <Badge className="bg-gray-100 text-gray-800">To Do</Badge>;
      case 'in-progress':
        return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800">Review</Badge>;
      case 'done':
        return <Badge className="bg-green-100 text-green-800">Done</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getAssigneeName = (email: string) => {
    const staff = staffMembers.find(s => s.email === email);
    return staff ? staff.name : email;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tasks / Daily Operations</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-md mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-status-filter">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="task-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {taskStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-priority-filter">Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger id="task-priority-filter">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {taskPriorities.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {tasks.length === 0 ? 'No tasks found. Create your first task by clicking "Add Task".' : 'No tasks match the current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getAssigneeName(task.assignee)}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>{task.projectName || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(task)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showAddModal && (
        <AddTaskModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSubmit={addTask}
          staffMembers={staffMembers}
        />
      )}
      
      {showEditModal && selectedTask && (
        <EditTaskModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          task={selectedTask}
          onSave={(updatedTask) => editTask(selectedTask.id, updatedTask)}
          staffMembers={staffMembers}
        />
      )}
      
      {showDeleteModal && selectedTask && (
        <DeleteModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title="Delete Task"
          description={`Are you sure you want to delete the task "${selectedTask.title}"? This action cannot be undone.`}
          onDelete={() => {
            deleteTask(selectedTask.id);
          }}
        />
      )}
    </>
  );
}; 