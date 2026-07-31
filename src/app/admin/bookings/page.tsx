
"use client"

import { useState } from 'react';
import { Search, Calendar, User, Phone, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function BookingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const baseRef = collection(firestore, 'bookings');
    if (user.role === 'branch_admin' && user.assignedBranchId) {
      return query(baseRef, where('branchId', '==', user.assignedBranchId));
    }
    return baseRef;
  }, [firestore, user]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const { data: bookings, loading } = useCollection(bookingsQuery);
  const { data: branches } = useCollection(branchesQuery);

  const handleUpdateStatus = (bookingId: string, status: string) => {
    if (!firestore) return;
    const bookingRef = doc(firestore, 'bookings', bookingId);
    updateDoc(bookingRef, { status })
      .then(() => toast({ title: 'Booking Updated', description: `Status changed to ${status}.` }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: bookingRef.path, operation: 'update' })));
  };

  const filteredBookings = bookings?.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.mobile.includes(search) ||
    b.scooterModel.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime());

  const getBranchName = (id: string) => branches?.find(b => b.id === id)?.name || 'Unknown Branch';

  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Test Ride Appointments</h1>
        <p className="text-muted-foreground">Manage customer test ride requests for your showroom.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search bookings by customer, mobile or model..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Scooter</TableHead>
              <TableHead>Showroom</TableHead>
              <TableHead>Preferred Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-20 text-center">Loading appointments...</TableCell></TableRow>
            ) : filteredBookings?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-20 text-center text-muted-foreground">No bookings found.</TableCell></TableRow>
            ) : filteredBookings?.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{booking.customerName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {booking.mobile}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{booking.scooterModel}</TableCell>
                <TableCell>
                  <div className="text-sm">{getBranchName(booking.branchId)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-primary" /> 
                    {format(new Date(booking.preferredDate), 'dd MMM yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {booking.preferredTime}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[booking.status] || ''}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {booking.status === 'pending' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-green-500/20 text-green-500 hover:bg-green-500/10" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
                        Complete
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
