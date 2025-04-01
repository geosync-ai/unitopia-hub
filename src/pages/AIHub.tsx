
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Lightbulb, FileText, Search, Send } from 'lucide-react';

const AIHub = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{type: 'user' | 'ai', content: string}[]>([
    { type: 'ai', content: 'Hello! I\'m your SCPNG AI Assistant. How can I help you today?' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: query }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `I'm simulating an AI response to your query: "${query}". In a real environment, this would connect to your configured AI provider.` 
      }]);
    }, 1000);
    
    setQuery('');
  };

  // Sample knowledge areas
  const knowledgeAreas = [
    { 
      title: 'Organizational Policies', 
      description: 'Access and query all organizational policies and procedures',
      icon: FileText 
    },
    { 
      title: 'Technical Knowledge Base', 
      description: 'Technical documentation and troubleshooting guides',
      icon: Lightbulb 
    },
    { 
      title: 'Project Management', 
      description: 'Best practices and organizational standards for projects',
      icon: MessageSquare 
    },
    { 
      title: 'Employee Resources', 
      description: 'HR information, benefits, and professional development',
      icon: Search 
    },
  ];

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI Knowledge Hub</h1>
        <p className="text-gray-500">Access AI-powered insights and search across organizational knowledge</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 text-intranet-primary" size={20} />
                AI Assistant
              </CardTitle>
              <CardDescription>Ask questions and get intelligent responses from your AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 h-72 overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 ${message.type === 'user' ? 'text-right' : ''}`}
                  >
                    <div 
                      className={`inline-block rounded-lg p-3 max-w-[80%] ${
                        message.type === 'user' 
                          ? 'bg-intranet-primary text-white' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your question..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-intranet-primary hover:bg-intranet-secondary">
                  <Send size={18} />
                </Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mb-3">Popular Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "What are our current IT security protocols?",
              "How do I submit a vacation request?",
              "When is the next company-wide meeting?",
              "Where can I find the latest project templates?"
            ].map((question, i) => (
              <Button 
                key={i} 
                variant="outline" 
                className="justify-start h-auto py-3 px-4 font-normal"
                onClick={() => {
                  setQuery(question);
                  setMessages(prev => [...prev, { type: 'user', content: question }]);
                  
                  // Simulate AI response
                  setTimeout(() => {
                    setMessages(prev => [...prev, { 
                      type: 'ai', 
                      content: `I'm simulating an AI response to: "${question}". This would connect to your configured AI provider.` 
                    }]);
                  }, 1000);
                }}
              >
                <MessageSquare size={16} className="mr-2 text-intranet-primary" />
                {question}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Areas</CardTitle>
              <CardDescription>Explore specialized knowledge domains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeAreas.map((area, index) => (
                <div key={index} className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="bg-intranet-light p-2 rounded-lg mr-3">
                    <area.icon size={18} className="text-intranet-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{area.title}</h3>
                    <p className="text-sm text-gray-500">{area.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Your unit's AI is configured to use:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Primary Model</div>
                  <div className="text-sm text-gray-500">OpenAI GPT-4</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Knowledge Sources</div>
                  <div className="text-sm text-gray-500">6 databases connected</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">Last Training</div>
                  <div className="text-sm text-gray-500">May 10, 2023</div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Request Configuration Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default AIHub;
