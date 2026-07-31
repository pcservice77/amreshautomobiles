"use client"

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Printer, Save, User, CreditCard, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      soldAt: new Date().toISOString(),
    };

    addDoc(collection(firestore, 'sales'), saleData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'sales',
          operation: 'create',
          requestResourceData: saleData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: 'Bill Recorded',
      description: `Invoice for ${data.customerName} has been queued for sync.`,
    });
    router.push('/admin/sales');
  };

  const watchModel = form.watch('model');
  useEffect(() => {
    if (watchModel && scooters) {
      const selected = scooters.find(s => s.model === watchModel);
      if (selected) {
        form.setValue('price', selected.price as string);
      }
    }
  }, [watchModel, scooters, form]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="print:hidden">
        <h1 className="text-3xl font-headline font-bold">Digital Billing Engine</h1>
        <p className="text-muted-foreground">Generate official sales invoices for customers.</p>
      </div>

      <div className="hidden print:block text-center border-b pb-8 mb-8">
        <h1 className="text-4xl font-bold uppercase">{showroom?.name || 'AMRESH AUTOMOBILES'}</h1>
        <p>{showroom?.address}</p>
        <p>Contact: {showroom?.contact} | Email: {showroom?.email}</p>
        <div className="mt-4 text-xl font-bold border-t pt-4">TAX INVOICE / SALE BILL</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card/40 border-white/5 print:border-none print:shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 print:hidden">
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

          <Card className="bg-card/40 border-white/5 print:border-none print:shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 print:hidden">
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

          <Card className="bg-card/40 border-white/5 print:border-none print:shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 print:hidden">
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

          <div className="flex gap-4 pt-4 print:hidden">
            <Button type="submit" size="lg" className="flex-1 gap-2 bg-primary text-primary-foreground">
              <Save className="h-5 w-5" />
              Finalize Sale & Save
            </Button>
            <Button type="button" variant="outline" size="lg" className="gap-2 border-white/10" onClick={handlePrint}>
              <Printer className="h-5 w-5" />
              Print Invoice
            </Button>
          </div>
          
          <div className="hidden print:block mt-12 text-sm text-center text-muted-foreground border-t pt-8">
            <p>Thank you for choosing Amresh Automobiles for your electric mobility needs.</p>
            <p>This is a computer generated invoice.</p>
          </div>
        </form>
      </Form>
    </div>
  );
}
