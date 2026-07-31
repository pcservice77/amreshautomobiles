
"use client"

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Building, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const settingsSchema = z.object({
  name: z.string().min(2, 'Showroom name is required'),
  contact: z.string().min(1, 'Contact number is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
  gstin: z.string().optional(),
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
      name: '',
      contact: '',
      email: '',
      address: '',
      gstin: '',
    },
  });

  useEffect(() => {
    if (showroom) {
      form.reset({
        name: showroom.name || '',
        contact: showroom.contact || '',
        email: showroom.email || '',
        address: showroom.address || '',
        gstin: showroom.gstin || '',
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

    toast({ 
      title: 'Settings Saved', 
      description: 'Business information update initiated.' 
    });
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Fetching configurations...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Showroom Configuration</h1>
        <p className="text-muted-foreground">Manage your business information used for billing and identity.</p>
      </div>

      <Card className="bg-card/40 border-white/5">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="bg-accent/20 p-2 rounded-lg">
            <Building className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Business Identity</CardTitle>
            <CardDescription>These details appear on customer invoices.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showroom Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Amresh Automobiles" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GSTIN (Optional)" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 XXXXX XXXXX" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@amreshautomobiles.com" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street, City, Pin" {...field} className="border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
