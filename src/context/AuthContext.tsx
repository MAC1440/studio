
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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
      // Existing user
      let userDataFromDb = userDocSnap.data() as User;
      
      // Data migration for users without an organizationId, but not for super-admin
      if (!userDataFromDb.organizationId && userDataFromDb.role !== 'super-admin') {
        console.log(`User ${firebaseUser.uid} is missing an organization. Creating one now.`);
        const newOrg = await createOrganization({ name: `${userDataFromDb.name}'s Workspace`, ownerId: firebaseUser.uid });
        await updateUserProfile(firebaseUser.uid, { organizationId: newOrg.id });
        userDataFromDb.organizationId = newOrg.id;
      }
      
      setUserData(userDataFromDb);
      return userDataFromDb;
    } else {
      // This is a new user signing up.
      // The user has been created in Firebase Auth, but not yet in Firestore.
      console.log("New user detected, creating Firestore user document and organization...");
      const newOrg = await createOrganization({ name: `${firebaseUser.displayName || firebaseUser.email}'s Workspace`, ownerId: firebaseUser.uid });
      
      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'New User',
        email: firebaseUser.email!,
        role: 'admin', // New sign-ups are always admins of their own org
        organizationId: newOrg.id,
        avatarUrl: firebaseUser.photoURL || `https://placehold.co/150x150.png`
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      
      setUserData(newUser);
      return newUser;
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const currentUserData = await fetchAndSetUserData(firebaseUser);
        // Do not fetch org-specific users if the user is a super-admin
        if (currentUserData?.organizationId && currentUserData.role !== 'super-admin') {
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
    // The onAuthStateChanged listener will handle fetching data, but we need to wait
    // for the user data to be available before returning, especially for redirects.
    return await fetchAndSetUserData(userCredential.user);
  };


  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    router.push('/login');
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
