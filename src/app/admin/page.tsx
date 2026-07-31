
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const data = [
  { name: 'Mon', sales: 2 },
  { name: 'Tue', sales: 4 },
  { name: 'Wed', sales: 3 },
  { name: 'Thu', sales: 7 },
  { name: 'Fri', sales: 5 },
  { name: 'Sat', sales: 8 },
  { name: 'Sun', sales: 6 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold mb-2">Showroom Overview</h1>
        <p className="text-muted-foreground">Welcome back, Amresh. Here's your business at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Sales" value="24" icon={ShoppingCart} trend="+12%" />
        <StatCard title="Active Inquiries" value="142" icon={Users} trend="+8%" />
        <StatCard title="Inventory" value="12 Models" icon={Package} />
        <StatCard title="Revenue" value="₹ 24.5L" icon={TrendingUp} trend="+15%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/40 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e202e', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#708FFF' }}
                  />
                  <Bar dataKey="sales" fill="#708FFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Customer Footfall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e202e', border: '1px solid #333', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#24C0FF" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: string; icon: any; trend?: string }) {
  return (
    <Card className="bg-card/40 border-white/5">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {trend && <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{trend}</span>}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
