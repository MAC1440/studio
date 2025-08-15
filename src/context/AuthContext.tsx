
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User, Organization, Project } from '@/lib/types';
import { getUsers, updateUserProfile } from '@/lib/firebase/users';
import { createOrganization, getOrganization } from '@/lib/firebase/organizations';
import { getProjects } from '@/lib/firebase/projects';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  organization: Organization | null;
  projects: Project[];
  activeProjectIds: string[];
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);
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
      console.log("New user detected, creating Firestore user document and organization...");
      const newOrg = await createOrganization({ name: `${firebaseUser.displayName || firebaseUser.email}'s Workspace`, ownerId: firebaseUser.uid });
      
      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'New User',
        email: firebaseUser.email!,
        role: 'admin',
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
        
        if (currentUserData?.organizationId) {
            const [orgData, projectData, allUsers] = await Promise.all([
                getOrganization(currentUserData.organizationId),
                getProjects(currentUserData.organizationId),
                getUsers(currentUserData.organizationId)
            ]);

            setOrganization(orgData);
            setUsers(allUsers);
            
            const sortedProjects = projectData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setProjects(sortedProjects);

            const plan = orgData?.subscriptionPlan || 'free';
            const limits = { free: 3, startup: 10, pro: Infinity };
            const limit = limits[plan];
            
            const activeIds = sortedProjects.slice(0, limit).map(p => p.id);
            setActiveProjectIds(activeIds);

        }
      } else {
        setUser(null);
        setUserData(null);
        setOrganization(null);
        setProjects([]);
        setUsers([]);
        setActiveProjectIds([]);
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
    return await fetchAndSetUserData(userCredential.user);
  };


  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, users, ticketReloadKey, reloadTickets, forceRefetch, organization, projects, activeProjectIds }}>
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
