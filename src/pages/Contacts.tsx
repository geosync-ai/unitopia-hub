
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Phone, Mail, MapPin, Plus } from 'lucide-react';
import OrganizationalStructure from '@/components/contacts/OrganizationalStructure';

interface Contact {
  id: number;
  name: string;
  position: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  avatar: string;
}

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Mock contact data
  const departments = ['All', 'Executive', 'IT', 'Finance', 'Marketing', 'HR', 'Operations'];
  
  const contacts: Contact[] = [
    {
      id: 1,
      name: 'John Anderson',
      position: 'CEO',
      department: 'Executive',
      location: 'Brisbane, Australia',
      email: 'john.anderson@scpng.com',
      phone: '+61 3 9876 5432',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=JA&backgroundColor=600018`
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      position: 'CTO',
      department: 'IT',
      location: 'Sydney, Australia',
      email: 'sarah.johnson@scpng.com',
      phone: '+61 2 8765 4321',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=SJ&backgroundColor=600018`
    },
    {
      id: 3,
      name: 'Michael Chen',
      position: 'Finance Director',
      department: 'Finance',
      location: 'Melbourne, Australia',
      email: 'michael.chen@scpng.com',
      phone: '+61 4 7654 3210',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=MC&backgroundColor=600018`
    },
    {
      id: 4,
      name: 'Emily Wilson',
      position: 'Marketing Manager',
      department: 'Marketing',
      location: 'Perth, Australia',
      email: 'emily.wilson@scpng.com',
      phone: '+61 8 6543 2109',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=EW&backgroundColor=600018`
    },
    {
      id: 5,
      name: 'David Thompson',
      position: 'HR Director',
      department: 'HR',
      location: 'Brisbane, Australia',
      email: 'david.thompson@scpng.com',
      phone: '+61 7 5432 1098',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=DT&backgroundColor=600018`
    },
    {
      id: 6,
      name: 'Lisa Wang',
      position: 'Operations Manager',
      department: 'Operations',
      location: 'Adelaide, Australia',
      email: 'lisa.wang@scpng.com',
      phone: '+61 8 4321 0987',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=LW&backgroundColor=600018`
    },
    {
      id: 7,
      name: 'Robert Brown',
      position: 'IT Manager',
      department: 'IT',
      location: 'Sydney, Australia',
      email: 'robert.brown@scpng.com',
      phone: '+61 2 3210 9876',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=RB&backgroundColor=600018`
    },
    {
      id: 8,
      name: 'Jessica Lee',
      position: 'Financial Analyst',
      department: 'Finance',
      location: 'Melbourne, Australia',
      email: 'jessica.lee@scpng.com',
      phone: '+61 3 2109 8765',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=JL&backgroundColor=600018`
    },
  ];
  
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || contact.department.toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  return (
    <PageLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Contact Directory</h1>
        <p className="text-gray-500">Find and connect with colleagues across the organization</p>
      </div>
      
      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full md:w-64">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="structure">Organization Chart</TabsTrigger>
        </TabsList>
        
        <TabsContent value="directory">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow animate-fade-in">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, position, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="whitespace-nowrap btn-hover-effect"
              >
                All Departments
              </Button>
              
              {departments.slice(1).map((dept) => (
                <Button
                  key={dept}
                  variant={filter === dept.toLowerCase() ? 'default' : 'outline'}
                  onClick={() => setFilter(dept.toLowerCase())}
                  className="whitespace-nowrap btn-hover-effect"
                >
                  {dept}
                </Button>
              ))}
            </div>
            
            <Button className="whitespace-nowrap animate-fade-in btn-hover-effect" style={{ animationDelay: '0.2s' }}>
              <Plus size={16} className="mr-1" />
              Add Contact
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContacts.map((contact, index) => (
              <Card key={contact.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.05}s` }}>
                <div className="h-12 bg-gradient-to-r from-intranet-primary to-intranet-secondary"></div>
                <CardContent className="p-6 pt-0 relative">
                  <div className="flex justify-center">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-20 h-20 rounded-full border-4 border-background -mt-10 shadow-md"
                    />
                  </div>
                  
                  <div className="text-center mt-2">
                    <h3 className="font-bold">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.position}</p>
                    <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full mt-1">
                      {contact.department}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-intranet-primary" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-intranet-primary" />
                      <span>{contact.phone}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-intranet-primary" />
                      <span>{contact.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm" className="w-full icon-hover-effect">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="structure">
          <OrganizationalStructure />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Contacts;
