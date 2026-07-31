"use client"

import { useState } from 'react';
import { Search, Eye, X, Zap, Activity, Trash2, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SalesHistoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const { toast } = useToast();

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

  const filteredSales = (sales || []).filter(s => 
    (s.customerName as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile as string)?.includes(search) ||
    (s.model as string)?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteSale = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !id) return;
    if (confirm('Permanently delete this invoice?')) {
      const docRef = doc(firestore, 'sales', id);
      deleteDoc(docRef)
        .then(() => toast({ title: 'Invoice Deleted' }))
        .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
    }
  };

  const amountToWords = (amount: number) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (amount === 0) return 'Zero';
    let words = '';
    if (amount >= 100000) { words += amountToWords(Math.floor(amount / 100000)) + ' Lakh '; amount %= 100000; }
    if (amount >= 1000) { words += amountToWords(Math.floor(amount / 1000)) + ' Thousand '; amount %= 1000; }
    if (amount >= 100) { words += amountToWords(Math.floor(amount / 100)) + ' Hundred '; amount %= 100; }
    if (amount > 0) {
      if (words !== '') words += 'and ';
      if (amount < 10) words += units[amount];
      else if (amount < 20) words += teens[amount - 10];
      else { words += tens[Math.floor(amount / 10)]; if (amount % 10 > 0) words += ' ' + units[amount % 10]; }
    }
    return words.trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-headline font-bold">Sales Ledger</h1>
      </div>

      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search records..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden print:hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20">Loading...</TableCell></TableRow>
            ) : filteredSales.length > 0 ? filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-primary font-bold">{sale.invoiceNo}</TableCell>
                <TableCell>
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.mobile}</div>
                </TableCell>
                <TableCell>{sale.model} {sale.variant}</TableCell>
                <TableCell className="font-bold">₹ {sale.price?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => handleDeleteSale(sale.id, e)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="text-center py-20">No records.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none">
          <div className="print-container relative bg-white p-[12mm] text-black">
            <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
              <div className="flex gap-4">
                <div className="bg-primary p-2 rounded-xl h-16 w-16 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white fill-current" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-primary uppercase">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                  <p className="text-[10px] text-gray-500 font-bold">{showroom?.address}</p>
                  <p className="text-[10px] text-gray-500 font-bold">Mob: {showroom?.contact}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-black">INVOICE</h2>
                <p className="text-sm font-bold text-primary">{selectedSale?.invoiceNo}</p>
                <p className="text-xs text-gray-400">{selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Buyer</p>
                <p className="text-lg font-black uppercase">{selectedSale?.customerName}</p>
                <p className="text-xs font-bold text-gray-600">{selectedSale?.address}, {selectedSale?.city}</p>
                <p className="text-xs font-bold text-gray-600">Mob: {selectedSale?.mobile}</p>
              </div>
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Vehicle Details</p>
                <p className="text-lg font-black uppercase text-primary">{selectedSale?.model}</p>
                <p className="text-xs font-bold">Chassis: {selectedSale?.chassisNumber}</p>
                <p className="text-xs font-bold">Color: {selectedSale?.color}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-black mb-8">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-black p-2 text-left">Description</th>
                  <th className="border border-black p-2 text-center w-24">HSN</th>
                  <th className="border border-black p-2 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-4">
                    <p className="font-black uppercase">{selectedSale?.model}</p>
                    <p className="text-[10px] text-gray-500">Electric Vehicle • {selectedSale?.variant || 'Standard'}</p>
                  </td>
                  <td className="border border-black p-4 text-center font-bold">{selectedSale?.hsn || '871160'}</td>
                  <td className="border border-black p-4 text-right font-black">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between">
              <div className="w-1/2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Rupees In Words</p>
                <p className="text-sm font-black uppercase text-primary">{amountToWords(selectedSale?.price || 0)} Only</p>
              </div>
              <div className="w-1/3 bg-gray-50 p-4 border-2 border-black rounded-xl">
                <div className="flex justify-between font-bold text-xs mb-2"><span>Subtotal</span> <span>₹ {selectedSale?.price?.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-lg border-t border-black pt-2"><span>Total</span> <span>₹ {selectedSale?.price?.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-20 flex justify-between items-end">
              <div className="text-center"><div className="w-40 border-t border-gray-300 mb-1"></div><p className="text-[10px] font-bold">Buyer Signature</p></div>
              <div className="text-center"><p className="text-xs font-black uppercase mb-10 text-primary">For {showroom?.name || 'Amresh Automobile'}</p><div className="w-56 border-t-2 border-black mb-1"></div><p className="text-[10px] font-bold">Authorized Signatory</p></div>
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-2 print:hidden bg-secondary">
            <Button onClick={() => window.print()}>Print Invoice</Button>
            <Button variant="outline" onClick={() => setSelectedSale(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}