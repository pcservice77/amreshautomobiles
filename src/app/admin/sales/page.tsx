"use client"

import { useState } from 'react';
import { Search, Download, Eye, Calendar, UserCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function SalesHistoryPage() {
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sales');
  }, [firestore]);

  const { data: sales, loading } = useCollection(salesQuery);
  const [search, setSearch] = useState('');

  const filteredSales = sales?.filter(s => 
    (s.customerName as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile as string)?.includes(search) ||
    (s.model as string)?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Sales History</h1>
          <p className="text-muted-foreground">Complete archive of customer transactions and delivery data.</p>
        </div>
        <Button variant="outline" className="gap-2 border-white/10">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by customer name, mobile or model..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Bill ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Scooter Model</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">Loading sales data...</TableCell>
              </TableRow>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs text-primary">{sale.id}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {sale.soldAt ? format(new Date(sale.soldAt), 'dd MMM yyyy') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sale.customerName}</span>
                      <span className="text-xs text-muted-foreground">{sale.mobile}</span>
                    </div>
                  </TableCell>
                  <TableCell>{sale.model}</TableCell>
                  <TableCell className="font-bold">{sale.price}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-400/10 text-green-400 border-green-400/20 gap-1">
                      <UserCheck className="h-3 w-3" />
                      Delivered
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-2 h-8">
                      <Eye className="h-4 w-4" />
                      View Bill
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-secondary p-4 rounded-full">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">No sales recorded yet</h4>
                      <p className="text-muted-foreground">New sales from the Billing tab will appear here.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
