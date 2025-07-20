
import { auth, db } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

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
    
    // Check if the app is already initialized to prevent errors
    const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(secondaryAppConfig, secondaryAppName);
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
        
        // No need to sign out from the secondary app auth instance
        
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

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
}

export async function getUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol);
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
    // This function now only deletes the user from the Firestore database.
    // The user's authentication account will remain in Firebase Authentication.
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}
