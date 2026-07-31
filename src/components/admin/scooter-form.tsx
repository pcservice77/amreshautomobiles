
"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateScooterDescription } from '@/ai/flows/generate-scooter-description';
import { useToast } from '@/hooks/use-toast';
import { Scooter } from '@/lib/db-mock';

const formSchema = z.object({
  model: z.string().min(2, 'Model name is required'),
  range: z.string().min(1, 'Range is required'),
  price: z.string().min(1, 'Price is required'),
  topSpeed: z.string().optional(),
  batteryCapacity: z.string().optional(),
  chargingTime: z.string().optional(),
  description: z.string().min(10, 'Description is too short'),
  imageUrl: z.string().url('Invalid image URL'),
});

interface ScooterFormProps {
  initialData?: Scooter;
  onSubmit: (data: any) => Promise<void>;
}

export function ScooterForm({ initialData, onSubmit }: ScooterFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      model: '',
      range: '',
      price: '',
      topSpeed: '',
      batteryCapacity: '',
      chargingTime: '',
      description: '',
      imageUrl: 'https://picsum.photos/seed/newscoot/600/400',
    },
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Volt Z1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="₹ 1,20,000" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="120 km" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="topSpeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top Speed (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="85 km/h" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="batteryCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Battery Capacity</FormLabel>
                <FormControl>
                  <Input placeholder="3.2 kWh" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chargingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Charging Time</FormLabel>
                <FormControl>
                  <Input placeholder="4 hours" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
