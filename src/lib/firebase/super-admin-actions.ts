
'use server';

import { db } from './config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { User } from '@/lib/types';


export async function getSuperAdmins(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '==', 'super-admin'));
    const userSnapshot = await getDocs(q);
    const userList = userSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<User, 'id'>;
        return { ...data, id: doc.id };
    });
    return userList;
}

