"use client"

import { useState } from 'react';
import { Search, Eye, X, Zap, Activity, Trash2, Printer, Download } from 'lucide-react';
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
        <DialogContent className={cn(
          "max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:shadow-none print:m-0",
          "print:max-h-none print:overflow-visible print:absolute print:top-0 print:left-0"
        )}>
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
                <Button variant="ghost" size="icon" className="text-white h-9 w-9 dialog-close-btn" onClick={() => setSelectedSale(null)}><X className="h-5 w-5" /></Button>
              </div>
            </div>
          </DialogHeader>
          
          <div 
            className="print-container relative bg-white overflow-hidden shadow-2xl mx-auto" 
            id="printable-invoice"
            style={{
              width: '210mm',
              height: '297mm',
              minHeight: '297mm',
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
                  <div className="relative h-24 w-24">
                    {showroom?.logoUrl ? (
                      <img src={showroom.logoUrl} alt="Logo" className="object-contain h-full w-full" />
                    ) : (
                      <div className="bg-primary p-4 rounded-2xl h-full w-full flex items-center justify-center">
                        <Zap className="h-12 w-12 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                    <div className="mt-4 text-[11px] leading-snug text-gray-700 font-bold max-w-[300px]">
                      <p>{showroom?.address || 'Padampur, Khunti, Jharkhand'}</p>
                      <p>Contact: {showroom?.contact || '9798910854'}</p>
                      <p>Email: {showroom?.email || 'amreshautomobile@gmail.com'}</p>
                      {showroom?.gstin && <p className="text-black text-xs mt-1 uppercase border-t border-gray-200 pt-1">GSTIN: {showroom.gstin}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <h2 className="text-6xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">INVOICE</h2>
                  <div className="space-y-2">
                    <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-gray-400 uppercase">Invoice Number</p>
                      <p className="text-lg font-black text-primary tracking-tight">{selectedSale?.invoiceNo}</p>
                    </div>
                    <div className="text-right pr-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                      <p className="text-sm font-black">{selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="invoice-watermark">
                <Zap className="h-[300px] w-[300px] text-primary/5" />
              </div>

              {/* Customer & Vehicle Info Boxes */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50/30">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-2 mb-4">Customer Details</h4>
                  <div className="space-y-2 text-[12px]">
                    <p className="text-xl font-black uppercase text-black leading-none">{selectedSale?.customerName}</p>
                    {selectedSale?.customerFatherName && <p className="text-gray-600 font-bold uppercase text-[10px]">C/O: {selectedSale.customerFatherName}</p>}
                    <p className="leading-snug text-gray-700 font-medium">{selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                    <div className="pt-2 space-y-1">
                      <p><span className="text-gray-400 uppercase text-[10px] w-20 inline-block">Mobile:</span> <span className="font-black text-black">{selectedSale?.mobile}</span></p>
                      <p><span className="text-gray-400 uppercase text-[10px] w-20 inline-block">{selectedSale?.idType || 'ID'}:</span> <span className="font-black text-black">{selectedSale?.idNumber}</span></p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50/30">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-2 mb-4">Vehicle Specifications</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div className="col-span-2 mb-2">
                      <p className="text-xl font-black text-primary uppercase leading-none">{selectedSale?.model}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedSale?.variant || 'Standard Edition'}</p>
                    </div>
                    <div><span className="text-gray-400 uppercase text-[9px] block">Color</span> <span className="font-black text-black uppercase">{selectedSale?.color || '-'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[9px] block">Battery</span> <span className="font-black text-black uppercase">{selectedSale?.batteryType || '-'}</span></div>
                    <div className="col-span-2"><span className="text-gray-400 uppercase text-[9px] block">Chassis Number</span> <span className="font-mono font-black text-black text-sm uppercase">{selectedSale?.chassisNumber}</span></div>
                    <div className="col-span-2"><span className="text-gray-400 uppercase text-[9px] block">Motor Number</span> <span className="font-black text-black uppercase">{selectedSale?.motorNumber || '-'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[9px] block">Reg No.</span> <span className="font-black text-black uppercase">{selectedSale?.registrationNumber || 'APPLIED'}</span></div>
                    <div><span className="text-gray-400 uppercase text-[9px] block">Range</span> <span className="font-black text-black uppercase">{selectedSale?.claimedRange || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Invoice Item Table */}
              <div className="flex-1">
                <table className="w-full invoice-table border-collapse rounded-xl overflow-hidden border-2 border-black">
                  <thead>
                    <tr>
                      <th className="w-16 text-center py-3">Sr.</th>
                      <th className="text-left py-3 px-4">Item & Vehicle Description</th>
                      <th className="w-28 text-center py-3">HSN</th>
                      <th className="w-20 text-center py-3">Qty</th>
                      <th className="w-32 text-right py-3 px-4">Rate</th>
                      <th className="w-36 text-right py-3 px-4">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    <tr className="min-h-[160px] align-top">
                      <td className="text-center font-black pt-4">01</td>
                      <td className="p-4">
                        <p className="font-black text-base uppercase leading-tight">{selectedSale?.model}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-1">{selectedSale?.variant || 'High Performance Electric Mobility'}</p>
                      </td>
                      <td className="text-center font-mono font-bold pt-4">{selectedSale?.hsn || '871160'}</td>
                      <td className="text-center font-black pt-4">01</td>
                      <td className="text-right font-mono font-bold pt-4 px-4">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                      <td className="text-right font-mono font-black text-black pt-4 px-4">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals and Footer */}
              <div className="flex justify-between items-start pt-10 border-t-2 border-gray-100">
                <div className="w-3/5 space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase italic mb-1 tracking-widest">Amount in Words</p>
                    <p className="text-sm font-black text-primary uppercase leading-tight border-b-4 border-primary/10 pb-3">Rupees {amountToWords(selectedSale?.price || 0)} Only</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-200">
                      <h5 className="text-[11px] font-black uppercase text-primary mb-4 flex items-center gap-3">
                        <Activity className="h-4 w-4" /> Settlement Summary
                      </h5>
                      <div className="text-[11px] space-y-2 font-bold uppercase">
                        <div className="flex justify-between border-b border-gray-200 pb-1"><span>Payment Mode:</span> <span className="text-black font-black">{selectedSale?.paymentMethod}</span></div>
                        {selectedSale?.paymentMethod === 'Finance' && (
                          <>
                            <div className="flex justify-between border-b border-gray-200 pb-1"><span>Financier:</span> <span className="text-black font-black">{selectedSale?.financeCompany}</span></div>
                            <div className="flex justify-between border-b border-gray-200 pb-1"><span>Loan Amount:</span> <span className="text-black font-black">₹ {selectedSale?.loanAmount?.toLocaleString()}</span></div>
                          </>
                        )}
                        {selectedSale?.utrNumber && <div className="flex justify-between"><span>TXN/UTR Reference:</span> <span className="text-black font-mono font-black">{selectedSale.utrNumber}</span></div>}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-gray-400 font-bold space-y-1 uppercase leading-tight opacity-70">
                    <p>* Official Receipt: Goods once sold will not be returned.</p>
                    <p>* Warranty: Covered as per OEM manufacturer policy.</p>
                    <p>* Jurisdiction: All disputes subject to Khunti (Jharkhand) court.</p>
                  </div>
                </div>

                <div className="w-1/3 bg-gray-50 rounded-2xl overflow-hidden border-2 border-black">
                  <div className="p-6 space-y-4 text-[12px] font-bold">
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[10px]">Sub Total</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[10px]">GST (Zero Rated)</span> <span>₹ 0.00</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-3"><span className="text-gray-500 uppercase text-[10px]">Net Payable</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                  </div>
                  <div className="bg-primary p-6 text-white text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-1 opacity-90">Grand Total</p>
                    <p className="text-4xl font-black">₹ {selectedSale?.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-auto pt-16 flex justify-between items-end pb-4">
                <div className="text-center">
                  <div className="w-56 border-t-2 border-gray-300 mb-2"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Signature</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase mb-16 text-primary tracking-tighter">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                  <div className="w-64 border-t-4 border-black mb-2"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}