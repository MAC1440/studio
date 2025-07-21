
'use server';

import {Resend} from 'resend';

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
      return {success: false, error: error.message};
    }

    return {success: true, data};
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {success: false, error: error.message};
  }
}
