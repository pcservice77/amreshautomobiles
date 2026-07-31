"use client"

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Building, ToggleLeft, Image as ImageIcon, Upload, X, Loader2, Zap } from 'lucide-react';
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
import Image from 'next/image';

const settingsSchema = z.object({
  name: z.string().min(2, 'Required'),
  tagline: z.string().optional(),
  contact: z.string().min(1, 'Required'),
  email: z.string().email(),
  address: z.string().min(5, 'Required'),
  gstin: z.string().optional(),
  useLetterhead: z.boolean().default(false),
  letterheadUrl: z.string().optional(),
  logoUrl: z.string().optional(),
});

export default function ShowroomSettingsPage() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
      useLetterhead: false,
      letterheadUrl: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (showroom) {
      form.reset({
        name: showroom.name || 'AMRESH AUTOMOBILE',
        tagline: showroom.tagline || 'Drive Electric • Live Smart',
        contact: showroom.contact || '',
        email: showroom.email || '',
        address: showroom.address || '',
        gstin: showroom.gstin || '',
        useLetterhead: !!showroom.useLetterhead,
        letterheadUrl: showroom.letterheadUrl || '',
        logoUrl: showroom.logoUrl || '',
      });
    }
  }, [showroom, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'letterheadUrl' | 'logoUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 800KB.',
      });
      return;
    }

    if (fieldName === 'letterheadUrl') setIsUploading(true);
    else setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      form.setValue(fieldName, base64String);
      if (fieldName === 'letterheadUrl') setIsUploading(false);
      else setIsUploadingLogo(false);
      toast({ title: 'Success', description: 'Image processed successfully.' });
    };
    reader.readAsDataURL(file);
  };

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
          <p className="text-muted-foreground">Manage showroom identity, logos, and invoice templates.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 text-foreground">
            <Card className="border-white/5 bg-card">
              <CardHeader className="flex flex-row items-center gap-3 bg-secondary/20 rounded-t-lg">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary font-bold">Showroom Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative h-24 w-24 bg-secondary rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group">
                    {form.watch('logoUrl') ? (
                      <Image src={form.watch('logoUrl') || ''} alt="Logo" fill className="object-contain p-2" />
                    ) : (
                      <Zap className="h-10 w-10 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button type="button" size="sm" variant="ghost" className="text-white" onClick={() => logoInputRef.current?.click()}>
                        {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <FormLabel className="mt-2 text-foreground">Official Logo (Square)</FormLabel>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="tagline" render={({ field }) => (
                    <FormItem><FormLabel>Tagline / Motto</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="gstin" render={({ field }) => (
                  <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/5 bg-card text-foreground">
            <CardHeader className="flex flex-row items-center gap-3 bg-secondary/20 rounded-t-lg">
              <ToggleLeft className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-primary font-bold">Background Template (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="useLetterhead"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-foreground">Enable Background Image</FormLabel>
                      <FormDescription>
                        Use a full-page A4 image as background (e.g., white page with scooter watermark).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('useLetterhead') && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors group relative">
                    {form.watch('letterheadUrl') ? (
                      <div className="relative w-full max-w-[200px] aspect-[1/1.4] rounded-md overflow-hidden border">
                        <Image src={form.watch('letterheadUrl') || ''} alt="Template Preview" fill className="object-contain" />
                        <button type="button" onClick={() => form.setValue('letterheadUrl', '')} className="absolute top-1 right-1 bg-destructive p-1 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Select JPG/PNG template (max 800KB)</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'letterheadUrl')} />
                    <Button type="button" variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                      {form.watch('letterheadUrl') ? 'Replace Image' : 'Select Template Image'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg">
            <Save className="mr-2 h-6 w-6" />
            Save Showroom Configuration
          </Button>
        </form>
      </Form>
    </div>
  );
}