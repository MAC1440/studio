// src/lib/firebase/admin.ts
'use server';

import * as admin from 'firebase-admin';
import type { SupportTicket, User } from '@/lib/types';
import type { firestore as adminFirestore } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createOrganization } from './organizations';
import { setDoc, doc } from 'firebase/firestore';
import { db } from './config';
import { sendPasswordResetEmail } from 'firebase/auth';


// Check if the required environment variables are set
const hasRequiredEnvVars =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!admin.apps.length) {
  if (hasRequiredEnvVars) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // The private key must be formatted correctly.
          // In your .env file, it should be a single line string with newlines represented as \\n
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
            ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined,
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  } else {
    console.warn(
      'Firebase admin initialization skipped. Missing one or more required environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.'
    );
  }
}


// Export auth only if the app was initialized
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;

type CreateUserArgs = {
    email: string;
    password?: string;
    name: string;
    role: 'admin' | 'user' | 'client';
    organizationId?: string;
};


// This function is now a server action that uses the Admin SDK.
export async function createUser(args: CreateUserArgs): Promise<User> {
    if (!adminAuth) {
        throw new Error("Admin SDK not initialized.");
    }
    
    const isInvite = args.role === 'client' || args.role === 'user';
    let password = args.password;

    if (!password) {
        if(isInvite){
            password = Math.random().toString(36).slice(-8);
        } else {
           throw new Error("Password is required for self-signup.");
        }
    }

    const userRecord = await adminAuth.createUser({
        email: args.email,
        password: password,
        displayName: args.name,
    });
    
    // For invited users (clients/team), immediately send a password reset link
    if (isInvite) {
        const resetLink = await adminAuth.generatePasswordResetLink(args.email);
        // Here you would typically use an email service (like Resend, SendGrid) to send the link.
        // For simplicity, we'll log it. In a real app, this should send an email.
        console.log(`Password reset link for ${args.email}: ${resetLink}`);
    }

    const newUser: User = {
        id: userRecord.uid,
        name: args.name,
        email: args.email,
        role: args.role,
        organizationId: args.organizationId || '',
        avatarUrl: userRecord.photoURL,
    };
    
    // Pre-create the user document in Firestore.
    // We use the client 'db' here because setDoc is simpler and security rules will allow it
    // assuming an admin is performing this action. This avoids circular dependencies.
    if (args.organizationId) {
         await setDoc(doc(db, "users", userRecord.uid), newUser);
    }
    
    return newUser;
}
