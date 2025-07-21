
'use server';

import {Resend} from 'resend';

export async function sendTestEmail(
    prevState: any,
    formData: FormData
  ) {
    const to = formData.get('email') as string;
    const fromName = formData.get('fromName') as string;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { success: false, message: "Resend API key is not configured. Please set RESEND_API_KEY." };
    }

    if (!to || !fromName) {
        return { success: false, message: "Recipient email and sender name are required." };
    }

  const resend = new Resend(apiKey);

  try {
    const {data, error} = await resend.emails.send({
      from: 'KanbanFlow <onboarding@resend.dev>',
      to: [to],
      subject: 'Test Email from KanbanFlow',
      html: `<p>Hello world from ${fromName}!</p>`,
    });

    if (error) {
      // Directly return the error message from the Resend API response.
      // This is more reliable than a generic error handler.
      return {success: false, message: error.message};
    }

    return {success: true, message: `A test email has been sent to ${to}.`};
  } catch (exception: unknown) {
    // This will catch network errors or other exceptions during the request.
    console.error('Failed to send email:', exception);
     if (exception instanceof Error) {
        return { success: false, message: exception.message };
    }
    return {success: false, message: 'An unexpected error occurred.'};
  }
}
