
"use client"

import { useState } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export default function BranchesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

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
      imageUrl: 'https://picsum.photos/seed/branch/600/400',
    },
  });

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

  const handleDelete = (id: string) => {
    if (!firestore || !confirm('Delete this branch?')) return;
    const branchRef = doc(firestore, 'branches', id);
    deleteDoc(branchRef)
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: branchRef.path, operation: 'delete' }));
      });
  };

  const filteredBranches = branches?.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    b.pincode.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Showroom Network</h1>
          <p className="text-muted-foreground">Manage your branch locations and dealer network.</p>
        </div>
        <Dialog open={isAddOpen || !!editingBranch} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingBranch(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Register New Branch'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Branch Name</FormLabel><FormControl><Input placeholder="Amresh Auto - Ranchi Main" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Branch Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="col-span-2 h-12 mt-4">
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by city, name or pincode..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">Loading network...</div>
        ) : filteredBranches?.map((branch) => (
          <Card key={branch.id} className="overflow-hidden bg-card/40 border-white/5 group">
            <div className="relative h-48">
              <Image src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} alt={branch.name} fill className="object-cover" />
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{branch.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setEditingBranch(branch);
                    form.reset(branch);
                  }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(branch.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {branch.city}, {branch.pincode}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{branch.address}</p>
              <div className="pt-2 flex flex-col gap-1 border-t border-white/5">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {branch.contact}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {branch.email}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
