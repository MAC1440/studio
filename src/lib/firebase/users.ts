
import { auth, db, storage } from './config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from '@/lib/types';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { createOrganization } from './organizations';

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
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
    
    const password = args.password || Math.random().toString(36).slice(-8);

    const secondaryAppConfig = auth.app.options;
    const secondaryAppName = `secondary-app-${Date.now()}`;
    const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(secondaryAppConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, args.email, password);
        const user = userCredential.user;

        let organizationId = args.organizationId;
        // If it's a new admin, create a new organization for them.
        if (args.role === 'admin' && !organizationId) {
            const newOrg = await createOrganization({ name: `${args.name}'s Workspace`, ownerId: user.uid });
            organizationId = newOrg.id;
        }

        if (!organizationId) {
            throw new Error("User must be associated with an organization.");
        }


        const newUser: User = {
            id: user.uid,
            name: args.name,
            email: args.email,
            role: args.role,
            organizationId: organizationId,
            avatarUrl: `https://placehold.co/150x150.png`
        };

        await setDoc(doc(db, "users", user.uid), newUser);
        
        if (isClientInvite) {
            await sendPasswordResetEmail(auth, args.email);
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
    const usersCol = collection(db, 'users');
    const q = organizationId ? query(usersCol, where('organizationId', '==', organizationId)) : query(usersCol);
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
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}
