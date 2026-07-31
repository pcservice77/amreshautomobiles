
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, FileText, Users, LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Inventory', icon: Box, href: '/admin/inventory' },
  { label: 'Billing', icon: FileText, href: '/admin/billing' },
  { label: 'Sales History', icon: Users, href: '/admin/sales' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <Zap className="h-5 w-5 text-primary-foreground fill-current" />
        </div>
        <span className="font-headline text-lg font-bold">VOLT <span className="text-primary">ADMIN</span></span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent transition-colors">
          <LogOut className="h-5 w-5" />
          Exit Admin
        </Link>
      </div>
    </div>
  );
}
