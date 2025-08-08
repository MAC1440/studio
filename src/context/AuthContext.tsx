
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User } from '@/lib/types';
import { getUsers, updateUserProfile } from '@/lib/firebase/users';
import { createOrganization } from '@/lib/firebase/organizations';
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
  
  const fetchAndSetUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      let userDataFromDb = userDocSnap.data() as User;
      
      // If user has no organizationId, create one for them (data migration)
      if (!userDataFromDb.organizationId) {
        console.log(`User ${firebaseUser.uid} is missing an organization. Creating one now.`);
        const newOrg = await createOrganization({ name: `${userDataFromDb.name}'s Workspace`, ownerId: firebaseUser.uid });
        await updateUserProfile(firebaseUser.uid, { organizationId: newOrg.id });
        userDataFromDb.organizationId = newOrg.id;
      }
      
      setUserData(userDataFromDb);
      return userDataFromDb;
    } else {
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
        const currentUserData = await fetchAndSetUserData(firebaseUser);
        if (currentUserData?.organizationId) {
            const allUsers = await getUsers(currentUserData.organizationId);
            setUsers(allUsers);
        }
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
