'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  Tag, 
  Calendar, 
  MapPin, 
  Check, 
  X, 
  Trash2, 
  Edit2, 
  Zap, 
  Sparkles,
  ToggleLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const offerSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  discount: z.string().min(1, 'Discount amount is required'),
  branchId: z.string().default('global'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  isActive: z.boolean().default(true),
});

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'offers');
  }, [firestore]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const { data: offers, loading } = useCollection(offersQuery);
  const { data: branches } = useCollection(branchesQuery);

  const form = useForm<z.infer<typeof offerSchema>>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: '',
      description: '',
      discount: '',
      branchId: 'global',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      isActive: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof offerSchema>) => {
    if (!firestore) return;

    const offerData = {
      ...values,
      createdAt: serverTimestamp(),
    };

    try {
      if (editingOffer) {
        const offerRef = doc(firestore, 'offers', editingOffer.id);
        await updateDoc(offerRef, values);
        toast({ title: 'Offer Updated' });
      } else {
        await addDoc(collection(firestore, 'offers'), offerData);
        toast({ title: 'Offer Created' });
      }
      setIsDialogOpen(false);
      setEditingOffer(null);
      form.reset();
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: 'offers', 
        operation: editingOffer ? 'update' : 'create' 
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'offers', id));
      toast({ title: 'Offer Deleted' });
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `offers/${id}`, operation: 'delete' }));
    }
  };

  const toggleActive = async (offer: any) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'offers', offer.id), { isActive: !offer.isActive });
      toast({ title: offer.isActive ? 'Offer Deactivated' : 'Offer Activated' });
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `offers/${offer.id}`, operation: 'update' }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Festive Offers & Flash Sales</h1>
          <p className="text-muted-foreground">Manage dynamic promo banners and branch-specific discounts.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingOffer(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Festive Offer'}</DialogTitle>
              <DialogDescription>
                This offer will appear as a banner on the home page for the selected duration.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Offer Title</FormLabel><FormControl><Input placeholder="Diwali Flash Sale" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Short Description</FormLabel><FormControl><Input placeholder="Flat discounts on all models" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="discount" render={({ field }) => (
                    <FormItem><FormLabel>Discount Amount</FormLabel><FormControl><Input placeholder="₹ 5,000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="branchId" render={({ field }) => (
                    <FormItem><FormLabel>Target Showroom</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">All Showrooms (Global)</SelectItem>
                          {branches?.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5"><FormLabel>Active Status</FormLabel><FormDescription>Visible on site</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-12">
                  {editingOffer ? 'Save Changes' : 'Launch Offer'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">Syncing promotions...</div>
        ) : offers?.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-card/40 border border-white/5 rounded-lg">
            No active offers. Start a festive campaign today!
          </div>
        ) : offers?.map((offer) => {
          const isExpired = new Date(offer.endDate) < new Date();
          const branch = branches?.find(b => b.id === offer.branchId);

          return (
            <Card key={offer.id} className={cn("bg-card/40 border-white/5 relative group overflow-hidden", !offer.isActive && "opacity-60")}>
              <div className={cn("absolute top-0 left-0 w-full h-1", offer.isActive ? "bg-primary" : "bg-muted")} />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <Tag className={cn("h-5 w-5", offer.isActive ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingOffer(offer);
                      form.reset(offer);
                      setIsDialogOpen(true);
                    }}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl">{offer.title}</CardTitle>
                <CardDescription>{offer.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary">{offer.discount} OFF</span>
                  <Switch checked={offer.isActive} onCheckedChange={() => toggleActive(offer)} />
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {branch?.name || 'Global Offer'}</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> 
                    {format(new Date(offer.startDate), 'dd MMM')} — {format(new Date(offer.endDate), 'dd MMM yyyy')}
                    {isExpired && <span className="text-destructive font-bold ml-2">EXPIRED</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
