"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ScooterCard } from '@/components/scooter-card';
import { CompareBar } from '@/components/compare-bar';
import { PromoBanner } from '@/components/promo-banner';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, ArrowRight, Zap, Calendar, ArrowUpRight, Leaf, Shield, Gauge, CheckCircle2, Wrench, Globe, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

function ScooterSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[2rem] border border-white/5 bg-card/40 backdrop-blur-xl p-10 space-y-6">
          <Skeleton className="w-full h-64 rounded-2xl bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3 bg-white/10" />
            <Skeleton className="h-4 w-1/3 bg-white/5" />
          </div>
          <Skeleton className="h-20 w-full rounded-3xl bg-white/5" />
          <div className="flex justify-between items-end">
            <Skeleton className="h-10 w-24 bg-white/10" />
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const firestore = useFirestore();
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const salesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sales');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: scooters, loading } = useCollection(scootersQuery);
  const { data: branches } = useCollection(branchesQuery);
  const { data: sales } = useCollection(salesQuery);
  const { data: showroom } = useDoc(showroomRef);

  // Impact Calculations
  const salesCount = sales?.length || 0;
  const co2Saved = (salesCount * 1.5).toFixed(1); // 1.5 Tons per EV per year
  const petrolSaved = (salesCount * 450).toLocaleString(); // 450L per EV per year

  return (
    <main className="min-h-screen pb-20 bg-[#050505]">
      <PromoBanner />
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] md:min-h-[800px] flex items-start pt-20 md:pt-28 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0 bg-[#050505]"
        >
          <Image
            src="/homebackgrounddesktop.png"
            alt="Amresh Automobiles - Futuristic EV Showroom"
            fill
            className="object-contain hidden md:block"
            priority
          />
          <Image
            src="/homebackgroundphone.png"
            alt="Amresh Automobiles - Futuristic EV Showroom"
            fill
            className="object-contain md:hidden"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-60" />
        </motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center flex flex-col items-center mt-6 md:mt-0"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/40 text-primary px-5 py-1.5 text-[8px] md:text-[9px] font-black tracking-[0.3em] uppercase mb-8 md:mb-10 bg-primary/5 backdrop-blur-xl">
              Future of Urban Mobility
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="font-headline text-4xl md:text-6xl font-black mb-4 md:mb-6 leading-[0.85] tracking-tighter italic uppercase text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              ELECTRIFY <br/> <span className="text-primary italic not-italic">YOUR DESTINY.</span>
            </motion.h1>
            
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8 md:mb-10">
              <span className="w-8 md:w-12 h-[1px] bg-white/30" />
              <p className="text-[10px] md:text-sm font-black tracking-[0.5em] uppercase text-white/90">
                Drive Electric <span className="text-primary">•</span> Live Smart
              </p>
              <span className="w-8 md:w-12 h-[1px] bg-white/30" />
            </motion.div>

            <motion.p variants={itemVariants} className="font-headline text-[10px] md:text-base text-muted-foreground mb-8 md:mb-12 max-w-sm md:max-w-lg mx-auto leading-relaxed opacity-80">
              Experience the silent power of sustainable luxury. Amresh Automobiles is redefining the electric experience in Jharkhand.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full items-center px-4 md:px-0">
              <Link href="/#showroom" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 md:h-12 w-full sm:w-auto px-6 md:px-8 bg-primary text-primary-foreground hover:scale-105 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full glow-primary">
                  Explore Showroom <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/test-ride" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-12 md:h-12 w-full sm:w-auto px-6 md:px-8 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full">
                  Book Test Ride
                </Button>
              </Link>
              <Link href="/service-booking" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-12 md:h-12 w-full sm:w-auto px-6 md:px-8 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Wrench className="h-4 w-4" /> Service Portal
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bar - Positioned between Hero and Showroom */}
      <div className="relative z-20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-12">
              <FeatureItem icon={Zap} label="100% Electric" />
              <FeatureItem icon={Gauge} label="Smart Ride" />
              <FeatureItem icon={Leaf} label="Eco Friendly" />
              <FeatureItem icon={Shield} label="Reliable & Safe" />
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Trusted By</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Thousands of Happy Riders</p>
              <div className="w-full h-[1px] bg-primary mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Showroom Section */}
      <section id="showroom" className="py-32 container mx-auto px-4 relative">
        <div className="flex flex-col items-center mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-headline text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase">OUR <span className="text-primary italic">FLEET.</span></h2>
            <div className="w-24 h-1 bg-primary mb-8 mx-auto" />
            <p className="text-muted-foreground text-xl max-w-xl">Curated performance. Exceptional design. The best electric scooters in India, available now.</p>
          </motion.div>
        </div>

        {loading ? (
          <ScooterSkeletonGrid />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {scooters?.map((scooter, i) => (
              <motion.div
                key={scooter.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <ScooterCard scooter={scooter as any} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section className="py-40 relative bg-zinc-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-tight mb-6">THE AMRESH <span className="text-primary italic">IMPACT.</span></h2>
            <p className="text-muted-foreground text-lg">Every scooter from our showroom contributes to a cleaner, greener India. Here is our collective milestone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ImpactCard 
              icon={Globe} 
              value={`${co2Saved} Tons`} 
              label="CO2 Emissions Saved" 
              desc="Cumulative carbon footprint reduced by our community."
              delay={0.1}
            />
            <ImpactCard 
              icon={TrendingDown} 
              value={`${petrolSaved} L`} 
              label="Petrol Saved Yearly" 
              desc="Total fuel consumption avoided by switching to EV."
              delay={0.2}
            />
            <ImpactCard 
              icon={CheckCircle2} 
              value={salesCount.toString()} 
              label="Happy EV Families" 
              desc="Households leading the change in Jharkhand."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <section id="features" className="py-40 bg-secondary/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 shadow-2xl glow-primary"
            >
              <Image
                src="https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png"
                alt="Amresh Automobiles Showroom Interior"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <h2 className="font-headline text-5xl md:text-6xl font-bold mb-10 tracking-tighter uppercase">CRAFTED FOR <br/><span className="text-primary italic">PRECISION.</span></h2>
              <div className="space-y-10">
                {[
                  { title: "Smart Ecosystem", desc: "Proprietary OS integration with real-time analytics and predictive maintenance." },
                  { title: "Next-Gen Energy", desc: "High-density LFP cells offering up to 150km of uninterrupted range on a single charge." },
                  { title: "White-Glove Service", desc: "Experience 24/7 dedicated support and concierge roadside assistance." }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 10 }}
                    className="flex gap-6 group"
                  >
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl h-fit group-hover:bg-primary transition-colors">
                      <Zap className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-headline text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dedicated Service Section */}
      <section id="service-promo" className="py-32 relative bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="glass-card p-12 md:p-20 rounded-[3rem] border-primary/20 flex flex-col lg:flex-row items-center justify-between gap-16 overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-2xl text-center lg:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-8">
                <Wrench className="h-3 w-3" /> Dedicated Owner Support
              </div>
              <h2 className="font-headline text-4xl md:text-6xl font-bold mb-8 tracking-tighter uppercase">WORLD-CLASS <br/><span className="text-primary italic">MAINTENANCE.</span></h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-12 max-w-xl mx-auto lg:mx-0">
                Keep your Amresh EV performing at its peak. Our expert technicians use genuine parts and state-of-the-art diagnostics to ensure your ride is always ready for the road.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link href="/service-booking">
                  <Button size="lg" className="h-16 px-12 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl glow-primary hover:scale-105 transition-all">
                    Access Service Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/5">
                  <Phone className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Service Hotline</p>
                    <p className="text-sm font-bold">{showroom?.contact || '+91 97989 10854'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 rounded-[4rem] rotate-12 border border-primary/10" />
              <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -rotate-6 border border-primary/5" />
              <Wrench className="w-48 h-48 text-primary relative z-10 drop-shadow-[0_0_40px_rgba(16,185,129,0.4)]" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="branches" className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="font-headline text-5xl font-bold mb-6 tracking-tighter uppercase">OUR <span className="text-primary italic">SHOWROOMS.</span></h2>
            <p className="text-muted-foreground text-xl">Find your nearest Amresh Automobiles location.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {branches?.map((branch, i) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="glass-card overflow-hidden group">
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image 
                      src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} 
                      alt={`${branch.name} Showroom`} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{branch.name}</h3>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{branch.city}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
                    <p className="mb-4">{branch.address}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{branch.contact}</span>
                      <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CompareBar />

      <footer id="contact" className="pt-32 border-t border-white/5 bg-[#050505]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-headline text-3xl font-black tracking-tighter uppercase">AMRESH</span>
              </Link>
              <p className="text-muted-foreground leading-relaxed text-lg font-light italic">
                Pioneering the silent revolution. <br/> Jharkhand's premier electric boutique.
              </p>
              <div className="flex gap-6">
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div>
              <h2 className="font-bold mb-10 text-xl tracking-tight uppercase text-primary">CONTACT US</h2>
              <ul className="space-y-6 text-muted-foreground">
                <li className="flex items-start gap-4 hover:text-white transition-colors cursor-pointer">
                  <MapPin className="h-6 w-6 text-primary shrink-0" />
                  <span>{showroom?.address || 'Main Showroom, Padampur, Khunti, JH'}</span>
                </li>
                <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                  <Phone className="h-6 w-6 text-primary shrink-0" />
                  <span className="font-bold">{showroom?.contact || '+91 97989 10854'}</span>
                </li>
                <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                  <Mail className="h-6 w-6 text-primary shrink-0" />
                  <span>{showroom?.email || 'amreshautomobiles@gmail.com'}</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold mb-10 text-xl tracking-tight uppercase text-primary">ABOUT US</h2>
              <ul className="space-y-6 text-muted-foreground">
                <li><Link href="/test-ride" className="hover:text-white transition-colors font-medium">Book a Test Ride</Link></li>
                <li><Link href="/#showroom" className="hover:text-white transition-colors font-medium">Scooter Models</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors font-medium">Partner Login</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors font-medium">Investor Relations</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold mb-10 text-xl tracking-tight uppercase text-primary">Find Us</h2>
              <div className="w-full aspect-square rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 group">
                <iframe
                  src="https://maps.google.com/maps?q=Amresh%20Automobiles%20Padampur%20Khunti%20Jharkhand&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="grayscale invert opacity-50 group-hover:opacity-100 group-hover:grayscale-0 group-hover:invert-0 transition-all duration-700"
                ></iframe>
              </div>
            </div>
          </div>
          <div className="py-12 border-t border-white/5 text-center text-muted-foreground text-sm tracking-widest uppercase font-black">
            © {currentYear} {showroom?.name || 'Amresh Automobiles'}. The Apex of Electric Luxury.
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureItem({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center bg-primary/5 group-hover:bg-primary group-hover:border-primary transition-all">
        <Icon className="h-4 w-4 text-primary group-hover:text-black transition-colors" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 group-hover:text-primary transition-colors">{label}</span>
    </div>
  );
}

function ImpactCard({ icon: Icon, value, label, desc, delay }: { icon: any, value: string, label: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-10 rounded-[3rem] bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:bg-primary/5 hover:border-primary/20 transition-all"
    >
      <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-5xl font-black text-white tracking-tighter mb-4">{value}</h3>
      <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-4">{label}</p>
      <p className="text-muted-foreground text-xs leading-relaxed max-w-[200px]">{desc}</p>
    </motion.div>
  );
}
