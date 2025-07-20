
// src/app/actions.ts
'use server';

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

type UpdateUserAuthArgs = {
    uid: string;
    email?: string;
    password?: string;
};

export async function updateUserAuth({ uid, email, password }: UpdateUserAuthArgs): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth) {
    const errorMsg = "Firebase Admin SDK not initialized. User auth updates are disabled. Ensure server environment variables are set correctly.";
    console.error(`updateUserAuth Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const updateData: { email?: string; password?: string } = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length > 0) {
        await adminAuth.updateUser(uid, updateData);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update user authentication details:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
