'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<(User & UserProfile) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) return;

    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        return onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...firebaseUser, ...(docSnap.data() as UserProfile) });
          } else {
            setUser(firebaseUser as any);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });
  }, [auth, firestore]);

  return { user, loading };
}
