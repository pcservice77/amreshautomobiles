
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Users, Package, TrendingUp, Landmark } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, startOfMonth, parseISO, isSameMonth, subMonths } from 'date-fns';

const COLORS = ['#708FFF', '#24C0FF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sales');
  }, [firestore]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'bookings');
  }, [firestore]);

  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: sales, loading: salesLoading } = useCollection(salesQuery);
  const { data: branches } = useCollection(branchesQuery);
  const { data: bookings } = useCollection(bookingsQuery);
  const { data: scooters } = useCollection(scootersQuery);

  // 1. Stats Calculation
  const stats = useMemo(() => {
    const totalRevenue = sales?.reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
    const activeInquiries = bookings?.filter(b => b.status === 'pending').length || 0;
    
    return {
      totalSales: sales?.length || 0,
      activeInquiries,
      inventory: scooters?.length || 0,
      revenue: `₹ ${(totalRevenue / 100000).toFixed(2)}L`
    };
  }, [sales, bookings, scooters]);

  // 2. Revenue by Branch (Bar Chart)
  const branchRevenueData = useMemo(() => {
    if (!sales || !branches) return [];
    
    const revenueMap: Record<string, number> = {};
    sales.forEach(sale => {
      const bId = sale.branchId || 'main_showroom';
      revenueMap[bId] = (revenueMap[bId] || 0) + (Number(sale.price) || 0);
    });

    return Object.entries(revenueMap).map(([bId, revenue]) => {
      const branch = branches.find(b => b.id === bId);
      return {
        name: branch?.name || 'Main Showroom',
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [sales, branches]);

  // 3. Top Selling Models (Pie Chart)
  const topModelsData = useMemo(() => {
    if (!sales) return [];
    
    const countMap: Record<string, number> = {};
    sales.forEach(sale => {
      const model = sale.model || 'Unknown';
      countMap[model] = (countMap[model] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sales]);

  // 4. Monthly Growth (Line Chart - Last 6 Months)
  const monthlyGrowthData = useMemo(() => {
    if (!sales) return [];
    
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      return startOfMonth(subMonths(now, 5 - i));
    });

    return last6Months.map(monthDate => {
      const monthLabel = format(monthDate, 'MMM');
      const monthRevenue = sales
        .filter(sale => {
          if (!sale.soldAt) return false;
          const saleDate = parseISO(sale.soldAt);
          return isSameMonth(saleDate, monthDate);
        })
        .reduce((acc, s) => acc + (Number(s.price) || 0), 0);
      
      return {
        name: monthLabel,
        revenue: monthRevenue
      };
    });
  }, [sales]);

  if (salesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Aggregating real-time business intelligence...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold mb-2">Showroom Overview</h1>
        <p className="text-muted-foreground">Real-time performance analytics for Amresh Automobiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Sales" value={stats.totalSales.toString()} icon={ShoppingCart} />
        <StatCard title="Pending Inquiries" value={stats.activeInquiries.toString()} icon={Users} />
        <StatCard title="Inventory Models" value={stats.inventory.toString()} icon={Package} />
        <StatCard title="Total Revenue" value={stats.revenue} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Branch */}
        <Card className="bg-card/40 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Revenue by Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1e202e', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#708FFF' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#708FFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className="bg-card/40 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Monthly Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e202e', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#24C0FF" strokeWidth={3} dot={{ r: 4, fill: '#24C0FF' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Models */}
        <Card className="bg-card/40 border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Top Selling Scooter Models
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="h-[300px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topModelsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topModelsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e202e', border: '1px solid #333', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Market Share Breakdown</h4>
              <div className="space-y-3">
                {topModelsData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value} Sold</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <Card className="bg-card/40 border-white/5">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
