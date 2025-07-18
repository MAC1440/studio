
import { auth, db } from './config';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user';
};

export async function createUser(args: CreateUserArgs, adminUid: string): Promise<User> {
    if (!args.password) {
        throw new Error("Password is required to create a user.");
    }

    // Create a temporary, secondary Firebase app instance.
    // This allows us to create a new user without affecting the currently logged-in admin's session.
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
            avatarUrl: `https://i.pravatar.cc/150?u=${user.uid}`
        };

        // Add a new document in collection "users"
        await setDoc(doc(db, "users", user.uid), newUser);
        
        // Sign out the newly created user from the secondary app instance
        await signOut(secondaryAuth);
        
        return newUser;
    } catch (error) {
        // Re-throw the error to be caught by the calling function
        throw error;
    } finally {
        // Clean up the secondary app instance
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
        // You can handle specific errors here if needed
        console.error("Password reset error:", error);
        throw new Error("Could not send password reset email. Please ensure the email address is correct.");
    }
}
