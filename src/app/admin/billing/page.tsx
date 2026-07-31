"use client"

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Printer, Save, User, CreditCard, Bike, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format } from 'date-fns';

const billSchema = z.object({
  customerName: z.string().min(3, 'Customer name is required'),
  mobile: z.string().length(10, 'Valid 10-digit mobile number required'),
  address: z.string().min(5, 'Address is required'),
  idType: z.string().min(1, 'ID Type is required'),
  idNumber: z.string().min(1, 'ID Number is required'),
  model: z.string().min(1, 'Scooter model is required'),
  chassisNumber: z.string().min(5, 'Chassis number is required'),
  price: z.string().min(1, 'Price is required'),
});

export default function BillingPage() {
  const firestore = useFirestore();
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
      mobile: '',
      address: '',
      idType: 'Aadhar',
      idNumber: '',
      model: '',
      chassisNumber: '',
      price: '',
    },
  });

  const onSubmit = (data: z.infer<typeof billSchema>) => {
    if (!firestore) return;
    
    const saleData = {
      ...data,
      gstin: showroom?.gstin || '',
      soldAt: new Date().toISOString(),
    };

    addDoc(collection(firestore, 'sales'), saleData)
      .then(() => {
        setIsSaved(true);
        toast({
          title: 'Bill Recorded',
          description: `Invoice for ${data.customerName} saved. Preparing to print...`,
        });
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
      }, 500);
    }
  }, [isSaved, router]);

  const watchModel = form.watch('model');
  useEffect(() => {
    if (watchModel && scooters) {
      const selected = scooters.find(s => s.model === watchModel);
      if (selected) {
        form.setValue('price', selected.price as string);
      }
    }
  }, [watchModel, scooters, form]);

  const handleManualPrint = () => {
    window.print();
  };

  const currentValues = form.getValues();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="print:hidden">
        <h1 className="text-3xl font-headline font-bold">Digital Billing Engine</h1>
        <p className="text-muted-foreground">Generate official sales invoices for customers.</p>
      </div>

      {/* Professional Printable Invoice Area */}
      <div id="printable-invoice" className="hidden print:block bg-white text-black p-8">
        <div className="text-center border-b-2 border-black pb-6 mb-6">
          <div className="flex justify-center mb-4">
             <Zap className="h-10 w-10 text-black fill-current" />
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">{showroom?.name || 'AMRESH AUTOMOBILES'}</h1>
          <p className="text-sm font-medium">{showroom?.address || 'Showroom Address'}</p>
          <p className="text-sm">Contact: {showroom?.contact} | Email: {showroom?.email}</p>
          {showroom?.gstin && <p className="font-bold mt-1">GSTIN: {showroom.gstin}</p>}
          <div className="mt-4 text-2xl font-black border-y-2 border-black py-2 tracking-widest">TAX INVOICE / SALE BILL</div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="space-y-1">
            <h4 className="font-bold border-b border-black pb-1 mb-2 text-xs uppercase">BILL TO:</h4>
            <p className="text-lg font-bold">{currentValues.customerName || '____________________'}</p>
            <p><span className="font-semibold">Mobile:</span> {currentValues.mobile || '__________'}</p>
            <p><span className="font-semibold">Address:</span> {currentValues.address || '____________________'}</p>
            <p><span className="font-semibold">{currentValues.idType}:</span> {currentValues.idNumber || '__________'}</p>
          </div>
          <div className="space-y-1 text-right">
            <h4 className="font-bold border-b border-black pb-1 mb-2 text-xs uppercase text-right">INVOICE DETAILS:</h4>
            <p><span className="font-semibold">Date:</span> {format(new Date(), 'dd MMMM yyyy')}</p>
            <p><span className="font-semibold">Time:</span> {format(new Date(), 'hh:mm a')}</p>
            <p><span className="font-semibold">Place of Supply:</span> {showroom?.address?.split(',').pop()?.trim() || 'Showroom City'}</p>
          </div>
        </div>

        <div className="border-2 border-black rounded-sm overflow-hidden mb-8">
          <Table className="border-collapse">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-black">
                <TableHead className="text-black font-bold uppercase py-3 border-r border-black">Item Description</TableHead>
                <TableHead className="text-black font-bold uppercase py-3 border-r border-black">Chassis Number</TableHead>
                <TableHead className="text-black font-bold uppercase py-3 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-black min-h-[100px]">
                <TableCell className="py-6 border-r border-black">
                  <p className="font-bold text-lg">{currentValues.model || 'Scooter Model'}</p>
                  <p className="text-xs text-gray-600">High Performance Electric Vehicle</p>
                </TableCell>
                <TableCell className="font-mono border-r border-black">{currentValues.chassisNumber || '__________'}</TableCell>
                <TableCell className="text-right font-bold text-lg">{currentValues.price || '₹ 0.00'}</TableCell>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableCell colSpan={2} className="text-right font-black text-xl py-4 border-r border-black">GRAND TOTAL</TableCell>
                <TableCell className="text-right font-black text-2xl py-4">{currentValues.price || '₹ 0.00'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-[10px] space-y-2">
            <h5 className="font-bold border-b border-black pb-0.5 mb-1">TERMS & CONDITIONS:</h5>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>Warranty as per manufacturer policies.</li>
              <li>Delivery subject to verification of documents.</li>
              <li>Subject to local jurisdiction.</li>
            </ol>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-56 border-t border-black text-center pt-2">
              <p className="font-bold text-sm">Authorised Signatory</p>
              <p className="text-[10px] text-gray-500 mt-0.5">For {showroom?.name || 'Amresh Automobiles'}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-gray-400 pt-4 border-t border-gray-100 italic">
          <p>This is a computer generated invoice. Go Green. Ride Electric.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 print:hidden">
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="H.No, Street, City, State" {...field} className="border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5">
            <CardHeader className="flex flex-row items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Identification Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="idType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Proof Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-white/10">
                          <SelectValue placeholder="Select ID Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="PAN">PAN Card</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="DL">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ID number" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5">
            <CardHeader className="flex flex-row items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Vehicle Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scooter Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-white/10">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scooters?.map(s => (
                          <SelectItem key={s.id} value={s.model as string}>{s.model as string}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chassisNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chassis Number</FormLabel>
                    <FormControl>
                      <Input placeholder="VOLT-XXXXX" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input placeholder="₹ 0.00" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button type="submit" size="lg" className="flex-1 gap-2 bg-primary text-primary-foreground">
              <Save className="h-5 w-5" />
              Finalize Sale & Save
            </Button>
            <Button type="button" variant="outline" size="lg" className="gap-2 border-white/10" onClick={handleManualPrint}>
              <Printer className="h-5 w-5" />
              Print Preview
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}