import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { User, Paperclip, Clock, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

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

  // Fetch messages
  useEffect(() => {
    if (!ticketId) return;
    
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

    fetchStaff();
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

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'public-reply':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'private-comment':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'note':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'system-message':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderMessage = (message: Message) => {
    const creatorName = message.creator?.name || 'Unknown';
    const isSystem = message.type === 'system-message';
    
    return (
      <div 
        key={message.id} 
        className={`mb-6 ${isSystem ? 'bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm italic' : ''}`}
      >
        {!isSystem ? (
          <>
            <div className="flex items-start space-x-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {creatorName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{creatorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {getMessageIcon(message.type)}
                      <span>{message.type.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-11 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {message.content}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{message.content}</span>
            <span className="text-xs ml-auto">
              {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length > 0 ? (
          <div>
            {messages.map(renderMessage)}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <Tabs 
            defaultValue="public-reply" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="public-reply">Public Reply</TabsTrigger>
              <TabsTrigger value="private-comment">Private Comment</TabsTrigger>
              <TabsTrigger value="note">Note</TabsTrigger>
            </TabsList>
            
            <TabsContent value="public-reply" className="mt-0">
              <div className="mb-2 flex items-center space-x-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">To:</div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 flex items-center space-x-1 text-sm">
                  <User className="w-3 h-3" />
                  <span>Requester</span>
                </div>
              </div>
            </TabsContent>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded">
              <Textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  activeTab === 'public-reply' 
                    ? "Type your reply to the requester..." 
                    : activeTab === 'private-comment'
                    ? "Add an internal comment (only visible to staff)..."
                    : "Add a note to this ticket..."
                }
                className="min-h-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              
              <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <Paperclip className="h-5 w-5" />
                </button>
                <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
                  {isSubmitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
};

export default TicketMessages; 