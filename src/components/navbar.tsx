"use client"

import Link from 'next/link';
import { ShieldCheck, LogOut, Menu, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const { scrollY } = useScroll();
  
  const backgroundColor = useTransform(scrollY, [0, 100], ["rgba(5, 5, 5, 0)", "rgba(5, 5, 5, 0.98)"]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(30px)"]);
  const borderOpacity = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"]);

  const isAdmin = user?.role === 'admin' || user?.role === 'branch_admin';

  const navLinks = [
    { name: 'Scooters', href: '/#showroom' },
    { name: 'Booking', href: '/test-ride' },
    { name: 'Service', href: '/service-booking', icon: Wrench },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <motion.nav 
      style={{ backgroundColor, backdropBlur, borderBottomColor: borderOpacity }}
      className="fixed top-0 w-full z-[100] border-b transition-all duration-500"
    >
      <div className="container mx-auto px-2 sm:px-4 h-24 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-4 group shrink-0">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0"
          >
            <Image 
              src="/logo.png" 
              alt="Amresh Automobiles Logo" 
              fill 
              className="object-contain"
              priority
            />
          </motion.div>
          <span className="font-headline text-lg sm:text-2xl font-black tracking-tighter text-white uppercase group-hover:text-primary transition-all duration-300 leading-none">
            AMRESH <span className="italic font-light opacity-50 block sm:inline">AUTOMOBILES</span>
          </span>
        </Link>
        
        <div className="hidden xl:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-primary transition-all hover:scale-105 relative group flex items-center gap-2">
              {link.name}
              {link.icon && <link.icon className="h-3 w-3 text-primary" />}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-4">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="flex gap-1 sm:gap-2 text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary/10 rounded-full px-3 sm:px-8 h-10 sm:h-12 border border-primary/30 bg-primary/5">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="hidden xs:inline">Portal</span>
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-white/5 hover:bg-destructive/10 hover:text-destructive w-10 h-10 sm:w-12 sm:h-12 transition-all"
                  onClick={() => signOut(auth!)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-black tracking-[0.2em] text-[10px] uppercase text-white hover:text-primary h-10 sm:h-12 px-4 sm:px-8 border border-white/5 rounded-full bg-white/5">
                  Login
                </Button>
              </Link>
            )}
          </div>

          <Link href="/test-ride" className="hidden xs:block">
            <Button className="h-10 sm:h-12 px-4 sm:px-10 bg-primary text-black font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] rounded-full shadow-[0_10px_30px_-5px_rgba(16,185,129,0.5)] hover:scale-105 transition-all active:scale-95 glow-primary">
              <span className="hidden sm:inline">Book Test Ride</span>
              <span className="sm:hidden">Book</span>
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/5 text-white">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#050505] border-white/10 w-full sm:max-w-md overflow-y-auto custom-scrollbar flex flex-col p-0">
              <div className="p-6 sm:p-10 flex flex-col min-h-full">
                <SheetHeader className="text-left mb-12">
                  <SheetTitle className="text-2xl font-black tracking-tighter uppercase text-white">
                    AMRESH <span className="text-primary italic">MENU</span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-6 sm:gap-8 flex-1">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.name} 
                      href={link.href} 
                      className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white hover:text-primary transition-colors flex items-center justify-between group"
                    >
                      {link.name}
                      <X className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
                
                <div className="mt-auto pt-12 pb-10 space-y-4">
                  <Link href="/service-booking" className="block">
                    <Button className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg glow-primary">
                      <Wrench className="mr-2 h-4 w-4" /> Service Portal
                    </Button>
                  </Link>
                  <Link href="/test-ride" className="block xs:hidden">
                    <Button className="w-full h-16 rounded-2xl bg-white/5 border border-primary/20 text-primary font-black uppercase tracking-widest text-xs">
                      Book Test Ride
                    </Button>
                  </Link>
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link href="/admin" className="block">
                          <Button className="w-full h-14 rounded-2xl bg-white/5 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest">
                            Admin Portal
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="destructive" 
                        className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest"
                        onClick={() => signOut(auth!)}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" className="block">
                      <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest">
                        Customer Login
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
