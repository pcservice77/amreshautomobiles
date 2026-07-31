
"use client"

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ScooterForm } from '@/components/admin/scooter-form';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const firestore = useFirestore();
  const scootersQuery = firestore ? collection(firestore, 'scooters') : null;
  const { data: scooters, loading } = useCollection(scootersQuery);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const handleAddScooter = async (data: any) => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'scooters'), {
        ...data,
        features: data.features || ['Standard Features']
      });
      setIsAddOpen(false);
      toast({
        title: 'Scooter Added',
        description: `${data.model} has been added to the showroom.`,
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add scooter.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to remove this model?')) {
      try {
        await deleteDoc(doc(firestore, 'scooters', id));
        toast({
          title: 'Scooter Removed',
          description: 'The model was deleted from inventory.',
        });
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete scooter.' });
      }
    }
  };

  const filteredScooters = scooters?.filter(s => 
    (s.model as string).toLowerCase().includes(search.toLowerCase())
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
          <DialogContent className="max-w-2xl bg-card">
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
            className="pl-10" 
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
