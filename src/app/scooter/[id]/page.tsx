
"use client"

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Battery, 
  Gauge, 
  Zap, 
  ArrowLeft, 
  Download, 
  CalendarDays, 
  ShoppingCart, 
  Activity, 
  Layers, 
  ChevronLeft,
  ChevronRight,
  Palette,
  ShieldCheck,
  ZapIcon
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScooterDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const scooterRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'scooters', id as string);
  }, [firestore, id]);

  const { data: scooter, loading } = useDoc(scooterRef);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Zap className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Calibrating Performance...</p>
      </div>
    </div>
  );

  if (!scooter) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-xl font-headline">Vehicle not found in archives.</p>
    </div>
  );

  const nextImage = () => {
    if (scooter.images && scooter.images.length > 0) {
      setActiveImageIdx((prev) => (prev + 1) % scooter.images.length);
    }
  };

  const prevImage = () => {
    if (scooter.images && scooter.images.length > 0) {
      setActiveImageIdx((prev) => (prev - 1 + scooter.images.length) % scooter.images.length);
    }
  };

  const colors = typeof scooter.availableColors === 'string' 
    ? scooter.availableColors.split(',').map((c: string) => c.trim()).filter(Boolean) 
    : [];

  return (
    <main className="min-h-screen bg-[#050505] text-foreground pb-32 selection:bg-primary/30">
      <Navbar />
      
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-40 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            className="mb-12 gap-3 text-muted-foreground hover:text-primary transition-all group"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Showroom</span>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Visual Showcase Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="relative w-full aspect-[4/3] md:aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIdx}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6 }}
                  className="relative w-full h-full"
                >
                  {scooter.images && scooter.images.length > 0 ? (
                    <Image 
                      src={scooter.images[activeImageIdx]} 
                      alt={scooter.model} 
                      fill 
                      className="object-contain p-8 transition-transform duration-1000 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                       <ZapIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              {scooter.images?.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
                  <button onClick={prevImage} className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    {activeImageIdx + 1} / {scooter.images.length}
                  </div>
                  <button onClick={nextImage} className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="absolute top-10 left-10 flex flex-col gap-3 z-10">
                <Badge className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg">New Release</Badge>
                <Badge className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border border-white/10">Limited</Badge>
              </div>
            </div>

            {/* Thumbnails */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide"
            >
              {scooter.images?.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm",
                    activeImageIdx === idx 
                      ? "border-primary scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                      : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                  )}
                >
                  <Image src={img} alt={`${scooter.model} ${idx}`} fill className="object-contain p-2" unoptimized />
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Technical Luxury Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col"
          >
            <div className="mb-12">
              <div className="flex flex-col gap-6">
                 <div>
                   <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-8xl font-headline font-bold mb-4 tracking-tighter leading-[0.8] uppercase text-gradient"
                   >
                    {scooter.model}
                   </motion.h1>
                   <p className="text-primary font-headline text-2xl font-light tracking-[0.2em] uppercase italic">
                    {scooter.tagline || 'Apex Mobility System'}
                   </p>
                 </div>
                 <div className="flex items-end gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Ex-Showroom</span>
                    <p className="text-5xl font-black text-white">{scooter.price}</p>
                 </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="glass-card p-8 rounded-[2rem] mb-12 border-primary/10"
            >
              <p className="text-muted-foreground text-lg leading-relaxed font-light italic">
                {scooter.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
              <Link href="/test-ride" className="w-full">
                <Button size="lg" className="h-20 text-xs font-black uppercase tracking-[0.3em] w-full bg-primary hover:bg-primary/90 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all active:scale-[0.97] rounded-3xl">
                  <ShoppingCart className="mr-3 h-5 w-5" /> Reserve Now
                </Button>
              </Link>
              <Link href="/test-ride" className="w-full">
                <Button variant="outline" size="lg" className="h-20 text-xs font-black uppercase tracking-[0.3em] w-full border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all rounded-3xl">
                  <CalendarDays className="mr-3 h-5 w-5" /> Schedule Viewing
                </Button>
              </Link>
              {scooter.brochureUrl && (
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="h-14 text-[9px] font-black uppercase tracking-[0.2em] border-white/5 text-muted-foreground hover:text-primary transition-all md:col-span-2"
                  onClick={() => window.open(scooter.brochureUrl, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" /> Technical Dossier (.PDF)
                </Button>
              )}
            </div>

            {/* Performance Specifications */}
            <div className="space-y-10 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-headline font-bold uppercase tracking-tighter">Performance <span className="text-primary italic">Matrix.</span></h3>
                <ShieldCheck className="h-6 w-6 text-primary opacity-50" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <SpecItem icon={Battery} label="Max Range" value={scooter.range || '120 KM'} delay={0.8} />
                <SpecItem icon={Gauge} label="Top Velocity" value={scooter.topSpeed || '85 KM/H'} delay={0.9} />
                <SpecItem icon={Zap} label="Voltage System" value={scooter.voltage || '60V'} delay={1.0} />
                <SpecItem icon={Activity} label="Class" value={scooter.category || 'High Performance'} delay={1.1} />
                <SpecItem icon={Layers} label="Architecture" value={scooter.batterySystem || 'Modular LFP'} delay={1.2} />
                <SpecItem icon={Battery} label="Cells" value={scooter.batteryType || 'Li-ion'} delay={1.3} />
              </div>
            </div>

            {/* Available Colors */}
            {colors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-16 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h4 className="font-black text-[10px] uppercase tracking-[0.3em]">Curation Palette</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color: string, i: number) => (
                    <Badge key={i} variant="outline" className="px-6 py-2 font-black text-[9px] uppercase tracking-widest bg-white/5 border-white/10 rounded-full hover:bg-primary/20 transition-colors">
                      {color}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function SpecItem({ icon: Icon, label, value, delay }: { icon: any, label: string, value: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, borderColor: 'rgba(16, 185, 129, 0.3)' }}
      className="flex flex-col gap-4 p-6 bg-zinc-900/30 border border-white/5 rounded-[2rem] group transition-all"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
