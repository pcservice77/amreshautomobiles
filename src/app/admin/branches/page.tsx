"use client"

import { useState, useRef } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Upload, X, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'react-hook-form';
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
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum 5MB allowed.' });
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !id) return;
    if (confirm('Permanently remove this showroom?')) {
      const branchRef = doc(firestore, 'branches', id);
      deleteDoc(branchRef)
        .then(() => toast({ title: 'Branch Removed' }))
        .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: branchRef.path, operation: 'delete' })));
    }
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
          <p className="text-muted-foreground">Manage branch offices and photos.</p>
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
              <DialogTitle>{editingBranch ? 'Edit Showroom' : 'New Showroom Registration'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-64 bg-secondary rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group">
                  {form.watch('imageUrl') ? (
                    <Image src={form.watch('imageUrl')} alt="Preview" fill className="object-cover" unoptimized />
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
                <p className="text-xs text-muted-foreground mt-2">Square format recommended (Max 5MB)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Branch Name" {...form.register('name')} />
                <Input placeholder="Full Address" {...form.register('address')} />
                <Input placeholder="City" {...form.register('city')} />
                <Input placeholder="Pincode" {...form.register('pincode')} />
                <Input placeholder="Contact" {...form.register('contact')} />
                <Input placeholder="Email" {...form.register('email')} />
              </div>
              <Button onClick={form.handleSubmit(onSubmit)} className="w-full h-12" disabled={isUploading}>
                {editingBranch ? 'Save Changes' : 'Register Showroom'}
              </Button>
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
              <Image src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} alt={branch.name} fill className="object-cover" unoptimized />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => {
                  setEditingBranch(branch);
                  form.reset(branch);
                }}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => handleDelete(branch.id, e)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold">{branch.name}</CardTitle>
              <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {branch.city}, {branch.pincode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{branch.address}</p>
              <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {branch.contact}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}