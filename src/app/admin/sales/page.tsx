
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
          isTemplateMode && "print:max-h-none print:overflow-visible"
        )}>
          <DialogHeader className="p-4 border-b print:hidden bg-secondary text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg">Amresh Automobile Official Invoice</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="text-white border-white/20 h-8" onClick={handlePrintBill}><Printer className="h-4 w-4 mr-2" /> Print</Button>
                <Button variant="ghost" className="text-white h-8" onClick={() => setSelectedSale(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </DialogHeader>
          
          <div 
            className="print-container relative bg-white overflow-hidden" 
            id="printable-invoice"
            style={{
              width: '210mm',
              height: '297mm',
              margin: '0 auto',
            }}
          >
            {/* Watermark */}
            <div className="invoice-watermark">
              <Zap className="h-[200px] w-[200px]" />
            </div>

            {isTemplateMode && (
              <img 
                src={showroom.letterheadUrl} 
                className="absolute inset-0 w-full h-full object-fill z-0" 
                alt="Background Format"
              />
            )}
            
            {/* Content Overlay */}
            <div className="relative z-10 w-full h-full p-[12mm] flex flex-col">
              
              {/* If no template, render Header */}
              {!isTemplateMode && (
                <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
                  <div className="flex gap-4">
                    <div className="bg-primary p-2 rounded-xl">
                      <Zap className="h-12 w-12 text-white fill-current" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                      <div className="mt-4 text-[10px] leading-tight text-gray-600 font-medium">
                        <p>{showroom?.address || 'Village Padampur, Khunti, Jharkhand'}</p>
                        <p>Mobile: {showroom?.contact || '9798910854'}</p>
                        <p>Email: {showroom?.email || 'amreshautomobile@gmail.com'}</p>
                        {showroom?.gstin && <p className="font-bold text-black mt-1">GSTIN: {showroom.gstin}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <h2 className="text-5xl font-black text-gray-100 absolute right-[12mm] top-[12mm] uppercase tracking-tighter -z-10">INVOICE</h2>
                    <div className="mt-8 space-y-1">
                      <p className="text-sm font-bold"><span className="text-gray-400">Invoice No:</span> <span className="text-primary">{selectedSale?.invoiceNo}</span></p>
                      <p className="text-sm font-bold"><span className="text-gray-400">Date:</span> {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Overlay Section (Works for both modes with different positioning logic) */}
              <div className={cn("flex-1", isTemplateMode ? "relative" : "space-y-6")}>
                
                {/* Mode dependent positioning for Customer and Vehicle boxes */}
                <div className={cn("grid grid-cols-2 gap-6", isTemplateMode && "absolute top-[52mm] left-0 w-full")}>
                  {/* Customer Details */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-3">Customer Information</h4>
                    <div className="space-y-1.5 text-[11px]">
                      <p className="text-lg font-black uppercase text-black">{selectedSale?.customerName}</p>
                      <p className="text-gray-600 font-bold">{selectedSale?.customerFatherName ? `S/O, W/O: ${selectedSale.customerFatherName}` : '-'}</p>
                      <p className="leading-snug"><span className="text-gray-400 uppercase text-[9px]">Address:</span> {selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                      <p><span className="text-gray-400 uppercase text-[9px]">Mobile:</span> <span className="font-bold">{selectedSale?.mobile}</span></p>
                      <p><span className="text-gray-400 uppercase text-[9px]">{selectedSale?.idType || 'ID'}:</span> {selectedSale?.idNumber}</p>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-3">Vehicle Specifications</h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                      <div className="col-span-2">
                        <p className="text-lg font-black text-primary uppercase">{selectedSale?.model}</p>
                        <p className="text-xs font-bold text-gray-500">{selectedSale?.variant || 'Standard Edition'}</p>
                      </div>
                      <p><span className="text-gray-400">Color:</span> {selectedSale?.color || '-'}</p>
                      <p><span className="text-gray-400">Battery:</span> {selectedSale?.batteryType || '-'}</p>
                      <p className="col-span-2"><span className="text-gray-400">Chassis:</span> <span className="font-mono font-bold text-black">{selectedSale?.chassisNumber}</span></p>
                      <p className="col-span-2"><span className="text-gray-400">Motor No:</span> {selectedSale?.motorNumber || '-'}</p>
                      <p><span className="text-gray-400">Reg No:</span> {selectedSale?.registrationNumber || 'Applied'}</p>
                      <p><span className="text-gray-400">Range:</span> {selectedSale?.claimedRange || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className={cn(isTemplateMode && "absolute top-[108mm] left-0 w-full")}>
                  <table className="w-full invoice-table border-collapse rounded-lg overflow-hidden border-2 border-primary">
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
                      <tr className="min-h-[120px] align-top">
                        <td className="text-center font-bold">1</td>
                        <td className="p-4">
                          <p className="font-black text-sm uppercase">{selectedSale?.model} {selectedSale?.variant}</p>
                          <p className="text-[10px] text-gray-400 mt-1 italic">High-Speed Eco-Friendly Electric Mobility Vehicle</p>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-primary"><Leaf className="h-3 w-3" /> Zero Emission</div>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> Certified Safe</div>
                          </div>
                        </td>
                        <td className="text-center">{selectedSale?.hsn || '871160'}</td>
                        <td className="text-center">1</td>
                        <td className="text-right font-mono">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                        <td className="text-right font-mono font-bold text-black">₹ {selectedSale?.price?.toLocaleString()}.00</td>
                      </tr>
                      {/* Empty row for spacing */}
                      <tr className="h-20"><td colSpan={6} className="border-none"></td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className={cn("flex justify-between items-start pt-6", isTemplateMode && "absolute bottom-[85mm] left-0 w-full px-2")}>
                  <div className="w-2/3 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase italic">Amount in Words:</p>
                      <p className="text-sm font-black text-primary uppercase leading-tight">Rupees {amountToWords(selectedSale?.price || 0)} Only</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <h5 className="text-[9px] font-black uppercase text-primary mb-2">Payment Details</h5>
                        <div className="text-[9px] space-y-1 font-bold">
                          <p>Method: <span className="text-black">{selectedSale?.paymentMethod}</span></p>
                          {selectedSale?.paymentMethod === 'Finance' && (
                            <>
                              <p>Financier: {selectedSale?.financeCompany}</p>
                              <p>Loan Amount: ₹ {selectedSale?.loanAmount?.toLocaleString()}</p>
                            </>
                          )}
                          {selectedSale?.utrNumber && <p>TXN/UTR: {selectedSale.utrNumber}</p>}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <h5 className="text-[9px] font-black uppercase text-primary mb-2">Bank Details</h5>
                        <div className="text-[9px] space-y-0.5 text-gray-600 font-medium">
                          <p className="text-black font-bold">{showroom?.bankName || '-'}</p>
                          <p>A/c: {showroom?.accountNumber || '-'}</p>
                          <p>IFSC: {showroom?.ifsc || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-1/3 bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-100">
                    <div className="p-3 space-y-2 text-[11px] font-bold">
                      <div className="flex justify-between"><span className="text-gray-400">Subtotal:</span> <span>₹ {selectedSale?.price?.toLocaleString()}.00</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">GST (Inclusive):</span> <span>₹ 0.00</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Round Off:</span> <span>₹ 0.00</span></div>
                    </div>
                    <div className="bg-primary p-4 text-white text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Grand Total</p>
                      <p className="text-3xl font-black">₹ {selectedSale?.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className={cn("mt-auto pt-8 flex justify-between items-end", isTemplateMode && "absolute bottom-[20mm] left-0 w-full px-4")}>
                  <div className="space-y-4">
                    <div className="text-[9px] text-gray-400 leading-tight">
                      <p className="font-bold underline text-black mb-1 italic">Terms & Conditions:</p>
                      <ul className="list-decimal pl-3 space-y-0.5">
                        <li>Goods once sold will not be taken back.</li>
                        <li>Warranty as per company policy.</li>
                        <li>Subject to Khunti Jurisdiction.</li>
                      </ul>
                    </div>
                    <div className="pt-4">
                      <div className="w-40 border-t border-black mb-1"></div>
                      <p className="text-[9px] font-black uppercase text-center">Customer Signature</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase mb-12 text-primary">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                    <div className="w-56 border-t-2 border-black mb-1"></div>
                    <p className="text-[9px] font-black uppercase tracking-tighter">Authorised Signatory</p>
                  </div>
                </div>

              </div>
              
              {/* Thank you note */}
              <div className="absolute bottom-[5mm] left-0 w-full text-center">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">Thank you for choosing Amresh Automobile</p>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
