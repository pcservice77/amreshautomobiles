
"use client"

import { useState } from 'react';
import { Search, Download, Eye, Calendar, UserCheck, FileText, Printer, X, Zap, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
              <TableRow><TableCell colSpan={6} className="text-center py-20">Loading...</TableCell></TableRow>
            ) : filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-primary font-bold">{sale.invoiceNo}</TableCell>
                <TableCell>{sale.soldAt ? format(new Date(sale.soldAt), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.mobile}</div>
                </TableCell>
                <TableCell>{sale.model} {sale.variant}</TableCell>
                <TableCell className="font-bold">₹ {sale.price.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}><Eye className="h-4 w-4 mr-2" /> View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className={cn(
          "max-w-[210mm] max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:shadow-none print:m-0",
          isTemplateMode && "print:max-h-none"
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
            className="print-container p-[12mm] relative min-h-[297mm]" 
            id="printable-invoice"
            style={isTemplateMode ? {
              backgroundImage: `url(${showroom.letterheadUrl})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'top center'
            } : {}}
          >
            {!isTemplateMode && <div className="invoice-watermark">AMRESH</div>}
            
            {/* Template Mode Absolute Positioning */}
            {isTemplateMode ? (
              <div className="relative w-full h-full text-[10px] font-bold">
                {/* Invoice Meta */}
                <div className="absolute top-[37mm] right-[15mm] text-red-600">
                  {selectedSale?.invoiceNo}
                </div>
                <div className="absolute top-[43mm] right-[15mm]">
                  {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : ''}
                </div>

                {/* Customer Details Box */}
                <div className="absolute top-[63mm] left-[5mm] w-[80mm] space-y-1.5 leading-tight">
                  <p className="text-[12px] uppercase">{selectedSale?.customerName}</p>
                  <p>{selectedSale?.customerFatherName}</p>
                  <p className="h-[12mm] overflow-hidden">{selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                  <p>{selectedSale?.mobile}</p>
                  <p>{selectedSale?.email}</p>
                  <p>{selectedSale?.idNumber}</p>
                </div>

                {/* Vehicle Details Box */}
                <div className="absolute top-[63mm] left-[105mm] w-[90mm] grid grid-cols-2 gap-y-1.5 gap-x-2">
                  <div className="col-span-2 text-[12px] uppercase text-primary">{selectedSale?.model}</div>
                  <div>{selectedSale?.variant}</div>
                  <div>{selectedSale?.color}</div>
                  <div>{selectedSale?.batteryType}</div>
                  <div>{selectedSale?.batteryCapacity}</div>
                  <div>{selectedSale?.claimedRange}</div>
                  <div className="col-span-2">{selectedSale?.motorNumber}</div>
                  <div className="col-span-2">{selectedSale?.chassisNumber}</div>
                  <div className="col-span-2">{selectedSale?.controllerNumber}</div>
                  <div>{selectedSale?.registrationNumber}</div>
                  <div>{selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : ''}</div>
                </div>

                {/* Table Area (Starts around 115mm) */}
                <div className="absolute top-[115mm] left-0 w-full px-2">
                   <div className="grid grid-cols-[35px_1fr_100px_60px_100px_100px] gap-2 items-center">
                      <div className="text-center">1</div>
                      <div className="uppercase">{selectedSale?.model} {selectedSale?.variant}</div>
                      <div className="text-center">{selectedSale?.hsn || '871160'}</div>
                      <div className="text-center">1</div>
                      <div className="text-right">₹ {selectedSale?.price.toLocaleString()}</div>
                      <div className="text-right">₹ {selectedSale?.price.toLocaleString()}</div>
                   </div>
                </div>

                {/* Summary & Footer Area (Positioned relative to bottom of table space) */}
                <div className="absolute top-[200mm] left-0 w-full px-4">
                  <div className="flex justify-between items-start">
                    <div className="w-[120mm] pt-4">
                      <p className="uppercase leading-tight">{amountToWords(selectedSale?.price)} Only</p>
                    </div>
                    <div className="w-[60mm] space-y-2 text-right">
                       <p>₹ {selectedSale?.price.toLocaleString()}.00</p>
                       <p>₹ 0.00</p>
                       <p>₹ {selectedSale?.price.toLocaleString()}.00</p>
                       <p>₹ 0.00</p>
                       <p>₹ 0.00</p>
                       <p>₹ 0.00</p>
                       <div className="text-white text-[16px] pt-4 pr-4">
                         ₹ {selectedSale?.price.toLocaleString()}.00
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Standard Invoice Header */}
                <div className="flex justify-between border-b-2 border-primary pb-4 mb-6">
                  <div className="flex gap-4 items-center">
                    <Zap className="h-16 w-16 text-primary fill-current" />
                    <div>
                      <h1 className="text-3xl font-black text-primary tracking-tighter leading-none">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                      <div className="mt-3 text-[10px] space-y-0.5 text-gray-500 font-medium">
                        <p>{showroom?.address}</p>
                        <p>Mobile: {showroom?.contact}</p>
                        <p>Email: {showroom?.email}</p>
                        {showroom?.gstin && <p className="font-bold text-black mt-1">GSTIN: {showroom.gstin}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-black text-gray-100 uppercase leading-none mb-2">INVOICE</h2>
                    <p className="text-sm font-bold"><span className="text-gray-400">No:</span> {selectedSale?.invoiceNo}</p>
                    <p className="text-sm font-bold"><span className="text-gray-400">Date:</span> {selectedSale?.soldAt ? format(new Date(selectedSale.soldAt), 'dd/MM/yyyy') : ''}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                    <h4 className="font-bold text-primary border-b border-primary/20 pb-1 mb-2 uppercase text-[10px] tracking-wider">Customer Details</h4>
                    <div className="space-y-1">
                      <p className="text-base font-black uppercase">{selectedSale?.customerName}</p>
                      {selectedSale?.customerFatherName && <p><span className="text-gray-500 font-semibold">S/O, W/O:</span> {selectedSale.customerFatherName}</p>}
                      <p className="leading-tight"><span className="text-gray-500 font-semibold">Address:</span> {selectedSale?.address}, {selectedSale?.city}, {selectedSale?.state} - {selectedSale?.pin}</p>
                      <p><span className="text-gray-500 font-semibold">Mobile:</span> {selectedSale?.mobile}</p>
                      <p><span className="text-gray-500 font-semibold">{selectedSale?.idType}:</span> {selectedSale?.idNumber}</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                    <h4 className="font-bold text-primary border-b border-primary/20 pb-1 mb-2 uppercase text-[10px] tracking-wider">Vehicle Specifications</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <p className="col-span-2 text-base font-black text-primary uppercase">{selectedSale?.model} {selectedSale?.variant}</p>
                      <p><span className="text-gray-500 font-semibold">Color:</span> {selectedSale?.color}</p>
                      <p><span className="text-gray-500 font-semibold">Reg No:</span> {selectedSale?.registrationNumber || 'N/A'}</p>
                      <p className="col-span-2"><span className="text-gray-500 font-semibold">Chassis:</span> {selectedSale?.chassisNumber}</p>
                      <p className="col-span-2"><span className="text-gray-500 font-semibold">Motor:</span> {selectedSale?.motorNumber || 'N/A'}</p>
                      <p><span className="text-gray-500 font-semibold">Battery:</span> {selectedSale?.batteryType}</p>
                      <p><span className="text-gray-500 font-semibold">Range:</span> {selectedSale?.claimedRange || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="mb-6">
                  <table className="w-full invoice-table border-collapse">
                    <thead>
                      <tr>
                        <th className="w-12 text-center">Sr</th>
                        <th className="text-left">Item Description</th>
                        <th className="w-24 text-center">HSN</th>
                        <th className="w-16 text-center">Qty</th>
                        <th className="w-28 text-right">Rate</th>
                        <th className="w-32 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-40 align-top">
                        <td className="text-center font-bold">1</td>
                        <td>
                          <p className="font-black text-sm uppercase">{selectedSale?.model}</p>
                          <p className="text-[10px] text-gray-500 mt-1">High-Performance Electric Mobility Solution</p>
                          {selectedSale?.variant && <p className="text-[10px] font-bold">Variant: {selectedSale.variant}</p>}
                        </td>
                        <td className="text-center">{selectedSale?.hsn || '871160'}</td>
                        <td className="text-center">1</td>
                        <td className="text-right">₹ {selectedSale?.price.toLocaleString()}.00</td>
                        <td className="text-right font-bold">₹ {selectedSale?.price.toLocaleString()}.00</td>
                      </tr>
                      <tr className="summary-total">
                        <td colSpan={4} className="py-4 px-6 text-right text-xl font-black italic border-none rounded-l-lg">GRAND TOTAL</td>
                        <td colSpan={2} className="py-4 px-6 text-right text-2xl font-black border-none rounded-r-lg">₹ {selectedSale?.price.toLocaleString()}.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Info */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-[11px]">
                  <div>
                    <p className="font-bold italic text-gray-700 mb-2 underline">Amount in Words:</p>
                    <p className="font-black text-xs uppercase leading-snug">Rupees {amountToWords(selectedSale?.price)} Only</p>
                    
                    <div className="mt-6 border-t-2 border-gray-100 pt-3">
                      <h5 className="font-black text-primary uppercase text-[9px] mb-2 tracking-widest">Showroom Bank Details</h5>
                      <div className="text-[9px] text-gray-600 font-medium">
                        <p>Bank: {showroom?.bankName}</p>
                        <p>A/c Name: {showroom?.accountName}</p>
                        <p>A/c No: {showroom?.accountNumber}</p>
                        <p>IFSC: {showroom?.ifsc} | Branch: {showroom?.branch}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h5 className="font-bold text-[10px] mb-2 uppercase border-b border-gray-200 pb-1">Terms & Conditions</h5>
                      <ul className="list-decimal pl-3 space-y-1 text-[9px] text-gray-500 font-medium italic">
                        <li>Goods once sold will not be taken back or exchanged.</li>
                        <li>Warranty as per manufacturer's company policy.</li>
                        <li>Battery warranty according to manufacturer standards.</li>
                        <li>All disputes are subject to Khunti (Jharkhand) Jurisdiction.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mt-20 px-4">
                  <div className="text-center">
                    <div className="w-48 border-t-2 border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Customer Signature</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase mb-12">For {showroom?.name || 'AMRESH AUTOMOBILE'}</p>
                    <div className="w-56 border-t-2 border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Authorised Signatory</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
