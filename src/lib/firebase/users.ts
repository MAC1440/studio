

import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithCredential } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import type { User, Organization } from '@/lib/types';
import { createOrganization } from './organizations';


type CreateUserArgs = {
    email: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
};

// This function handles creating both new admins (self-signup) and inviting team/clients.
export async function createUser(args: CreateUserArgs): Promise<void> {
    const isInvite = args.role === 'client' || args.role === 'user';

    // --- Flow 1: Admin self-signup ---
    if (!isInvite) {
        // This flow is currently not used in the UI, but kept for potential future use.
        // It requires a password to be passed in args.
        throw new Error("Admin self-signup is not currently supported from the client-side.");
    }
    
    // --- Flow 2: Inviting a client or team user ---
    if (!args.organizationId) {
        throw new Error("Organization ID is required to invite a user.");
    }
    
    const userQuery = query(collection(db, 'users'), where("email", "==", args.email));
    const existingUser = await getDocs(userQuery);

    if(!existingUser.empty){
        throw new Error("User with this email already exists in the system.");
    }
    
    // Send a sign-in link to the user.
    const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, args.email, actionCodeSettings);
    
    // We also store the email locally so the app can recognize the user
    // when they return from the email link.
    window.localStorage.setItem('emailForSignIn', args.email);
    
    // Create a temporary "invite" document. This holds the user's role and org
    // so we can assign it to them when they first sign in.
    await setDoc(doc(db, "invites", args.email), {
        name: args.name,
        email: args.email,
        role: args.role,
        organizationId: args.organizationId,
    });
}


export async function completeInvitation(email: string, password?: string): Promise<User | null> {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
        throw new Error("This is not a valid sign-in link.");
    }
    
    // This will sign the user in.
    const userCredential = await signInWithEmailLink(auth, email, window.location.href);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
        // Now, find the invite document to get their role and organization.
        const inviteRef = doc(db, 'invites', email);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            throw new Error("No pending invitation found for this email address.");
        }

        const inviteData = inviteSnap.data();
        await updateProfile(firebaseUser, { displayName: inviteData.name });
        
        const newUser: User = {
            id: firebaseUser.uid,
            name: inviteData.name,
            email: email,
            role: inviteData.role,
            organizationId: inviteData.organizationId,
            avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(inviteData.name)}`,
        };
        
        // Create the permanent user document.
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);

        // Delete the temporary invite document.
        await deleteDoc(inviteRef);
        
        window.localStorage.removeItem('emailForSignIn');

        return newUser;
    }
    
    return null;
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
      const id = doc.id
      return { ...data, id };
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
        if (error.code === 'auth/user-not-found') {
            throw new Error("No account found with this email address.");
        }
        throw new Error("Could not send password reset email. Please try again.");
    }
}

export async function deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}
