"use client"

import { useState } from 'react';
import { Search, Download, Eye, Calendar, UserCheck, FileText, Printer, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function SalesHistoryPage() {
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const salesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sales');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: sales, loading } = useCollection(salesQuery);
  const { data: showroom } = useDoc(showroomRef);

  const filteredSales = sales?.filter(s => 
    (s.customerName as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile as string)?.includes(search) ||
    (s.model as string)?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handlePrintBill = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-headline font-bold">Sales History</h1>
          <p className="text-muted-foreground">Complete archive of customer transactions and delivery data.</p>
        </div>
        <Button variant="outline" className="gap-2 border-white/10">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex gap-4 print:hidden">
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

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden print:hidden">
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
                    <Button variant="ghost" size="sm" className="gap-2 h-8" onClick={() => setSelectedSale(sale)}>
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

      {/* Bill Viewer Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:shadow-none print:border-none print:p-0">
          <DialogHeader className="p-4 border-b print:hidden bg-secondary text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Viewer
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 h-8" onClick={handlePrintBill}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 h-8" onClick={() => setSelectedSale(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-10" id="printable-invoice">
            <div className="text-center border-b-2 border-black pb-6 mb-8">
              <div className="flex justify-center mb-3">
                 <Zap className="h-12 w-12 text-black fill-current" />
              </div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter">{showroom?.name || 'AMRESH AUTOMOBILES'}</h1>
              <p className="text-sm font-medium mt-1">{showroom?.address}</p>
              <p className="text-xs">Contact: {showroom?.contact} | Email: {showroom?.email}</p>
              {showroom?.gstin && <p className="font-bold mt-1 text-sm">GSTIN: {showroom.gstin}</p>}
              <div className="mt-6 text-2xl font-black border-y-2 border-black py-2 tracking-[0.2em] uppercase">Tax Invoice / Sale Bill</div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
              <div className="space-y-1">
                <h4 className="font-bold border-b border-black pb-0.5 mb-2 text-xs uppercase tracking-widest text-gray-500">Bill To:</h4>
                <p className="text-xl font-bold">{selectedSale?.customerName}</p>
                <p className="text-sm"><span className="font-semibold">Mobile:</span> {selectedSale?.mobile}</p>
                <p className="text-sm"><span className="font-semibold">Address:</span> {selectedSale?.address}</p>
                <p className="text-sm"><span className="font-semibold">{selectedSale?.idType}:</span> {selectedSale?.idNumber}</p>
              </div>
              <div className="space-y-1 text-right">
                <h4 className="font-bold border-b border-black pb-0.5 mb-2 text-xs uppercase tracking-widest text-gray-500 text-right">Invoice Info:</h4>
                <p className="text-sm"><span className="font-semibold">Invoice No:</span> {selectedSale?.id}</p>
                <p className="text-sm"><span className="font-semibold">Date:</span> {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd MMMM yyyy') : 'N/A'}</p>
                <p className="text-sm"><span className="font-semibold">Time:</span> {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'hh:mm a') : 'N/A'}</p>
                {selectedSale?.gstin && <p className="text-sm"><span className="font-semibold">Store GSTIN:</span> {selectedSale.gstin}</p>}
              </div>
            </div>

            <div className="border-2 border-black rounded-sm overflow-hidden mb-8">
              <Table className="border-collapse">
                <TableHeader className="bg-gray-100">
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="text-black font-extrabold uppercase py-4 border-r-2 border-black h-12">Item Description</TableHead>
                    <TableHead className="text-black font-extrabold uppercase py-4 border-r-2 border-black h-12">Chassis Number</TableHead>
                    <TableHead className="text-black font-extrabold uppercase py-4 text-right h-12">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b-2 border-black h-32 align-top">
                    <TableCell className="py-6 border-r-2 border-black">
                      <p className="font-black text-xl">{selectedSale?.model}</p>
                      <p className="text-xs text-gray-600 mt-1 uppercase">High Performance Electric Scooter</p>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-center border-r-2 border-black py-6">{selectedSale?.chassisNumber}</TableCell>
                    <TableCell className="text-right font-black text-xl py-6">{selectedSale?.price}</TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={2} className="text-right font-black text-2xl py-6 border-r-2 border-black">GRAND TOTAL</TableCell>
                    <TableCell className="text-right font-black text-3xl py-6">{selectedSale?.price}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <div className="text-[10px] space-y-3">
                <h5 className="font-bold border-b border-black pb-0.5 uppercase tracking-wider">Terms & Conditions:</h5>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Manufacturer warranty applies as per standard policies.</li>
                  <li>Insurance and registration details provided separately.</li>
                  <li>All disputes subject to local jurisdiction.</li>
                </ul>
              </div>
              <div className="flex flex-col items-center justify-end">
                <div className="w-56 border-t-2 border-black text-center pt-2">
                  <p className="font-black text-sm uppercase">Authorised Signatory</p>
                  <p className="text-[10px] text-gray-400 mt-1">For Amresh Automobiles Showroom</p>
                </div>
              </div>
            </div>

            <div className="mt-20 text-center text-[10px] text-gray-300 pt-6 border-t border-gray-100 italic">
              <p>This is a computer generated invoice and does not require a physical signature.</p>
              <p className="mt-1 font-bold text-black opacity-30 tracking-[0.3em] uppercase">Go Green. Ride Electric.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}