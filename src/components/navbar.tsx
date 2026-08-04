
"use client"

import Link from 'next/link';
import { Zap, ShieldCheck, ShoppingCart, LogOut, User, CalendarDays, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const { scrollY } = useScroll();
  
  const backgroundColor = useTransform(scrollY, [0, 100], ["rgba(5, 5, 5, 0)", "rgba(5, 5, 5, 0.8)"]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(20px)"]);
  const borderOpacity = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.05)"]);

  const isAdmin = user?.role === 'admin' || user?.role === 'branch_admin';

  return (
    <motion.nav 
      style={{ backgroundColor, backdropBlur, borderBottomColor: borderOpacity }}
      className="fixed top-0 w-full z-[100] border-b transition-all duration-300"
    >
      <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            className="bg-primary p-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <Zap className="h-6 w-6 text-primary-foreground fill-current" />
          </motion.div>
          <span className="font-headline text-2xl font-black tracking-tighter text-foreground uppercase group-hover:text-primary transition-colors">
            AMRESH
          </span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-12 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Link href="/#showroom" className="hover:text-primary transition-all hover:scale-110">Fleet</Link>
          <Link href="/#features" className="hover:text-primary transition-all hover:scale-110">Innovation</Link>
          <Link href="/test-ride" className="hover:text-primary transition-all hover:scale-110">Booking</Link>
          <Link href="/#contact" className="hover:text-primary transition-all hover:scale-110">Ateliers</Link>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-primary font-bold hover:bg-primary/10 rounded-full px-6">
                    <ShieldCheck className="h-4 w-4" />
                    Portal
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/5 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => signOut(auth!)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="font-bold tracking-widest text-[10px] uppercase hover:text-primary">
                Login
              </Button>
            </Link>
          )}
          <Link href="/test-ride">
            <Button className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
              Book Ride
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
