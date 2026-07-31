
"use client"

import { useState } from 'react';
import { Search, UserCog, Shield, MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'branches');
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: branches } = useCollection(branchesQuery);

  const handleUpdateUser = (uid: string, data: any) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', uid);
    
    updateDoc(userRef, data)
      .then(() => {
        toast({ title: 'User Updated', description: 'Role or branch assignment saved.' });
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: data
        }));
      });
  };

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-center">Unauthorized. Only Main Admins can access this page.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">User Management</h1>
        <p className="text-muted-foreground">Promote users to Branch Admins and assign them to specific showrooms.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or email..." 
          className="pl-10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card/40 border border-white/5 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Assigned Showroom</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading ? (
              <TableRow><TableCell colSpan={4} className="py-20 text-center">Loading user records...</TableCell></TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-20 text-center text-muted-foreground">No users found.</TableCell></TableRow>
            ) : filteredUsers?.map((u) => (
              <TableRow key={u.id} className={u.uid === currentUser?.uid ? "opacity-50" : ""}>
                <TableCell>
                  <div className="font-medium">{u.name || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <Select 
                    disabled={u.uid === currentUser?.uid}
                    defaultValue={u.role || 'user'} 
                    onValueChange={(val) => handleUpdateUser(u.id, { role: val })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Standard User</SelectItem>
                      <SelectItem value="branch_admin">Branch Admin</SelectItem>
                      <SelectItem value="admin">Main Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.role === 'branch_admin' ? (
                    <Select 
                      defaultValue={u.assignedBranchId || ''} 
                      onValueChange={(val) => handleUpdateUser(u.id, { assignedBranchId: val })}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Assign Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">N/A for this role</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                   {u.role === 'admin' && <Badge className="bg-primary/20 text-primary border-primary/30">System Admin</Badge>}
                   {u.role === 'branch_admin' && <Badge variant="outline" className="text-accent border-accent/30">Sub Admin</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
