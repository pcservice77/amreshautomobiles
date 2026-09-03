"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, User, Bike, Receipt, Landmark, Loader2, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { sendInvoiceEmail } from '@/app/actions/email';
import { format } from 'date-fns';
import Image from 'next/image';

const billSchema = z.object({
  customerName: z.string().min(3, 'Required'),
  customerFatherName: z.string().optional(),
  mobile: z.string().length(10, '10-digits required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pin: z.string().length(6, '6-digits required'),
  idType: z.string().default('Aadhar'),
  idNumber: z.string().min(1, 'Required'),
  
  model: z.string().min(1, 'Required'),
  variant: z.string().optional(),
  color: z.string().min(1, 'Required'),
  batteryType: z.string().default('Lithium-ion'),
  batteryCapacity: z.string().optional(),
  batterySerialNumber: z.string().optional(),
  claimedRange: z.string().optional(),
  chassisNumber: z.string().min(5, 'Required'),
  motorNumber: z.string().optional(),
  controllerNumber: z.string().optional(),
  vehicleSerialNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  
  price: z.coerce.number().min(1, 'Required'),
  hsn: z.string().default('871160'),
  
  paymentMethod: z.string().default('Cash'),
  financeCompany: z.string().optional(),
  loanAmount: z.coerce.number().default(0),
  downPayment: z.coerce.number().default(0),
  utrNumber: z.string().optional(),
});

export default function BillingPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedSale, setLastSavedSale] = useState<any>(null);
  
  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: scooters } = useCollection(scootersQuery);
  const { data: showroom } = useDoc(showroomRef);
  
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof billSchema>>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      customerName: '',
      customerFatherName: '',
      mobile: '',
      email: '',
      address: '',
      city: 'Khunti',
      state: 'Jharkhand',
      pin: '834004',
      idType: 'Aadhar',
      idNumber: '',
      model: '',
      variant: '',
      color: '',
      batteryType: 'Lithium-ion',
      batteryCapacity: '',
      batterySerialNumber: '',
      claimedRange: '',
      chassisNumber: '',
      motorNumber: '',
      controllerNumber: '',
      vehicleSerialNumber: '',
      registrationNumber: '',
      price: 0,
      hsn: '871160',
      paymentMethod: 'Cash',
      financeCompany: '',
      loanAmount: 0,
      downPayment: 0,
      utrNumber: '',
    },
  });

  const generateInvoiceNo = async () => {
    if (!firestore || !user) return 'AA/26-27/000001';
    const q = query(collection(firestore, 'sales'), orderBy('soldAt', 'desc'), limit(1));
    try {
      const snap = await getDocs(q);
      if (snap.empty) return 'AA/26-27/000001';
      const last = snap.docs[0].data().invoiceNo || 'AA/26-27/000000';
      const parts = last.split('/');
      const lastNumStr = parts.pop() || '000000';
      const num = parseInt(lastNumStr) + 1;
      return `AA/26-27/${num.toString().padStart(6, '0')}`;
    } catch (e) {
      return `AA/26-27/${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
    }
  };

  const onSubmit = async (data: z.infer<typeof billSchema>) => {
    if (!firestore || !user) return;
    setIsSubmitting(true);
    
    const invNo = await generateInvoiceNo();
    const saleData = {
      ...data,
      invoiceNo: invNo,
      gstin: showroom?.gstin || '',
      soldAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      branchId: user.assignedBranchId || 'main_showroom',
    };

    try {
      await addDoc(collection(firestore, 'sales'), saleData);
      setLastSavedSale(saleData);
      
      if (data.email) {
        await sendInvoiceEmail(data.email, saleData, showroom || {});
      }

      setIsSaved(true);
      toast({ title: 'Sale Recorded', description: `Invoice ${invNo} saved.` });
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sales',
        operation: 'create',
        requestResourceData: saleData,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSaved) {
      setTimeout(() => {
        window.print();
        router.push('/admin/sales');
      }, 1500);
    }
  }, [isSaved, router]);

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

  const watchModel = form.watch('model');
  useEffect(() => {
    if (watchModel && scooters) {
      const selected = scooters.find(s => s.model === watchModel);
      if (selected) {
        form.setValue('price', parseFloat(selected.price.replace(/[^\d.]/g, '')) || 0);
        form.setValue('variant', selected.variant || '');
        form.setValue('batteryType', selected.batteryType || 'Lithium-ion');
      }
    }
  }, [watchModel, scooters, form]);

  if (isSaved && lastSavedSale) {
    return (
      <div className="print-container bg-white text-black p-[15mm]">
        <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
          <div className="flex gap-4">
            <div className="bg-primary p-2 rounded-xl h-16 w-16 flex items-center justify-center relative overflow-hidden">
              {showroom?.logoUrl ? (
                <Image src={showroom.logoUrl} alt="Logo" fill className="object-cover" unoptimized />
              ) : (
                <Zap className="h-8 w-8 text-white fill-current" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary uppercase">{showroom?.name || 'AMRESH AUTOMOBILE'}</h1>
              <p className="text-[10px] text-gray-500 font-bold italic mb-1">{showroom?.tagline}</p>
              <p className="text-[9px] text-gray-500 leading-tight max-w-[250px]">{showroom?.address}</p>
              <p className="text-[10px] text-gray-800 font-bold mt-1">GSTIN: {showroom?.gstin || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-black">INVOICE</h2>
            <p className="text-sm font-bold text-primary">{lastSavedSale.invoiceNo}</p>
            <p className="text-xs text-gray-400">{format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-black p-4 rounded-xl">
            <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Buyer</p>
            <p className="text-lg font-black uppercase">{lastSavedSale.customerName}</p>
            <p className="text-xs font-bold text-gray-600">{lastSavedSale.address}, {lastSavedSale.city}</p>
            <p className="text-xs font-bold text-gray-600">Mob: {lastSavedSale.mobile}</p>
            <p className="text-xs font-bold text-gray-600">ID: {lastSavedSale.idType} - {lastSavedSale.idNumber}</p>
          </div>
          <div className="border border-black p-4 rounded-xl">
            <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Vehicle Details</p>
            <p className="text-lg font-black uppercase text-primary">{lastSavedSale.model}</p>
            <p className="text-xs font-bold">Chassis: {lastSavedSale.chassisNumber}</p>
            {lastSavedSale.batterySerialNumber && <p className="text-xs font-bold">Battery S/N: {lastSavedSale.batterySerialNumber}</p>}
            <p className="text-xs font-bold">Color: {lastSavedSale.color}</p>
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
              <td className="border border-black p-4 align-top">
                <p className="font-black uppercase">{lastSavedSale.model}</p>
                <p className="text-[10px] text-gray-500">Electric Vehicle • {lastSavedSale.variant || 'Standard'}</p>
              </td>
              <td className="border border-black p-4 text-center font-bold align-top">{lastSavedSale.hsn}</td>
              <td className="border border-black p-4 text-right font-black align-top">₹ {lastSavedSale.price.toLocaleString()}.00</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between">
          <div className="w-1/2">
            <p className="text-[10px] font-black text-gray-400 uppercase">Rupees In Words</p>
            <p className="text-sm font-black uppercase text-primary">{amountToWords(lastSavedSale.price)} Only</p>
          </div>
          <div className="w-1/3 bg-gray-50 p-4 border-2 border-black rounded-xl">
            <div className="flex justify-between font-black text-lg"><span>Total</span> <span>₹ {lastSavedSale.price.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="mt-20 flex justify-between items-end">
          <div className="text-center">
            <div className="w-40 border-t border-gray-300 mb-1"></div>
            <p className="text-[10px] font-bold">Buyer Signature</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase mb-10 text-primary">For {showroom?.name}</p>
            <div className="w-56 border-t-2 border-black mb-1"></div>
            <p className="text-[10px] font-bold">Authorized Signatory</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-foreground">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-headline font-bold">Amresh Automobile Billing</h1>
          <p className="text-muted-foreground">Generate GST compliant sales invoices with automated PDF delivery.</p>
        </div>
        <Receipt className="h-10 w-10 text-primary" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
          {/* Customer Details */}
          <Card className="shadow-sm border-white/5 bg-card">
            <CardHeader className="flex flex-row items-center gap-2 bg-secondary/30 rounded-t-lg">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">1. Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Customer Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customerFatherName" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Father/Husband Name</FormLabel>
                  <FormControl><Input placeholder="Care of Name" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (For Automated PDF)</FormLabel>
                  <FormControl><Input placeholder="customer@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="pin" render={({ field }) => (
                <FormItem><FormLabel>PIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="idType" render={({ field }) => (
                <FormItem><FormLabel>ID Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Aadhar">Aadhar Card</SelectItem><SelectItem value="PAN">PAN Card</SelectItem></SelectContent>
                </Select></FormItem>
              )} />
              <FormField control={form.control} name="idNumber" render={({ field }) => (
                <FormItem><FormLabel>ID Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card className="shadow-sm border-white/5 bg-card">
            <CardHeader className="flex flex-row items-center gap-2 bg-secondary/30 rounded-t-lg">
              <Bike className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">2. Vehicle Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent>{scooters?.map(s => (<SelectItem key={s.id} value={s.model}>{s.model}</SelectItem>))}</SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="variant" render={({ field }) => (
                <FormItem><FormLabel>Variant</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="batteryType" render={({ field }) => (
                <FormItem><FormLabel>Battery Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="batterySerialNumber" render={({ field }) => (
                <FormItem><FormLabel>Battery Serial Number (Optional)</FormLabel><FormControl><Input placeholder="BATT-XXXXXX" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="chassisNumber" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Chassis Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="motorNumber" render={({ field }) => (
                <FormItem><FormLabel>Motor Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                <FormItem><FormLabel>Reg. Number (if any)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Price & Payment */}
          <Card className="shadow-sm border-white/5 lg:col-span-2 bg-card">
            <CardHeader className="flex flex-row items-center gap-2 bg-secondary/30 rounded-t-lg">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">3. Price & Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
              <div className="space-y-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Sale Price (Total)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="hsn" render={({ field }) => (
                  <FormItem><FormLabel>HSN Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              
              <div className="space-y-4">
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / Net Banking</SelectItem>
                      <SelectItem value="Finance">Finance / EMI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select></FormItem>
                )} />
                <FormField control={form.control} name="utrNumber" render={({ field }) => (
                  <FormItem><FormLabel>Transaction/UTR No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              {form.watch('paymentMethod') === 'Finance' && (
                <div className="space-y-4 border-l pl-8 border-dashed">
                  <FormField control={form.control} name="financeCompany" render={({ field }) => (
                    <FormItem><FormLabel>Finance Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="loanAmount" render={({ field }) => (
                    <FormItem><FormLabel>Loan Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto px-12 bg-primary text-primary-foreground text-lg h-14"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Finalizing...</>
              ) : (
                <><Save className="mr-2 h-6 w-6" /> Finalize Sale & Email Invoice</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}