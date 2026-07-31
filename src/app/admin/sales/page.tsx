
"use client"

import { useState } from 'react';
import { Search, Eye, X, Zap, Activity, Trash2, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
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

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDeleteSale = (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this invoice record permanently?')) {
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
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSale(sale.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="text-lg">Amresh Automobile Invoice</DialogTitle>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="bg-primary text-white" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" /> Download as PDF
                </Button>
                <Button variant="ghost" size="icon" className="text-white" onClick={() => setSelectedSale(null)}><X className="h-5 w-5" /></Button>
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
            {isTemplateMode && (
              <img 
                src={showroom.letterheadUrl} 
                className="absolute inset-0 w-full h-full object-fill z-0" 
                alt="Invoice Template"
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
                    <h1 className="text-3xl font-black text-primary uppercase leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                    <div className="mt-3 text-[10px] leading-snug text-gray-800 font-bold max-w-[300px]">
                      <p>{showroom?.address || 'Village Padampur, Khunti, Jharkhand - 834004'}</p>
                      <p>Mob: {showroom?.contact || '9798910854'}</p>
                      <p>Email: {showroom?.email || 'amreshautomobile@gmail.com'}</p>
                      {showroom?.gstin && <p className="text-black text-[10px] mt-1 uppercase border-t border-gray-100 pt-1">GSTIN: {showroom.gstin}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <h2 className="text-5xl font-black text-black uppercase leading-none mb-4 tracking-tighter">INVOICE</h2>
                  <div className="space-y-1">
                    <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Number</p>
                      <p className="text-base font-black text-primary">{selectedSale?.invoiceNo}</p>
                    </div>
                    <div className="text-right pt-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Date</p>
                      <p className="text-[11px] font-black">{selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="invoice-watermark">
                <Receipt className="h-[300px] w-[300px] text-primary/5" />
              </div>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="border border-black rounded-2xl p-5 bg-gray-50/20">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-4">Buyer Details</h4>
                  <div className="space-y-2 text-[11px]">
                    <p className="text-lg font-black uppercase text-black leading-tight">{selectedSale?.customerName}</p>
                    {selectedSale?.customerFatherName && <p className="text-gray-600 font-bold uppercase text-[9px]">C/O: {selectedSale.customerFatherName}</p>}
                    <p className="text-gray-700 font-bold uppercase leading-relaxed">{selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                    <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-black">
                      <p><span className="text-gray-400 uppercase text-[8px] block">Mobile</span> {selectedSale?.mobile}</p>
                      <p><span className="text-gray-400 uppercase text-[8px] block">{selectedSale?.idType || 'ID'}</span> {selectedSale?.idNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-black rounded-2xl p-5 bg-gray-50/20">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-4">Vehicle Specs</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[10px]">
                    <div className="col-span-2">
                      <p className="text-lg font-black text-primary uppercase leading-none">{selectedSale?.model}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{selectedSale?.variant || 'Electric Edition'}</p>
                    </div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Color</span> <span className="font-black text-black uppercase">{selectedSale?.color || 'N/A'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Battery</span> <span className="font-black text-black uppercase">{selectedSale?.batteryType || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="text-gray-400 uppercase text-[8px] block">Chassis Number</span> <span className="font-mono font-black text-black text-xs">{selectedSale?.chassisNumber}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Reg No.</span> <span className="font-black text-black uppercase">{selectedSale?.registrationNumber || 'APPLIED'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[8px] block">Range</span> <span className="font-black text-black uppercase">{selectedSale?.claimedRange || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Table - Compacted height */}
              <div className="mb-6">
                <table className="w-full invoice-table border-collapse border border-black rounded-xl overflow-hidden">
                  <thead>
                    <tr>
                      <th className="w-12 text-center py-3 bg-primary text-white border border-black">Sr.</th>
                      <th className="text-left py-3 px-4 bg-primary text-white border border-black">Description</th>
                      <th className="w-24 text-center py-3 bg-primary text-white border border-black">HSN</th>
                      <th className="w-16 text-center py-3 bg-primary text-white border border-black">Qty</th>
                      <th className="w-32 text-right py-3 px-4 bg-primary text-white border border-black">Rate</th>
                      <th className="w-32 text-right py-3 px-4 bg-primary text-white border border-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    <tr className="align-top">
                      <td className="text-center font-black py-4 border border-black">01</td>
                      <td className="p-4 border border-black">
                        <p className="font-black text-sm uppercase text-black">{selectedSale?.model}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{selectedSale?.variant || 'High Efficiency Mobility'}</p>
                      </td>
                      <td className="text-center font-mono font-bold py-4 border border-black">{selectedSale?.hsn || '871160'}</td>
                      <td className="text-center font-black py-4 border border-black">01</td>
                      <td className="text-right font-mono font-bold py-4 px-4 border border-black">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                      <td className="text-right font-mono font-black py-4 px-4 border border-black">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Info - Moved up closer to table */}
              <div className="flex justify-between items-start pt-6 border-t border-gray-100">
                <div className="w-3/5 space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase italic mb-1">Amount in Words</p>
                    <p className="text-[12px] font-black text-primary uppercase leading-tight border-b-2 border-primary/10 pb-2">
                      Rupees {amountToWords(selectedSale?.price || 0)} Only
                    </p>
                  </div>
                  
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                    <h5 className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Settlement Details
                    </h5>
                    <div className="text-[10px] space-y-2 font-bold uppercase">
                      <div className="flex justify-between border-b border-gray-200 pb-1"><span>Mode</span> <span className="text-black font-black">{selectedSale?.paymentMethod}</span></div>
                      {selectedSale?.paymentMethod === 'Finance' && (
                        <>
                          <div className="flex justify-between border-b border-gray-200 pb-1"><span>Financier</span> <span className="text-black font-black">{selectedSale?.financeCompany}</span></div>
                          <div className="flex justify-between border-b border-gray-200 pb-1"><span>Loan</span> <span className="text-black font-black">₹ {selectedSale?.loanAmount?.toLocaleString()}</span></div>
                        </>
                      )}
                      {selectedSale?.utrNumber && <div className="flex justify-between"><span>Reference</span> <span className="text-black font-mono font-black">{selectedSale.utrNumber}</span></div>}
                    </div>
                  </div>

                  <div className="text-[8px] text-gray-400 font-bold uppercase leading-tight opacity-80">
                    <p>* Goods sold cannot be returned or exchanged.</p>
                    <p>* Warranty applies as per manufacturer terms.</p>
                    <p>* Jurisdiction for disputes: Khunti (JH).</p>
                  </div>
                </div>

                <div className="w-1/3 bg-gray-50 rounded-3xl overflow-hidden border-2 border-black">
                  <div className="p-5 space-y-2 text-[12px] font-black text-gray-700">
                    <div className="flex justify-between"><span>Sub Total</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                    <div className="flex justify-between text-gray-400"><span>GST (0%)</span> <span>₹ 0.00</span></div>
                  </div>
                  <div className="bg-primary p-5 text-white text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Final Amount</p>
                    <p className="text-3xl font-black">₹ {selectedSale?.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Signatures - Fixed at bottom of page using mt-auto */}
              <div className="mt-auto pt-12 flex justify-between items-end">
                <div className="text-center">
                  <div className="w-48 border-t border-gray-300 mb-2"></div>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Buyer Signature</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black uppercase mb-12 text-primary">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                  <div className="w-64 border-t-2 border-black mb-2"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
