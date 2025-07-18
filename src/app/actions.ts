// src/app/actions.ts
'use server';

import { Resend } from 'resend';
import { adminAuth } from '@/lib/firebase/admin';

type SendEmailArgs = {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return { success: false, error: 'RESEND_API_KEY not configured.' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'KanbanFlow <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function deleteUserFromAuth(uid: string) {
    try {
        await adminAuth.deleteUser(uid);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user from Firebase Auth:', error);
        // Provide a more specific error message if available
        const message = error.code === 'auth/user-not-found'
            ? 'User not found in Firebase Authentication.'
            : 'An unexpected error occurred during user deletion from Auth.';
        return { success: false, error: message };
    }
}
