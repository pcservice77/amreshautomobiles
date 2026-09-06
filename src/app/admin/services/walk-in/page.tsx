"use client"

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Loader2, Wrench, Bike, IndianRupee, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { sendServiceCompletionEmail } from '@/app/actions/email';

const serviceBillSchema = z.object({
  branchId: z.string().min(1, 'Select a center'),
  currentKm: z.coerce.number().min(0, 'Required'),
  serviceType: z.string().default('Routine'),
  preferredDate: z.string().default(format(new Date(), 'yyyy-MM-dd')),
  preferredTime: z.string().default('Walk-in'),
  notes: z.string().optional(),
  laborCharge: z.coerce.number().default(0),
  parts: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    price: z.coerce.number().min(0, 'Price required')
  })).default([]),
});

export default function WalkInServicePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [isSearching, setIsSearching] = useState(false);
  const [matchingSale, setMatchingSale] = useState<any>(null);
  const [searchInput, setSearchInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [total, setTotal] = useState(0);

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

  const form = useForm<z.infer<typeof serviceBillSchema>>({
    resolver: zodResolver(serviceBillSchema),
    defaultValues: {
      branchId: user?.assignedBranchId || '',
      currentKm: 0,
      serviceType: 'Routine',
      preferredDate: format(new Date(), 'yyyy-MM-dd'),
      preferredTime: 'Walk-in',
      notes: '',
      laborCharge: 0,
      parts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts"
  });

  // Calculate Total
  const labor = form.watch('laborCharge');
  const parts = form.watch('parts');
  useEffect(() => {
    const partsTotal = parts?.reduce((acc, p) => acc + (Number(p.price) || 0), 0) || 0;
    setTotal(partsTotal + (Number(labor) || 0));
  }, [labor, parts]);

  // Load existing service if editing
  useEffect(() => {
    if (editId && firestore) {
      getDoc(doc(firestore, 'service-bookings', editId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          form.reset({
            branchId: data.branchId,
            currentKm: data.currentKm,
            serviceType: data.serviceType,
            preferredDate: data.preferredDate,
            preferredTime: data.preferredTime,
            notes: data.notes || '',
            laborCharge: data.laborCharge || 0,
            parts: data.parts || [],
          });
          // Also need to set the sale context
          getDoc(doc(firestore, 'sales', data.saleId)).then(sSnap => {
            if (sSnap.exists()) setMatchingSale({ ...sSnap.data(), id: sSnap.id });
          });
        }
      });
    }
  }, [editId, firestore, form]);

  const onSearch = async () => {
    if (!firestore || !searchInput) return;
    setIsSearching(true);
    setMatchingSale(null);

    try {
      const salesRef = collection(firestore, 'sales');
      const val = searchInput.trim();
      
      let snap = await getDocs(query(salesRef, where('mobile', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('chassisNumber', '==', val)));
      if (snap.empty) snap = await getDocs(query(salesRef, where('invoiceNo', '==', val)));

      if (snap.empty) {
        toast({ variant: 'destructive', title: 'Not Found', description: 'No vehicle linked to this input.' });
      } else {
        setMatchingSale({ ...snap.docs[0].data(), id: snap.docs[0].id });
        toast({ title: 'Vehicle Identified', description: `Owner: ${snap.docs[0].data().customerName}` });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Search Error' });
    } finally {
      setIsSearching(false);
    }
  };

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

  const onSubmit = async (values: z.infer<typeof serviceBillSchema>) => {
    if (!firestore || !matchingSale) return;
    setIsSaving(true);

    const serviceNo = editId ? matchingSale.serviceNo : await generateServiceNo();
    const branch = branches?.find(b => b.id === values.branchId);

    const bookingData = {
      ...values,
      serviceNo,
      totalAmount: total,
      saleId: matchingSale.id,
      customerName: matchingSale.customerName,
      mobile: matchingSale.mobile,
      email: matchingSale.email || '',
      chassisNumber: matchingSale.chassisNumber,
      model: matchingSale.model,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branchName: branch?.name || 'Amresh Automobiles',
    };

    try {
      if (editId) {
        await updateDoc(doc(firestore, 'service-bookings', editId), bookingData);
        toast({ title: 'Record Updated' });
      } else {
        await addDoc(collection(firestore, 'service-bookings'), bookingData);
        toast({ title: 'Service Saved & Billed' });
      }

      // Send Completion Email with Bill
      if (matchingSale.email) {
        await sendServiceCompletionEmail(matchingSale.email, bookingData, showroom || {});
      }

      router.push('/admin/services');
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'service-bookings',
        operation: editId ? 'update' : 'create',
        requestResourceData: bookingData,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold">Garage Desk</h1>
          <p className="text-muted-foreground">Log vehicle work and generate service invoices.</p>
        </div>
      </div>

      {!matchingSale ? (
        <Card className="bg-card/40 border-white/5 p-12 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-xl font-bold uppercase">Search Vehicle Record</h3>
            <div className="flex gap-2">
              <Input 
                placeholder="Mobile / Chassis / Invoice" 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="h-14 text-lg font-bold bg-white/5"
              />
              <Button size="lg" className="h-14 px-8" onClick={onSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="animate-spin" /> : 'Identify'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Vehicle Identity */}
              <Card className="bg-card/40 border-white/5">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bike className="h-5 w-5 text-primary" /> Vehicle Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Owner</p>
                    <p className="font-bold">{matchingSale.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Model</p>
                    <p className="font-bold">{matchingSale.model}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Chassis</p>
                    <p className="font-mono text-xs">{matchingSale.chassisNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Mobile</p>
                    <p className="font-bold">{matchingSale.mobile}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Service Logs */}
              <Card className="bg-card/40 border-white/5">
                <CardHeader className="bg-secondary/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" /> Work Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="serviceType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Routine">Routine Maintenance</SelectItem>
                          <SelectItem value="Repair">General Repair</SelectItem>
                          <SelectItem value="Warranty">Warranty Work (Paid/Free)</SelectItem>
                          <SelectItem value="Battery Check">Battery Health Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currentKm" render={({ field }) => (
                    <FormItem><FormLabel>Odometer Reading (KM)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="branchId" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Servicing Center</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger></FormControl>
                        <SelectContent>{branches?.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Mechanic Observations</FormLabel><FormControl><Input placeholder="Brake pads thin, battery health 98%..." {...field} /></FormControl></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Parts & Spare Billing */}
              <Card className="bg-card/40 border-white/5">
                <CardHeader className="bg-secondary/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" /> Parts Replaced
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', price: 0 })}>
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end border-b border-white/5 pb-4 last:border-0">
                      <FormField control={form.control} name={`parts.${index}.name`} render={({ field }) => (
                        <FormItem className="flex-1"><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="Disc Brake Pad" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`parts.${index}.price`} render={({ field }) => (
                        <FormItem className="w-32"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No spare parts added yet.</p>}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="bg-primary/5 border-primary/20 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Service Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="laborCharge" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor / Service Charge</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" className="pl-9 bg-black/20" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parts Total</span>
                      <span>₹ {parts?.reduce((acc, p) => acc + (Number(p.price) || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Labor Charge</span>
                      <span>₹ {Number(labor).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t-2 border-primary/20">
                      <span className="text-lg font-black uppercase">Grand Total</span>
                      <span className="text-3xl font-black text-primary">₹ {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-8 space-y-4">
                    <Button type="submit" className="w-full h-14 font-black uppercase text-xs tracking-widest glow-primary" disabled={isSaving}>
                      {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />}
                      Save & Email Bill
                    </Button>
                    <Button type="button" variant="outline" className="w-full h-12" onClick={() => setMatchingSale(null)}>
                      Switch Vehicle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
