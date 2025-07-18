
'use server';
/**
 * @fileOverview A flow for sending email notifications to users.
 *
 * - notifyUser - A function that sends an email when a ticket is assigned.
 * - NotifyUserInput - The input type for the notifyUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

const NotifyUserInputSchema = z.object({
  ticketId: z.string().describe('The ID of the ticket.'),
  ticketTitle: z.string().describe('The title of the ticket.'),
  userName: z.string().describe('The name of the user to notify.'),
  userEmail: z.string().email().describe('The email of the user to notify.'),
});
export type NotifyUserInput = z.infer<typeof NotifyUserInputSchema>;

const emailSender = ai.defineTool(
    {
      name: 'emailSender',
      description: 'Send an email to a user.',
      inputSchema: z.object({
        to: z.string(),
        subject: z.string(),
        html: z.string(),
      }),
      outputSchema: z.void(),
    },
    async (input) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
            from: 'KanbanFlow <onboarding@resend.dev>',
            to: input.to,
            subject: input.subject,
            html: input.html,
        });
    }
);


export async function notifyUser(input: NotifyUserInput): Promise<void> {
  return notifyUserFlow(input);
}


const notifyUserFlow = ai.defineFlow(
  {
    name: 'notifyUserFlow',
    inputSchema: NotifyUserInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const subject = `You've been assigned a new ticket: "${input.ticketTitle}"`;
    const htmlBody = `
      <h1>New Ticket Assignment</h1>
      <p>Hi ${input.userName},</p>
      <p>You have been assigned a new ticket on KanbanFlow:</p>
      <p><b>Title:</b> ${input.ticketTitle}</p>
      <p>You can view the ticket on the board.</p>
      <p>Thank you,</p>
      <p>The KanbanFlow Team</p>
    `;

    // Directly call the email sender tool without involving an LLM
    await emailSender({
        to: input.userEmail,
        subject: subject,
        html: htmlBody,
    });
  }
);
