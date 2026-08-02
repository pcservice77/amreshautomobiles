
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
  Palette
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading luxury details...</div>;
  if (!scooter) return <div className="min-h-screen flex items-center justify-center">Scooter not found.</div>;

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
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 md:pt-32">
        <Button 
          variant="ghost" 
          className="mb-8 gap-2 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Fleet
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Visuals Section */}
          <div className="space-y-6">
            <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl border border-white/5 bg-zinc-900/30">
              {scooter.images && scooter.images.length > 0 ? (
                <>
                  <Image 
                    src={scooter.images[activeImageIdx]} 
                    alt={scooter.model} 
                    fill 
                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  {scooter.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">No Image Available</div>
              )}
              <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                <Badge className="bg-primary/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1">New Edition</Badge>
                <Badge className="bg-accent/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1">Eco Smart</Badge>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {scooter.images?.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "relative w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-zinc-900",
                    activeImageIdx === idx ? "border-primary scale-105 shadow-lg shadow-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt={`${scooter.model} ${idx}`} fill className="object-contain" unoptimized />
                </button>
              ))}
            </div>

            {/* Available Colors */}
            {colors.length > 0 && (
              <div className="bg-card/40 border border-white/5 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Palette className="h-5 w-5" />
                  <h4 className="font-bold">Available Colors</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-4 py-1 font-medium bg-secondary/50 border-white/5">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                 <div>
                   <h1 className="text-5xl md:text-6xl font-headline font-bold mb-2 tracking-tight">{scooter.model}</h1>
                   <p className="text-primary font-headline text-xl font-medium tracking-wide">{scooter.tagline || 'Drive the Future'}</p>
                 </div>
                 <p className="text-4xl font-black text-primary">{scooter.price}</p>
              </div>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl">
              {scooter.description}
            </p>

            <div className="grid grid-cols-1 gap-4 mb-10">
              <Link href="/test-ride" className="w-full">
                <Button size="lg" className="h-16 text-lg font-bold w-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                </Button>
              </Link>
              <Link href="/test-ride" className="w-full">
                <Button variant="secondary" size="lg" className="h-16 text-lg font-bold w-full bg-secondary hover:bg-secondary/80 transition-all border border-white/5">
                  <CalendarDays className="mr-2 h-5 w-5" /> Book Test Ride
                </Button>
              </Link>
              {scooter.brochureUrl && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 text-sm font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all"
                  onClick={() => window.open(scooter.brochureUrl, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Brochure
                </Button>
              )}
            </div>

            {/* Technical Specifications */}
            <div className="space-y-6 pt-10 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-headline font-bold">Technical Specifications</h3>
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Premium Mobility</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecItem icon={Battery} label="Range" value={scooter.range || 'N/A'} />
                <SpecItem icon={Gauge} label="Top Speed" value={scooter.topSpeed || 'N/A'} />
                <SpecItem icon={Zap} label="Voltage" value={scooter.voltage || 'N/A'} />
                <SpecItem icon={Activity} label="Category" value={scooter.category || 'N/A'} />
                <SpecItem icon={Layers} label="Battery System" value={scooter.batterySystem || 'N/A'} />
                <SpecItem icon={Battery} label="Battery Type" value={scooter.batteryType || 'N/A'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-card/40 border border-white/5 rounded-2xl group hover:border-primary/30 transition-all">
      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
