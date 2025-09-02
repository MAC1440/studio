
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where, writeBatch, arrayRemove } from 'firebase/firestore';
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
            avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(args.name)}`,
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
    // Use the primary auth instance for password resets
    const primaryAuth = getAuth();
    try {
        await sendPasswordResetEmail(primaryAuth, email);
    } catch (error: any) {
        console.error("Password reset error:", error);
        throw new Error("Could not send password reset email. Please ensure the email address is correct.");
    }
}

export async function deleteUser(userId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Delete the user document
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);

    // 2. Delete all invoices for this client
    const invoicesQuery = query(collection(db, 'invoices'), where('clientId', '==', userId));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    invoicesSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // 3. Delete all proposals for this client
    const proposalsQuery = query(collection(db, 'proposals'), where('clientId', '==', userId));
    const proposalsSnapshot = await getDocs(proposalsQuery);
    proposalsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 4. Delete all notifications for this user
    const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // 5. Remove user from all projects they are assigned to
    const projectsQuery = query(collection(db, 'projects'), where('clientIds', 'array-contains', userId));
    const projectsSnapshot = await getDocs(projectsQuery);
    projectsSnapshot.forEach(projectDoc => {
        batch.update(projectDoc.ref, {
            clientIds: arrayRemove(userId)
        });
    });

    // Note: Chat history is not deleted to preserve context for the admin team.
    // The user will lose access once their account is deleted.

    await batch.commit();

    // The user's actual auth account is not deleted from Firebase Auth here.
    // This only removes them from the application database.
    // This is often desired behavior to prevent a user from immediately re-signing up.
}


export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}

export async function getAllUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<User, 'id'>;
      return { ...data, id: doc.id };
    });
    return userList;
}
