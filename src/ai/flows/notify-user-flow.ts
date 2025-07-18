
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
import {confirm} from 'genkit';

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

    const {toolRequest} = await ai.generate({
        prompt: `A user has been assigned a new ticket. Generate a friendly and professional email notification to ${input.userEmail}.
        
        Ticket Title: "${input.ticketTitle}"
        User Name: ${input.userName}
        
        The email should inform the user they have been assigned a new ticket and provide a link to view it. The link should be to /board.
        
        Generate only the subject and the HTML body of the email.
        `,
        model: 'googleai/gemini-1.5-flash-latest',
        tools: [emailSender],
        config: {
            // Lower temperature for more deterministic, less "creative" output
            temperature: 0.2,
        },
    });


    if (!toolRequest) {
        console.error("The model did not request the emailSender tool. Cannot send email.");
        return;
    }

    if (toolRequest.name !== 'emailSender') {
        // This case shouldn't happen with our prompt, but it's good practice to handle it.
        await confirm({
            label: `The model requested an unexpected tool: ${toolRequest.name}. The expected tool was emailSender.`,
            context: toolRequest,
        });
        return;
    }
    
    // We are sure the tool is 'emailSender'
    const toolInput = {
      ...toolRequest.input,
      to: input.userEmail,
    };

    const toolResponse = await toolRequest.run(toolInput);

    // Although our tool output is void, we need to pass a response back to the model.
    await toolRequest.confirm(toolResponse);

  }
);
