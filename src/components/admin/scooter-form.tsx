"use client"

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Save, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { generateScooterDescription } from '@/ai/flows/generate-scooter-description';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formSchema = z.object({
  model: z.string().min(2, 'Model name is required'),
  tagline: z.string().default(''),
  range: z.string().min(1, 'Range is required'),
  price: z.string().min(1, 'Price is required'),
  topSpeed: z.string().default(''),
  batteryType: z.string().default(''),
  batteryCapacity: z.string().default(''),
  voltage: z.string().default(''),
  category: z.string().default(''),
  batterySystem: z.string().default(''),
  chargingTime: z.string().default(''),
  description: z.string().min(10, 'Description is too short'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  availableColors: z.string().default(''),
  brochureUrl: z.string().default(''),
});

interface ScooterFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function ScooterForm({ initialData, onSubmit }: ScooterFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: initialData?.model || '',
      tagline: initialData?.tagline || '',
      range: initialData?.range || '',
      price: initialData?.price || '',
      topSpeed: initialData?.topSpeed || '',
      batteryType: initialData?.batteryType || '',
      batteryCapacity: initialData?.batteryCapacity || '',
      voltage: initialData?.voltage || '',
      category: initialData?.category || '',
      batterySystem: initialData?.batterySystem || '',
      chargingTime: initialData?.chargingTime || '',
      description: initialData?.description || '',
      images: initialData?.images || [],
      availableColors: initialData?.availableColors || '',
      brochureUrl: initialData?.brochureUrl || '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentImages = form.getValues('images') || [];
    if (currentImages.length + files.length > 5) {
      toast({ variant: 'destructive', title: 'Limit Exceeded', description: 'Max 5 images allowed.' });
      return;
    }

    setIsUploading(true);
    const promises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error(`${file.name} is too large (Max 5MB)`));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((newImages) => {
        form.setValue('images', [...currentImages, ...newImages]);
        toast({ title: 'Success', description: 'Images uploaded.' });
      })
      .catch((err) => toast({ variant: 'destructive', title: 'Upload Error', description: err.message }))
      .finally(() => setIsUploading(false));
  };

  const removeImage = (idx: number) => {
    const imgs = form.getValues('images');
    form.setValue('images', imgs.filter((_, i) => i !== idx));
  };

  const handleGenerateDescription = async () => {
    const v = form.getValues();
    if (!v.model || !v.range || !v.price) {
      toast({ variant: 'destructive', title: 'Missing Specs', description: 'Fill model, range, and price first.' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateScooterDescription({
        model: v.model,
        range: v.range,
        price: v.price,
        topSpeed: v.topSpeed,
        batteryCapacity: v.batteryCapacity,
        chargingTime: v.chargingTime,
      });
      form.setValue('description', result.description);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Generation Failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormLabel>Scooter Photos (Max 5, 5MB each)</FormLabel>
          <div className="grid grid-cols-5 gap-4">
            {form.watch('images')?.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                <Image src={img} alt="Scooter" fill className="object-cover" unoptimized />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-destructive p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {(form.watch('images')?.length || 0) < 5 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:bg-white/5 disabled:opacity-50" disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin" /> : <Plus className="h-6 w-6" />}
                <span className="text-[10px] mt-1">Add Image</span>
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem><FormLabel>Model Name</FormLabel><FormControl><Input placeholder="Volt X" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="tagline" render={({ field }) => (
            <FormItem><FormLabel>Tagline</FormLabel><FormControl><Input placeholder="Drive Future" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Price</FormLabel><FormControl><Input placeholder="₹ 1,20,000" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="range" render={({ field }) => (
            <FormItem><FormLabel>Range</FormLabel><FormControl><Input placeholder="120 km" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="availableColors" render={({ field }) => (
            <FormItem><FormLabel>Colors</FormLabel><FormControl><Input placeholder="Red, Black, Blue" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="brochureUrl" render={({ field }) => (
            <FormItem><FormLabel>Brochure Link</FormLabel><FormControl><Input placeholder="Google Drive Link" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField control={form.control} name="topSpeed" render={({ field }) => (
            <FormItem><FormLabel>Speed</FormLabel><FormControl><Input placeholder="80 km/h" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="batteryType" render={({ field }) => (
            <FormItem><FormLabel>Battery</FormLabel><FormControl><Input placeholder="LFP" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="voltage" render={({ field }) => (
            <FormItem><FormLabel>Voltage</FormLabel><FormControl><Input placeholder="60V" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="chargingTime" render={({ field }) => (
            <FormItem><FormLabel>Charge Time</FormLabel><FormControl><Input placeholder="4h" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Description</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />} AI Draft
              </Button>
            </div>
            <FormControl><Textarea rows={4} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full gap-2" disabled={isUploading}>
          <Save className="h-4 w-4" /> {initialData ? 'Update Model' : 'Save to Inventory'}
        </Button>
      </form>
    </Form>
  );
}