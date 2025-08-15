

import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import type { User, Organization } from '@/lib/types';
import { createOrganization } from './organizations';


type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
};

// This function handles creating both new admins (self-signup) and inviting team/clients.
export async function createUser(args: CreateUserArgs): Promise<void> {
    const isInvite = args.role === 'client' || args.role === 'user';

    // --- Flow 1: Admin self-signup ---
    if (!isInvite) {
        if (!args.password) {
            throw new Error("Password is required for admin self-signup.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, args.email, args.password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            await updateProfile(firebaseUser, { displayName: args.name });

            let orgId = args.organizationId;
            // Every new admin signup creates a new organization for them.
            const newOrg = await createOrganization({ name: `${args.name}'s Workspace`, ownerId: firebaseUser.uid });
            orgId = newOrg.id;

            const newUser: User = {
                id: firebaseUser.uid,
                name: args.name,
                email: args.email,
                role: args.role,
                organizationId: orgId!,
                avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(args.name)}`,
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        }
        return;
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
        url: `${window.location.origin}/login`,
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
    
    // This will sign the user in and create their Firebase Auth account.
    const userCredential = await signInWithEmailAndPassword(auth, email, password || ''); // Password can be empty for link sign-in
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
        
        // If a password was provided, update it.
        // This flow is simplified for now. In a real app, you would force password creation.

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
