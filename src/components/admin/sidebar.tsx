"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, FileText, Users, LogOut, Settings, MapPin, CalendarCheck, UserCog, Building, Sparkles, Zap, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();

  const isMainAdmin = user?.role === 'admin';
  const isBranchAdmin = user?.role === 'branch_admin';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Bookings', icon: CalendarCheck, href: '/admin/bookings' },
    { label: 'Services', icon: Wrench, href: '/admin/services' },
    { label: 'Inventory', icon: Box, href: '/admin/inventory' },
    { label: 'Billing', icon: FileText, href: '/admin/billing' },
    { label: 'Sales History', icon: Users, href: '/admin/sales' },
  ];

  if (isBranchAdmin || isMainAdmin) {
    navItems.push({ label: 'Festive Offers', icon: Sparkles, href: '/admin/offers' });
  }

  if (isBranchAdmin) {
    navItems.push({ label: 'My Showroom', icon: Building, href: '/admin/my-branch' });
  }

  if (isMainAdmin) {
    navItems.push({ label: 'User Management', icon: UserCog, href: '/admin/users' });
    navItems.push({ label: 'Showroom Locations', icon: MapPin, href: '/admin/branches' });
    navItems.push({ label: 'Global Settings', icon: Settings, href: '/admin/settings' });
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col p-6 print:hidden">
      <div className="flex items-center gap-2 mb-10 px-2 flex-shrink-0">
        <div className="relative h-10 w-10">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <span className="font-headline text-lg font-bold uppercase">AMRESH <span className="text-primary">ADMIN</span></span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent transition-colors group">
          <Zap className="h-5 w-5 group-hover:text-primary" />
          View Site
        </Link>
        <button 
          onClick={() => auth && signOut(auth)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
