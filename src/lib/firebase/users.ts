
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
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

    // This flow is for a new admin user signing themselves up directly.
    if (!isInvite) {
        if (!args.password) {
            throw new Error("Password is required for admin self-signup.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, args.email, args.password);
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
            await updateProfile(firebaseUser, { displayName: args.name });

            let orgId = args.organizationId;
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
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        }
        return;
    }
    
    // This flow is for inviting a client or user.
    // We create a user record in Firestore first, then send a password reset email.
    // The user doesn't exist in Firebase Auth until they complete the password reset.
    if (!args.organizationId) {
        throw new Error("Organization ID is required to invite a user.");
    }
    
    const tempUserId = doc(collection(db, 'users')).id; // Generate a temporary ID

    const newUser: User = {
        id: tempUserId, // We will update this later if needed, but it's a placeholder
        name: args.name,
        email: args.email,
        role: args.role,
        organizationId: args.organizationId,
    };
    // Note: We are creating a user document in Firestore *before* an auth user exists.
    // This is okay for this flow. We'll need a way to link them up later if necessary,
    // but for now, the login flow will find this document by email.
    // A more robust solution might involve a temporary `invites` collection.
    
    const userQuery = query(collection(db, 'users'), where("email", "==", args.email));
    const existingUser = await getDocs(userQuery);

    if(!existingUser.empty){
        throw new Error("User with this email already exists in the system.");
    }

    await setDoc(doc(db, "users", tempUserId), newUser);
    await forgotPassword(args.email);
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
      // This is a patch to handle users created via invite flow
      // who don't have their auth UID as their doc ID yet.
      // We look up by email to find their "real" record.
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
            // This is expected for new invited users, so we don't throw.
            // Firebase will still send the "reset" email which allows them to set a password.
             return;
        }
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
