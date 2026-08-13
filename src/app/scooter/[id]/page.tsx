
"use client"

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Battery, 
  Gauge, 
  Zap, 
  ArrowLeft, 
  CalendarDays, 
  ShoppingCart, 
  Activity, 
  Layers, 
  ChevronLeft,
  ChevronRight,
  Palette,
  ShieldCheck,
  ZapIcon,
  Maximize2,
  X,
  Calculator,
  IndianRupee,
  TrendingUp,
  Fuel
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

export default function ScooterDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(-1);

  // EMI & Savings State
  const [downPayment, setDownPayment] = useState(30000);
  const [tenure, setTenure] = useState(24);
  const [dailyCommute, setDailyCommute] = useState(40);

  const scooterRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'scooters', id as string);
  }, [firestore, id]);

  const { data: scooter, loading } = useDoc(scooterRef);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-foreground p-12 md:p-24 space-y-12">
      <Skeleton className="h-10 w-32 bg-white/10" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <Skeleton className="aspect-square w-full rounded-[3rem] bg-white/5" />
        <div className="space-y-8">
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-12 w-2/3 bg-white/5" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-3xl bg-white/5" />
            <Skeleton className="h-32 rounded-3xl bg-white/5" />
          </div>
          <Skeleton className="h-40 w-full rounded-3xl bg-white/5" />
        </div>
      </div>
    </div>
  );

  if (!scooter) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-xl font-headline">Vehicle not found in archives.</p>
    </div>
  );

  const variants = scooter.variants || [];
  const currentPriceStr = selectedVariantIdx === -1 ? scooter.price : variants[selectedVariantIdx].price;
  const currentRange = selectedVariantIdx === -1 ? scooter.range : variants[selectedVariantIdx].range;
  const currentVariantName = selectedVariantIdx === -1 ? 'Standard' : variants[selectedVariantIdx].name;

  // Numerical Price for Calculations
  const numericPrice = parseFloat(currentPriceStr.replace(/[^\d.]/g, '')) || 100000;

  // EMI Calculation (Simplified)
  const interestRate = 0.12; // 12% Annual
  const loanAmount = Math.max(0, numericPrice - downPayment);
  const monthlyInterest = interestRate / 12;
  const emi = loanAmount > 0 
    ? (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, tenure)) / (Math.pow(1 + monthlyInterest, tenure) - 1)
    : 0;

  // Petrol Savings Calculation
  const petrolPrice = 100;
  const petrolMileage = 40; // 40 km/l
  const evElectricityCostPerKm = 0.15; // Approx ₹0.15 per km
  const monthlyCommute = dailyCommute * 30;
  
  const petrolMonthlyCost = (monthlyCommute / petrolMileage) * petrolPrice;
  const evMonthlyCost = monthlyCommute * evElectricityCostPerKm;
  const monthlySavings = petrolMonthlyCost - evMonthlyCost;

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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 pt-12 md:pt-20 relative z-10">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="relative w-full aspect-[4/3] md:aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
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
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                       <ZapIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-full">
                  <Maximize2 className="h-6 w-6 text-white" />
                </div>
              </div>

              {scooter.images?.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    {activeImageIdx + 1} / {scooter.images.length}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

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

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col"
          >
            <div className="mb-12">
              <div className="flex flex-col gap-8">
                 <div>
                   <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-8xl font-headline font-bold mb-4 tracking-tighter leading-[0.8] uppercase text-gradient"
                   >
                    {scooter.model}
                   </motion.h1>
                   <p className="text-primary font-headline text-2xl font-light tracking-[0.2em] uppercase italic">
                    {scooter.tagline || 'Excellence in Motion'}
                   </p>
                 </div>

                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Compare Options</p>
                     <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[9px] tracking-widest">{variants.length + 1} Variants Available</Badge>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button 
                       onClick={() => setSelectedVariantIdx(-1)}
                       className={cn(
                         "p-6 rounded-3xl text-left transition-all border flex flex-col gap-2 shadow-sm group",
                         selectedVariantIdx === -1 ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/50"
                       )}
                     >
                       <div className="flex justify-between items-center w-full">
                         <span className="text-sm font-black uppercase tracking-widest">Standard</span>
                         {selectedVariantIdx === -1 && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                       </div>
                       <div className="space-y-1">
                         <p className={cn("text-xs font-bold", selectedVariantIdx === -1 ? "text-white" : "text-foreground")}>{scooter.range} Range</p>
                         <p className={cn("text-[10px] opacity-70", selectedVariantIdx === -1 ? "text-white" : "text-primary")}>Price: {scooter.price}</p>
                       </div>
                     </button>

                     {variants.map((v: any, idx: number) => (
                       <button 
                         key={idx}
                         onClick={() => setSelectedVariantIdx(idx)}
                         className={cn(
                           "p-6 rounded-3xl text-left transition-all border flex flex-col gap-2 shadow-sm group",
                           selectedVariantIdx === idx ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/50"
                         )}
                       >
                         <div className="flex justify-between items-center w-full">
                           <span className="text-sm font-black uppercase tracking-widest">{v.name}</span>
                           {selectedVariantIdx === idx && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                         </div>
                         <div className="space-y-1">
                           <p className={cn("text-xs font-bold", selectedVariantIdx === idx ? "text-white" : "text-foreground")}>{v.range} Range</p>
                           <p className={cn("text-[10px] opacity-70", selectedVariantIdx === idx ? "text-white" : "text-primary")}>Price: {v.price}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2 block">Ex-Showroom ({currentVariantName} • {currentRange})</span>
                      <p className="text-6xl font-black text-white tracking-tighter">{currentPriceStr}</p>
                    </div>
                    <div className="hidden sm:block">
                      <Zap className="h-10 w-10 text-primary opacity-20" />
                    </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </motion.div>
        </div>

        {/* Finance & Savings Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-24 border-t border-white/5"
        >
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-3xl font-headline font-bold uppercase tracking-tighter">Finance <span className="text-primary italic">Calculator.</span></h3>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-black">Plan your premium investment.</p>
              </div>
            </div>

            <div className="space-y-8 glass-card p-8 rounded-[2.5rem]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Down Payment</span>
                  <span className="text-xl font-bold">₹ {downPayment.toLocaleString()}</span>
                </div>
                <Slider 
                  value={[downPayment]} 
                  onValueChange={(val) => setDownPayment(val[0])} 
                  max={numericPrice} 
                  step={5000} 
                  className="py-4"
                />
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loan Tenure (Months)</span>
                <div className="grid grid-cols-3 gap-2">
                  {[12, 24, 36].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTenure(m)}
                      className={cn(
                        "py-3 rounded-2xl font-bold text-sm transition-all border",
                        tenure === m ? "bg-primary text-primary-foreground border-primary" : "bg-zinc-900 border-white/5 hover:border-white/20"
                      )}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Estimated Monthly EMI</p>
                  <p className="text-5xl font-black text-white tracking-tighter">₹ {Math.round(emi).toLocaleString()}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-2xl">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="text-3xl font-headline font-bold uppercase tracking-tighter">Monthly <span className="text-primary italic">Savings.</span></h3>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-black">Electric vs Petrol Economics.</p>
              </div>
            </div>

            <div className="space-y-8 glass-card p-8 rounded-[2.5rem] border-accent/20">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily Commute</span>
                  <span className="text-xl font-bold">{dailyCommute} KM</span>
                </div>
                <Slider 
                  value={[dailyCommute]} 
                  onValueChange={(val) => setDailyCommute(val[0])} 
                  max={150} 
                  step={5} 
                  className="py-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Fuel className="h-4 w-4 text-red-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Petrol Cost</span>
                    </div>
                    <p className="text-2xl font-bold">₹ {Math.round(petrolMonthlyCost).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Monthly Avg.</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20 rounded-[2rem]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">EV Cost</span>
                    </div>
                    <p className="text-2xl font-bold">₹ {Math.round(evMonthlyCost).toLocaleString()}</p>
                    <p className="text-[10px] text-primary/60">Monthly Avg.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-1">Your Monthly Profit</p>
                  <p className="text-5xl font-black text-white tracking-tighter">₹ {Math.round(monthlySavings).toLocaleString()}</p>
                  <p className="text-[10px] text-accent font-bold mt-1 animate-pulse">Save ₹ {Math.round(monthlySavings * 12).toLocaleString()} Yearly!</p>
                </div>
                <div className="bg-accent/10 p-4 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-16 py-24 border-t border-white/5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-tighter">
              Performance Specs.
            </h3>
            <ShieldCheck className="h-10 w-10 text-primary opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpecItem icon={Battery} label="Range" value={currentRange} delay={0.1} />
            <SpecItem icon={Gauge} label="Top Speed" value={scooter.topSpeed || '85 KM/H'} delay={0.2} />
            <SpecItem icon={Zap} label="Voltage" value={scooter.voltage || '60V'} delay={0.3} />
            <SpecItem icon={Activity} label="Class" value={scooter.category || 'High Performance'} delay={0.4} />
            <SpecItem icon={Layers} label="Battery Tech" value={scooter.batterySystem || 'Modular LFP'} delay={0.5} />
            <SpecItem icon={Battery} label="Cell Type" value={scooter.batteryType || 'Li-ion'} delay={0.6} />
          </div>

          {colors.length > 0 && (
            <div className="space-y-8 pt-12">
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 text-primary" />
                <h4 className="font-black text-xs uppercase tracking-[0.4em] text-muted-foreground">Available Colors</h4>
              </div>
              <div className="flex flex-wrap gap-4">
                {colors.map((color: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-10 py-4 bg-zinc-900/40 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest hover:border-primary/50 transition-colors cursor-default"
                  >
                    {color}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] bg-black/95 border-none p-0 flex items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">Vehicle Visualizer</DialogTitle>
          <DialogDescription className="sr-only">Fullscreen inspection of {scooter.model}</DialogDescription>
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-primary hover:text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            {scooter.images && scooter.images[activeImageIdx] && (
              <motion.div 
                key={activeImageIdx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full h-full max-w-6xl"
              >
                <Image 
                  src={scooter.images[activeImageIdx]} 
                  alt={scooter.model} 
                  fill 
                  className="object-contain"
                  unoptimized
                />
              </motion.div>
            )}

            {scooter.images?.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-primary hover:text-white transition-all z-50 group"
                >
                  <ChevronLeft className="h-8 w-8 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-primary hover:text-white transition-all z-50 group"
                >
                  <ChevronRight className="h-8 w-8 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-[12px] font-black uppercase tracking-[0.2em] z-50">
                  {activeImageIdx + 1} / {scooter.images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
      className="flex flex-col gap-6 p-10 bg-zinc-900/30 border border-white/5 rounded-[2.5rem] group transition-all"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
