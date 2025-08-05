
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
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
  users: User[];
  ticketReloadKey: number;
  reloadTickets: () => void;
  forceRefetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketReloadKey, setTicketReloadKey] = useState(0);
  const [refetchKey, setRefetchKey] = useState(0);
  const router = useRouter();

  const reloadTickets = useCallback(() => {
    setTicketReloadKey(oldKey => oldKey + 1);
  }, []);

  const forceRefetch = useCallback(() => {
    setRefetchKey(oldKey => oldKey + 1);
  }, []);
  
  const fetchAndSetUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as User;
      setUserData(userData);
      return userData;
    } else {
      // User data not found in Firestore. This can happen for a new user.
      // The calling function should handle this case, e.g., by creating the user document.
      console.warn(`User document not found for UID: ${firebaseUser.uid}`);
      setUserData(null);
      return null;
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchAndSetUserData(firebaseUser);
        const allUsers = await getUsers();
        setUsers(allUsers);
      } else {
        setUser(null);
        setUserData(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetUserData, refetchKey]);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user) {
        throw new Error("Login failed: no user returned");
    }
    // Fetch and return user data immediately after login to ensure it's available for routing.
    return fetchAndSetUserData(userCredential.user);
  };


  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, users, ticketReloadKey, reloadTickets, forceRefetch }}>
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
