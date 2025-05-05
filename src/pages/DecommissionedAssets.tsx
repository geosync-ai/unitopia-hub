
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { Eye, Edit, Trash2, Search, RotateCcw } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";

// Sample decommissioned assets data
const decommissionedAssets = [
  {
    id: '1',
    name: 'Dell XPS 15',
    asset_id: 'DELL-001',
    type: 'Laptop',
    condition: 'Decommissioned',
    reason: 'Obsolete',
    decommission_date: '2023-01-15',
    assigned_to: 'John Doe',
    email: 'john.doe@example.com',
    unit: 'IT Unit',
    division: 'Corporate Services',
    description: 'Old laptop with damaged screen',
    assigned_date: '2020-06-01',
    purchased_date: '2020-05-15',
    last_updated: '2023-01-15'
  },
  {
    id: '2',
    name: 'HP LaserJet Pro',
    asset_id: 'HP-002',
    type: 'Printer',
    condition: 'Decommissioned',
    reason: 'Damaged',
    decommission_date: '2023-02-20',
    assigned_to: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    unit: 'Marketing',
    division: 'Corporate Services',
    description: 'Office printer with mechanical issues',
    assigned_date: '2019-03-10',
    purchased_date: '2019-02-28',
    last_updated: '2023-02-20'
  },
  {
    id: '3',
    name: 'Cisco IP Phone',
    asset_id: 'CISCO-003',
    type: 'Phone',
    condition: 'Decommissioned',
    reason: 'Replaced',
    decommission_date: '2023-03-05',
    assigned_to: 'Mike Williams',
    email: 'mike.williams@example.com',
    unit: 'Legal Advisory',
    division: 'Legal Services',
    description: 'Office phone replaced with newer model',
    assigned_date: '2018-11-15',
    purchased_date: '2018-10-30',
    last_updated: '2023-03-05'
  },
  {
    id: '4',
    name: 'Apple iMac',
    asset_id: 'APPLE-004',
    type: 'Desktop PC',
    condition: 'Decommissioned',
    reason: 'Obsolete',
    decommission_date: '2023-04-12',
    assigned_to: 'Emma Davis',
    email: 'emma.davis@example.com',
    unit: 'Design',
    division: 'Marketing',
    description: 'Design team iMac, no longer compatible with new software',
    assigned_date: '2017-08-20',
    purchased_date: '2017-08-10',
    last_updated: '2023-04-12'
  }
];

