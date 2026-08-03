
"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Zap, Calendar, MapPin, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sendBookingConfirmationEmail } from '@/app/actions/email';

const bookingSchema = z.object({
  customerName: z.string().min(3, 'Required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().length(10, '10-digits required'),
  address: z.string().min(5, 'Required'),
  scooterModel: z.string().min(1, 'Select a model'),
  branchId: z.string().min(1, 'Select a showroom'),
  preferredDate: z.string().min(1, 'Select a date'),
  preferredTime: z.string().min(1, 'Select a time'),
});

export default function TestRideBookingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: branches } = useCollection(branchesQuery);
  const { data: scooters } = useCollection(scootersQuery);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      email: '',
      mobile: '',
      address: '',
      scooterModel: '',
      branchId: '',
      preferredDate: format(new Date(), 'yyyy-MM-dd'),
      preferredTime: '10:00 AM',
    },
  });

  const onSubmit = async (data: z.infer<typeof bookingSchema>) => {
    if (!firestore) return;
    setIsSubmitting(true);

    const bookingData = {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save to Firestore
      await addDoc(collection(firestore, 'bookings'), bookingData);
      
      // 2. Trigger Email Notification (Server Action)
      const branch = branches?.find(b => b.id === data.branchId);
      const emailResult = await sendBookingConfirmationEmail(data.email, {
        customerName: data.customerName,
        scooterModel: data.scooterModel,
        date: data.preferredDate,
        time: data.preferredTime,
        branchName: branch?.name || 'Amresh Automobiles',
      });

      if (!emailResult.success) {
        console.warn('Email notification failed to send, but booking was saved:', emailResult.error);
        toast({ 
          title: 'Booking Saved', 
          description: 'Your ride is booked, but we had trouble sending the confirmation email. Our team will call you.' 
        });
      } else {
        toast({ title: 'Success', description: 'Test ride booked! Check your email for confirmation.' });
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Booking Error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process your booking. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex justify-center">
          <Card className="max-w-md w-full text-center p-8 bg-card/50 backdrop-blur-xl border-white/10">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/20 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-headline font-bold mb-4">Ride Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for choosing Amresh Automobiles. We've sent a confirmation email to <strong>{form.getValues('email')}</strong>. Our executive will call you shortly.
            </p>
            <Button className="w-full" onClick={() => setIsSuccess(false)}>Book Another Ride</Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-5xl font-headline font-bold mb-6">Book Your <span className="text-primary italic">Test Ride.</span></h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experience the adrenaline of future-ready electric mobility. Fill out the form to schedule a ride at a showroom near you.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Top Performance</h4>
                  <p className="text-muted-foreground text-sm">Experience peak torque and silent efficiency.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Wide Network</h4>
                  <p className="text-muted-foreground text-sm">Multiple locations across Jharkhand for your convenience.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Instant Notification</h4>
                  <p className="text-muted-foreground text-sm">Get real-time booking updates via email.</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="lg:col-span-3 border-white/10 bg-card/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Schedule Ride</CardTitle>
              <CardDescription>Enter your details and select your preferred vehicle and location.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1"><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="mobile" render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1"><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="col-span-2"><FormLabel>Address/City</FormLabel><FormControl><Input placeholder="Your area" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="scooterModel" render={({ field }) => (
                      <FormItem><FormLabel>Select Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger><SelectValue placeholder="Which scooter?" /></SelectTrigger>
                          <SelectContent>{scooters?.map(s => <SelectItem key={s.id} value={s.model}>{s.model}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="branchId" render={({ field }) => (
                      <FormItem><FormLabel>Showroom Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger><SelectValue placeholder="Nearest Showroom" /></SelectTrigger>
                          <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="preferredDate" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="preferredTime" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Time Slot</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10:00 AM">10:00 AM - 12:00 PM</SelectItem>
                            <SelectItem value="12:00 PM">12:00 PM - 02:00 PM</SelectItem>
                            <SelectItem value="02:00 PM">02:00 PM - 04:00 PM</SelectItem>
                            <SelectItem value="04:00 PM">04:00 PM - 06:00 PM</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : 'Schedule Test Ride Now'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}
