
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure environment variables are loaded. In Next.js, this is typically handled automatically.
// The presence of `dotenv` in `dev.ts` is for the `genkit:dev` script.
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    '=============================================================\n' +
    'WARNING: GOOGLE_API_KEY is not set.\n' +
    'AI features will not work.\n\n' +
    'If you are running locally, please ensure the key is in your .env file.\n' +
    'If this app is deployed, `.env` files are likely not used for security reasons. ' +
    'You MUST set the GOOGLE_API_KEY in your hosting platform\'s "Environment Variables" or "Secrets" section.\n' +
    '============================================================='
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
