
'use server';
/**
 * @fileOverview An AI flow for generating proposal content.
 *
 * - generateProposal - A function that handles the proposal generation process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProposalInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the proposal content. Should be a descriptive topic.'),
});
export type GenerateProposalInput = z.infer<typeof GenerateProposalInputSchema>;

const GenerateProposalOutputSchema = z.object({
  content: z.string().describe('The generated proposal content in HTML format.'),
});
export type GenerateProposalOutput = z.infer<typeof GenerateProposalOutputSchema>;

export async function generateProposal(input: GenerateProposalInput): Promise<GenerateProposalOutput> {
  return generateProposalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProposalPrompt',
  input: { schema: GenerateProposalInputSchema },
  output: { schema: GenerateProposalOutputSchema },
  prompt: `You are an expert business proposal writer for a creative agency. 
  
  Generate a professional and persuasive proposal based on the following topic. 
  The output should be a well-structured HTML document. 
  
  Your response should include the following sections:
  1.  **Introduction**: Briefly introduce the project and its goals.
  2.  **Scope of Work**: Detail the specific services and deliverables. Use a bulleted list.
  3.  **Timeline**: Provide an estimated timeline for the project, broken down into phases.
  4.  **Pricing**: Give a sample pricing table. Include line items and a total.
  5.  **Conclusion**: End with a strong call to action.
  
  Topic: {{{prompt}}}
  `,
});

const generateProposalFlow = ai.defineFlow(
  {
    name: 'generateProposalFlow',
    inputSchema: GenerateProposalInputSchema,
    outputSchema: GenerateProposalOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
