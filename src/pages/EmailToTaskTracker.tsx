import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, FileText, BarChart2, Brain, Paperclip, Send, Tag, Menu } from 'lucide-react';

// Define interfaces for clearer data structure
interface Task {
  id: string;
  title: string;
  status: 'New' | 'In Progress' | 'Done' | 'Archived';
  urgency: 'High' | 'Medium' | 'Low';
  // Add more task fields as needed: description, comments, assignedTo, dueDate etc.
}

interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  attachments: { name: string; url: string }[];
  associatedTasks: Task[];
}

const EmailToTaskTracker: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [isSenderConfigVisible, setIsSenderConfigVisible] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState<Email | null>({
    id: 'email1',
    sender: 'important-client@example.com',
    subject: 'Urgent: Project Alpha Update Required',
    body: 'Hi team,\n\nPlease provide an update on Project Alpha by EOD today. Specifically, I need to know the current status of milestones 1 and 3, and any blocking issues.\n\nThanks,\nClient Contact',
    receivedAt: '2024-05-15T10:30:00Z',
    attachments: [{ name: 'project-alpha-brief.pdf', url: '#' }],
    associatedTasks: [
      { id: 'task1', title: 'Provide Project Alpha Milestone 1 Update', status: 'New', urgency: 'High' },
      { id: 'task2', title: 'Assess Project Alpha Milestone 3 Status', status: 'New', urgency: 'High' },
      { id: 'task3', title: 'Identify Blockers for Project Alpha', status: 'In Progress', urgency: 'Medium' },
      { id: 'task4', title: 'Draft Client Communication for Alpha Delays', status: 'New', urgency: 'Medium' },
      { id: 'task5', title: 'Schedule Follow-up Meeting with Client (Alpha)', status: 'Archived', urgency: 'Low' },
      { id: 'task6', title: 'Update Internal Dashboard with Alpha Progress', status: 'Done', urgency: 'Low' },
    ],
  });

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskDetailModalOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  };

  const toggleSenderConfig = () => {
    setIsSenderConfigVisible(!isSenderConfigVisible);
  };

  // Dummy monitored senders
  const monitoredSenders = [
    { id: 'sender1', email: 'hr@example.com' },
    { id: 'sender2', email: 'client@example.com' },
    { id: 'sender3', email: 'important-client@example.com' },
  ];

  return (
    <div className="flex h-[calc(100vh-theme-header-height)] bg-muted/40">
      {/* Sender Configuration Panel (Sidebar) - Conditional Rendering */}
      {isSenderConfigVisible && (
        <aside className="w-1/4 min-w-[300px] max-w-[400px] border-r bg-background p-6 flex flex-col gap-4 overflow-y-auto transition-all duration-300 ease-in-out">
          <h2 className="text-xl font-semibold">Sender Configuration</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monitored Senders</CardTitle>
              <CardDescription>Emails from these senders will automatically create tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {monitoredSenders.map(sender => (
                  <li key={sender.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted rounded-md">
                    <span>{sender.email}</span>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </li>
                ))}
              </ul>
              <Input type="email" placeholder="Add new sender email" className="mt-2" />
              <Button className="w-full mt-2"> <PlusCircle className="mr-2 h-4 w-4" /> Add Sender</Button>
            </CardContent>
          </Card>
          <div className="mt-auto space-y-2">
              <Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Print Reports</Button>
              <Button variant="outline" className="w-full"><Brain className="mr-2 h-4 w-4" /> AI Analysis</Button>
          </div>
        </aside>
      )}

      {/* Main Content Area: Email View (Left) and Associated Tasks (Right) */}
      <main className={`flex-1 flex flex-col p-6 overflow-y-hidden transition-all duration-300 ease-in-out`}>
        <header className="mb-6 flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSenderConfig} className="mr-4">
                <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-3xl font-bold">Email-to-Task Tracker</h1>
        </header>
        
        {selectedEmail ? (
          <div className="flex flex-1 overflow-y-hidden">
            {/* Email Content View */}
            <section className={`${isSenderConfigVisible ? 'w-1/2' : 'w-1/2'} border-r pr-6 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out`}>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-1">Email: {selectedEmail.subject}</h2>
                <p className="text-sm text-muted-foreground">From: {selectedEmail.sender} | Received: {new Date(selectedEmail.receivedAt).toLocaleString()}</p>
              </div>
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Email Body</CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap text-sm">
                  {selectedEmail.body}
                </CardContent>
              </Card>
              {selectedEmail.attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Attachments</h3>
                  <ul className="space-y-1">
                    {selectedEmail.attachments.map((att, index) => (
                      <li key={index} className="text-sm">
                        <a href={att.url} className="text-blue-600 hover:underline flex items-center">
                          <Paperclip className="h-4 w-4 mr-2" /> {att.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Associated Tasks View */}
            <section className={`${isSenderConfigVisible ? 'w-1/2' : 'w-1/2'} pl-6 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out`}>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Associated Tasks</h2>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Create New Task</Button>
              </div>
              <div className="space-y-4">
                {selectedEmail.associatedTasks.length > 0 ? selectedEmail.associatedTasks.map(task => (
                  <Card key={task.id} onClick={() => handleSelectTask(task)} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Status: <span className={`font-semibold ${task.status === 'New' ? 'text-blue-500' : task.status === 'In Progress' ? 'text-yellow-500' : 'text-green-500'}`}>{task.status}</span></p>
                      <p className="text-sm">Urgency: <span className={`font-semibold ${task.urgency === 'High' ? 'text-red-500' : task.urgency === 'Medium' ? 'text-orange-500' : 'text-gray-500'}`}>{task.urgency}</span></p>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-muted-foreground">No tasks associated with this email yet.</p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-lg">Select an email to view its details and associated tasks.</p>
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={isTaskDetailModalOpen} onOpenChange={setIsTaskDetailModalOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Task Details: {selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pr-2">
                <Card className="shadow-none border-none">
                    <CardContent className="space-y-4 pt-4">
                        <div>
                            <label htmlFor="taskStatusModal" className="text-sm font-medium block mb-1">Status</label>
                            <Input id="taskStatusModal" defaultValue={selectedTask.status} />
                        </div>
                        <div>
                            <label htmlFor="taskUrgencyModal" className="text-sm font-medium block mb-1">Urgency</label>
                            <Input id="taskUrgencyModal" defaultValue={selectedTask.urgency} />
                        </div>
                        <div>
                            <label htmlFor="taskCommentsModal" className="text-sm font-medium block mb-1">Comments</label>
                            <Textarea id="taskCommentsModal" placeholder="Add a comment..." rows={4}/>
                        </div>
                        <div>
                            <label htmlFor="taskAttachmentsModal" className="text-sm font-medium block mb-1">Attachments</label>
                            <Input id="taskAttachmentsModal" type="file" />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-md font-semibold mb-2">AI Insights (Placeholder)</h3>
                            <div className="space-y-1 text-sm p-3 bg-muted rounded-md">
                                <p><Tag className="h-4 w-4 mr-2 inline-block text-blue-500"/>Keywords: Project Alpha, Update, EOD</p>
                                <p><Send className="h-4 w-4 mr-2 inline-block text-red-500"/>Detected Urgency: High</p>
                                <p><Brain className="h-4 w-4 mr-2 inline-block text-green-500"/>Sentiment: Neutral-Negative</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <DialogFooter className="mt-auto pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseTaskModal}>Cancel</Button>
              </DialogClose>
              <Button type="button">Update Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmailToTaskTracker; 