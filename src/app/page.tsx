
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ScooterCard } from '@/components/scooter-card';
import { CompareBar } from '@/components/compare-bar';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, ArrowRight, Zap, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Home() {
  const firestore = useFirestore();
  
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
    <main className="min-h-screen pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-[95vh] flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png"
            alt="Amresh Automobiles - Best EV Scooty in Jharkhand and India"
            fill
            className="object-cover opacity-70"
            priority
            data-ai-hint="electric scooter"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-primary text-primary px-4 py-1 text-xs font-semibold mb-4 bg-primary/10 backdrop-blur-sm">
              Future of Urban Mobility in Jharkhand & India
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
              Electrify Your <span className="text-primary italic">Daily Journey.</span>
            </h1>
            <p className="text-lg text-foreground/90 mb-8 max-w-lg leading-relaxed font-medium drop-shadow-md">
              Experience the power of sustainable engineering at <strong>Amresh Automobiles</strong>. We are the top-rated <strong>electric scooter showroom in Jharkhand</strong>, providing premium EV technology to all of India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#showroom">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-lg w-full shadow-lg shadow-primary/20">
                  Browse New EV Scooty
                </Button>
              </Link>
              <Link href="/test-ride">
                <Button size="lg" variant="outline" className="border-white/20 text-lg bg-background/20 backdrop-blur-md hover:bg-white/10 w-full">
                  Book Test Ride
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Grid */}
      <section id="showroom" className="py-24 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-bold mb-4">Latest <span className="text-primary">Electric Scooters in India</span></h2>
            <p className="text-muted-foreground">Find the perfect EV scooty at Amresh Automobiles, Jharkhand's leading showroom.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading our fleet...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scooters?.map((scooter) => (
              <ScooterCard key={scooter.id} scooter={scooter as any} />
            ))}
          </div>
        )}
      </section>

      {/* Branches Section */}
      <section className="py-24 bg-card/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-4xl font-bold mb-4">Our <span className="text-primary">Showroom Network</span></h2>
            <p className="text-muted-foreground">Visit Amresh Automobiles for a personalized EV experience at the best price in India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {branches?.map((branch) => (
              <Card key={branch.id} className="bg-card/40 border-white/5 group hover:border-primary/50 transition-all overflow-hidden">
                <div className="relative aspect-square w-full">
                  <Image 
                    src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} 
                    alt={`${branch.name} - Amresh Automobiles Showroom`} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span>{branch.address}, {branch.city} - {branch.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{branch.contact}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png"
                alt="Amresh Automobiles Showroom Interior - Best EV Scooty in India"
                fill
                className="object-cover"
                data-ai-hint="showroom interior"
              />
            </div>
            <div>
              <h2 className="font-headline text-4xl font-bold mb-6">Why Choose <span className="text-primary">Amresh Automobiles?</span></h2>
              <div className="space-y-6">
                {[
                  { title: "Smart Connectivity", desc: "Integrated app with GPS tracking, remote diagnostics, and OTA updates for all our electric scooters." },
                  { title: "Rapid Charging", desc: "Get from 0 to 80% in less than 2 hours with our specialized charging points." },
                  { title: "Premium Service", desc: "Lifetime battery warranty and 24/7 roadside assistance for our EV customers across Jharkhand." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-primary/20 p-2 rounded-lg h-fit">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="inline-block mt-8">
                <Link href="/test-ride">
                  <Button className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Calendar className="h-4 w-4" /> Book a Test Ride
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Floating Bar */}
      <CompareBar />

      {/* Footer / Contact */}
      <footer id="contact" className="pt-24 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold tracking-tight uppercase">AMRESH AUTOMOBILES</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Leading the charge towards a greener future in India. Visit our showroom to test ride the best electric scooters at Amresh Automobiles.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div>
              <h2 className="font-bold mb-6 text-lg">Contact Amresh Automobiles</h2>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span>{showroom?.address || 'Main Showroom, Padampur, Khunti, Jharkhand'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span>{showroom?.contact || '+91 97989 10854'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <span>{showroom?.email || 'amreshautomobile@gmail.com'}</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold mb-6 text-lg">Quick Links</h2>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li><Link href="/test-ride" className="hover:text-primary">Book EV Test Ride</Link></li>
                <li><Link href="/#showroom" className="hover:text-primary">EV Scooty Models</Link></li>
                <li><Link href="/login" className="hover:text-primary">Staff Login</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold mb-6 text-lg">EV News & Offers</h2>
              <p className="text-muted-foreground text-sm mb-4">Subscribe for the latest EV scooty offers from Amresh Automobiles.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your Email" className="bg-secondary border-none rounded-md px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary outline-none" />
                <Button className="bg-primary text-primary-foreground">Join</Button>
              </div>
            </div>
          </div>
          <div className="py-8 border-t border-white/5 text-center text-muted-foreground text-sm">
            © 2025 {showroom?.name || 'Amresh Automobiles'}. All rights reserved. | Best Electric Scooters in Jharkhand & India.
          </div>
        </div>
      </footer>
    </main>
  );
}
