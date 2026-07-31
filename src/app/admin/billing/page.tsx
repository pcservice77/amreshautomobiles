
"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Printer, Save, User, CreditCard, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db, Scooter } from '@/lib/db-mock';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchScooters = async () => {
      const data = await db.getScooters();
      setScooters(data);
    };
    fetchScooters();
  }, []);

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

  const onSubmit = async (data: z.infer<typeof billSchema>) => {
    try {
      await db.addSale({
        ...data,
        soldAt: new Date().toISOString(),
      });
      toast({
        title: 'Bill Generated',
        description: `Invoice for ${data.customerName} has been recorded.`,
      });
      router.push('/admin/sales');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Billing Failed',
        description: 'Could not generate the bill. Please try again.',
      });
    }
  };

  const watchModel = form.watch('model');
  useEffect(() => {
    if (watchModel) {
      const selected = scooters.find(s => s.model === watchModel);
      if (selected) {
        form.setValue('price', selected.price);
      }
    }
  }, [watchModel, scooters, form]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Digital Billing Engine</h1>
        <p className="text-muted-foreground">Generate official sales invoices for customers.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer Details */}
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
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="9876543210" {...field} />
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
                        <Input placeholder="H.No, Street, City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ID Details */}
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
                        <SelectTrigger>
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
                      <Input placeholder="Enter ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Vehicle Details */}
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scooters.map(s => (
                          <SelectItem key={s.id} value={s.model}>{s.model}</SelectItem>
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
                      <Input placeholder="VOLT-XXXXX" {...field} />
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
                      <Input placeholder="₹ 0.00" {...field} />
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
            <Button type="button" variant="outline" size="lg" className="gap-2 border-white/10" onClick={() => window.print()}>
              <Printer className="h-5 w-5" />
              Print Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
