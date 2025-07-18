
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, getAuth, type User as FirebaseUser } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user';
};

// IMPORTANT: This implementation has a limitation. It only creates a user record in Firestore
// and an authentication entry. It does not provide a secure way to delete the user
// from Firebase Authentication from the client-side, as that requires admin privileges
// typically handled by a backend server (e.g., Firebase Functions).

export async function createUser(args: CreateUserArgs): Promise<User> {
    if (!args.password) {
        throw new Error("Password is required to create a user.");
    }

    // Create a temporary, secondary Firebase app instance to create a user
    // without logging out the current admin.
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

        // Add a new document in the "users" collection in Firestore
        await setDoc(doc(db, "users", user.uid), newUser);
        
        // Sign out the newly created user from the temporary auth instance
        await signOut(secondaryAuth);
        
        return newUser;
    } catch (error) {
        console.error("Error in createUser:", error);
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
        console.error("Password reset error:", error);
        throw new Error("Could not send password reset email. Please ensure the email address is correct.");
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        // Note: This does NOT delete the user from Firebase Authentication.
        // A secure implementation for that would require a backend function.
    } catch (error) {
        console.error("Error deleting user from Firestore: ", error);
        throw new Error("Failed to delete user record.");
    }
}
