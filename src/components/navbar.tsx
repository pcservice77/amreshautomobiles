
"use client"

import Link from 'next/link';
import { Zap, ShieldCheck, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { motion, useScroll, useTransform } from 'framer-motion';

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const { scrollY } = useScroll();
  
  const backgroundColor = useTransform(scrollY, [0, 100], ["rgba(5, 5, 5, 0)", "rgba(5, 5, 5, 0.9)"]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(30px)"]);
  const borderOpacity = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.08)"]);

  const isAdmin = user?.role === 'admin' || user?.role === 'branch_admin';

  return (
    <motion.nav 
      style={{ backgroundColor, backdropBlur, borderBottomColor: borderOpacity }}
      className="fixed top-0 w-full z-[100] border-b transition-all duration-500"
    >
      <div className="container mx-auto px-4 h-20 md:h-28 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            className="bg-primary p-2.5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            <Zap className="h-6 w-6 text-primary-foreground fill-current" />
          </motion.div>
          <span className="font-headline text-2xl font-black tracking-tighter text-foreground uppercase group-hover:text-primary transition-all duration-300">
            AMRESH <span className="italic font-light opacity-50">AUTO</span>
          </span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          <Link href="/#showroom" className="hover:text-primary transition-all hover:scale-110 relative group">
            Scooters
            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="/#features" className="hover:text-primary transition-all hover:scale-110 relative group">
            Innovation
            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="/test-ride" className="hover:text-primary transition-all hover:scale-110 relative group">
            Booking
            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="/#contact" className="hover:text-primary transition-all hover:scale-110 relative group">
            Contact Us
            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary/10 rounded-full px-8 h-12 border border-primary/20">
                    <ShieldCheck className="h-4 w-4" />
                    Portal
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-white/5 hover:bg-destructive/10 hover:text-destructive w-12 h-12 transition-all"
                onClick={() => signOut(auth!)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="font-black tracking-[0.2em] text-[10px] uppercase hover:text-primary h-12 px-8">
                Login
              </Button>
            </Link>
          )}
          <Link href="/test-ride">
            <Button className="h-12 px-10 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-full shadow-[0_10px_30px_-5px_rgba(16,185,129,0.5)] hover:scale-105 transition-all active:scale-95">
              Book Test Ride
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-full w-12 h-12 bg-white/5">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
