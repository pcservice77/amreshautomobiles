
"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Search, Loader2, Calendar, MapPin, CheckCircle2, History, Printer, Zap, Bike } from 'lucide-react';
import { format } from 'date-fns';
import { sendServiceConfirmationEmail } from '@/app/actions/email';
import { motion, AnimatePresence } from 'framer-motion';

const searchSchema = z.object({
  identifier: z.string().min(3, 'Enter Mobile, Chassis or Invoice No.'),
});

const serviceSchema = z.object({
  branchId: z.string().min(1, 'Select a service center'),
  currentKm: z.coerce.number().min(1, 'Required'),
  serviceType: z.string().default('Routine'),
  preferredDate: z.string().min(1, 'Select a date'),
  preferredTime: z.string().min(1, 'Select a slot'),
  notes: z.string().optional(),
});

export default function ServiceBookingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [matchingSale, setMatchingSale] = useState<any>(null);
  const [lastService, setLastService] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsSubmitting] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const { data: branches } = useCollection(branchesQuery);

  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { identifier: '' },
  });

  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      branchId: '',
      currentKm: 0,
      serviceType: 'Routine',
      preferredDate: format(new Date(), 'yyyy-MM-dd'),
      preferredTime: '10:00 AM',
      notes: '',
    },
  });

  const onSearch = async (data: z.infer<typeof searchSchema>) => {
    if (!firestore) return;
    setIsSearching(true);
    setMatchingSale(null);
    setLastService(null);

    try {
      const salesRef = collection(firestore, 'sales');
      const val = data.identifier.trim();
      
      // Attempt search by multiple fields
      let snap = await getDocs(query(salesRef, where('mobile', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('chassisNumber', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('invoiceNo', '==', val)));

      if (snap.empty) {
        toast({ variant: 'destructive', title: 'Vehicle Not Found', description: 'Could not find a record matching those details.' });
      } else {
        const sale = { ...snap.docs[0].data(), id: snap.docs[0].id };
        setMatchingSale(sale);

        // Fetch last service - wrapped in try/catch to handle permission issues gracefully
        try {
          const servicesRef = collection(firestore, 'service-bookings');
          const sSnap = await getDocs(query(
            servicesRef, 
            where('chassisNumber', '==', sale.chassisNumber),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(1)
          ));
          if (!sSnap.empty) setLastService(sSnap.docs[0].data());
        } catch (historyError) {
          console.warn('Vehicle history lookup restricted or index missing');
        }
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Search Error', description: 'Problem connecting to database.' });
    } finally {
      setIsSearching(false);
    }
  };

  const onBookService = async (data: z.infer<typeof serviceSchema>) => {
    if (!firestore || !matchingSale) return;
    setIsSubmitting(true);

    const bookingData = {
      ...data,
      saleId: matchingSale.id,
      customerName: matchingSale.customerName,
      mobile: matchingSale.mobile,
      email: matchingSale.email || '',
      chassisNumber: matchingSale.chassisNumber,
      model: matchingSale.model,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(firestore, 'service-bookings'), bookingData);
      
      const branch = branches?.find(b => b.id === data.branchId);
      if (matchingSale.email) {
        await sendServiceConfirmationEmail(matchingSale.email, {
          customerName: matchingSale.customerName,
          scooterModel: matchingSale.model,
          date: data.preferredDate,
          time: data.preferredTime,
          branchName: branch?.name || 'Amresh Automobiles',
          serviceType: data.serviceType,
        });
      }

      setBookedDetails({ ...bookingData, id: docRef.id, branchName: branch?.name });
      toast({ title: 'Service Booked!', description: 'Your appointment is registered.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Booking Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookedDetails) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex justify-center pb-20">
          <Card className="max-w-2xl w-full border-primary/20 bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="bg-primary p-8 text-center text-primary-foreground relative overflow-hidden">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-headline font-bold">Booking Confirmed</h1>
              <p className="opacity-80">Reference ID: {bookedDetails.id}</p>
              <Zap className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10" />
            </div>
            
            <CardContent className="p-10 space-y-8 print:p-0">
              <div className="grid grid-cols-2 gap-8 border-b pb-8 border-white/5">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Customer</p>
                  <p className="font-bold">{bookedDetails.customerName}</p>
                  <p className="text-sm text-muted-foreground">{bookedDetails.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Vehicle</p>
                  <p className="font-bold">{bookedDetails.model}</p>
                  <p className="text-sm text-muted-foreground">Chassis: {bookedDetails.chassisNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Service Center</p>
                    <p className="font-bold">{bookedDetails.branchName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Appointment</p>
                    <p className="font-bold">{format(new Date(bookedDetails.preferredDate), 'PPPP')} at {bookedDetails.preferredTime}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Bike className="h-4 w-4 text-primary" />
                  Arrival Guidelines
                </h4>
                <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                  <li>Please arrive 15 minutes before your scheduled slot.</li>
                  <li>Ensure your vehicle has at least 20% battery remaining.</li>
                  <li>Bring this digital slip or your original invoice.</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="p-8 border-t border-white/5 flex gap-4 no-print">
              <Button className="flex-1 h-12 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Download Slip
              </Button>
              <Button variant="outline" className="flex-1 h-12" onClick={() => window.location.reload()}>
                Book Another
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-6xl font-headline font-bold mb-6 tracking-tighter leading-none">
                SMART <br/><span className="text-primary italic">SERVICE.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Expert maintenance for your high-performance EV. Enter your details to retrieve vehicle history and book your next checkup.
              </p>
            </motion.div>

            <div className="space-y-6">
               <FeatureCard icon={History} title="Recall History" desc="View all past services and technical notes for your unit." />
               <FeatureCard icon={MapPin} title="Flexible Centers" desc="Select any Amresh Showroom in Jharkhand for your repair." />
               <FeatureCard icon={Wrench} title="Authentic Parts" desc="Only original LFP batteries and components used by certified tech." />
            </div>
          </div>

          {/* Right Column: Dynamic Form */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!matchingSale ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border-white/10 bg-card/30 backdrop-blur-xl p-8 rounded-[2rem]">
                    <CardHeader className="p-0 mb-8">
                      <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Identify Your Vehicle</CardTitle>
                      <CardDescription>Enter one identifier to fetch your data from Amresh archives.</CardDescription>
                    </CardHeader>
                    <Form {...searchForm}>
                      <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-6">
                        <FormField control={searchForm.control} name="identifier" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile / Chassis / Invoice</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="e.g. 9876543210 or AA/..." className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl" {...field} />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit" size="lg" className="w-full h-14 font-black uppercase text-xs tracking-widest gap-2 rounded-2xl" disabled={isSearching}>
                          {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Zap className="h-4 w-4" />}
                          Access Dashboard
                        </Button>
                      </form>
                    </Form>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="booking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-white/10 bg-card/30 backdrop-blur-xl p-8 rounded-[2rem]">
                    <div className="flex justify-between items-start mb-10 pb-6 border-b border-white/5">
                      <div>
                        <h3 className="text-3xl font-headline font-bold text-primary">{matchingSale.model}</h3>
                        <p className="text-sm text-muted-foreground">Owned by {matchingSale.customerName}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold" onClick={() => setMatchingSale(null)}>Change Vehicle</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Purchased From</p>
                        <p className="font-bold text-xs">{(branches?.find(b => b.id === matchingSale.branchId))?.name || 'Main Showroom'}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Last Service</p>
                        <p className="font-bold text-xs">{lastService ? format(new Date(lastService.createdAt), 'dd MMM yyyy') : 'First Service'}</p>
                      </div>
                    </div>

                    <Form {...serviceForm}>
                      <form onSubmit={serviceForm.handleSubmit(onBookService)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={serviceForm.control} name="branchId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Center</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white/5 rounded-xl border-white/10">
                                    <SelectValue placeholder="Select Showroom" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {branches?.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={serviceForm.control} name="serviceType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white/5 rounded-xl border-white/10">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Routine">Routine Service</SelectItem>
                                  <SelectItem value="Repair">General Repair</SelectItem>
                                  <SelectItem value="Warranty">Warranty Claim</SelectItem>
                                  <SelectItem value="Battery Check">Battery Health Check</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={serviceForm.control} name="currentKm" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Reading (KM)</FormLabel>
                              <FormControl><Input type="number" className="h-12 bg-white/5 rounded-xl border-white/10" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={serviceForm.control} name="preferredDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Date</FormLabel>
                              <FormControl><Input type="date" className="h-12 bg-white/5 rounded-xl border-white/10" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <Button type="submit" size="lg" className="w-full h-14 font-black uppercase text-xs tracking-widest glow-primary rounded-2xl" disabled={isBooking}>
                          {isBooking ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Service Appointment'}
                        </Button>
                      </form>
                    </Form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="p-3 bg-primary/10 rounded-2xl h-fit border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
