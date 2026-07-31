
"use client"

import Link from 'next/link';
import { Zap, ShieldCheck, ShoppingCart, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Zap className="h-6 w-6 text-primary-foreground fill-current" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground uppercase">
            AMRESH <span className="text-primary">AUTOMOBILES</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/#showroom" className="hover:text-primary transition-colors">Showroom</Link>
          <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="/#contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    Admin Portal
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut(auth!)}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
          <Button variant="default" size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>
    </nav>
  );
}
