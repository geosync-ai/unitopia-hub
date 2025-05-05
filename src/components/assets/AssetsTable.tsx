
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronUp, ChevronDown, Eye, Edit, Trash2 } from "lucide-react";
import { Asset } from "@/types/asset";
import { formatDate } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface AssetsTableProps {
  assets: Asset[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  divisionId?: string;
  onView?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

export function AssetsTable({ 
  assets, 
  onSort, 
  sortColumn, 
  sortDirection,
  divisionId,
  onView,
  onEdit,
  onDelete
}: AssetsTableProps) {
  // Function to render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  // Function to handle column click for sorting
  const handleColumnClick = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  return (
    <div className="rounded-md border">
      <div className="relative overflow-x-auto">
        {/* Ensure the container has a fixed height and overflow settings */}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
          <Table>
            {/* Apply sticky styling to table header */}
            <TableHeader className="sticky top-0 z-10 bg-white border-b">
              <TableRow>
                <TableCell className="w-12 p-2 text-center"></TableCell>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('name')}
                >
                  <div className="flex items-center">
                    Name {renderSortIndicator('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('id')}
                >
                  <div className="flex items-center">
                    ID {renderSortIndicator('id')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('type')}
                >
                  <div className="flex items-center">
                    Type {renderSortIndicator('type')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('condition')}
                >
                  <div className="flex items-center">
                    Condition {renderSortIndicator('condition')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('assignedTo')}
                >
                  <div className="flex items-center">
                    Assigned To {renderSortIndicator('assignedTo')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('email')}
                >
                  <div className="flex items-center">
                    Email {renderSortIndicator('email')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('unit')}
                >
                  <div className="flex items-center">
                    Unit {renderSortIndicator('unit')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('division')}
                >
                  <div className="flex items-center">
                    Division {renderSortIndicator('division')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('description')}
                >
                  <div className="flex items-center">
                    Description {renderSortIndicator('description')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('assignedDate')}
                >
                  <div className="flex items-center">
                    Assigned Date {renderSortIndicator('assignedDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('purchasedDate')}
                >
                  <div className="flex items-center">
                    Purchased Date {renderSortIndicator('purchasedDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-medium cursor-pointer"
                  onClick={() => handleColumnClick('lastUpdated')}
                >
                  <div className="flex items-center">
                    Last Updated {renderSortIndicator('lastUpdated')}
                  </div>
                </TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-24 text-center">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="p-2 text-center">
                      {asset.image ? (
                        <img 
                          src={asset.image} 
                          alt={asset.name} 
                          className="w-8 h-8 mx-auto rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 mx-auto rounded-md bg-gray-200 flex items-center justify-center">
                          {asset.name.charAt(0)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.asset_id || asset.id}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>{asset.condition}</TableCell>
                    <TableCell>{asset.assigned_to || asset.assignedTo}</TableCell>
                    <TableCell>{asset.email}</TableCell>
                    <TableCell>{asset.unit}</TableCell>
                    <TableCell>{asset.division}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{asset.description}</TableCell>
                    <TableCell>{formatDate(asset.assigned_date || asset.assignedDate)}</TableCell>
                    <TableCell>{formatDate(asset.purchased_date || asset.purchasedDate)}</TableCell>
                    <TableCell>{formatDate(asset.last_updated || asset.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(asset)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(asset)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(asset)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
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
    </div>
  );
}
