import React, { useState } from 'react';
import { MoreHorizontal, Plus, Search, Filter, Download, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Transaction {
  id: string;
  transactionId: string;
  bank: string;
  amount: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  timestamp: string;
  type: 'debit' | 'credit' | 'transfer';
  fee: string;
  reference: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN_20250718_001',
    bank: 'First National Bank',
    amount: 'R15,250.00',
    status: 'completed',
    timestamp: '2025-01-18 14:23:45',
    type: 'transfer',
    fee: 'R152.50',
    reference: 'SALARY_PAYMENT_JAN',
  },
  {
    id: '2',
    transactionId: 'TXN_20250718_002',
    bank: 'ABSA Bank',
    amount: 'R8,750.50',
    status: 'processing',
    timestamp: '2025-01-18 14:22:12',
    type: 'debit',
    fee: 'R87.51',
    reference: 'INVOICE_5547',
  },
  {
    id: '3',
    transactionId: 'TXN_20250718_003',
    bank: 'Standard Bank',
    amount: 'R25,000.00',
    status: 'completed',
    timestamp: '2025-01-18 14:20:33',
    type: 'credit',
    fee: 'R250.00',
    reference: 'CLIENT_PAYMENT_ABC123',
  },
  {
    id: '4',
    transactionId: 'TXN_20250718_004',
    bank: 'Nedbank',
    amount: 'R12,500.75',
    status: 'pending',
    timestamp: '2025-01-18 14:19:18',
    type: 'transfer',
    fee: 'R125.01',
    reference: 'VENDOR_PAYMENT_789',
  },
  {
    id: '5',
    transactionId: 'TXN_20250718_005',
    bank: 'First National Bank',
    amount: 'R45,000.00',
    status: 'completed',
    timestamp: '2025-01-18 14:15:02',
    type: 'credit',
    fee: 'R450.00',
    reference: 'LOAN_DISBURSEMENT',
  },
  {
    id: '6',
    transactionId: 'TXN_20250718_006',
    bank: 'ABSA Bank',
    amount: 'R3,750.25',
    status: 'failed',
    timestamp: '2025-01-18 14:12:55',
    type: 'debit',
    fee: 'R37.50',
    reference: 'UTILITY_PAYMENT_FAIL',
  },
];

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch = 
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesBank = bankFilter === 'all' || transaction.bank === bankFilter;
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
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-gray-100 text-gray-800';
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Processing Log</CardTitle>
              <CardDescription>Real-time weekend settlement transactions from connected banks</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search transactions or references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                <SelectItem value="First National Bank">FNB</SelectItem>
                <SelectItem value="ABSA Bank">ABSA</SelectItem>
                <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                <SelectItem value="Nedbank">Nedbank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
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
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">{transaction.transactionId}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{getBankAbbreviation(transaction.bank)}</span>
                        </div>
                        <span className="hidden sm:inline">{transaction.bank}</span>
                        <span className="sm:hidden">{getBankAbbreviation(transaction.bank)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{transaction.amount}</TableCell>
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
                    <TableCell className="text-green-600 font-medium">{transaction.fee}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleString()}
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

          {/* Additional Transaction Info */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Transactions</p>
                <p className="font-medium">{filteredTransactions.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Volume</p>
                <p className="font-medium">R{filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount.replace('R', '').replace(',', '')), 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processing Fees</p>
                <p className="font-medium text-green-600">R{filteredTransactions.reduce((sum, t) => sum + parseFloat(t.fee.replace('R', '').replace(',', '')), 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="font-medium">
                  {Math.round((filteredTransactions.filter(t => t.status === 'completed').length / filteredTransactions.length) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Pagination */}
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
        </CardContent>
      </Card>
    </div>
  );
}