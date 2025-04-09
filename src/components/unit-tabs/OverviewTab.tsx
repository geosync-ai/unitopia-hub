import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BarChart2, Target, Clock, Flag, 
  CheckCircle, AlertTriangle, Briefcase 
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line
} from 'recharts';

interface Risk {
  id: string;
  title: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface KRA {
  id: string;
  name: string;
  progress: number;
  status: string;
}

interface SetupWizardState {
  showSetupWizard: boolean;
  setShowSetupWizard: (show: boolean) => void;
}

interface OverviewTabProps {
  projects: Project[];
  tasks: Task[];
  risks: Risk[];
  kras: KRA[];
  setupState: SetupWizardState;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  projects, 
  tasks, 
  risks, 
  kras, 
  setupState 
}) => {
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const reviewTasks = tasks.filter(task => task.status === 'review').length;

  const activeProjects = projects.filter(project => project.status === 'in-progress').length;
  const completedProjects = projects.filter(project => project.status === 'completed').length;
  const plannedProjects = projects.filter(project => project.status === 'planned').length;
  const onHoldProjects = projects.filter(project => project.status === 'on-hold').length;

  const activeRisks = risks.filter(risk => 
    ['identified', 'analyzing', 'mitigating', 'monitoring'].includes(risk.status)
  ).length;

  // Sample chart data
  const taskStatusData = [
    { name: 'To Do', value: todoTasks, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks, color: '#fbbf24' },
    { name: 'Review', value: reviewTasks, color: '#f59e0b' },
    { name: 'Done', value: completedTasks, color: '#34d399' }
  ];

  const projectStatusData = [
    { name: 'Planned', value: plannedProjects, color: '#3b82f6' },
    { name: 'In Progress', value: activeProjects, color: '#fbbf24' },
    { name: 'Completed', value: completedProjects, color: '#34d399' },
    { name: 'On Hold', value: onHoldProjects, color: '#ef4444' }
  ];

  // Monthly task completion sample data
  const monthlyCompletionData = [
    { name: 'Jan', completed: 5, added: 8 },
    { name: 'Feb', completed: 7, added: 6 },
    { name: 'Mar', completed: 10, added: 12 },
    { name: 'Apr', completed: 8, added: 5 },
    { name: 'May', completed: 12, added: 9 },
    { name: 'Jun', completed: 15, added: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed, {inProgressTasks} in progress
            </p>
            <Progress className="h-2 mt-2" value={(completedTasks / tasks.length) * 100 || 0} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active, {completedProjects} completed
            </p>
            <Progress className="h-2 mt-2" value={(completedProjects / projects.length) * 100 || 0} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRisks}</div>
            <p className="text-xs text-muted-foreground">
              {risks.length - activeRisks} resolved
            </p>
            <Progress 
              className="h-2 mt-2" 
              value={((risks.length - activeRisks) / risks.length) * 100 || 0} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KRA Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kras.reduce((acc, kra) => acc + kra.progress, 0) / kras.length || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {kras.filter(kra => kra.status === 'closed').length} completed
            </p>
            <Progress 
              className="h-2 mt-2" 
              value={kras.reduce((acc, kra) => acc + kra.progress, 0) / kras.length || 0} 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Overview of tasks by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Overview of projects by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Projects">
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Task Trends</CardTitle>
          <CardDescription>Tasks completed vs. new tasks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#34d399" 
                  activeDot={{ r: 8 }} 
                  name="Completed Tasks"
                />
                <Line 
                  type="monotone" 
                  dataKey="added" 
                  stroke="#3b82f6" 
                  name="New Tasks" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab; 