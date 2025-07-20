
// src/app/actions.ts
'use server';

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
