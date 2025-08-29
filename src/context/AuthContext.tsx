
// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { Organization, Project, User } from '@/lib/types';
import { getUsers, updateUserProfile } from '@/lib/firebase/users';
import { createOrganization, getOrganization } from '@/lib/firebase/organizations';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/lib/firebase/projects';


interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  organization: Organization | null;
  isOrgLoading: boolean;
  projects: Project[];
  activeProjectIds: string[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
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
  const [isOrgLoading, setIsOrgLoading] = useState(true);
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
      
      // Data migration for users without an organizationId
      if (!userDataFromDb.organizationId) {
        console.log(`User ${firebaseUser.uid} is missing an organization. Creating one now.`);
        const newOrg = await createOrganization({ name: `${userDataFromDb.name}'s Workspace`, ownerId: firebaseUser.uid });
        await updateUserProfile(firebaseUser.uid, { organizationId: newOrg.id });
        userDataFromDb.organizationId = newOrg.id;
      }
      
      // Data migration for users without an avatarUrl
      if (!userDataFromDb.avatarUrl) {
          console.log(`User ${firebaseUser.uid} is missing an avatar. Creating one now.`);
          const newAvatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userDataFromDb.name)}`;
          await updateUserProfile(firebaseUser.uid, { avatarUrl: newAvatarUrl });
          userDataFromDb.avatarUrl = newAvatarUrl;
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
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || 'New User')}`
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      
      setUserData(newUser);
      return newUser;
    }
  }, []);

  useEffect(() => {
    // This effect only handles the silent authentication state changes.
    // The explicit sign-in with link action is handled on the login page.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const currentUserData = await fetchAndSetUserData(firebaseUser);
        
        if (currentUserData?.organizationId) {
            setIsOrgLoading(true);
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
            setIsOrgLoading(false);

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
    // The onAuthStateChanged listener will handle fetching data, but we need to wait
    // for the user data to be available before returning, especially for redirects.
    return await fetchAndSetUserData(userCredential.user);
  };

  const signup = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    if (!firebaseUser) {
      throw new Error("Signup failed: no user returned from Firebase");
    }
    
    // Create new organization for this user
    const newOrg = await createOrganization({
      name: `${name}'s Workspace`,
      ownerId: firebaseUser.uid,
    });
    
    // Create the user document in Firestore
    const newUserDoc: User = {
      id: firebaseUser.uid,
      name,
      email,
      role: 'admin',
      organizationId: newOrg.id,
      avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
    
    // After signup, force a refetch of all data.
    forceRefetch();
  };
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout, users, ticketReloadKey, reloadTickets, forceRefetch, organization, isOrgLoading, projects, activeProjectIds }}>
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
