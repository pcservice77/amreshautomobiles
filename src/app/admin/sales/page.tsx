
"use client"

import { useState } from 'react';
import { Search, Eye, Calendar, UserCheck, FileText, Printer, X, Zap, Leaf, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View Bill</Button>
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
          "max-w-[210mm] max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:shadow-none print:m-0",
          "print:max-h-none print:overflow-visible"
        )}>
          <DialogHeader className="p-4 border-b print:hidden bg-secondary text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg">Official Showroom Invoice</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="text-white border-white/20 h-8" onClick={handlePrintBill}><Printer className="h-4 w-4 mr-2" /> Print</Button>
                <Button variant="ghost" className="text-white h-8" onClick={() => setSelectedSale(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </DialogHeader>
          
          <div 
            className="print-container relative bg-white overflow-hidden shadow-2xl mx-auto" 
            id="printable-invoice"
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
            
            <div className="relative z-10 w-full h-full p-[12mm] flex flex-col">
              {/* Logo & Showroom Header (Standard Mode) */}
              <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
                <div className="flex gap-5">
                  <div className="relative h-20 w-20">
                    {showroom?.logoUrl ? (
                      <img src={showroom.logoUrl} alt="Logo" className="object-contain h-full w-full" />
                    ) : (
                      <div className="bg-primary p-3 rounded-2xl h-full w-full flex items-center justify-center">
                        <Zap className="h-10 w-10 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                    <div className="mt-4 text-[10px] leading-tight text-gray-600 font-medium">
                      <p>{showroom?.address || 'Village Padampur, PO- Lodhma, Khunti'}</p>
                      <p>Mobile: {showroom?.contact || '9798910854'}</p>
                      <p>Email: {showroom?.email || 'amreshautomobile@gmail.com'}</p>
                      {showroom?.gstin && <p className="font-bold text-black mt-1 uppercase">GSTIN: {showroom.gstin}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter">INVOICE</h2>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-bold"><span className="text-gray-400">Invoice No:</span> <span className="text-primary">{selectedSale?.invoiceNo}</span></p>
                    <p className="text-sm font-bold"><span className="text-gray-400">Date:</span> {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Watermark (Optional Branding) */}
              <div className="invoice-watermark">
                <Zap className="h-[250px] w-[250px] text-primary/5" />
              </div>

              {/* Detail Blocks */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-3">Customer Information</h4>
                  <div className="space-y-1.5 text-[11px]">
                    <p className="text-lg font-black uppercase text-black leading-none">{selectedSale?.customerName}</p>
                    <p className="text-gray-600 font-bold">{selectedSale?.customerFatherName ? `S/O, W/O: ${selectedSale.customerFatherName}` : '-'}</p>
                    <p className="leading-snug text-gray-700">{selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                    <p><span className="text-gray-400 uppercase text-[9px]">Mobile:</span> <span className="font-bold">{selectedSale?.mobile}</span></p>
                    <p><span className="text-gray-400 uppercase text-[9px]">{selectedSale?.idType || 'ID'}:</span> <span className="font-bold">{selectedSale?.idNumber}</span></p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-3">Vehicle Specifications</h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                    <div className="col-span-2 mb-1">
                      <p className="text-lg font-black text-primary uppercase leading-none">{selectedSale?.model}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{selectedSale?.variant || 'Standard Edition'}</p>
                    </div>
                    <p><span className="text-gray-400 uppercase text-[9px]">Color:</span> <span className="font-bold">{selectedSale?.color || '-'}</span></p>
                    <p><span className="text-gray-400 uppercase text-[9px]">Battery:</span> <span className="font-bold">{selectedSale?.batteryType || '-'}</span></p>
                    <p className="col-span-2"><span className="text-gray-400 uppercase text-[9px]">Chassis:</span> <span className="font-mono font-bold text-black border-b border-gray-300">{selectedSale?.chassisNumber}</span></p>
                    <p className="col-span-2"><span className="text-gray-400 uppercase text-[9px]">Motor No:</span> <span className="font-bold">{selectedSale?.motorNumber || '-'}</span></p>
                    <p><span className="text-gray-400 uppercase text-[9px]">Reg No:</span> <span className="font-bold">{selectedSale?.registrationNumber || 'Applied'}</span></p>
                    <p><span className="text-gray-400 uppercase text-[9px]">Range:</span> <span className="font-bold">{selectedSale?.claimedRange || '-'}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1">
                <table className="w-full invoice-table border-collapse rounded-lg overflow-hidden border-2 border-black">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Sr.</th>
                      <th className="text-left">Item Description</th>
                      <th className="w-24 text-center">HSN</th>
                      <th className="w-16 text-center">Qty</th>
                      <th className="w-28 text-right">Rate</th>
                      <th className="w-32 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="min-h-[140px] align-top">
                      <td className="text-center font-bold">1</td>
                      <td className="p-4">
                        <p className="font-black text-sm uppercase leading-none">{selectedSale?.model} {selectedSale?.variant}</p>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-tighter">High-Speed Eco-Friendly Electric Mobility Vehicle</p>
                        <ul className="mt-3 space-y-1 text-[8px] text-gray-400 font-bold uppercase italic">
                          <li>- Zero Emissions technology</li>
                          <li>- Smart Dashboard connectivity</li>
                          <li>- High Performance Battery Unit</li>
                        </ul>
                      </td>
                      <td className="text-center font-mono">{selectedSale?.hsn || '871160'}</td>
                      <td className="text-center font-bold">1</td>
                      <td className="text-right font-mono">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                      <td className="text-right font-mono font-bold text-black">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="flex justify-between items-start pt-8">
                <div className="w-2/3 space-y-5">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase italic mb-1">Amount in Words:</p>
                    <p className="text-sm font-black text-primary uppercase leading-tight border-b-2 border-primary/10 pb-2">Rupees {amountToWords(selectedSale?.price || 0)} Only</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h5 className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                        <Activity className="h-3 w-3" /> Payment Status
                      </h5>
                      <div className="text-[10px] space-y-1.5 font-bold">
                        <p className="flex justify-between"><span>Method:</span> <span className="text-black uppercase">{selectedSale?.paymentMethod}</span></p>
                        {selectedSale?.paymentMethod === 'Finance' && (
                          <>
                            <p className="flex justify-between"><span>Financier:</span> <span className="text-black uppercase">{selectedSale?.financeCompany}</span></p>
                            <p className="flex justify-between"><span>Loan:</span> <span className="text-black">₹ {selectedSale?.loanAmount?.toLocaleString()}</span></p>
                          </>
                        )}
                        {selectedSale?.utrNumber && <p className="flex justify-between"><span>TXN/UTR:</span> <span className="text-black font-mono">{selectedSale.utrNumber}</span></p>}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h5 className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                        <Landmark className="h-3 w-3" /> Settlement Details
                      </h5>
                      <div className="text-[9px] space-y-1 text-gray-600 font-medium">
                        <p className="text-black font-black uppercase">{showroom?.bankName || '-'}</p>
                        <p><span className="text-gray-400">A/c:</span> <span className="font-bold">{showroom?.accountNumber || '-'}</span></p>
                        <p><span className="text-gray-400">IFSC:</span> <span className="font-bold">{showroom?.ifsc || '-'}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] text-gray-400 font-bold space-y-0.5 uppercase">
                    <p>* Goods once sold will not be taken back.</p>
                    <p>* Warranty as per company policy. Khunti Jurisdiction only.</p>
                  </div>
                </div>

                <div className="w-1/3 bg-gray-50 rounded-xl overflow-hidden border-2 border-black">
                  <div className="p-5 space-y-4 text-[11px] font-bold">
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[9px]">Subtotal</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 uppercase text-[9px]">GST (0%)</span> <span>₹ 0.00</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500 uppercase text-[9px]">Net Payable</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                  </div>
                  <div className="bg-primary p-5 text-white text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Grand Total</p>
                    <p className="text-4xl font-black">₹ {selectedSale?.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-auto pt-14 flex justify-between items-end pb-4">
                <div className="text-center">
                  <div className="w-48 border-t border-gray-300 mb-2"></div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Customer Signature</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase mb-14 text-primary">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                  <div className="w-56 border-t-2 border-black mb-2"></div>
                  <p className="text-[9px] font-black uppercase">Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
