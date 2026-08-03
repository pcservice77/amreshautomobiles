
"use client"

import { useCompare } from '@/hooks/use-compare';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { X, GitCompare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function CompareBar() {
  const { selectedIds, toggleCompare, clearCompare } = useCompare();
  const firestore = useFirestore();

  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: scooters } = useCollection(scootersQuery);

  if (selectedIds.length === 0) return null;

  const selectedScooters = selectedIds
    .map(id => scooters?.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-2xl">
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <div className="bg-primary/20 p-2 rounded-lg hidden sm:block">
            <GitCompare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex gap-2">
            {selectedScooters.map((scooter: any) => (
              <div key={scooter.id} className="relative group shrink-0">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden">
                  <Image 
                    src={scooter.images?.[0] || 'https://picsum.photos/seed/s/100/100'} 
                    alt={scooter.model} 
                    fill 
                    className="object-contain" 
                  />
                </div>
                <button 
                  onClick={() => toggleCompare(scooter.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: 3 - selectedScooters.length }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-lg border border-white/5 border-dashed flex items-center justify-center text-zinc-700">
                +
              </div>
            ))}
          </div>
          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {selectedScooters.length} of 3 selected
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCompare}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
          <Link href="/compare" className="flex-1 md:flex-none">
            <Button size="sm" className="w-full gap-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
              Compare Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
