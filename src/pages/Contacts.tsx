import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Phone, Mail, MapPin, Plus, RefreshCw } from 'lucide-react';
import OrganizationalStructure from '@/components/contacts/OrganizationalStructure';
import useMicrosoftContacts, { MicrosoftContact } from '@/hooks/useMicrosoftContacts';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const { contacts, isLoading, error, refetch } = useMicrosoftContacts();
  const { isAuthenticated, loginWithMicrosoft } = useAuth();
  
  // Get unique departments from contacts
  const departments = ['All', ...new Set(contacts
    .map(contact => contact.department)
    .filter((dept): dept is string => !!dept))];
  
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.jobTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (contact.emailAddresses?.[0]?.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || (contact.department?.toLowerCase() || '') === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const renderContactCard = (contact: MicrosoftContact, index: number) => (
    <Card key={contact.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.05}s` }}>
      <div className="h-12 bg-gradient-to-r from-intranet-primary to-intranet-secondary"></div>
      <CardContent className="p-6 pt-0 relative">
        <div className="flex justify-center">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.displayName}&backgroundColor=600018`}
            alt={contact.displayName}
            className="w-20 h-20 rounded-full border-4 border-background -mt-10 shadow-md"
          />
        </div>
        
        <div className="text-center mt-2">
          <h3 className="font-bold">{contact.displayName}</h3>
          <p className="text-sm text-muted-foreground">{contact.jobTitle || 'No position specified'}</p>
          {contact.department && (
            <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full mt-1">
              {contact.department}
            </span>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          {contact.emailAddresses?.[0] && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-intranet-primary" />
              <span className="truncate">{contact.emailAddresses[0].address}</span>
            </div>
          )}
          
          {(contact.businessPhones?.[0] || contact.mobilePhone) && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-intranet-primary" />
              <span>{contact.businessPhones?.[0] || contact.mobilePhone}</span>
            </div>
          )}
          
          {contact.officeLocation && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-intranet-primary" />
              <span>{contact.officeLocation}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button variant="outline" size="sm" className="w-full icon-hover-effect">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
            
            <div className="flex gap-2">
              <Button 
                className="whitespace-nowrap animate-fade-in btn-hover-effect" 
                style={{ animationDelay: '0.2s' }}
                onClick={refetch}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button className="whitespace-nowrap animate-fade-in btn-hover-effect" style={{ animationDelay: '0.2s' }}>
                <Plus size={16} className="mr-1" />
                Add Contact
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-12 bg-gradient-to-r from-intranet-primary to-intranet-secondary"></div>
                  <CardContent className="p-6 pt-0 relative">
                    <div className="flex justify-center">
                      <Skeleton className="w-20 h-20 rounded-full -mt-10" />
                    </div>
                    <div className="text-center mt-2">
                      <Skeleton className="h-6 w-32 mx-auto mb-2" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact, index) => renderContactCard(contact, index))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No contacts found matching your search criteria
              </div>
            )}
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
