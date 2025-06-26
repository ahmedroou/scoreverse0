"use server";
import { suggestMatchups } from '@/ai/flows/suggest-matchups';
import type { SuggestMatchupsInput, SuggestMatchupsOutput } from '@/ai/flows/suggest-matchups';

export async function handleSuggestMatchupsAction(input: SuggestMatchupsInput): Promise<SuggestMatchupsOutput | { error: string }> {
  try {
    const result = await suggestMatchups(input);
    return result;
  } catch (error: any) {
    console.error("Error suggesting matchups:", error);
    const errorMessage = error.message || '';

    // Specific check for API service blocked or disabled
    if (errorMessage.includes('API_KEY_SERVICE_BLOCKED') || errorMessage.includes('403 Forbidden')) {
      return { error: "The AI service is blocked. Please ensure the 'Generative Language API' is enabled in your Google Cloud project and a billing account is linked. See README.md for instructions." };
    }
    
    // Specific check for an invalid API key
    if (errorMessage.includes('API_KEY_INVALID')) {
      return { error: "The API key is invalid. Please ensure your Firebase configuration is correct and you have completed the setup in the Google Cloud Console." };
    }
    
    // Generic fallback for other errors
    return { error: "An unexpected error occurred while generating matchups. Please try again later." };
  }
}
