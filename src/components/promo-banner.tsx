
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function PromoBanner() {
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(true);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'offers'),
      where('isActive', '==', true)
    );
  }, [firestore]);

  const { data: offers, loading } = useCollection(offersQuery);

  // Filter offers by date client-side to avoid complex Firestore indexing for this MVP
  const activeOffers = (offers || []).filter(offer => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return now >= start && now <= end;
  });

  if (!isVisible || loading || activeOffers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative bg-primary text-primary-foreground overflow-hidden z-[110]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-500 to-primary opacity-50 animate-pulse" />
        
        <div className="container mx-auto px-4 py-3 relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white/20 p-1.5 rounded-full hidden sm:block">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 overflow-hidden">
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest whitespace-nowrap">
                {activeOffers[0].title}
              </p>
              <div className="hidden sm:block w-px h-4 bg-white/30" />
              <p className="text-[10px] sm:text-xs font-medium opacity-90 truncate">
                {activeOffers[0].description} — <span className="font-black text-white">Save {activeOffers[0].discount}!</span>
              </p>
              {activeOffers[0].branchId !== 'global' && (
                <span className="bg-black/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">
                  Exclusive at Showroom
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
