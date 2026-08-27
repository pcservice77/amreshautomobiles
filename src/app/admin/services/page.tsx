
"use client"

import { useState } from 'react';
import { Search, Calendar, Phone, CheckCircle2, Clock, XCircle, Wrench, Bike, User, FileText } from 'lucide-react';
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

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const baseRef = collection(firestore, 'service-bookings');
    if (user.role === 'branch_admin' && user.assignedBranchId) {
      return query(baseRef, where('branchId', '==', user.assignedBranchId));
    }
    return baseRef;
  }, [firestore, user]);

  const { data: services, loading } = useCollection(servicesQuery);

  const handleUpdateStatus = async (service: any, status: string) => {
    if (!firestore) return;
    const serviceRef = doc(firestore, 'service-bookings', service.id);
    
    updateDoc(serviceRef, { status })
      .then(() => {
        toast({ title: 'Service Updated', description: `Status changed to ${status}.` });
      })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: serviceRef.path, operation: 'update' })));
  };

  const filteredServices = services?.filter(s => 
    s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile?.includes(search) ||
    s.chassisNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.serviceNo?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime());

  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Service & Repairs</h1>
          <p className="text-muted-foreground">Manage incoming vehicle maintenance requests and tech logs.</p>
        </div>
        <Wrench className="h-10 w-10 text-primary opacity-20" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by ID, customer, mobile or chassis..." 
          className="pl-10 h-12" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Service #</TableHead>
              <TableHead>Customer Details</TableHead>
              <TableHead>Vehicle & KM</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Preferred Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-20 text-center">Syncing service queue...</TableCell></TableRow>
            ) : filteredServices?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-20 text-center text-muted-foreground">No service requests found.</TableCell></TableRow>
            ) : filteredServices?.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-mono text-primary font-bold text-xs">
                  {service.serviceNo || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" /> {service.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col gap-1 mt-1">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {service.mobile}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold flex items-center gap-2">
                    <Bike className="h-3 w-3" /> {service.model}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Chassis: {service.chassisNumber}</div>
                  <Badge variant="outline" className="mt-1 text-[9px] bg-white/5">{service.currentKm} KM</Badge>
                </TableCell>
                <TableCell>
                   <span className="text-sm font-medium">{service.serviceType}</span>
                   {service.notes && <div className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{service.notes}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-primary" /> 
                    {format(new Date(service.preferredDate), 'dd MMM yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {service.preferredTime}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[service.status] || ''}>
                    {service.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {service.status === 'pending' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10" onClick={() => handleUpdateStatus(service, 'confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {service.status === 'confirmed' && (
                      <Button variant="outline" size="sm" className="h-8 text-xs border-green-500/20 text-green-500 hover:bg-green-500/10" onClick={() => handleUpdateStatus(service, 'completed')}>
                        Finish
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(service.status) && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleUpdateStatus(service, 'cancelled')}>
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
