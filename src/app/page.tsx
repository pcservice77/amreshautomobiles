
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ScooterCard } from '@/components/scooter-card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
      <section className="relative h-[90vh] flex items-center pt-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={PlaceHolderImages[0].imageUrl}
            alt="Amresh Automobiles Hero"
            fill
            className="object-cover opacity-40"
            priority
            data-ai-hint="electric scooter"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-primary text-primary px-4 py-1 text-xs font-semibold mb-4">
              Future of Urban Mobility
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Electrify Your <span className="text-primary italic">Daily Journey.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Experience the power of sustainable engineering at <strong>Amresh Automobiles</strong>. We bring you the finest selection of electric scooters designed for speed, comfort, and zero emissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#showroom">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-lg w-full">
                  Explore Models
                </Button>
              </Link>
              <Link href="/test-ride">
                <Button size="lg" variant="outline" className="border-white/10 text-lg hover:bg-white/5 w-full">
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
            <h2 className="font-headline text-4xl font-bold mb-4">Our Electric <span className="text-primary">Fleet</span></h2>
            <p className="text-muted-foreground">Modern solutions for modern mobility needs.</p>
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
            <p className="text-muted-foreground">Visit us at any of our branches for a personalized experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {branches?.map((branch) => (
              <Card key={branch.id} className="bg-card/40 border-white/5 group hover:border-primary/50 transition-all">
                <div className="relative h-40">
                  <Image src={branch.imageUrl || 'https://picsum.photos/seed/br/600/400'} alt={branch.name} fill className="object-cover" />
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
                src={PlaceHolderImages[4].imageUrl}
                alt="Showroom"
                fill
                className="object-cover"
                data-ai-hint="showroom interior"
              />
            </div>
            <div>
              <h2 className="font-headline text-4xl font-bold mb-6">Why Choose <span className="text-primary">Amresh Automobiles?</span></h2>
              <div className="space-y-6">
                {[
                  { title: "Smart Connectivity", desc: "Integrated app with GPS tracking, remote diagnostics, and OTA updates." },
                  { title: "Rapid Charging", desc: "Get from 0 to 80% in less than 2 hours with our Volt Charge technology." },
                  { title: "Premium Service", desc: "Lifetime battery warranty and 24/7 roadside assistance across the city." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-primary/20 p-2 rounded-lg h-fit">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/test-ride" className="inline-block mt-8">
                <Button className="gap-2 bg-primary text-primary-foreground">
                  <Calendar className="h-4 w-4" /> Book a Test Ride
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                Leading the charge towards a greener future. Visit our showroom to test ride the evolution of transport.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground">
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Contact Us</h4>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span>{showroom?.address || 'Main Showroom, Padampur, Khunti'}</span>
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
              <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li><Link href="/test-ride" className="hover:text-primary">Book Test Ride</Link></li>
                <li><Link href="/#showroom" className="hover:text-primary">Browse Scooters</Link></li>
                <li><Link href="/login" className="hover:text-primary">Employee Login</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Newsletter</h4>
              <p className="text-muted-foreground text-sm mb-4">Subscribe for the latest offers and tech updates.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your Email" className="bg-secondary border-none rounded-md px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary outline-none" />
                <Button className="bg-primary text-primary-foreground">Join</Button>
              </div>
            </div>
          </div>
          <div className="py-8 border-t border-white/5 text-center text-muted-foreground text-sm">
            © 2025 {showroom?.name || 'Amresh Automobiles'}. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
