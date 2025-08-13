
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
};


// This function will now ONLY create the user in the auth system.
// The user document and organization creation will be handled by the AuthContext
// after the user has logged in for the first time.
export async function createUser(args: CreateUserArgs): Promise<User> {
    const isInvite = args.role === 'client' || args.role === 'user';
    
    let password = args.password;
    // For any invited user (client or internal), we auto-generate a password and send a reset link.
    if (!password) {
        if(isInvite){
            password = Math.random().toString(36).slice(-8);
        } else {
           throw new Error("Password is required for self-signup.");
        }
    }
    
    // We use a temporary, secondary Firebase app to create the user.
    // This allows us to create a new user without logging out the current admin user.
    const secondaryAppConfig = auth.app.options;
    const secondaryAppName = `secondary-app-${Date.now()}`;
    const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(secondaryAppConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, args.email, password);
        const user = userCredential.user;

        // If it's an invitation, send a password reset email immediately.
        if (isInvite) {
            await sendPasswordResetEmail(auth, args.email);
        }

        const newUser: User = {
            id: user.uid,
            name: args.name,
            email: args.email,
            role: args.role,
            organizationId: args.organizationId || '', 
        };
        
        // Pre-create the user document for all invited users so they exist in the system before first login.
        if (args.organizationId) {
             await setDoc(doc(db, "users", user.uid), newUser);
        }
        
        return newUser;
    } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
    } finally {
        if (getApps().some(app => app.name === secondaryAppName)) {
           await deleteApp(secondaryApp);
        }
    }
}


export async function getUsers(organizationId?: string): Promise<User[]> {
    if (!organizationId) {
        console.warn("getUsers called without organizationId");
        return [];
    }
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('organizationId', '==', organizationId));
    const userSnapshot = await getDocs(q);
    const userList = userSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<User, 'id'>;
      return { ...data, id: doc.id };
    });
    return userList;
}

export async function forgotPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Password reset error:", error);
        throw new Error("Could not send password reset email. Please ensure the email address is correct.");
    }
}

export async function deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    // Note: This does NOT delete the user from Firebase Authentication.
    // For a production app, you would want to use a Cloud Function to do that
    // to ensure you don't leave orphaned auth accounts.
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}

    
