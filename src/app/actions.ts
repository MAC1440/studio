
// src/app/actions.ts
'use server';
import dotenv from 'dotenv';
dotenv.config();

import { adminAuth } from '@/lib/firebase/admin';

type SendEmailArgs = {
    to: string;
    subject: string;
    html: string;
}

// This function is not being used, but we'll keep it for potential future use.
// It requires a Resend API key in environment variables.
export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return { success: false, error: 'RESEND_API_KEY not configured.' };
  }
  
  // To use Resend, you would need to install it: npm install resend
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    // const { data, error } = await resend.emails.send({
    //   from: 'KanbanFlow <onboarding@resend.dev>',
    //   to,
    //   subject,
    //   html,
    // });

    // if (error) {
    //   console.error('Resend error:', error);
    //   return { success: false, error: error.message };
    // }

    // return { success: true, data };
    console.log("Email sending is currently disabled. Implement with a service like Resend if needed.");
    return { success: true, data: null };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function deleteUserFromAuth(uid: string) {
    if (!adminAuth) {
      const errorMessage = 'Firebase Admin SDK not initialized. User deletion is disabled. Ensure server environment variables are set correctly.';
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
    try {
        await adminAuth.deleteUser(uid);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user from Firebase Auth:', error);
        const message = error.code === 'auth/user-not-found'
            ? 'User not found in Firebase Authentication.'
            : `An unexpected error occurred during user deletion from Auth: ${error.message}`;
        return { success: false, error: message };
    }
}
