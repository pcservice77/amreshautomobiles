"use client"

import { useState, useRef } from 'react';
import { Plus, Search, MapPin, Phone, Trash2, Edit2, Loader2, Building, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

const branchSchema = z.object({
  name: z.string().min(2, 'Required'),
  address: z.string().min(5, 'Required'),
  city: z.string().min(2, 'Required'),
  pincode: z.string().length(6, '6-digits required'),
  contact: z.string().min(10, 'Required'),
  email: z.string().email('Invalid email'),
  imageUrl: z.string().min(1, 'Showroom photo is required'),
  googleMapUrl: z.string().optional(),
});

export default function BranchesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const { data: branches, loading } = useCollection(branchesQuery);

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      pincode: '',
      contact: '',
      email: '',
      imageUrl: '',
      googleMapUrl: '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 500KB allowed per image.' });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue('imageUrl', reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: z.infer<typeof branchSchema>) => {
    if (!firestore) return;

    if (editingBranch) {
      const branchRef = doc(firestore, 'branches', editingBranch.id);
      setDoc(branchRef, data, { merge: true })
        .then(() => {
          toast({ title: 'Branch Updated' });
          setEditingBranch(null);
        })
        .catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: branchRef.path, operation: 'update' }));
        });
    } else {
      addDoc(collection(firestore, 'branches'), data)
        .then(() => {
          toast({ title: 'Branch Added' });
          setIsAddOpen(false);
          form.reset();
        })
        .catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'branches', operation: 'create' }));
        });
    }
  };

  const executeDelete = () => {
    if (!firestore || !deleteId) return;
    const branchRef = doc(firestore, 'branches', deleteId);
    deleteDoc(branchRef)
      .then(() => toast({ title: 'Branch Removed' }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: branchRef.path, operation: 'delete' })));
    setDeleteId(null);
  };

  const filteredBranches = (branches || []).filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Showroom Locations</h1>
          <p className="text-muted-foreground">Manage branch offices and their Google Map locations.</p>
        </div>
        <Dialog open={isAddOpen || !!editingBranch} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingBranch(null);
            form.reset({
              name: '',
              address: '',
              city: '',
              pincode: '',
              contact: '',
              email: '',
              imageUrl: '',
              googleMapUrl: '',
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Showroom' : 'New Showroom Registration'}</DialogTitle>
              <DialogDescription>
                Provide details, upload a photo, and add a Google Maps link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-64 bg-secondary rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group">
                  {form.watch('imageUrl') ? (
                    <Image src={form.watch('imageUrl')} alt="Preview" fill className="object-contain" unoptimized />
                  ) : (
                    <Building className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      {isUploading ? <Loader2 className="animate-spin" /> : 'Change Photo'}
                    </Button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="googleMapUrl" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Google Maps Link</FormLabel>
                      <FormControl><Input placeholder="https://maps.google.com/..." {...field} /></FormControl>
                      <FormDescription>Link for customers to navigate to this showroom.</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Full Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="col-span-2 h-12" disabled={isUploading}>
                    {editingBranch ? 'Save Changes' : 'Register Showroom'}
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter branches..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="overflow-hidden bg-card/40 border-white/5 relative group">
            <div className="relative aspect-square w-full">
              <Image src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} alt={branch.name} fill className="object-contain" unoptimized />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => {
                  setEditingBranch(branch);
                  form.reset({
                    name: branch.name || '',
                    address: branch.address || '',
                    city: branch.city || '',
                    pincode: branch.pincode || '',
                    contact: branch.contact || '',
                    email: branch.email || '',
                    imageUrl: branch.imageUrl || '',
                    googleMapUrl: branch.googleMapUrl || '',
                  });
                }}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(branch.id);
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                {branch.name}
                {branch.googleMapUrl && (
                  <a href={branch.googleMapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {branch.city}, {branch.pincode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{branch.address}</p>
              <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {branch.contact}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this branch location from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground">Remove Branch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
