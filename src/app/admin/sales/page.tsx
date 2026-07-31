"use client"

import { useState } from 'react';
import { Search, Eye, X, Zap, Activity, Trash2, Printer, Download, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SalesHistoryPage() {
  const firestore = useFirestore();
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

  const filteredSales = sales?.filter(s => 
    (s.customerName as string)?.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile as string)?.includes(search) ||
    (s.model as string)?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteSale = (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this invoice permanently?')) {
      const docRef = doc(firestore, 'sales', id);
      deleteDoc(docRef)
        .then(() => {
          toast({ title: 'Invoice Deleted', description: 'The record has been removed.' });
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const amountToWords = (amount: number) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    
    let words = '';
    if (amount >= 100000) {
      words += amountToWords(Math.floor(amount / 100000)) + ' Lakh ';
      amount %= 100000;
    }
    if (amount >= 1000) {
      words += amountToWords(Math.floor(amount / 1000)) + ' Thousand ';
      amount %= 1000;
    }
    if (amount >= 100) {
      words += amountToWords(Math.floor(amount / 100)) + ' Hundred ';
      amount %= 100;
    }
    if (amount > 0) {
      if (words !== '') words += 'and ';
      if (amount < 10) words += units[amount];
      else if (amount < 20) words += teens[amount - 10];
      else {
        words += tens[Math.floor(amount / 10)];
        if (amount % 10 > 0) words += ' ' + units[amount % 10];
      }
    }
    return words.trim();
  };

  const isTemplateMode = !!(showroom?.useLetterhead && showroom?.letterheadUrl);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-headline font-bold">Transaction Ledger</h1>
          <p className="text-muted-foreground">Historical records of all vehicle sales and invoices.</p>
        </div>
      </div>

      <div className="flex gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by customer, mobile or model..." 
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
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20">Loading records...</TableCell></TableRow>
            ) : filteredSales.length > 0 ? filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-primary font-bold">{sale.invoiceNo}</TableCell>
                <TableCell>{sale.soldAt ? format(new Date(sale.soldAt), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.mobile}</div>
                </TableCell>
                <TableCell>{sale.model} {sale.variant}</TableCell>
                <TableCell className="font-bold">₹ {sale.price?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View Bill</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSale(sale.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No transactions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none">
          <DialogHeader className="p-4 border-b print:hidden bg-secondary text-white sticky top-0 z-50">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg">Amresh Automobile Invoice</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-white border-white/20 h-9" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" /> Print Bill
                </Button>
                <Button variant="outline" size="sm" className="text-white border-white/20 h-9" onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" /> Save as PDF
                </Button>
                <Button variant="ghost" size="icon" className="text-white h-9 w-9" onClick={() => setSelectedSale(null)}><X className="h-5 w-5" /></Button>
              </div>
            </div>
          </DialogHeader>
          
          <div 
            className="print-container relative bg-white overflow-hidden" 
            style={{
              width: '210mm',
              height: '297mm',
              margin: '0 auto',
            }}
          >
            {/* Background Template Image */}
            {isTemplateMode && (
              <img 
                src={showroom.letterheadUrl} 
                className="absolute inset-0 w-full h-full object-fill z-0 bg-template" 
                alt="Invoice Background Template"
              />
            )}
            
            <div className="relative z-10 w-full h-full p-[12mm] flex flex-col text-black">
              {/* Header */}
              <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
                <div className="flex gap-6">
                  <div className="relative h-20 w-20">
                    {showroom?.logoUrl ? (
                      <img src={showroom.logoUrl} alt="Logo" className="object-contain h-full w-full" />
                    ) : (
                      <div className="bg-primary p-4 rounded-2xl h-full w-full flex items-center justify-center">
                        <Zap className="h-10 w-10 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                    <div className="mt-3 text-[10px] leading-snug text-gray-700 font-bold max-w-[280px]">
                      <p>{showroom?.address || 'Padampur, Khunti, Jharkhand'}</p>
                      <p>Contact: {showroom?.contact || '9798910854'}</p>
                      <p>Email: {showroom?.email || 'amreshautomobile@gmail.com'}</p>
                      {showroom?.gstin && <p className="text-black text-[10px] mt-1 uppercase border-t border-gray-200 pt-1">GSTIN: {showroom.gstin}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <h2 className="text-5xl font-black text-black uppercase tracking-tighter leading-none mb-4">INVOICE</h2>
                  <div className="space-y-1">
                    <div className="inline-block bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Invoice Number</p>
                      <p className="text-base font-black text-primary tracking-tight">{selectedSale?.invoiceNo}</p>
                    </div>
                    <div className="text-right pr-2 pt-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Date</p>
                      <p className="text-[11px] font-black">{selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="invoice-watermark">
                <Zap className="h-[250px] w-[250px] text-primary/5" />
              </div>

              {/* Customer & Vehicle Info Boxes */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/20">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2 mb-3">Customer Details</h4>
                  <div className="space-y-1.5 text-[11px]">
                    <p className="text-lg font-black uppercase text-black leading-none">{selectedSale?.customerName}</p>
                    {selectedSale?.customerFatherName && <p className="text-gray-600 font-bold uppercase text-[9px]">C/O: {selectedSale.customerFatherName}</p>}
                    <p className="leading-snug text-gray-700 font-medium">{selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                    <div className="pt-2 space-y-0.5">
                      <p><span className="text-gray-400 uppercase text-[9px] w-16 inline-block">Mobile:</span> <span className="font-black text-black">{selectedSale?.mobile}</span></p>
                      <p><span className="text-gray-400 uppercase text-[9px] w-16 inline-block">{selectedSale?.idType || 'ID'}:</span> <span className="font-black text-black">{selectedSale?.idNumber}</span></p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/20">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2 mb-3">Vehicle Details</h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                    <div className="col-span-2 mb-1">
                      <p className="text-lg font-black text-primary uppercase leading-none">{selectedSale?.model}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{selectedSale?.variant || 'Standard Edition'}</p>
                    </div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Color</span> <span className="font-black text-black uppercase">{selectedSale?.color || '-'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Battery</span> <span className="font-black text-black uppercase">{selectedSale?.batteryType || '-'}</span></div>
                    <div className="col-span-2"><span className="text-gray-400 uppercase text-[8px] block">Chassis Number</span> <span className="font-mono font-black text-black text-xs uppercase">{selectedSale?.chassisNumber}</span></div>
                    <div className="col-span-2"><span className="text-gray-400 uppercase text-[8px] block">Motor Number</span> <span className="font-black text-black text-[9px] uppercase">{selectedSale?.motorNumber || '-'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Reg No.</span> <span className="font-black text-black uppercase">{selectedSale?.registrationNumber || 'APPLIED'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Range</span> <span className="font-black text-black uppercase">{selectedSale?.claimedRange || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Invoice Item Table */}
              <div className="flex-1 min-h-[300px]">
                <table className="w-full invoice-table border-collapse rounded-xl overflow-hidden border border-black">
                  <thead>
                    <tr>
                      <th className="w-12 text-center py-2">Sr.</th>
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="w-24 text-center py-2">HSN</th>
                      <th className="w-16 text-center py-2">Qty</th>
                      <th className="w-28 text-right py-2 px-3">Rate</th>
                      <th className="w-32 text-right py-2 px-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    <tr className="min-h-[200px] align-top">
                      <td className="text-center font-black pt-3">01</td>
                      <td className="p-3">
                        <p className="font-black text-sm uppercase leading-tight">{selectedSale?.model}</p>
                        <p className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">{selectedSale?.variant || 'Electric Mobility Vehicle'}</p>
                      </td>
                      <td className="text-center font-mono font-bold pt-3">{selectedSale?.hsn || '871160'}</td>
                      <td className="text-center font-black pt-3">01</td>
                      <td className="text-right font-mono font-bold pt-3 px-3">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                      <td className="text-right font-mono font-black text-black pt-3 px-3">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals and Footer */}
              <div className="flex justify-between items-start pt-6 border-t border-gray-100">
                <div className="w-3/5 space-y-5">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase italic mb-0.5 tracking-widest">Amount in Words</p>
                    <p className="text-[11px] font-black text-primary uppercase leading-tight border-b-2 border-primary/10 pb-2">Rupees {amountToWords(selectedSale?.price || 0)} Only</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h5 className="text-[9px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                      <Activity className="h-3 w-3" /> Settlement Details
                    </h5>
                    <div className="text-[9px] space-y-1 font-bold uppercase">
                      <div className="flex justify-between border-b border-gray-200 pb-0.5"><span>Payment Mode:</span> <span className="text-black font-black">{selectedSale?.paymentMethod}</span></div>
                      {selectedSale?.paymentMethod === 'Finance' && (
                        <>
                          <div className="flex justify-between border-b border-gray-200 pb-0.5"><span>Financier:</span> <span className="text-black font-black">{selectedSale?.financeCompany}</span></div>
                          <div className="flex justify-between border-b border-gray-200 pb-0.5"><span>Loan Amount:</span> <span className="text-black font-black">₹ {selectedSale?.loanAmount?.toLocaleString()}</span></div>
                        </>
                      )}
                      {selectedSale?.utrNumber && <div className="flex justify-between"><span>Reference:</span> <span className="text-black font-mono font-black">{selectedSale.utrNumber}</span></div>}
                    </div>
                  </div>

                  <div className="text-[8px] text-gray-400 font-bold space-y-0.5 uppercase leading-tight opacity-70">
                    <p>* Goods once sold will not be returned.</p>
                    <p>* Warranty covered as per manufacturer policy.</p>
                    <p>* All disputes subject to Khunti (Jharkhand) jurisdiction.</p>
                  </div>
                </div>

                <div className="w-1/3 bg-gray-50 rounded-2xl overflow-hidden border border-black">
                  <div className="p-4 space-y-2 text-[11px] font-bold">
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[9px]">Sub Total</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[9px]">GST (0%)</span> <span>₹ 0.00</span></div>
                  </div>
                  <div className="bg-primary p-4 text-white text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-90">Grand Total</p>
                    <p className="text-3xl font-black">₹ {selectedSale?.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-auto pt-12 flex justify-between items-end pb-2">
                <div className="text-center">
                  <div className="w-48 border-t border-gray-300 mb-1"></div>
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Customer Signature</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase mb-12 text-primary tracking-tighter">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                  <div className="w-56 border-t-2 border-black mb-1"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}