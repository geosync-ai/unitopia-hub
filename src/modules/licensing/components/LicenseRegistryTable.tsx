import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming these are ShadCN table components
import { Input } from '@/components/ui/input'; // ShadCN input
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // ShadCN select
import { Button } from '@/components/ui/button'; // ShadCN button
import { Badge } from '@/components/ui/badge'; // ShadCN badge
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  FileImage,
  Edit3,
  Trash2,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added for dropdown

const DOTS = '...'; // Ellipsis marker

// Helper function to generate pagination items
const getPaginationItems = (currentPage: number, totalPages: number, siblingCount = 1): (string | number)[] => {
  const totalPageNumbers = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*DOTS

  if (totalPageNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
    return [firstPageIndex, DOTS, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }
  // Default case for safety, though ideally covered above
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// Mock data structure - adjust as per actual license data
interface LicenseRecord {
  id: string;
  licenseNumber: string;
  licenseeName: string;
  licenseType: string;
  issuedDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  dateGenerated: string; // Assuming a string like 'YYYY-MM-DD HH:mm'
}

// Mock data - replace with actual data fetching later
const MOCK_LICENSES: LicenseRecord[] = [
  {
    id: '1',
    licenseNumber: 'CML123456',
    licenseeName: 'ABC Corporation Ltd.',
    licenseType: 'Investment Advisor',
    issuedDate: '2023-01-15',
    expiryDate: '2024-01-14',
    status: 'Active',
    dateGenerated: '2023-01-10 10:30',
  },
  {
    id: '2',
    licenseNumber: 'CML654321',
    licenseeName: 'XYZ Ventures Inc.',
    licenseType: 'Broker-Dealer',
    issuedDate: '2022-07-01',
    expiryDate: '2023-06-30',
    status: 'Expired',
    dateGenerated: '2022-06-25 14:15',
  },
  {
    id: '3',
    licenseNumber: 'CML789012',
    licenseeName: 'Pacific Funds Management',
    licenseType: 'Fund Manager',
    issuedDate: '2023-03-01',
    expiryDate: '2023-12-31', // Example: Expiring soon if current date is late 2023
    status: 'Expiring Soon',
    dateGenerated: '2023-02-20 09:00',
  },
  // Add more mock data as needed (e.g., 10-15 records for pagination)
  {
    id: '4',
    licenseNumber: 'CML234567',
    licenseeName: 'Global Trust Co.',
    licenseType: 'Trustee Services',
    issuedDate: '2023-05-20',
    expiryDate: '2024-05-19',
    status: 'Active',
    dateGenerated: '2023-05-15 11:00',
  },
  {
    id: '5',
    licenseNumber: 'CML890123',
    licenseeName: 'Alpha Investments',
    licenseType: 'Investment Advisor',
    issuedDate: '2022-11-01',
    expiryDate: '2023-10-31',
    status: 'Expired',
    dateGenerated: '2022-10-25 16:45',
  },
  // Added 5 more mock records for pagination
  {
    id: '6',
    licenseNumber: 'CML345678',
    licenseeName: 'Beta Finance Group',
    licenseType: 'Fund Manager',
    issuedDate: '2023-02-10',
    expiryDate: '2024-02-09',
    status: 'Active',
    dateGenerated: '2023-02-05 09:30',
  },
  {
    id: '7',
    licenseNumber: 'CML901234',
    licenseeName: 'Gamma Solutions Ltd.',
    licenseType: 'Broker-Dealer',
    issuedDate: '2023-08-01',
    expiryDate: '2024-07-31',
    status: 'Active',
    dateGenerated: '2023-07-25 11:15',
  },
  {
    id: '8',
    licenseNumber: 'CML456789',
    licenseeName: 'Delta Consulting',
    licenseType: 'Investment Advisor',
    issuedDate: '2022-05-15',
    expiryDate: '2023-05-14',
    status: 'Expired',
    dateGenerated: '2022-05-10 14:00',
  },
  {
    id: '9',
    licenseNumber: 'CML012345',
    licenseeName: 'Epsilon Holdings',
    licenseType: 'Trustee Services',
    issuedDate: '2023-11-20',
    expiryDate: '2024-01-15', // Expiring Soon
    status: 'Expiring Soon',
    dateGenerated: '2023-11-15 10:00',
  },
  {
    id: '10',
    licenseNumber: 'CML567890',
    licenseeName: 'Zeta Capital Partners',
    licenseType: 'Fund Manager',
    issuedDate: '2023-06-01',
    expiryDate: '2024-05-31',
    status: 'Active',
    dateGenerated: '2023-05-28 12:30',
  },
  // Added 5 more mock records for 3 pages of pagination
  {
    id: '11',
    licenseNumber: 'CML112233',
    licenseeName: 'Omega Investments PLC',
    licenseType: 'Investment Advisor',
    issuedDate: '2023-01-20',
    expiryDate: '2024-01-19',
    status: 'Active',
    dateGenerated: '2023-01-15 09:00',
  },
  {
    id: '12',
    licenseNumber: 'CML445566',
    licenseeName: 'Sigma Securities Ltd.',
    licenseType: 'Broker-Dealer',
    issuedDate: '2022-09-10',
    expiryDate: '2023-09-09',
    status: 'Expired',
    dateGenerated: '2022-09-05 14:30',
  },
  {
    id: '13',
    licenseNumber: 'CML778899',
    licenseeName: 'Theta Asset Management',
    licenseType: 'Fund Manager',
    issuedDate: '2023-04-05',
    expiryDate: '2024-02-28', // Expiring soon
    status: 'Expiring Soon',
    dateGenerated: '2023-03-30 11:45',
  },
  {
    id: '14',
    licenseNumber: 'CML001122',
    licenseeName: 'Iota Trust Services',
    licenseType: 'Trustee Services',
    issuedDate: '2023-07-15',
    expiryDate: '2024-07-14',
    status: 'Active',
    dateGenerated: '2023-07-10 10:15',
  },
  {
    id: '15',
    licenseNumber: 'CML334455',
    licenseeName: 'Kappa Advisory Co.',
    licenseType: 'Investment Advisor',
    issuedDate: '2022-12-01',
    expiryDate: '2023-11-30',
    status: 'Expired',
    dateGenerated: '2022-11-25 15:00',
  },
];

const ITEMS_PER_PAGE = 5;

const LicenseRegistryTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLicenses = useMemo(() => {
    return MOCK_LICENSES.filter((license) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm =
        license.licenseNumber.toLowerCase().includes(searchTermLower) ||
        license.licenseeName.toLowerCase().includes(searchTermLower);
      const matchesLicenseType =
        !licenseTypeFilter || license.licenseType === licenseTypeFilter;
      const matchesStatus = !statusFilter || license.status === statusFilter;
      return matchesSearchTerm && matchesLicenseType && matchesStatus;
    });
  }, [searchTerm, licenseTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE);
  const paginatedLicenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLicenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLicenses, currentPage]);

  // Use the helper function to get pagination items
  const paginationItems = useMemo(() => {
    return getPaginationItems(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const getStatusBadgeVariant = (status: LicenseRecord['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Active':
        return 'default'; // Green in many ShadCN themes
      case 'Expiring Soon':
        return 'secondary'; // Orange/Yellow
      case 'Expired':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };
  
  // Placeholder for unique license types for the filter dropdown
  const uniqueLicenseTypes = useMemo(() => {
    const types = new Set(MOCK_LICENSES.map(l => l.licenseType));
    return Array.from(types);
  }, []);


  return (
    <div className="bg-gray-100 dark:bg-intranet-dark min-h-screen">
      <div className="container mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 border border-gray-300 dark:border-gray-600">
        {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 md:mb-8">License Registry</h1> */}

        {/* Table Controls */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="search"
                  type="text"
                  placeholder="License No. or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="licenseTypeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Type</label>
              <Select value={licenseTypeFilter} onValueChange={setLicenseTypeFilter}>
                <SelectTrigger id="licenseTypeFilter">
                  <SelectValue placeholder="All License Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All License Types</SelectItem>
                  {uniqueLicenseTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {/* Removed Apply Filters button as filtering is now instant */}
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>License Number</TableHead>
                <TableHead>Licensee Name</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLicenses.length > 0 ? (
                paginatedLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.licenseNumber}</TableCell>
                    <TableCell>{license.licenseeName}</TableCell>
                    <TableCell>{license.licenseType}</TableCell>
                    <TableCell>{license.issuedDate}</TableCell>
                    <TableCell>{license.expiryDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(license.status)} className="whitespace-nowrap">
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{license.dateGenerated}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Save Button (formerly Edit) */}
                        <Button variant="ghost" size="icon" title="Save">
                          <Edit3 className="h-4 w-4 text-purple-600" /> {/* Icon can be changed later if needed */}
                        </Button>
                        
                        {/* Delete Button */}
                        <Button variant="ghost" size="icon" title="Delete">
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>

                        {/* More Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="More actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => console.log('View action clicked for', license.id)}>
                              <Eye className="mr-2 h-4 w-4 text-blue-600" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('Download PDF action clicked for', license.id)}>
                              <FileText className="mr-2 h-4 w-4 text-red-600" />
                              <span>Download PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('Download JPEG action clicked for', license.id)}>
                              <FileImage className="mr-2 h-4 w-4 text-yellow-500" />
                              <span>Download JPEG</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No licenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
           <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {paginationItems.map((item, index) => {
                if (typeof item === 'string') { // Ellipsis
                  return (
                    <span key={`${item}-${index}`} className="flex items-center justify-center w-9 h-9 text-sm text-gray-500">
                      {DOTS}
                    </span>
                  );
                }
                // Page number button
                return (
                  <Button
                    key={item}
                    variant={currentPage === item ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(item)}
                    className="w-9 h-9 p-0"
                    aria-label={`Go to page ${item}`}
                  >
                    {item}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseRegistryTable; 