
"use client"

import { Navbar } from '@/components/navbar';
import { useCompare } from '@/hooks/use-compare';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GitCompare, Battery, Gauge, Zap, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  const { selectedIds, toggleCompare, clearCompare } = useCompare();
  const firestore = useFirestore();
  const router = useRouter();

  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: allScooters, loading } = useCollection(scootersQuery);

  const selectedScooters = selectedIds
    .map(id => allScooters?.find(s => s.id === id))
    .filter(Boolean);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading comparison table...</div>;

  if (selectedScooters.length === 0) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center space-y-6">
          <div className="flex justify-center">
            <GitCompare className="h-20 w-20 text-muted-foreground opacity-20" />
          </div>
          <h1 className="text-3xl font-headline font-bold">No Scooters Selected</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Please select at least two scooters from our showroom to compare their features.
          </p>
          <Link href="/#showroom">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Showroom
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const specs = [
    { label: 'Price', key: 'price', icon: Zap },
    { label: 'Range', key: 'range', icon: Battery },
    { label: 'Top Speed', key: 'topSpeed', icon: Gauge },
    { label: 'Battery Type', key: 'batteryType', icon: Battery },
    { label: 'Voltage', key: 'voltage', icon: Zap },
    { label: 'Category', key: 'category', icon: GitCompare },
    { label: 'Battery System', key: 'batterySystem', icon: Battery },
  ];

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 gap-2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Fleet
            </Button>
            <h1 className="text-4xl font-headline font-bold">Compare <span className="text-primary">Models</span></h1>
          </div>
          <Button variant="outline" onClick={clearCompare} className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" /> Clear Selection
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-white/5 w-48"></th>
                {selectedScooters.map((scooter: any) => (
                  <th key={scooter.id} className="p-4 border-b border-white/5 min-w-[250px]">
                    <div className="space-y-4 text-center">
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900/50 border border-white/10 group">
                        <Image 
                          src={scooter.images?.[0] || 'https://picsum.photos/seed/s/600/400'} 
                          alt={scooter.model} 
                          fill 
                          className="object-contain" 
                        />
                        <button 
                          onClick={() => toggleCompare(scooter.id)}
                          className="absolute top-2 right-2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{scooter.model}</h3>
                        <p className="text-primary font-bold">{scooter.price}</p>
                      </div>
                      <Link href={`/scooter/${scooter.id}`}>
                        <Button size="sm" className="w-full mt-4">Details</Button>
                      </Link>
                    </div>
                  </th>
                ))}
                {selectedScooters.length < 3 && (
                  <th className="p-4 border-b border-white/5 min-w-[250px]">
                    <Link href="/#showroom" className="block w-full h-full border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-12 hover:bg-white/5 transition-all text-muted-foreground group">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">+</div>
                      <div className="text-sm font-medium">Add to Compare</div>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={spec.key} className={cn(i % 2 === 0 ? "bg-white/5" : "bg-transparent")}>
                  <td className="p-6 font-medium border-r border-white/5">
                    <div className="flex items-center gap-2">
                      <spec.icon className="h-4 w-4 text-primary" />
                      {spec.label}
                    </div>
                  </td>
                  {selectedScooters.map((scooter: any) => (
                    <td key={scooter.id} className="p-6 text-center text-foreground font-semibold border-r border-white/5 last:border-r-0">
                      {scooter[spec.key] || 'Standard'}
                    </td>
                  ))}
                  {selectedScooters.length < 3 && <td className="p-6 border-white/5"></td>}
                </tr>
              ))}
              <tr>
                <td className="p-6 font-medium border-t border-white/5">Features</td>
                {selectedScooters.map((scooter: any) => (
                  <td key={scooter.id} className="p-6 border-t border-white/5 border-r last:border-r-0 border-white/5">
                    <div className="flex flex-wrap justify-center gap-2">
                      {scooter.features?.map((f: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] uppercase bg-zinc-800 text-zinc-300">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </td>
                ))}
                {selectedScooters.length < 3 && <td className="p-6 border-t border-white/5"></td>}
              </tr>
              <tr>
                <td className="p-6 border-t border-white/5"></td>
                {selectedScooters.map((scooter: any) => (
                  <td key={scooter.id} className="p-6 border-t border-white/5 text-center">
                    <Link href="/test-ride">
                      <Button className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                        <ShoppingCart className="h-4 w-4" />
                        Book Now
                      </Button>
                    </Link>
                  </td>
                ))}
                {selectedScooters.length < 3 && <td className="p-6 border-t border-white/5"></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
