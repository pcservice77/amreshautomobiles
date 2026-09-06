
"use client"

import { useState } from 'react';
import { Search, Calendar, Phone, CheckCircle2, Clock, XCircle, Wrench, Bike, User, FileText, PlusCircle, Eye, Printer, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Zap } from 'lucide-react';

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const baseRef = collection(firestore, 'service-bookings');
    if (user.role === 'branch_admin' && user.assignedBranchId) {
      return query(baseRef, where('branchId', '==', user.assignedBranchId));
    }
    return baseRef;
  }, [firestore, user]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const showroomRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'showroom');
  }, [firestore]);

  const { data: services, loading } = useCollection(servicesQuery);
  const { data: branches } = useCollection(branchesQuery);
  const { data: showroom } = useDoc(showroomRef);

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

  const currentBranch = selectedService ? branches?.find(b => b.id === selectedService.branchId) : null;
  const showroomName = currentBranch?.name || showroom?.name || 'AMRESH AUTOMOBILE';
  const showroomAddress = currentBranch?.address || showroom?.address;
  const showroomLogo = currentBranch?.imageUrl || showroom?.logoUrl;
  const showroomGstin = currentBranch?.gstin || showroom?.gstin;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-3xl font-headline font-bold">Garage & Maintenance</h1>
          <p className="text-muted-foreground">Manage scheduled appointments and walk-in service billing.</p>
        </div>
        <Link href="/admin/services/walk-in">
          <Button className="h-12 px-6 gap-2 glow-primary">
            <PlusCircle className="h-5 w-5" /> New Walk-in Service
          </Button>
        </Link>
      </div>

      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by Service #, Customer, Mobile or Chassis..." 
          className="pl-10 h-12" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden print:hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Service #</TableHead>
              <TableHead>Customer Details</TableHead>
              <TableHead>Vehicle & KM</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-20 text-center">Syncing service logs...</TableCell></TableRow>
            ) : filteredServices?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-20 text-center text-muted-foreground">No service records found.</TableCell></TableRow>
            ) : filteredServices?.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-mono text-primary font-bold text-xs">
                  {service.serviceNo || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" /> {service.customerName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{service.mobile}</div>
                </TableCell>
                <TableCell>
                  <div className="font-bold flex items-center gap-2">
                    <Bike className="h-3 w-3" /> {service.model}
                  </div>
                  <Badge variant="outline" className="mt-1 text-[9px] bg-white/5">{service.currentKm} KM</Badge>
                </TableCell>
                <TableCell>
                   <div className="text-sm font-bold">₹ {service.totalAmount?.toLocaleString() || '0'}</div>
                   <div className="text-[9px] text-muted-foreground">{service.parts?.length || 0} Parts Added</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[service.status] || ''}>
                    {service.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedService(service)}>
                      <Eye className="h-4 w-4 mr-2" /> Bill
                    </Button>
                    {service.status !== 'completed' && (
                      <Link href={`/admin/services/walk-in?id=${service.id}`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary">
                          <CreditCard className="h-4 w-4 mr-2" /> Process
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Service Invoice Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-[210mm] w-full max-h-[95vh] overflow-y-auto bg-white text-black p-0 border-none print:max-h-none print:fixed print:inset-0 print:m-0 print:w-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Service Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="print-container relative bg-white p-[20mm] text-black">
            <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
              <div className="flex gap-4">
                <div className="bg-primary p-2 rounded-xl h-16 w-16 flex items-center justify-center relative overflow-hidden">
                  {showroomLogo ? (
                    <Image src={showroomLogo} alt="Logo" fill className="object-cover" unoptimized />
                  ) : (
                    <Zap className="h-8 w-8 text-white fill-current" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-primary uppercase">{showroomName}</h1>
                  <p className="text-[10px] text-gray-500 font-bold italic mb-1">Drive Electric • Live Smart</p>
                  <p className="text-[9px] text-gray-500 leading-tight max-w-[250px]">{showroomAddress}</p>
                  <p className="text-[10px] text-gray-800 font-bold mt-1">GSTIN: {showroomGstin || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-black">SERVICE BILL</h2>
                <p className="text-sm font-bold text-primary">{selectedService?.serviceNo}</p>
                <p className="text-xs text-gray-400">{selectedService?.preferredDate ? format(new Date(selectedService.preferredDate), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Customer</p>
                <p className="text-lg font-black uppercase">{selectedService?.customerName}</p>
                <p className="text-xs font-bold text-gray-600">Mob: {selectedService?.mobile}</p>
              </div>
              <div className="border border-black p-4 rounded-xl">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Vehicle Details</p>
                <p className="text-lg font-black uppercase text-primary">{selectedService?.model}</p>
                <p className="text-xs font-bold">Chassis: {selectedService?.chassisNumber}</p>
                <p className="text-xs font-bold">Odometer: {selectedService?.currentKm} KM</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-black mb-8">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-black p-2 text-left">Job Description / Part Name</th>
                  <th className="border border-black p-2 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-3 align-top">
                    <p className="font-bold uppercase">{selectedService?.serviceType} Service Charge</p>
                    <p className="text-[10px] text-gray-500">Professional labor and diagnostics</p>
                  </td>
                  <td className="border border-black p-3 text-right font-bold align-top">₹ {selectedService?.laborCharge?.toLocaleString() || '0'}.00</td>
                </tr>
                {selectedService?.parts?.map((part: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black p-3 align-top">
                      <p className="font-medium uppercase">{part.name}</p>
                      <p className="text-[10px] text-gray-400 italic">Spare part replacement</p>
                    </td>
                    <td className="border border-black p-3 text-right font-bold align-top">₹ {part.price?.toLocaleString()}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-1/3 bg-gray-50 p-4 border-2 border-black rounded-xl h-fit">
                <div className="flex justify-between font-bold text-xs mb-2"><span>Subtotal</span> <span>₹ {selectedService?.totalAmount?.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-lg border-t border-black pt-2"><span>TOTAL BILL</span> <span>₹ {selectedService?.totalAmount?.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="mt-20 flex justify-between items-end">
              <div className="text-center">
                <div className="w-40 border-t border-gray-300 mb-1"></div>
                <p className="text-[10px] font-bold">Customer Signature</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase mb-10 text-primary">For {showroomName}</p>
                <div className="w-56 border-t-2 border-black mb-1"></div>
                <p className="text-[10px] font-bold">Service In-Charge</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3 no-print bg-secondary">
             <Button className="gap-2 h-12" onClick={() => window.print()}>
               <Printer className="h-4 w-4" /> Print Service Bill
             </Button>
             <Button variant="outline" className="h-12" onClick={() => setSelectedService(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
