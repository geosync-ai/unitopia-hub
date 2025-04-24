import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { User, Paperclip, Clock, MessageSquare, FileText, AlertCircle, Bold, Italic, Underline, Link, Image, Code, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  created_at: string;
  type: 'public-reply' | 'private-comment' | 'note' | 'system-message';
  created_by: number;
  creator?: {
    name: string;
    email: string;
  };
  attachments?: any[];
}

interface TicketMessagesProps {
  ticketId: string;
  currentUserId: number;
}

const TicketMessages: React.FC<TicketMessagesProps> = ({ ticketId, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<string>('public-reply');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<{[key: number]: {name: string, email: string}}>({}); 

  // Mock data for now
  const mockMessages = [
    {
      id: "1",
      content: "Ex beatae aliquid militia. Enim doloremque molestiae voluptatem recusandae. Maxime beatae nostrum ut. Deserunt totam aut nihil quo beatae. Quas non delectus praesentium est illum vitae nemo iure.",
      created_at: "2022-02-09T10:31:00Z",
      type: "public-reply",
      created_by: 1,
      creator: {
        name: "Allie Harmon",
        email: "aharmon@example.com"
      },
      attachments: [
        { name: "Screen_shot.png", date: "2022-06-16T13:30:00Z" },
        { name: "Screen_shot.png", date: "2022-06-16T13:30:00Z" }
      ]
    },
    {
      id: "2",
      content: "Dolorem similique et aliquid illum dolor. Vel quo magnam.",
      created_at: "2022-02-09T10:31:00Z",
      type: "public-reply",
      created_by: 1,
      creator: {
        name: "Allie Harmon",
        email: "aharmon@example.com"
      }
    }
  ];

  useEffect(() => {
    if (!ticketId) return;
    
    // Use mock data for now
    setMessages(mockMessages);
    
    // Real implementation would fetch messages
    /*
    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */
  }, [ticketId]);

  // Fetch staff info once for message creators
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_members')
          .select('id, name, email');

        if (error) throw error;

        if (data) {
          const staffMap = data.reduce((acc, staff) => {
            acc[staff.id] = { name: staff.name, email: staff.email };
            return acc;
          }, {} as {[key: number]: {name: string, email: string}});
          setStaff(staffMap);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      }
    };

    // Uncomment when ready to use real data
    // fetchStaff();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        // Enhance messages with creator info
        const enhancedMessages = data.map(message => ({
          ...message,
          creator: staff[message.created_by]
        }));
        setMessages(enhancedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: "There was an error loading the ticket messages.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate sending message with mock data
      const newMsg = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        created_at: new Date().toISOString(),
        type: activeTab as 'public-reply' | 'private-comment' | 'note' | 'system-message',
        created_by: currentUserId,
        creator: {
          name: "Allie Harmon",
          email: "aharmon@example.com"
        }
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
      
      // Real implementation would use supabase
      /*
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          content: newMessage,
          created_by: currentUserId,
          type: activeTab
        });

      if (error) throw error;

      // Update ticket status if sending public reply
      if (activeTab === 'public-reply') {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ 
            status: 'in-progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);

        if (updateError) throw updateError;
      }

      setNewMessage('');
      fetchMessages();
      */

      toast({
        title: "Message sent",
        description: activeTab === 'public-reply' 
          ? "Your reply has been sent and the ticket updated." 
          : "Your message has been added to the ticket.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const renderAttachments = (attachments: any[]) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="ml-11 mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-3 py-1.5 text-xs"
          >
            <div className="text-gray-600 dark:text-gray-400">
              {attachment.name}
            </div>
            <div className="text-gray-500 dark:text-gray-500">
              {format(new Date(attachment.date), 'dd MMM yyyy, h:mm a')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="public-reply" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="public-reply">Public Reply</TabsTrigger>
                <TabsTrigger value="private-comment">Private Comment</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'public-reply' && (
            <div className="flex items-center mb-2 gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">To:</div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=Allison%20Westervelt`} />
                  <AvatarFallback>AW</AvatarFallback>
                </Avatar>
                <span className="text-sm">Allison Westervelt &lt;awestervelt@email.com&gt;</span>
                <button className="ml-1 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18"></path>
                    <path d="M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {messages.map(message => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.creator?.name}`} />
                    <AvatarFallback>{message.creator ? getInitials(message.creator.name) : 'UN'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{message.creator?.name}</div>
                        <div className="text-xs text-gray-500">
                          To: Danny Amacher &lt;danny@capacity.com&gt;
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                        <button className="ml-2 text-gray-400 hover:text-gray-600">
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-700 dark:text-gray-300">
                      {message.content}
                    </div>
                    {message.attachments && renderAttachments(message.attachments)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add a reply..."
            className="min-h-[120px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          
          <div className="px-3 py-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2">
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Bold">
                <Bold className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Italic">
                <Italic className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Underline">
                <Underline className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Link">
                <Link className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Image">
                <Image className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Code">
                <Code className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Attachment">
                <Paperclip className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="mr-2">
                <Badge variant="outline" className="cursor-pointer">Add to KB</Badge>
              </div>
              <Button onClick={handleSubmit} disabled={!newMessage.trim() || isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketMessages; 