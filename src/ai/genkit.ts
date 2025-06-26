
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebaseConfig, isFirebaseConfigured } from '@/lib/firebase'; // Import config and helper

// IMPORTANT: This application uses the Firebase Web API Key for Genkit.
// This key is retrieved from the `firebaseConfig` object in `/src/lib/firebase.ts`.
// For the AI features to work, you MUST ensure that the "Generative Language API"
// is enabled for your project in the Google Cloud Console and that a billing
// account is linked. See the README.md for direct links and instructions.
const apiKey = firebaseConfig.apiKey;

if (!isFirebaseConfigured()) {
  console.warn(
    '=============================================================\n' +
    'WARNING: Firebase is not configured.\n' +
    'AI features will not work.\n\n' +
    'Please add your Firebase project configuration to `/src/lib/firebase.ts`.\n' +
    '============================================================='
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the Firebase API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
