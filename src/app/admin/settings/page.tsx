
"use client"

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Building, Landmark, ToggleLeft, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const settingsSchema = z.object({
  name: z.string().min(2, 'Required'),
  tagline: z.string().optional(),
  contact: z.string().min(1, 'Required'),
  email: z.string().email(),
  address: z.string().min(5, 'Required'),
  gstin: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  branch: z.string().optional(),
  useLetterhead: z.boolean().default(false),
  letterheadUrl: z.string().optional(),
});

export default function ShowroomSettingsPage() {
  const firestore = useFirestore();

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: showroom, loading: fetching } = useDoc(showroomRef);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: 'AMRESH AUTOMOBILE',
      tagline: 'Drive Electric • Live Smart',
      contact: '',
      email: '',
      address: '',
      gstin: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      useLetterhead: false,
      letterheadUrl: '',
    },
  });

  useEffect(() => {
    if (showroom) {
      form.reset({
        name: showroom.name || 'AMRESH AUTOMOBILE',
        tagline: showroom.tagline || '',
        contact: showroom.contact || '',
        email: showroom.email || '',
        address: showroom.address || '',
        gstin: showroom.gstin || '',
        bankName: showroom.bankName || '',
        accountName: showroom.accountName || '',
        accountNumber: showroom.accountNumber || '',
        ifsc: showroom.ifsc || '',
        branch: showroom.branch || '',
        useLetterhead: !!showroom.useLetterhead,
        letterheadUrl: showroom.letterheadUrl || '',
      });
    }
  }, [showroom, form]);

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'settings', 'showroom');
    setDoc(docRef, data, { merge: true })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    toast({ title: 'Settings Saved', description: 'Showroom details updated successfully.' });
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Loading configurations...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Business Configuration</h1>
          <p className="text-muted-foreground">Manage your showroom identity, bank details, and printing preferences.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-foreground">
            <Card className="border-white/5 bg-card">
              <CardHeader className="flex flex-row items-center gap-3 bg-secondary/20 rounded-t-lg">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary font-bold">Showroom Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tagline" render={({ field }) => (
                  <FormItem><FormLabel>Tagline / Moto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="gstin" render={({ field }) => (
                  <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-card">
              <CardHeader className="flex flex-row items-center gap-3 bg-secondary/20 rounded-t-lg">
                <Landmark className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary font-bold">Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="accountName" render={({ field }) => (
                  <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="ifsc" render={({ field }) => (
                    <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/5 bg-card text-foreground">
            <CardHeader className="flex flex-row items-center gap-3 bg-secondary/20 rounded-t-lg">
              <ToggleLeft className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-primary font-bold">Print Preferences</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="useLetterhead"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use Background Template Image</FormLabel>
                      <FormDescription>
                        Enable this to print billing details on top of your custom invoice image.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('useLetterhead') && (
                <FormField control={form.control} name="letterheadUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Template Image URL
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter URL of your invoice background image..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Upload your invoice template to a hosting service and paste the direct link here.
                    </FormDescription>
                  </FormItem>
                )} />
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg">
            <Save className="mr-2 h-6 w-6" />
            Save Configuration
          </Button>
        </form>
      </Form>
    </div>
  );
}
