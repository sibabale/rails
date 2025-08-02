import React, { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal, Plus, Search, Filter, Download, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../lib/hooks';
import { loadTransactions } from '../../../lib/slices/transactionSlice';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { DataTableProps, Transaction } from './DataTable.interface';

/**
 * Safely parses a monetary amount from various input formats.
 * Handles both number and string inputs, removes currency symbols and commas,
 * and returns 0 if parsing fails.
 * 
 * @param amount - The amount to parse (number or string)
 * @returns The parsed amount as a number, or 0 if parsing fails
 */
const parseAmount = (amount: number | string): number => {
  // If it's already a number, return it directly
  if (typeof amount === 'number') {
    return amount;
  }
  
  // If it's not a string, return 0
  if (typeof amount !== 'string') {
    return 0;
  }
  
  try {
    // Remove currency symbols, commas, and other non-numeric characters except decimal points
    const cleanedAmount = amount.replace(/[^\d.-]/g, '');
    
    // Parse the cleaned string to a number
    const parsed = parseFloat(cleanedAmount);
    
    // Return the parsed number if it's valid, otherwise return 0
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    // If any error occurs during parsing, return 0
    return 0;
  }
};

/**
 * Safely calculates the fee for a transaction.
 * Handles different types of fee and amount values, including parsing strings
 * and defaulting to 0 when invalid.
 * 
 * @param fee - The fee value (number, string, or undefined)
 * @param amount - The transaction amount (number or string)
 * @param feePercentage - The fee percentage as decimal (default: 0.01 for 1%)
 * @returns The calculated fee as a number
 */
const calculateFee = (fee: number | string | undefined, amount: number | string, feePercentage: number = 0.01): number => {
  // If fee is already provided and valid, use it
  if (fee !== undefined && fee !== null) {
    const parsedFee = parseAmount(fee);
    if (parsedFee > 0) {
      return parsedFee;
    }
  }
  
  // Calculate fee based on amount if fee is not provided or invalid
  const parsedAmount = parseAmount(amount);
  return parsedAmount * feePercentage;
};



export function DataTable({ showAllBanks = false }: DataTableProps) {
  const dispatch = useAppDispatch();
  const { transactions: reduxTransactions, loading: reduxLoading, error } = useAppSelector((state) => state.transactions);
  const { bankProfile } = useAppSelector((state) => state.bank);
  
  // Local state for all-banks view (when showAllBanks is true)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allTransactionsLoading, setAllTransactionsLoading] = useState(true);
  
  // Use appropriate data source based on mode
  const transactions = showAllBanks ? allTransactions : reduxTransactions;
  const loading = showAllBanks ? allTransactionsLoading : reduxLoading;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadTransactionsData = useCallback(async () => {
    try {
      if (showAllBanks) {
        // For internal dashboard, get all transactions
        setAllTransactionsLoading(true);
        const response = await fetch('/api/transactions');
        const data = await response.json();
        setAllTransactions(data.transactions || []);
        setAllTransactionsLoading(false);
      } else if (bankProfile?.adminEmail) {
        // For bank dashboard, get only their transactions using Redux
        dispatch(loadTransactions({ 
          userId: bankProfile.adminEmail,
          limit: 50 
        }));
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      if (showAllBanks) {
        setAllTransactions([]);
        setAllTransactionsLoading(false);
      }
    }
  }, [showAllBanks, bankProfile?.adminEmail, dispatch]);

  useEffect(() => {
    loadTransactionsData();
  }, [loadTransactionsData]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.txn_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesBank = bankFilter === 'all' || transaction.sender_bank === bankFilter;
    return matchesSearch && matchesStatus && matchesBank;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'credit':
        return 'bg-green-100 text-green-800';
      case 'debit':
        return 'bg-orange-100 text-orange-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getBankAbbreviation = (bank: string) => {
    switch (bank) {
      case 'First National Bank':
        return 'FNB';
      case 'ABSA Bank':
        return 'ABSA';
      case 'Standard Bank':
        return 'SB';
      case 'Nedbank':
        return 'NB';
      default:
        return bank.substring(0, 3).toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Processing Log</CardTitle>
              <CardDescription className="text-gray-600">Real-time weekend settlement transactions from connected banks</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadTransactionsData}
                disabled={loading}
                className="hover:bg-gray-100 border-gray-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-gray-100 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search transactions or references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white border-gray-300">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white border-gray-300">
                <SelectValue placeholder="Filter by bank" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg">
                <SelectItem value="all">All Banks</SelectItem>
                <SelectItem value="First National Bank">FNB</SelectItem>
                <SelectItem value="ABSA Bank">ABSA</SelectItem>
                <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                <SelectItem value="Nedbank">Nedbank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading transactions...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No transactions found
              </h3>
              <p className="text-sm text-muted-foreground">
                {showAllBanks 
                  ? "No transactions have been processed across all banks yet." 
                  : "No transactions have been submitted for your bank yet."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee (1%)</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.txn_ref}>
                    <TableCell className="font-mono text-sm">
                      {transaction.txn_ref}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{getBankAbbreviation(transaction.sender_bank)}</span>
                        </div>
                        <span className="hidden sm:inline">{transaction.sender_bank}</span>
                        <span className="sm:hidden">{getBankAbbreviation(transaction.sender_bank)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      R{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      R{(transaction.amount * 0.01).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Transaction
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Transaction
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}

          {/* Additional Transaction Info - Only show if there are transactions */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Transactions</p>
                <p className="font-medium">{filteredTransactions.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Volume</p>
                <p className="font-medium">R{filteredTransactions.reduce((sum, t) => {
                  return sum + t.amount;
                }, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processing Fees</p>
                <p className="font-medium text-green-600">R{filteredTransactions.reduce((sum, t) => {
                  return sum + (t.amount * 0.01);
                }, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="font-medium">
                  {Math.round((filteredTransactions.filter(t => t.status === 'completed').length / filteredTransactions.length) * 100)}%
                </p>
              </div>
            </div>
            </div>
          )}

          {/* Pagination - Only show if there are transactions */}
          {!loading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}