const DecommissionedAssets: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState<string>('decommission_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Extract unique values for filters
  const types = [...new Set(decommissionedAssets.map(asset => asset.type))];
  const reasons = [...new Set(decommissionedAssets.map(asset => asset.reason))];
  const units = [...new Set(decommissionedAssets.map(asset => asset.unit))];
  const divisions = [...new Set(decommissionedAssets.map(asset => asset.division))];

  // Apply filters and sorting
  const filteredAssets = decommissionedAssets.filter(asset => {
    const matchesSearch = 
      searchTerm === '' || 
      Object.values(asset).some(val => 
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesReason = reasonFilter === 'all' || asset.reason === reasonFilter;
    const matchesUnit = unitFilter === 'all' || asset.unit === unitFilter;
    const matchesDivision = divisionFilter === 'all' || asset.division === divisionFilter;
    
    return matchesSearch && matchesType && matchesReason && matchesUnit && matchesDivision;
  }).sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setReasonFilter('all');
    setUnitFilter('all');
    setDivisionFilter('all');
  };

  // Handle asset actions
  const handleViewAsset = (asset: any) => {
    toast({
      title: 'View Asset',
      description: `Viewing decommissioned asset: ${asset.name}`,
    });
  };

  const handleEditAsset = (asset: any) => {
    toast({
      title: 'Edit Asset',
      description: `Editing decommissioned asset: ${asset.name}`,
    });
  };

  const handleDeleteAsset = (asset: any) => {
    toast({
      title: 'Delete Asset',
      description: `Deleting decommissioned asset: ${asset.name}`,
    });
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Decommissioned Assets</h1>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <TooltipWrapper content="Search decommissioned assets">
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </TooltipWrapper>
        </div>

        <div className="flex flex-wrap gap-3">
          <TooltipWrapper content="Filter by asset type">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipWrapper>

          <TooltipWrapper content="Filter by decommission reason">
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {reasons.map(reason => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipWrapper>

          <TooltipWrapper content="Filter by unit">
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipWrapper>

          <TooltipWrapper content="Filter by division">
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division} value={division}>{division}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipWrapper>

          <TooltipWrapper content="Reset all filters">
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </TooltipWrapper>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="responsive-table-container">
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white border-b">
                  <TableRow>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('name')}>
                      <TooltipWrapper content="Click to sort by name">
                        <div className="flex items-center">
                          Name {renderSortIndicator('name')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('asset_id')}>
                      <TooltipWrapper content="Click to sort by asset ID">
                        <div className="flex items-center">
                          Asset ID {renderSortIndicator('asset_id')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('type')}>
                      <TooltipWrapper content="Click to sort by type">
                        <div className="flex items-center">
                          Type {renderSortIndicator('type')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('reason')}>
                      <TooltipWrapper content="Click to sort by reason">
                        <div className="flex items-center">
                          Reason {renderSortIndicator('reason')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('assigned_to')}>
                      <TooltipWrapper content="Click to sort by assigned person">
                        <div className="flex items-center">
                          Assigned To {renderSortIndicator('assigned_to')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('email')}>
                      <TooltipWrapper content="Click to sort by email">
                        <div className="flex items-center">
                          Email {renderSortIndicator('email')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('unit')}>
                      <TooltipWrapper content="Click to sort by unit">
                        <div className="flex items-center">
                          Unit {renderSortIndicator('unit')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('division')}>
                      <TooltipWrapper content="Click to sort by division">
                        <div className="flex items-center">
                          Division {renderSortIndicator('division')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('decommission_date')}>
                      <TooltipWrapper content="Click to sort by decommission date">
                        <div className="flex items-center">
                          Decommission Date {renderSortIndicator('decommission_date')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('purchased_date')}>
                      <TooltipWrapper content="Click to sort by purchase date">
                        <div className="flex items-center">
                          Purchase Date {renderSortIndicator('purchased_date')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="font-medium cursor-pointer whitespace-nowrap max-w-[200px]" onClick={() => handleSort('description')}>
                      <TooltipWrapper content="Click to sort by description">
                        <div className="flex items-center">
                          Description {renderSortIndicator('description')}
                        </div>
                      </TooltipWrapper>
                    </TableHead>
                    <TableHead className="text-right font-medium sticky right-0 bg-white z-20 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center">
                        No decommissioned assets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Asset name: ${asset.name}`}>
                            {asset.name}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Asset ID: ${asset.asset_id}`}>
                            {asset.asset_id}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Asset type: ${asset.type}`}>
                            {asset.type}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Reason for decommissioning: ${asset.reason}`}>
                            {asset.reason}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Last assigned to: ${asset.assigned_to}`}>
                            {asset.assigned_to}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={asset.email}>
                            {asset.email}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={asset.unit}>
                            {asset.unit}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={asset.division}>
                            {asset.division}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Decommissioned on: ${formatDate(asset.decommission_date)}`}>
                            {formatDate(asset.decommission_date)}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <TooltipWrapper content={`Purchased on: ${formatDate(asset.purchased_date)}`}>
                            {formatDate(asset.purchased_date)}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <TooltipWrapper content={asset.description}>
                            {asset.description}
                          </TooltipWrapper>
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white z-10">
                          <DropdownMenu>
                            <TooltipWrapper content="Asset actions">
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipWrapper>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAsset(asset)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAsset(asset)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredAssets.length} of {decommissionedAssets.length} decommissioned assets
      </div>
    </div>
  );
};

export default DecommissionedAssets;
