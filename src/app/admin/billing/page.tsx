"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, User, Bike, Receipt, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    if (!firestore) return 'AA/26-27/000001';
    const q = query(collection(firestore, 'sales'), orderBy('soldAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return 'AA/26-27/000001';
    const last = snap.docs[0].data().invoiceNo || 'AA/26-27/000000';
    const parts = last.split('/');
    const lastNumStr = parts.pop() || '000000';
    const num = parseInt(lastNumStr) + 1;
    return `AA/26-27/${num.toString().padStart(6, '0')}`;
  };

  const onSubmit = async (data: z.infer<typeof billSchema>) => {
    if (!firestore || !user) return;
    
    const invNo = await generateInvoiceNo();
    const saleData = {
      ...data,
      invoiceNo: invNo,
      gstin: showroom?.gstin || '',
      soldAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      branchId: user.assignedBranchId || 'main_showroom',
    };

    addDoc(collection(firestore, 'sales'), saleData)
      .then(() => {
        setIsSaved(true);
        toast({ title: 'Invoice Saved', description: `Invoice ${invNo} generated.` });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'sales',
          operation: 'create',
          requestResourceData: saleData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  useEffect(() => {
    if (isSaved) {
      setTimeout(() => {
        window.print();
        router.push('/admin/sales');
      }, 800);
    }
  }, [isSaved, router]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-foreground">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-headline font-bold">Amresh Automobile Billing</h1>
          <p className="text-muted-foreground">Generate GST compliant sales invoices for electric scooters.</p>
        </div>
        <Receipt className="h-10 w-10 text-primary" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
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
                <FormItem><FormLabel>Email (Opt)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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
            <Button type="submit" size="lg" className="w-full md:w-auto px-12 bg-primary text-primary-foreground text-lg h-14">
              <Save className="mr-2 h-6 w-6" />
              Finalize Sale & Save Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}