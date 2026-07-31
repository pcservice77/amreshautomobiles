"use client"

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ScooterForm } from '@/components/admin/scooter-form';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function InventoryPage() {
  const firestore = useFirestore();
  
  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: scooters, loading } = useCollection(scootersQuery);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const handleAddScooter = async (data: any) => {
    if (!firestore) return;
    
    const scooterData = {
      ...data,
      features: data.features || ['Standard Features']
    };

    setIsAddOpen(false);
    
    addDoc(collection(firestore, 'scooters'), scooterData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'scooters',
          operation: 'create',
          requestResourceData: scooterData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: 'Success',
      description: `${data.model} addition initiated.`,
    });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to remove this model?')) {
      const docRef = doc(firestore, 'scooters', id);
      deleteDoc(docRef)
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
      
      toast({
        title: 'Model Removed',
        description: 'The request to delete the scooter has been sent.',
      });
    }
  };

  const filteredScooters = scooters?.filter(s => 
    (s.model as string || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Inventory Controller</h1>
          <p className="text-muted-foreground">Manage your showroom fleet and specifications.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Add New Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Add Scooter to Showroom</DialogTitle>
            </DialogHeader>
            <ScooterForm onSubmit={handleAddScooter} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search models..." 
            className="pl-10 border-white/10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Charging</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">Loading inventory...</TableCell>
              </TableRow>
            ) : filteredScooters && filteredScooters.length > 0 ? (
              filteredScooters.map((scooter) => (
                <TableRow key={scooter.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-1.5 rounded-md">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      {scooter.model}
                    </div>
                  </TableCell>
                  <TableCell>{scooter.range}</TableCell>
                  <TableCell className="text-primary font-bold">{scooter.price}</TableCell>
                  <TableCell>{scooter.chargingTime || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(scooter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No scooters found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
