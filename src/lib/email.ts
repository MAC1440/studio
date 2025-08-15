
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailArgs {
    to: string;
    name: string;
    organizationName: string;
}

export async function sendInvitationEmail({ to, name, organizationName }: SendInvitationEmailArgs) {
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not set. Skipping email invitation.");
        // In a real app, you might want to have a fallback or throw a more specific error.
        return;
    }

    const inviteLink = `https://boardr.vercel.app/login?email=${encodeURIComponent(to)}`;

    try {
        await resend.emails.send({
            from: 'BoardR <onboarding@resend.dev>',
            to: [to],
            subject: `You're invited to join ${organizationName} on BoardR`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h1 style="color: #333;">You've been invited!</h1>
                    <p>Hi ${name},</p>
                    <p>You have been invited to join the <strong>${organizationName}</strong> workspace on BoardR.</p>
                    <p>Click the button below to set up your account and get started:</p>
                    <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #673AB7; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">Set Up Your Account</a>
                    <p style="font-size: 12px; color: #777;">If you did not expect this invitation, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">&copy; BoardR. All rights reserved.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send invitation email:", error);
        throw new Error("Could not send invitation email. Please check the email service configuration.");
    }
}
