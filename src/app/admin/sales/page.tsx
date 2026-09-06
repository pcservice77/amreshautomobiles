"use client"

import { useState } from 'react';
import { Search, Eye, Trash2, Zap, FileText, Edit, Save, Loader2, Download } from 'lucide-react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

const saleEditSchema = z.object({
  customerName: z.string().min(3, 'Required'),
  mobile: z.string().length(10, '10-digits required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Required'),
  model: z.string().min(1, 'Required'),
  variant: z.string().optional(),
  color: z.string().min(1, 'Required'),
  chassisNumber: z.string().min(5, 'Required'),
  batterySerialNumber: z.string().optional(),
  price: z.coerce.number().min(1, 'Required'),
  paymentMethod: z.string().default('Cash'),
});

export default function SalesHistoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const editForm = useForm<z.infer<typeof saleEditSchema>>({
    resolver: zodResolver(saleEditSchema),
    defaultValues: {
      customerName: '',
      mobile: '',
      email: '',
      address: '',
      model: '',
      variant: '',
      color: '',
      chassisNumber: '',
      batterySerialNumber: '',
      price: 0,
      paymentMethod: 'Cash',
    },
  });

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

  const handleEditClick = (sale: any) => {
    setEditingSale(sale);
    editForm.reset({
      customerName: sale.customerName || '',
      mobile: sale.mobile || '',
      email: sale.email || '',
      address: sale.address || '',
      model: sale.model || '',
      variant: sale.variant || '',
      color: sale.color || '',
      chassisNumber: sale.chassisNumber || '',
      batterySerialNumber: sale.batterySerialNumber || '',
      price: sale.price || 0,
      paymentMethod: sale.paymentMethod || 'Cash',
    });
  };

  const onEditSubmit = async (values: z.infer<typeof saleEditSchema>) => {
    if (!firestore || !editingSale) return;
    setIsUpdating(true);

    const saleRef = doc(firestore, 'sales', editingSale.id);
    try {
      await updateDoc(saleRef, values);
      toast({ title: 'Sale Updated', description: `Record for ${values.customerName} has been modified.` });
      setEditingSale(null);
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: saleRef.path,
        operation: 'update',
        requestResourceData: values,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredSales || filteredSales.length === 0) return;
    
    const headers = ["Invoice No", "Customer Name", "Mobile", "Email", "Model", "Variant", "Color", "Chassis", "Battery S/N", "Price", "Date"];
    const rows = filteredSales.map(s => [
      `"${s.invoiceNo}"`,
      `"${s.customerName}"`,
      `"${s.mobile}"`,
      `"${s.email || 'N/A'}"`,
      `"${s.model}"`,
      `"${s.variant || 'Standard'}"`,
      `"${s.color}"`,
      `"${s.chassisNumber}"`,
      `"${s.batterySerialNumber || 'N/A'}"`,
      s.price,
      format(new Date(s.soldAt), 'yyyy-MM-dd')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Amresh_Sales_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful', description: 'Your CSV report has been downloaded.' });
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
        <div className="flex gap-4">
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export Data
          </Button>
          <FileText className="h-10 w-10 text-primary opacity-20" />
        </div>
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
                  <span className="text-xs bg-zinc-900 border border-white/10 px-2 py-1 rounded">
                    {getBranchDetails(sale.branchId)?.name || 'Main'}
                  </span>
                </TableCell>
                <TableCell className="font-bold">₹ {sale.price?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="ghost" size="sm" className="hover:text-primary" onClick={() => handleEditClick(sale)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
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

      {/* Edit Sale Dialog */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-2xl bg-card border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sale Record</DialogTitle>
            <DialogDescription>
              Update transaction details for invoice {editingSale?.invoiceNo}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="customerName" render={({ field }) => (
                  <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="mobile" render={({ field }) => (
                  <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Full Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <div className="md:col-span-2 border-t border-white/5 pt-4 my-2" />
                
                <FormField control={editForm.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="variant" render={({ field }) => (
                  <FormItem><FormLabel>Variant</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={editForm.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Color</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="chassisNumber" render={({ field }) => (
                  <FormItem><FormLabel>Chassis Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="batterySerialNumber" render={({ field }) => (
                  <FormItem><FormLabel>Battery Serial Number (Optional)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />

                <div className="md:col-span-2 border-t border-white/5 pt-4 my-2" />

                <FormField control={editForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Sale Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI / Net Banking</SelectItem>
                        <SelectItem value="Finance">Finance / EMI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingSale(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:max-h-none print:absolute print:top-0 print:left-0 print:w-full print:rounded-none print:shadow-none print:bg-white print:translate-x-0 print:translate-y-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Detailed GST invoice view for {selectedSale?.customerName} - Invoice No: {selectedSale?.invoiceNo}.
            </DialogDescription>
          </DialogHeader>
          <div className="print-container relative bg-white p-[20mm] text-black">
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
                {selectedSale?.batterySerialNumber && <p className="text-xs font-bold">Battery S/N: {selectedSale?.batterySerialNumber}</p>}
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
