
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { deleteUserFromAuth } from '@/app/actions';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user';
};

export async function createUser(args: CreateUserArgs): Promise<User> {
    if (!args.password) {
        throw new Error("Password is required to create a user.");
    }

    const secondaryAppConfig = auth.app.options;
    const secondaryAppName = `secondary-app-${Date.now()}`;
    const secondaryApp = initializeApp(secondaryAppConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, args.email, args.password);
        const user = userCredential.user;

        const newUser: User = {
            id: user.uid,
            name: args.name,
            email: args.email,
            role: args.role,
            avatarUrl: `https://placehold.co/150x150.png`
        };

        await setDoc(doc(db, "users", user.uid), newUser);
        
        await signOut(secondaryAuth);
        
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


export async function getUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol);
    const userSnapshot = await getDocs(q);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
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
    // First, delete the user from Firestore.
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Then, call the server action to delete the user from Firebase Auth.
    const result = await deleteUserFromAuth(userId);

    if (!result.success) {
      // If deleting from Auth fails, we should ideally re-create the Firestore document
      // to avoid an inconsistent state, but for now, we'll just throw the error.
      // A more robust implementation could use a transactional approach or a retry mechanism.
      throw new Error(`Failed to delete user from Authentication: ${result.error}`);
    }
}
