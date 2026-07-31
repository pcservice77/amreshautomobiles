
"use client"

import { useState } from 'react';
import { Search, Eye, Trash2, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

export default function SalesHistoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const salesRef = collection(firestore, 'sales');
    if (user.role === 'branch_admin' && user.assignedBranchId) {
      return query(salesRef, where('branchId', '==', user.assignedBranchId));
    }
    return salesRef;
  }, [firestore, user]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: sales, loading } = useCollection(salesQuery);
  const { data: branches } = useCollection(branchesQuery);
  const { data: showroom } = useDoc(showroomRef);

  const filteredSales = (sales || []).filter(s => 
    (s.customerName as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile as string)?.includes(search) ||
    (s.model as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.invoiceNo as string)?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

  const executeDelete = () => {
    if (!firestore || !deleteId) return;
    const docRef = doc(firestore, 'sales', deleteId);
    deleteDoc(docRef)
      .then(() => toast({ title: 'Invoice Deleted' }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
    setDeleteId(null);
  };

  const getBranchDetails = (branchId: string) => {
    return branches?.find(b => b.id === branchId);
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

  const currentBranch = selectedSale ? getBranchDetails(selectedSale.branchId) : null;
  const showroomName = currentBranch?.name || showroom?.name || 'AMRESH AUTOMOBILE';
  const showroomTagline = currentBranch?.tagline || showroom?.tagline || 'Drive Electric • Live Smart';
  const showroomAddress = currentBranch?.address || showroom?.address;
  const showroomContact = currentBranch?.contact || showroom?.contact;
  const showroomLogo = currentBranch?.imageUrl || showroom?.logoUrl;
  const showroomGstin = currentBranch?.gstin || showroom?.gstin;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-headline font-bold">Sales History</h1>
          <p className="text-muted-foreground">
            {user?.role === 'branch_admin' ? 'Viewing records for your branch.' : 'Complete showroom sales overview.'}
          </p>
        </div>
        <FileText className="h-10 w-10 text-primary opacity-20" />
      </div>

      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by Invoice, Customer or Mobile..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden print:hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20">Loading records...</TableCell></TableRow>
            ) : filteredSales.length > 0 ? filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-primary font-bold">{sale.invoiceNo}</TableCell>
                <TableCell>
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.mobile}</div>
                </TableCell>
                <TableCell>{sale.model} {sale.variant}</TableCell>
                <TableCell>
                  <span className="text-xs bg-secondary px-2 py-1 rounded">
                    {getBranchDetails(sale.branchId)?.name || 'Main'}
                  </span>
                </TableCell>
                <TableCell className="font-bold">₹ {sale.price?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(sale.id);
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-20">No sales records found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Detailed GST invoice view for {selectedSale?.customerName} - Invoice No: {selectedSale?.invoiceNo}.
            </DialogDescription>
          </DialogHeader>
          <div className="print-container relative bg-white p-[12mm] text-black">
            <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
              <div className="flex gap-4">
                <div className="bg-primary p-2 rounded-xl h-16 w-16 flex items-center justify-center relative overflow-hidden">
                  {showroomLogo ? (
                    <Image src={showroomLogo} alt="Logo" fill className="object-cover" unoptimized />
                  ) : (
                    <Zap className="h-8 w-8 text-white fill-current" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-primary uppercase">{showroomName}</h1>
                  <p className="text-[10px] text-gray-500 font-bold italic mb-1">{showroomTagline}</p>
                  <p className="text-[9px] text-gray-500 leading-tight max-w-[250px]">{showroomAddress}</p>
                  <p className="text-[10px] text-gray-800 font-bold mt-1">GSTIN: {showroomGstin || 'N/A'}</p>
                  <p className="text-[10px] text-gray-800 font-bold">Mob: {showroomContact}</p>
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
                <p className="text-xs font-bold text-gray-600">ID: {selectedSale?.idType} - {selectedSale?.idNumber}</p>
              </div>
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Vehicle Details</p>
                <p className="text-lg font-black uppercase text-primary">{selectedSale?.model}</p>
                <p className="text-xs font-bold">Chassis: {selectedSale?.chassisNumber}</p>
                {selectedSale?.motorNumber && <p className="text-xs font-bold">Motor: {selectedSale?.motorNumber}</p>}
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
                <tr className="min-h-[100px]">
                  <td className="border border-black p-4 align-top">
                    <p className="font-black uppercase">{selectedSale?.model}</p>
                    <p className="text-[10px] text-gray-500">Electric Vehicle • {selectedSale?.variant || 'Standard'}</p>
                    <p className="text-[10px] text-gray-500 mt-2">Battery: {selectedSale?.batteryType} • Range: {selectedSale?.claimedRange}</p>
                  </td>
                  <td className="border border-black p-4 text-center font-bold align-top">{selectedSale?.hsn || '871160'}</td>
                  <td className="border border-black p-4 text-right font-black align-top">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between">
              <div className="w-1/2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Rupees In Words</p>
                <p className="text-sm font-black uppercase text-primary">{amountToWords(selectedSale?.price || 0)} Only</p>
                
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Payment Method</p>
                  <p className="text-xs font-bold">{selectedSale?.paymentMethod}</p>
                  {selectedSale?.utrNumber && <p className="text-[10px]">TXN: {selectedSale?.utrNumber}</p>}
                  {selectedSale?.financeCompany && <p className="text-[10px]">Financier: {selectedSale?.financeCompany}</p>}
                </div>
              </div>
              <div className="w-1/3 bg-gray-50 p-4 border-2 border-black rounded-xl h-fit">
                <div className="flex justify-between font-bold text-xs mb-2"><span>Subtotal</span> <span>₹ {selectedSale?.price?.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-lg border-t border-black pt-2"><span>Total</span> <span>₹ {selectedSale?.price?.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-20 flex justify-between items-end">
              <div className="text-center">
                <div className="w-40 border-t border-gray-300 mb-1"></div>
                <p className="text-[10px] font-bold">Buyer Signature</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase mb-10 text-primary">For {showroomName}</p>
                <div className="w-56 border-t-2 border-black mb-1"></div>
                <p className="text-[10px] font-bold">Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-2 print:hidden bg-secondary">
            <Button onClick={() => window.print()}>Print Invoice</Button>
            <Button variant="outline" onClick={() => setSelectedSale(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
