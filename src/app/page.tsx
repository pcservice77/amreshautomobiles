
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
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, ArrowRight, Zap, Calendar, ArrowUpRight } from 'lucide-react';
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

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: scooters, loading } = useCollection(scootersQuery);
  const { data: branches } = useCollection(branchesQuery);
  const { data: showroom } = useDoc(showroomRef);

  return (
    <main className="min-h-screen pb-20 bg-[#050505]">
      <PromoBanner />
      <Navbar />

      <section className="sr-only">
        <h2>Amresh Automobiles - Best EV Scooty Showroom</h2>
        <p>Also searched as amresh automobile, amreshautomobiles, and amresh autommobiles.</p>
        <p>Providing the best ev scooty in khunti, showroom near ranchi, and showroom near khunti.</p>
        <p>Top electric vehicle showrrom in jharkhand and showroom in jharkhand.</p>
      </section>

      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          {/* Responsive Background Images from Public Folder */}
          <Image
            src="/homebackgrounddesktop.png"
            alt="Amresh Automobiles - Premium EV Showroom"
            fill
            className="object-cover hidden md:block"
            priority
            data-ai-hint="scooter desktop"
          />
          <Image
            src="/homebackgroundphone.png"
            alt="Amresh Automobiles - Premium EV Showroom"
            fill
            className="object-cover md:hidden"
            priority
            data-ai-hint="scooter mobile"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-80" />
        </motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/30 text-primary px-6 py-2 text-xs font-black tracking-[0.2em] uppercase mb-8 bg-primary/5 backdrop-blur-xl">
              Future of Urban Mobility
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="font-headline text-6xl md:text-9xl font-bold mb-8 leading-[0.9] tracking-tighter text-gradient">
              ELECTRIFY YOUR <br/> <span className="italic font-light">DESTINY.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Experience the silent power of sustainable luxury. <strong>Amresh Automobiles</strong> is redefining the electric experience in Jharkhand.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/#showroom">
                <Button size="lg" className="h-16 px-12 bg-primary text-primary-foreground hover:scale-105 transition-all text-lg shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                  Explore Showroom
                </Button>
              </Link>
              <Link href="/test-ride">
                <Button size="lg" variant="outline" className="h-16 px-12 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all text-lg">
                  Book Test Ride
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-10 w-72 h-72 bg-accent/20 rounded-full blur-[120px] pointer-events-none" 
        />
      </section>

      <section id="showroom" className="py-32 container mx-auto px-4 relative">
        <div className="flex flex-col items-center mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-headline text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase">OUR <span className="text-primary italic">SCOOTERS.</span></h2>
            <div className="w-24 h-1 bg-primary mb-8 mx-auto" />
            <p className="text-muted-foreground text-xl max-w-xl">Curated performance. Exceptional design. The best electric scooters in India, available now at Amresh Automobiles.</p>
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
                className="object-cover scale-110 hover:scale-100 transition-transform duration-1000"
                data-ai-hint="showroom interior"
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
                <Zap className="h-10 w-10 text-primary" />
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
                  <span>{showroom?.email || 'sales@amresh.com'}</span>
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
