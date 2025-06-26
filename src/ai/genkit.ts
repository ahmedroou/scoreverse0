import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure environment variables are loaded. In Next.js, this is typically handled automatically.
// The presence of `dotenv` in `dev.ts` is for the `genkit:dev` script.
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    'WARNING: The GOOGLE_API_KEY environment variable is not set. AI features will not work. Please set it in your .env file.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
