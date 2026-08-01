
"use client"

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
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
  
  // AlertDialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
          const permissionError = new FirestorePermissionError({
            path: scooterRef.path,
            operation: 'update',
            requestResourceData: scooterData,
          });
          errorEmitter.emit('permission-error', permissionError);
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
          const permissionError = new FirestorePermissionError({
            path: 'scooters',
            operation: 'create',
            requestResourceData: scooterData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
    
    setEditingScooter(null);
  };

  const executeDelete = () => {
    if (!firestore || !deleteId) return;
    
    const docRef = doc(firestore, 'scooters', deleteId);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Model Removed',
          description: 'Record has been deleted.',
        });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    
    setDeleteId(null);
  };

  const filteredScooters = (scooters || []).filter(s => 
    (s.model as string || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Inventory Controller</h1>
          <p className="text-muted-foreground">Manage showroom models and specifications.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingScooter(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setEditingScooter(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-white/10 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingScooter ? `Edit ${editingScooter.model}` : 'New Scooter Model'}
              </DialogTitle>
              <DialogDescription>
                Fill out the technical specifications and upload photos for the scooter model.
              </DialogDescription>
            </DialogHeader>
            <ScooterForm 
              initialData={editingScooter} 
              onSubmit={handleSaveScooter} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search models..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <TableRow><TableCell colSpan={5} className="text-center py-20">Loading fleet...</TableCell></TableRow>
            ) : filteredScooters.length > 0 ? filteredScooters.map((scooter) => (
              <TableRow key={scooter.id} className="hover:bg-white/5 transition-colors">
                <TableCell>
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                    {scooter.images?.[0] ? (
                      <Image src={scooter.images[0]} alt={scooter.model} fill className="object-cover" unoptimized />
                    ) : (
                      <Package className="h-full w-full p-2 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{scooter.model}</TableCell>
                <TableCell>{scooter.range}</TableCell>
                <TableCell className="text-primary font-bold">{scooter.price}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingScooter(scooter);
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(scooter.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No scooters found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scooter model from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
