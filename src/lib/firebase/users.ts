
import { auth, db, storage } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
};

export async function createUser(args: CreateUserArgs): Promise<User> {
    const isClientInvite = args.role === 'client';
    if (!args.password) {
        if(isClientInvite){
            // We can proceed, will auto-generate password
        } else {
           throw new Error("Password is required to create a user.");
        }
    }
    
    // For clients, we generate a password because they will set their own via the reset link.
    const password = args.password || Math.random().toString(36).slice(-8);

    // Use a temporary, secondary Firebase app instance to create the user.
    // This prevents the current admin from being signed out.
    const secondaryAppConfig = auth.app.options;
    const secondaryAppName = `secondary-app-${Date.now()}`;
    const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(secondaryAppConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, args.email, password);
        const user = userCredential.user;

        const newUser: User = {
            id: user.uid,
            name: args.name,
            email: args.email,
            role: args.role,
            avatarUrl: `https://placehold.co/150x150.png`
        };

        await setDoc(doc(db, "users", user.uid), newUser);
        
        // If it's a client, send them a password reset email which acts as a "welcome" email.
        if (isClientInvite) {
            await sendPasswordResetEmail(auth, args.email);
        }
        
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


export async function uploadAvatar(userId: string, file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
        throw new Error("File is not an image.");
    }

    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}
