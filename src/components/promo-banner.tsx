
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Tag, Zap, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export function PromoBanner() {
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'offers'),
      where('isActive', '==', true)
    );
  }, [firestore]);

  const { data: offers, loading } = useCollection(offersQuery);

  // Filter active offers by date
  const activeOffers = (offers || []).filter(offer => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return now >= start && now <= end;
  });

  useEffect(() => {
    if (activeOffers.length > 0 && !hasClosed) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeOffers, hasClosed]);

  if (loading || activeOffers.length === 0) return null;

  const offer = activeOffers[0];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -400, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed bottom-6 left-6 z-[120] w-[320px] max-w-[90vw]"
        >
          <div className="relative glass-card overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-primary/20 group">
            {/* Pulsing glow background */}
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary animate-pulse" />

            {/* Offer Image */}
            {offer.imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image 
                  src={offer.imageUrl} 
                  alt={offer.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <div className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    Live Now
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 relative">
              <button 
                onClick={() => {
                  setIsVisible(false);
                  setHasClosed(true);
                }}
                className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Limited Edition Deal</span>
              </div>

              <h3 className="text-xl font-headline font-bold text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                {offer.title}
              </h3>
              
              <p className="text-sm text-white/70 mb-6 line-clamp-2 leading-relaxed">
                {offer.description}
              </p>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Instant Saving</p>
                  <p className="text-3xl font-black text-white tracking-tighter">
                    {offer.discount} <span className="text-primary font-light">OFF</span>
                  </p>
                </div>
                
                <Link href="/test-ride">
                  <button className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-[0_10px_20px_-5px_rgba(16,185,129,0.5)] hover:scale-110 transition-all active:scale-95 group/btn">
                    <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Target Branch Badge */}
            {offer.branchId !== 'global' && (
              <div className="bg-primary/20 backdrop-blur-md px-6 py-2 text-center border-t border-white/5">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Exclusive Showroom Offer</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
