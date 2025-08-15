

import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, sendSignInLinkToEmail } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { createOrganization } from './organizations';


type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
};


// This function is now client-safe and uses the client SDK.
// It's intended to be called from client components.
export async function createUser(args: CreateUserArgs): Promise<void> {
    const isInvite = args.role === 'client' || args.role === 'user';
    let password = args.password;

    if (!password && isInvite) {
        // This flow is for inviting a user who will set their own password via an email link.
        const actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this
            // URL must be in the authorized domains list in the Firebase Console.
            url: `https://boardr.vercel.app/login`,
            handleCodeInApp: true, // This must be true.
        };

        // When a user is invited, we store their intended role and organization
        // in a temporary 'invites' collection. When they click the link and
        // sign in for the first time, we'll use this data to create their real user document.
        await setDoc(doc(db, "invites", args.email), {
            name: args.name,
            email: args.email,
            role: args.role,
            organizationId: args.organizationId,
        });

        await sendSignInLinkToEmail(auth, args.email, actionCodeSettings);
        
        // We also store the email locally so the app can recognize the user
        // when they return from the email link.
        window.localStorage.setItem('emailForSignIn', args.email);
        return;
    }

    if (!password) {
        throw new Error("Password is required for self-signup.");
    }
    
    // This flow is for a user signing themselves up directly.
    const userCredential = await createUserWithEmailAndPassword(auth, args.email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: args.name });

        let orgId = args.organizationId;
        // If it's a new admin signing up, create an organization for them.
        if (args.role === 'admin' && !orgId) {
            const newOrg = await createOrganization({ name: `${args.name}'s Workspace`, ownerId: firebaseUser.uid });
            orgId = newOrg.id;
        }

        const newUser: User = {
            id: firebaseUser.uid,
            name: args.name,
            email: args.email,
            role: args.role,
            organizationId: orgId!,
            avatarUrl: firebaseUser.photoURL,
        };

        // Create the user document in Firestore.
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
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

export async function getAllUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
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
