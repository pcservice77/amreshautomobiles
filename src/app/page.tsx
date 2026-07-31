"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ScooterCard } from '@/components/scooter-card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { db, Scooter } from '@/lib/db-mock';
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  const [scooters, setScooters] = useState<Scooter[]>([]);

  useEffect(() => {
    const fetchScooters = async () => {
      const data = await db.getScooters();
      setScooters(data);
    };
    fetchScooters();
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center pt-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={PlaceHolderImages[0].imageUrl}
            alt="Amresh Volt Hero"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 border-primary text-primary px-4 py-1">
              Future of Urban Mobility
            </Badge>
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Electrify Your <span className="text-primary italic">Daily Journey.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Experience the power of sustainable engineering. Amresh Volt brings you the finest selection of electric scooters designed for speed, comfort, and zero emissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-lg">
                Explore Models
              </Button>
              <Button size="lg" variant="outline" className="border-white/10 text-lg hover:bg-white/5">
                Book Test Ride
              </Button>
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full">All</Button>
            <Button variant="ghost" size="sm" className="rounded-full">Performance</Button>
            <Button variant="ghost" size="sm" className="rounded-full">City</Button>
            <Button variant="ghost" size="sm" className="rounded-full">Economy</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {scooters.map((scooter) => (
            <ScooterCard key={scooter.id} scooter={scooter} />
          ))}
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={PlaceHolderImages[4].imageUrl}
                alt="Showroom"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-headline text-4xl font-bold mb-6">Why Choose <span className="text-primary">Amresh Volt?</span></h2>
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
                <span className="font-headline text-2xl font-bold tracking-tight">AMRESH VOLT</span>
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
                  <span>Main Showroom, MG Road,<br />Amresh Automobiles Complex</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <span>contact@amreshvolt.com</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li><Link href="#" className="hover:text-primary">Browse Scooters</Link></li>
                <li><Link href="#" className="hover:text-primary">Service Center</Link></li>
                <li><Link href="#" className="hover:text-primary">Charging Network</Link></li>
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
            © 2025 Amresh Volt. All rights reserved. Powered by Clean Energy.
          </div>
        </div>
      </footer>
    </main>
  );
}

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "outline", className?: string }) {
  const styles = variant === "outline" ? "border" : "bg-primary text-primary-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${styles} ${className}`}>
      {children}
    </span>
  );
}
