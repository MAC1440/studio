import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {configure} from 'genkit';

configure({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = {};
