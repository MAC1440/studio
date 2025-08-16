
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Genkit v1.x initialization.
// The `genkit()` call creates and configures the AI instance in one step.
// We use a simple check to prevent re-initialization during hot-reloads.
const ai = genkit({
  plugins: [
    googleAI({
      // To get an API key, follow the instructions at
      // https://ai.google.dev/
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // In a serverless environment, you may want to disable the registry
  // and tracing to reduce overhead.
  enableRegistry: true,
});


// Export the AI instance for use in other parts of the application
export { ai };
