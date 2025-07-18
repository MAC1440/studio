
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User } from '@/lib/types';
import { getUsers } from '@/lib/firebase/users';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  users: User[];
  ticketReloadKey: number;
  reloadTickets: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketReloadKey, setTicketReloadKey] = useState(0);
  const router = useRouter();

  const reloadTickets = useCallback(() => {
    setTicketReloadKey(oldKey => oldKey + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const [userDocSnap, allUsers] = await Promise.all([
          getDoc(userDocRef),
          getUsers()
        ]);
        
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as User);
        } else {
            setUserData(null);
        }
        setUsers(allUsers);
      } else {
        setUser(null);
        setUserData(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user) {
        throw new Error("Login failed: no user returned");
    }
  };


  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, users, ticketReloadKey, reloadTickets }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
