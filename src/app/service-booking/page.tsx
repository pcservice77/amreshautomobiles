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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Search, Loader2, Calendar, MapPin, CheckCircle2, History, Printer, Zap, Bike, ShieldCheck, FileText, Download, TrendingUp } from 'lucide-react';
import { format, addYears, isAfter } from 'date-fns';
import { sendServiceConfirmationEmail } from '@/app/actions/email';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsSubmitting] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: branches } = useCollection(branchesQuery);
  const { data: showroom } = useDoc(showroomRef);

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

  const generateServiceNo = async () => {
    if (!firestore) return 'AA/SR/000001';
    const q = query(collection(firestore, 'service-bookings'), orderBy('createdAt', 'desc'), limit(1));
    try {
      const snap = await getDocs(q);
      if (snap.empty) return 'AA/SR/000001';
      const last = snap.docs[0].data().serviceNo || 'AA/SR/000000';
      const parts = last.split('/');
      const lastNumStr = parts.pop() || '000000';
      const num = parseInt(lastNumStr) + 1;
      return `AA/SR/${num.toString().padStart(6, '0')}`;
    } catch (e) {
      return `AA/SR/${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
    }
  };

  const onSearch = async (data: z.infer<typeof searchSchema>) => {
    if (!firestore) return;
    setIsSearching(true);
    setMatchingSale(null);
    setServiceHistory([]);

    try {
      const salesRef = collection(firestore, 'sales');
      const val = data.identifier.trim();
      
      let snap = await getDocs(query(salesRef, where('mobile', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('chassisNumber', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('invoiceNo', '==', val)));

      if (snap.empty) {
        toast({ variant: 'destructive', title: 'Vehicle Not Found', description: 'Could not find a record matching those details.' });
      } else {
        const sale = { ...snap.docs[0].data(), id: snap.docs[0].id };
        setMatchingSale(sale);

        // Fetch full service history
        try {
          const servicesRef = collection(firestore, 'service-bookings');
          const sSnap = await getDocs(query(
            servicesRef, 
            where('chassisNumber', '==', sale.chassisNumber),
            orderBy('createdAt', 'desc')
          ));
          setServiceHistory(sSnap.docs.map(d => ({ ...d.data(), id: d.id })));
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

    const serviceNo = await generateServiceNo();
    const branch = branches?.find(b => b.id === data.branchId);

    const bookingData = {
      ...data,
      serviceNo,
      saleId: matchingSale.id,
      customerName: matchingSale.customerName,
      mobile: matchingSale.mobile,
      email: matchingSale.email || '',
      chassisNumber: matchingSale.chassisNumber,
      model: matchingSale.model,
      status: 'pending',
      createdAt: new Date().toISOString(),
      branchName: branch?.name || 'Amresh Automobiles',
    };

    try {
      await addDoc(collection(firestore, 'service-bookings'), bookingData);
      
      if (matchingSale.email) {
        await sendServiceConfirmationEmail(matchingSale.email, {
          serviceNo,
          customerName: matchingSale.customerName,
          scooterModel: matchingSale.model,
          date: data.preferredDate,
          time: data.preferredTime,
          branchName: branch?.name || 'Amresh Automobiles',
          serviceType: data.serviceType,
          currentKm: data.currentKm,
          chassisNumber: matchingSale.chassisNumber,
          notes: data.notes,
        }, showroom || {});
      }

      setBookedDetails(bookingData);
      toast({ title: 'Service Booked!', description: `Appointment ${serviceNo} registered.` });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Booking Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const soldDate = matchingSale?.soldAt ? new Date(matchingSale.soldAt) : null;
  
  // Warranty Periods
  const vehicleExpiry = soldDate ? addYears(soldDate, 1) : null;
  const chargerExpiry = soldDate ? addYears(soldDate, 1) : null;
  const batteryExpiry = soldDate ? addYears(soldDate, 3) : null;

  const isVehicleActive = vehicleExpiry ? isAfter(vehicleExpiry, new Date()) : false;
  const isChargerActive = chargerExpiry ? isAfter(chargerExpiry, new Date()) : false;
  const isBatteryActive = batteryExpiry ? isAfter(batteryExpiry, new Date()) : false;

  if (bookedDetails) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex justify-center pb-20">
          <Card className="max-w-2xl w-full border-primary/20 bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="bg-primary p-8 text-center text-primary-foreground relative overflow-hidden">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-headline font-bold">Booking Confirmed</h1>
              <p className="opacity-80">Service No: {bookedDetails.serviceNo}</p>
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
            </CardContent>
            
            <CardFooter className="p-8 border-t border-white/5 flex gap-4 no-print">
              <Button className="flex-1 h-12 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Service Slip
              </Button>
              <Button variant="outline" className="flex-1 h-12" onClick={() => window.location.reload()}>
                Garage Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-foreground pb-32">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32">
        {!matchingSale ? (
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <ShieldCheck className="h-3 w-3" /> Secure Owner Access
              </div>
              <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 tracking-tighter uppercase leading-[0.9]">
                OWNER'S <br/><span className="text-primary italic">GARAGE.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                Access your full service history, warranty details, and digital invoices. Experience high-tech ownership.
              </p>
            </motion.div>

            <Card className="w-full max-w-2xl border-white/10 bg-card/30 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-6 relative z-10">
                  <FormField control={searchForm.control} name="identifier" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identify Your Ride</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Mobile No. / Chassis / Invoice" className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold" {...field} />
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" size="lg" className="w-full h-16 font-black uppercase text-xs tracking-widest gap-3 rounded-2xl glow-primary" disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Zap className="h-5 w-5" />}
                    Enter Digital Garage
                  </Button>
                </form>
              </Form>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-3xl">
              <SimpleFeature icon={History} label="Service Logs" />
              <SimpleFeature icon={ShieldCheck} label="Warranty Tracking" />
              <SimpleFeature icon={FileText} label="Digital Invoices" />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-12">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-primary font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Verified Ownership
                  </p>
                  <h2 className="text-5xl font-headline font-bold uppercase tracking-tight">{matchingSale.model}</h2>
                  <p className="text-muted-foreground text-lg italic">Belongs to {matchingSale.customerName}</p>
               </motion.div>
               <div className="flex gap-3">
                 <Button variant="outline" className="h-12 px-6 rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary/10" onClick={() => setIsInvoiceOpen(true)}>
                   <FileText className="h-4 w-4" /> View Invoice
                 </Button>
                 <Button variant="ghost" className="h-12 px-6 rounded-xl" onClick={() => setMatchingSale(null)}>Exit Garage</Button>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Vehicle Identity & Warranties */}
               <Card className="bg-card/40 border-white/10 rounded-3xl p-8 space-y-8 h-fit">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <Bike className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold uppercase">Specifications</h3>
                  </div>

                  <div className="space-y-6">
                    <DataPoint label="Invoice No" value={matchingSale.invoiceNo} />
                    <DataPoint label="Chassis No" value={matchingSale.chassisNumber} />
                    {matchingSale.batterySerialNumber && <DataPoint label="Battery S/N" value={matchingSale.batterySerialNumber} />}
                    <DataPoint label="Purchase Date" value={format(new Date(matchingSale.soldAt), 'dd MMM yyyy')} />
                    
                    <div className="pt-6 border-t border-white/5 space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Warranty Coverage</h4>
                      
                      {/* Vehicle Warranty */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase text-white/70">Scooty (1 Year)</span>
                          <span className={isVehicleActive ? "text-primary text-[8px] font-black uppercase" : "text-destructive text-[8px] font-black uppercase"}>
                            {isVehicleActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-700", isVehicleActive ? "bg-primary w-full" : "bg-destructive w-full")} />
                        </div>
                        <p className="text-[8px] text-muted-foreground italic">Ends: {vehicleExpiry ? format(vehicleExpiry, 'dd MMM yyyy') : 'N/A'}</p>
                      </div>

                      {/* Charger Warranty */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase text-white/70">Charger (1 Year)</span>
                          <span className={isChargerActive ? "text-primary text-[8px] font-black uppercase" : "text-destructive text-[8px] font-black uppercase"}>
                            {isChargerActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-700", isChargerActive ? "bg-primary w-full" : "bg-destructive w-full")} />
                        </div>
                        <p className="text-[8px] text-muted-foreground italic">Ends: {chargerExpiry ? format(chargerExpiry, 'dd MMM yyyy') : 'N/A'}</p>
                      </div>

                      {/* Battery Warranty */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase text-primary">Battery (3 Years)</span>
                          <span className={isBatteryActive ? "text-primary text-[8px] font-black uppercase" : "text-destructive text-[8px] font-black uppercase"}>
                            {isBatteryActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-700", isBatteryActive ? "bg-primary w-full" : "bg-destructive w-full")} />
                        </div>
                        <p className="text-[8px] text-muted-foreground italic">Ends: {batteryExpiry ? format(batteryExpiry, 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
               </Card>

               {/* Service Hub */}
               <div className="lg:col-span-2 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-primary/5 border-primary/20 rounded-3xl p-8 space-y-6">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-primary/20 rounded-2xl">
                           <Wrench className="h-6 w-6 text-primary" />
                         </div>
                         <h3 className="text-xl font-bold uppercase">Schedule Next</h3>
                       </div>
                       <p className="text-sm text-muted-foreground leading-relaxed">Book a slot for routine maintenance or battery health checkup.</p>
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest glow-primary">
                             Book Appointment Now
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="bg-[#050505] border-white/10 max-w-lg">
                           <DialogHeader>
                             <DialogTitle>Service Registration</DialogTitle>
                             <DialogDescription>Select your preferred showroom and slot for {matchingSale.model}.</DialogDescription>
                           </DialogHeader>
                           <Form {...serviceForm}>
                            <form onSubmit={serviceForm.handleSubmit(onBookService)} className="space-y-6 pt-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={serviceForm.control} name="branchId" render={({ field }) => (
                                  <FormItem className="sm:col-span-2">
                                    <FormLabel>Showroom Center</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger className="bg-white/5"><SelectValue placeholder="Nearest Center" /></SelectTrigger></FormControl>
                                      <SelectContent>{branches?.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />
                                <FormField control={serviceForm.control} name="serviceType" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>
                                        <SelectItem value="Routine">Routine</SelectItem>
                                        <SelectItem value="Repair">Repair</SelectItem>
                                        <SelectItem value="Battery Check">Battery Check</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />
                                <FormField control={serviceForm.control} name="currentKm" render={({ field }) => (
                                  <FormItem><FormLabel>Odometer (KM)</FormLabel><FormControl><Input type="number" className="bg-white/5" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={serviceForm.control} name="preferredDate" render={({ field }) => (
                                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" className="bg-white/5" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={serviceForm.control} name="preferredTime" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time Slot</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>
                                        <SelectItem value="10:00 AM">10 AM - 12 PM</SelectItem>
                                        <SelectItem value="12:00 PM">12 PM - 2 PM</SelectItem>
                                        <SelectItem value="02:00 PM">2 PM - 4 PM</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )} />
                              </div>
                              <Button type="submit" className="w-full h-14 font-black uppercase text-xs tracking-widest glow-primary" disabled={isBooking}>
                                {isBooking ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Booking'}
                              </Button>
                            </form>
                           </Form>
                         </DialogContent>
                       </Dialog>
                    </Card>

                    <Card className="bg-accent/5 border-accent/20 rounded-3xl p-8 space-y-6">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-accent/20 rounded-2xl">
                           <ShieldCheck className="h-6 w-6 text-accent" />
                         </div>
                         <h3 className="text-xl font-bold uppercase">LFP Insights</h3>
                       </div>
                       <div className="space-y-4">
                         <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Next Scheduled Service</span>
                           <span className="font-bold">In {(serviceHistory.length + 1) * 3000} KM</span>
                         </div>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-accent w-1/2" />
                         </div>
                       </div>
                       <p className="text-[10px] text-muted-foreground italic">Maintaining your EV properly ensures maximum battery life cycle and resale value.</p>
                    </Card>
                 </div>

                 {/* History Timeline */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-primary" />
                      <h4 className="font-black text-xs uppercase tracking-[0.4em] text-muted-foreground">Digital Service Log</h4>
                    </div>

                    <div className="space-y-4">
                      {serviceHistory.length > 0 ? serviceHistory.map((s, idx) => (
                        <motion.div 
                          key={s.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group relative flex gap-6 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                        >
                          <div className="flex flex-col items-center gap-2">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", s.status === 'completed' ? "bg-primary/10 border-primary/20 text-primary" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500")}>
                               {s.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                             </div>
                             {idx < serviceHistory.length - 1 && <div className="w-[1px] h-full bg-white/10" />}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                 <h5 className="font-bold text-lg">{s.serviceType} Service</h5>
                                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.serviceNo}</p>
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{format(new Date(s.preferredDate), 'dd MMM yyyy')}</span>
                             </div>
                             <div className="flex gap-4 items-center">
                               <Badge variant="outline" className="bg-white/5 text-[9px] uppercase">{s.currentKm} KM</Badge>
                               <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.branchName}</span>
                             </div>
                             {s.notes && <p className="text-xs text-muted-foreground italic mt-3 border-l-2 border-primary/20 pl-3">{s.notes}</p>}
                          </div>
                        </motion.div>
                      )) : (
                        <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                           <History className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-4" />
                           <p className="text-muted-foreground font-medium">No service records found for this unit.</p>
                           <p className="text-[10px] uppercase tracking-widest text-primary mt-2">Ready for first checkup!</p>
                        </div>
                      )}
                    </div>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Digital Invoice Modal */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:max-h-none print:fixed print:inset-0 print:m-0 print:w-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Digital Invoice</DialogTitle>
          </DialogHeader>
          <div className="print-container relative bg-white p-[20mm] text-black">
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
                  <p className="text-[10px] text-gray-500 font-bold italic mb-1">{showroom?.tagline || 'Drive Electric • Live Smart'}</p>
                  <p className="text-[9px] text-gray-500 leading-tight max-w-[250px]">{showroom?.address}</p>
                  <p className="text-[10px] text-gray-800 font-bold mt-1">GSTIN: {showroom?.gstin || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-black">INVOICE</h2>
                <p className="text-sm font-bold text-primary">{matchingSale?.invoiceNo}</p>
                <p className="text-xs text-gray-400">{matchingSale?.soldAt ? format(new Date(matchingSale.soldAt), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Buyer</p>
                <p className="text-lg font-black uppercase">{matchingSale?.customerName}</p>
                <p className="text-xs font-bold text-gray-600">{matchingSale?.address}, {matchingSale?.city}</p>
                <p className="text-xs font-bold text-gray-600">Mob: {matchingSale?.mobile}</p>
              </div>
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Vehicle Details</p>
                <p className="text-lg font-black uppercase text-primary">{matchingSale?.model}</p>
                <p className="text-xs font-bold">Chassis: {matchingSale?.chassisNumber}</p>
                {matchingSale?.batterySerialNumber && <p className="text-xs font-bold">Battery S/N: {matchingSale?.batterySerialNumber}</p>}
                <p className="text-xs font-bold">Color: {matchingSale?.color}</p>
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
                    <p className="font-black uppercase">{matchingSale?.model}</p>
                    <p className="text-[10px] text-gray-500">Electric Vehicle • High Performance EV</p>
                  </td>
                  <td className="border border-black p-4 text-center font-bold align-top">{matchingSale?.hsn || '871160'}</td>
                  <td className="border border-black p-4 text-right font-black align-top">₹ {matchingSale?.price?.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between">
              <div className="w-1/2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Rupees In Words</p>
                <p className="text-sm font-black uppercase text-primary">{amountToWords(matchingSale?.price || 0)} Only</p>
              </div>
              <div className="w-1/3 bg-gray-50 p-4 border-2 border-black rounded-xl">
                <div className="flex justify-between font-black text-lg"><span>Total</span> <span>₹ {matchingSale?.price?.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-20 flex justify-between items-end">
              <div className="text-center">
                <div className="w-40 border-t border-gray-300 mb-1"></div>
                <p className="text-[10px] font-bold">Buyer Signature</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase mb-10 text-primary">For {showroom?.name || 'Amresh Automobiles'}</p>
                <div className="w-56 border-t-2 border-black mb-1"></div>
                <p className="text-[10px] font-bold">Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div className="p-6 border-t flex justify-end gap-3 no-print bg-secondary">
             <Button className="gap-2 h-12" onClick={() => window.print()}>
               <Printer className="h-4 w-4" /> Print GST Invoice
             </Button>
             <Button variant="outline" className="h-12" onClick={() => setIsInvoiceOpen(false)}>Close Window</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SimpleFeature({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-primary/5 hover:border-primary/20 transition-all">
       <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
         <Icon className="h-6 w-6 text-primary" />
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}

function DataPoint({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-sm tracking-tight">{value}</p>
    </div>
  );
}
