import { auth, db } from './config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, getDocs, query } from 'firebase/firestore';
import type { User } from '@/lib/types';

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
    
    const userCredential = await createUserWithEmailAndPassword(auth, args.email, args.password);
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

    return newUser;
}

export async function getUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol);
    const userSnapshot = await getDocs(q);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    return userList;
}
