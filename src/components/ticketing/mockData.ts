import { Ticket } from './TicketList';

export const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Laudantium neque veritatis',
    code: 'OPS-102',
    date: 'Jun 2',
    status: 'to-do',
    priority: 'medium',
    assignees: ['Allie Harmon']
  },
  {
    id: '2',
    title: 'Soluta quam velit',
    code: 'APPS-216',
    date: 'Jun 2',
    status: 'to-do',
    priority: 'low',
    assignees: ['John Smith']
  },
  {
    id: '3',
    title: 'Molestiae saepe illum',
    code: 'APPS-216',
    date: 'Jun 1',
    status: 'open',
    priority: 'medium',
    assignees: ['Allie Harmon']
  },
  {
    id: '4',
    title: 'Dignissimos maiores porro',
    code: 'APPS-216',
    date: 'May 31',
    status: 'closed',
    priority: 'low',
    assignees: ['Alex Johnson']
  },
  {
    id: '5',
    title: 'Nihil porro repudiandae',
    code: 'APPS-216',
    date: 'May 31',
    status: 'closed',
    priority: 'low',
    assignees: ['Allie Harmon']
  },
  {
    id: '6',
    title: 'Aspernatur cumque ipsum',
    code: 'APPS-216',
    date: 'May 30',
    status: 'closed',
    priority: 'low',
    assignees: ['Support Agent']
  },
  {
    id: '7',
    title: 'Culpa quos aliquam',
    code: 'APPS-216',
    date: 'May 30',
    status: 'in-progress',
    priority: 'medium',
    assignees: ['Service Desk']
  },
  {
    id: '8',
    title: 'Atque incidunt autem',
    code: 'APPS-216',
    date: 'May 30',
    status: 'in-progress',
    priority: 'high',
    assignees: ['Technical Support']
  },
  {
    id: '9',
    title: 'Ut sapiente sunt',
    code: 'APPS-216',
    date: 'May 29',
    status: 'resolved',
    priority: 'urgent',
    assignees: ['IT Support']
  }
];

// Sample content for different menu items
export interface MenuSection {
  id: string;
  label: string;
  count?: number;
  icon: string;
  component: React.ComponentType<any>;
}

export interface TicketData {
  tickets: Ticket[];
}

export const getTicketById = (id: string): Ticket | undefined => {
  return mockTickets.find(ticket => ticket.id === id);
}; 