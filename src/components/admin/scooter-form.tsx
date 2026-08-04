"use client"

import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Save, Upload, X, Plus, AlertCircle, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateScooterDescription } from '@/ai/flows/generate-scooter-description';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name required'),
  range: z.string().min(1, 'Range required'),
  price: z.string().min(1, 'Price required'),
});

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
  variants: z.array(variantSchema).default([]),
});

interface ScooterFormProps {
  initialData?: any;
  existingScooters?: any[];
  onSubmit: (data: any) => Promise<void>;
}

export function ScooterForm({ initialData, existingScooters, onSubmit }: ScooterFormProps) {
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
      variants: initialData?.variants || [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        model: initialData.model || '',
        tagline: initialData.tagline || '',
        range: initialData.range || '',
        price: initialData.price || '',
        topSpeed: initialData.topSpeed || '',
        batteryType: initialData.batteryType || '',
        batteryCapacity: initialData.batteryCapacity || '',
        voltage: initialData.voltage || '',
        category: initialData.category || '',
        batterySystem: initialData.batterySystem || '',
        chargingTime: initialData.chargingTime || '',
        description: initialData.description || '',
        images: initialData.images || [],
        availableColors: initialData.availableColors || '',
        brochureUrl: initialData.brochureUrl || '',
        variants: initialData.variants || [],
      });
    }
  }, [initialData, form]);

  const handleImportTemplate = (scooterId: string) => {
    const source = existingScooters?.find(s => s.id === scooterId);
    if (!source) return;

    form.reset({
      ...form.getValues(),
      model: source.model || '',
      tagline: source.tagline || '',
      range: source.range || '',
      price: source.price || '',
      topSpeed: source.topSpeed || '',
      batteryType: source.batteryType || '',
      batteryCapacity: source.batteryCapacity || '',
      voltage: source.voltage || '',
      category: source.category || '',
      batterySystem: source.batterySystem || '',
      chargingTime: source.chargingTime || '',
      description: source.description || '',
      availableColors: source.availableColors || '',
      brochureUrl: source.brochureUrl || '',
      variants: source.variants || [],
    });
    
    toast({
      title: 'Template Imported',
      description: `Imported specifications from ${source.model}.`,
    });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentImages = form.getValues('images') || [];
    if (currentImages.length + files.length > 5) {
      toast({ variant: 'destructive', title: 'Limit Exceeded', description: 'Max 5 images allowed.' });
      return;
    }

    setIsUploading(true);
    const promises = Array.from(files).map((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: `${file.name} exceeds 10MB.` });
        return Promise.reject(new Error('File too large'));
      }
      return compressImage(file);
    });

    try {
      const newImages = await Promise.all(promises);
      form.setValue('images', [...currentImages, ...newImages]);
      toast({ title: 'Success', description: 'Images compressed and uploaded successfully.' });
    } catch (err: any) {
      if (err.message !== 'File too large') {
        toast({ variant: 'destructive', title: 'Upload Error', description: 'Failed to process images.' });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        {!initialData && existingScooters && existingScooters.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Copy className="h-4 w-4" />
              Template Importer
            </div>
            <div className="flex gap-2">
              <Select onValueChange={handleImportTemplate}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue placeholder="Clone from existing model..." />
                </SelectTrigger>
                <SelectContent>
                  {existingScooters.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.model} ({s.availableColors || 'Std Color'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Use this to quickly add a new color of an existing model with all its variants and technical specs pre-filled.
            </p>
          </div>
        )}

        <Alert variant="secondary" className="bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Smart Image Engine Active</AlertTitle>
          <AlertDescription>
            Images will be automatically optimized for high performance.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <FormLabel>Scooter Photos</FormLabel>
          <div className="grid grid-cols-5 gap-4">
            {form.watch('images')?.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group bg-zinc-900">
                <Image src={img} alt="Scooter Preview" fill className="object-contain" unoptimized />
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
            <FormItem><FormLabel>Base Price</FormLabel><FormControl><Input placeholder="₹ 1,20,000" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="range" render={({ field }) => (
            <FormItem><FormLabel>Base Range</FormLabel><FormControl><Input placeholder="120 km" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <div className="space-y-4 border border-white/5 p-4 rounded-xl bg-white/5">
          <div className="flex items-center justify-between">
            <FormLabel className="text-primary font-bold">Model Variants (Range/Price Packs)</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', range: '', price: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Variant
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-white/5 pb-4 last:border-0">
              <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => (
                <FormItem><FormLabel>Variant Name</FormLabel><FormControl><Input placeholder="Pro" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`variants.${index}.range`} render={({ field }) => (
                <FormItem><FormLabel>Range</FormLabel><FormControl><Input placeholder="150 km" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input placeholder="₹ 1,40,000" {...field} /></FormControl></FormItem>
              )} />
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField control={form.control} name="topSpeed" render={({ field }) => (
            <FormItem><FormLabel>Top Speed</FormLabel><FormControl><Input placeholder="80 km/h" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="batteryType" render={({ field }) => (
            <FormItem><FormLabel>Battery Type</FormLabel><FormControl><Input placeholder="LFP" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="voltage" render={({ field }) => (
            <FormItem><FormLabel>Voltage</FormLabel><FormControl><Input placeholder="60V" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="chargingTime" render={({ field }) => (
            <FormItem><FormLabel>Charge Time</FormLabel><FormControl><Input placeholder="4h" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="availableColors" render={({ field }) => (
          <FormItem><FormLabel>Available Colors</FormLabel><FormControl><Input placeholder="Red, Blue, Matte Black" {...field} /></FormControl><FormDescription>Comma separated list of colors.</FormDescription></FormItem>
        )} />

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

        <Button type="submit" className="w-full gap-2 h-12" disabled={isUploading}>
          <Save className="h-4 w-4" /> {initialData ? 'Update Model' : 'Save to Inventory'}
        </Button>
      </form>
    </Form>
  );
}
