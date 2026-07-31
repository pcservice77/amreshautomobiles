"use client"

import { useState, useRef } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Upload, X, Loader2, Building } from 'lucide-react';
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
  imageUrl: z.string().min(1, 'Image is required'),
});

export default function BranchesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue('imageUrl', reader.result as string);
      setIsUploading(false);
      toast({ title: 'Success', description: 'Showroom photo processed.' });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({ variant: 'destructive', title: 'Upload failed' });
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !id) return;
    
    if (confirm('Permanently remove this showroom location?')) {
      const branchRef = doc(firestore, 'branches', id);
      deleteDoc(branchRef)
        .then(() => {
          toast({ title: 'Branch Removed' });
        })
        .catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: branchRef.path, operation: 'delete' }));
        });
    }
  };

  const filteredBranches = (branches || []).filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    b.pincode.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Showroom Network</h1>
          <p className="text-muted-foreground">Manage your branch locations and fleet distribution.</p>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Register New Branch'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <div className="flex flex-col items-center">
                  <div className="relative h-48 w-full bg-secondary rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group">
                    {form.watch('imageUrl') ? (
                      <>
                        <Image src={form.watch('imageUrl')} alt="Preview" fill className="object-cover" unoptimized />
                        <button 
                          type="button" 
                          onClick={() => form.setValue('imageUrl', '')}
                          className="absolute top-2 right-2 bg-destructive p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        {isUploading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : <Building className="h-8 w-8 mx-auto text-muted-foreground" />}
                        <p className="text-xs mt-2 text-muted-foreground">Upload Showroom Photo (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> {form.watch('imageUrl') ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {form.formState.errors.imageUrl && <p className="text-xs text-destructive mt-1">Photo is required</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Branch Name</FormLabel><FormControl><Input placeholder="Amresh Auto - Ranchi" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Full Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormItem><FormLabel>Official Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full h-12 mt-4" disabled={isUploading}>
                  {editingBranch ? 'Update Showroom Details' : 'Register Showroom'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter by city, name or pincode..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">Locating branches...</div>
        ) : filteredBranches.map((branch) => (
          <Card key={branch.id} className="overflow-hidden bg-card/40 border-white/5 group">
            <div className="relative h-48">
              <Image src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} alt={branch.name} fill className="object-cover" unoptimized />
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-xl font-bold">{branch.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => {
                    setEditingBranch(branch);
                    form.reset(branch);
                  }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(branch.id, e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> {branch.city}, {branch.pincode}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground leading-relaxed">{branch.address}</p>
              <div className="pt-3 flex flex-col gap-2 border-t border-white/5">
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