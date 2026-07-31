
"use client"

import Link from 'next/link';
import { Zap, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Zap className="h-6 w-6 text-primary-foreground fill-current" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground">
            AMRESH <span className="text-primary">VOLT</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#showroom" className="hover:text-primary transition-colors">Showroom</Link>
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Portal
            </Button>
          </Link>
          <Button variant="default" size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>
    </nav>
  );
}
