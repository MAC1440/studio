
'use server';

import {Resend} from 'resend';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return 'An unknown error occurred.';
}


export async function sendTestEmail({
  to,
  fromName,
}: {
  to: string;
  fromName: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const {data, error} = await resend.emails.send({
      from: 'KanbanFlow <onboarding@resend.dev>',
      to: [to],
      subject: 'Test Email from KanbanFlow',
      html: `<p>Hello world from ${fromName}!</p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return {success: false, error: getErrorMessage(error)};
    }

    return {success: true, data};
  } catch (error: unknown) {
    console.error('Failed to send email:', error);
    return {success: false, error: getErrorMessage(error)};
  }
}
