
"use client"

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Save, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateScooterDescription } from '@/ai/flows/generate-scooter-description';
import { useToast } from '@/hooks/use-toast';
import { Scooter } from '@/lib/db-mock';
import Image from 'next/image';

const formSchema = z.object({
  model: z.string().min(2, 'Model name is required'),
  tagline: z.string().optional(),
  range: z.string().min(1, 'Range is required'),
  price: z.string().min(1, 'Price is required'),
  topSpeed: z.string().optional(),
  batteryType: z.string().optional(),
  batteryCapacity: z.string().optional(),
  voltage: z.string().optional(),
  category: z.string().optional(),
  batterySystem: z.string().optional(),
  chargingTime: z.string().optional(),
  description: z.string().min(10, 'Description is too short'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

interface ScooterFormProps {
  initialData?: Scooter;
  onSubmit: (data: any) => Promise<void>;
}

export function ScooterForm({ initialData, onSubmit }: ScooterFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      model: '',
      tagline: '',
      range: '',
      price: '',
      topSpeed: '',
      batteryType: '',
      batteryCapacity: '',
      voltage: '',
      category: '',
      batterySystem: '',
      chargingTime: '',
      description: '',
      images: [],
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentImages = form.getValues('images') || [];
    if (currentImages.length + files.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Limit Exceeded',
        description: 'Maximum 5 images allowed per scooter.',
      });
      return;
    }

    setIsUploading(true);

    const promises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error(`File ${file.name} exceeds 5MB limit.`));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((newBase64Images) => {
        form.setValue('images', [...currentImages, ...newBase64Images]);
        toast({ title: 'Images Uploaded', description: `${newBase64Images.length} images added.` });
      })
      .catch((err) => {
        toast({
          variant: 'destructive',
          title: 'Upload Error',
          description: err.message,
        });
      })
      .finally(() => setIsUploading(false));
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const handleGenerateDescription = async () => {
    const values = form.getValues();
    if (!values.model || !values.range || !values.price) {
      toast({
        variant: 'destructive',
        title: 'Missing Specs',
        description: 'Please fill in model, range, and price to generate a description.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateScooterDescription({
        model: values.model,
        range: values.range,
        price: values.price,
        topSpeed: values.topSpeed,
        batteryCapacity: values.batteryCapacity,
        chargingTime: values.chargingTime,
        features: ['LED Lighting', 'Fast Charging', 'Smart Lock'],
      });
      form.setValue('description', result.description);
      toast({
        title: 'Description Generated',
        description: 'AI has drafted a professional description for you.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Failed to generate description. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormLabel>Scooter Images (Max 5, 5MB each)</FormLabel>
          <div className="grid grid-cols-5 gap-4">
            {form.watch('images')?.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                <Image src={img} alt={`Scooter ${idx}`} fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {(form.watch('images')?.length || 0) < 5 && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors"
              >
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                <span className="text-[10px] mt-1">Add Image</span>
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Name</FormLabel>
                <FormControl><Input placeholder="e.g. Volt Z1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline (e.g. Reliable Energy)</FormLabel>
                <FormControl><Input placeholder="Catchy phrase..." {...field} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl><Input placeholder="₹ 1,20,000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Range</FormLabel>
                <FormControl><Input placeholder="120 km" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="topSpeed"
            render={({ field }) => (
              <FormItem><FormLabel>Top Speed</FormLabel><FormControl><Input placeholder="85 km/h" {...field} /></FormControl></FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batteryType"
            render={({ field }) => (
              <FormItem><FormLabel>Battery Type</FormLabel><FormControl><Input placeholder="Lithium-ion / Lead Acid" {...field} /></FormControl></FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="voltage"
            render={({ field }) => (
              <FormItem><FormLabel>Voltage</FormLabel><FormControl><Input placeholder="60-72V" {...field} /></FormControl></FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="Low Speed / High Speed" {...field} /></FormControl></FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batterySystem"
            render={({ field }) => (
              <FormItem><FormLabel>Battery System</FormLabel><FormControl><Input placeholder="Swappable / Fixed" {...field} /></FormControl></FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chargingTime"
            render={({ field }) => (
              <FormItem><FormLabel>Charging Time</FormLabel><FormControl><Input placeholder="4 hours" {...field} /></FormControl></FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Product Description</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate with AI
                </Button>
              </div>
              <FormControl>
                <Textarea rows={6} placeholder="Describe the scooter features and benefits..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" />
          {initialData ? 'Update Scooter' : 'Add Scooter to Inventory'}
        </Button>
      </form>
    </Form>
  );
}
