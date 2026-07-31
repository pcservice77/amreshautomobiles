"use client"

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Building, MapPin, Phone, Mail, Image as ImageIcon, Upload, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

const branchSettingsSchema = z.object({
  name: z.string().min(2, 'Required'),
  tagline: z.string().optional(),
  address: z.string().min(5, 'Required'),
  city: z.string().min(2, 'Required'),
  pincode: z.string().length(6, '6-digits required'),
  contact: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  gstin: z.string().optional(),
  imageUrl: z.string().optional(),
});

export default function MyBranchSettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const branchRef = useMemoFirebase(() => {
    if (!firestore || !user?.assignedBranchId) return null;
    return doc(firestore, 'branches', user.assignedBranchId);
  }, [firestore, user]);

  const { data: branch, loading: fetching } = useDoc(branchRef);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof branchSettingsSchema>>({
    resolver: zodResolver(branchSettingsSchema),
    defaultValues: {
      name: '',
      tagline: '',
      address: '',
      city: '',
      pincode: '',
      contact: '',
      email: '',
      gstin: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name || '',
        tagline: branch.tagline || 'Drive Electric • Live Smart',
        address: branch.address || '',
        city: branch.city || '',
        pincode: branch.pincode || '',
        contact: branch.contact || '',
        email: branch.email || '',
        gstin: branch.gstin || '',
        imageUrl: branch.imageUrl || '',
      });
    }
  }, [branch, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const onSubmit = (data: z.infer<typeof branchSettingsSchema>) => {
    if (!firestore || !user?.assignedBranchId) return;
    const docRef = doc(firestore, 'branches', user.assignedBranchId);
    setDoc(docRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Branch Details Saved' });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (!user || user.role !== 'branch_admin') {
    return <div className="p-20 text-center text-muted-foreground">Access denied. Main Admins manage all branches in Showroom Locations.</div>;
  }

  if (fetching) return <div className="p-20 text-center text-muted-foreground">Loading branch configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Showroom Management</h1>
          <p className="text-muted-foreground">Manage your specific branch details for billing and public display.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-white/5 bg-card overflow-hidden">
            <CardHeader className="bg-secondary/20 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Branch Identity & Photo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="relative aspect-square w-48 bg-secondary rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group">
                  {form.watch('imageUrl') ? (
                    <Image src={form.watch('imageUrl') || ''} alt="Branch Photo" fill className="object-cover" unoptimized />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {form.watch('imageUrl') ? 'Replace Photo' : 'Upload Photo'}
                    </Button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <p className="text-xs text-muted-foreground mt-4">Square photo recommended for branding (Max 5MB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Showroom Name</FormLabel><FormControl><Input placeholder="Amresh Automobile - Main" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tagline" render={({ field }) => (
                  <FormItem><FormLabel>Branch Tagline</FormLabel><FormControl><Input placeholder="Ride the Spark" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="gstin" render={({ field }) => (
                  <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input placeholder="20AAAAA0000A1Z5" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input placeholder="branch@amresh.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="834001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="123 Street Name, Area" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Ranchi" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg" disabled={isUploading}>
            <Save className="mr-2 h-6 w-6" />
            Save Branch Settings
          </Button>
        </form>
      </Form>
    </div>
  );
}