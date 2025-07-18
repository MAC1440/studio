'use server';
import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {configure} from 'genkit';

export const ai: Genkit = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
