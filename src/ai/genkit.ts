
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { configureGenkit } from 'genkit';

// Note: The genkit() call does not automatically configure the instance.
// configureGenkit() is required to apply the plugins and other settings.
// In a Next.js app, this file is likely to be imported in multiple places,
// so we should ensure that we only configure genkit once.

let configured = false;
if (!configured) {
    configureGenkit({
      plugins: [
        googleAI({
          // To get an API key, follow the instructions at
          // https://ai.google.dev/
          apiKey: process.env.GEMINI_API_KEY,
        }),
      ],
      // Log steps and errors to the console.
      logLevel: "debug",
      // Provide a callback to handle errors when rendering a flow.
      render: (err) => {
        console.error(err);
      },
      // In a serverless environment, you may want to disable the registry
      // and tracing to reduce overhead.
      enableRegistry: true,
    });
    configured = true;
}


// Export the AI instance for use in other parts of the application
export { genkit as ai };
