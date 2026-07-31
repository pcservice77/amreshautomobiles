
"use client"

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ScooterForm } from '@/components/admin/scooter-form';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

export default function InventoryPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScooter, setEditingScooter] = useState<any>(null);
  const [search, setSearch] = useState('');

  const scootersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'scooters');
  }, [firestore]);

  const { data: scooters, loading } = useCollection(scootersQuery);

  const handleSaveScooter = async (data: any) => {
    if (!firestore) return;
    
    const scooterData = {
      ...data,
      features: data.features || ['Standard Features']
    };

    setIsDialogOpen(false);
    
    if (editingScooter) {
      const scooterRef = doc(firestore, 'scooters', editingScooter.id);
      setDoc(scooterRef, scooterData, { merge: true })
        .then(() => {
          toast({
            title: 'Model Updated',
            description: `${data.model} has been updated successfully.`,
          });
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: scooterRef.path,
            operation: 'update',
            requestResourceData: scooterData,
          }));
        });
    } else {
      addDoc(collection(firestore, 'scooters'), scooterData)
        .then(() => {
          toast({
            title: 'Model Added',
            description: `${data.model} has been added to inventory.`,
          });
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'scooters',
            operation: 'create',
            requestResourceData: scooterData,
          }));
        });
    }
    
    setEditingScooter(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firestore || !id) return;
    
    if (confirm('Are you sure you want to remove this model from inventory? This cannot be undone.')) {
      const docRef = doc(firestore, 'scooters', id);
      deleteDoc(docRef)
        .then(() => {
          toast({
            title: 'Model Removed',
            description: 'The scooter has been deleted from records.',
          });
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          }));
        });
    }
  };

  const openAddDialog = () => {
    setEditingScooter(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (scooter: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingScooter(scooter);
    setIsDialogOpen(true);
  };

  const filteredScooters = (scooters || []).filter(s => 
    (s.model as string || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Inventory Controller</h1>
          <p className="text-muted-foreground">Manage your showroom fleet and specifications.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingScooter(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Add New Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-white/10 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingScooter ? `Edit ${editingScooter.model}` : 'Add Scooter to Showroom'}
              </DialogTitle>
            </DialogHeader>
            <ScooterForm 
              initialData={editingScooter} 
              onSubmit={handleSaveScooter} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search models..." 
            className="pl-10 border-white/10 text-foreground" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-foreground">Loading inventory...</TableCell>
              </TableRow>
            ) : filteredScooters.length > 0 ? (
              filteredScooters.map((scooter) => (
                <TableRow key={scooter.id} className="hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                      {scooter.images && scooter.images.length > 0 ? (
                        <Image src={scooter.images[0]} alt={scooter.model} fill className="object-cover" unoptimized />
                      ) : (
                        <Package className="h-full w-full p-2 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {scooter.model}
                  </TableCell>
                  <TableCell className="text-foreground">{scooter.range}</TableCell>
                  <TableCell className="text-primary font-bold">{scooter.price}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                        onClick={(e) => openEditDialog(scooter, e)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDelete(scooter.id, e)}
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
