
"use server";
import { suggestHandicap } from '@/ai/flows/suggest-handicap';
import type { SuggestHandicapInput, SuggestHandicapOutput } from '@/ai/flows/suggest-handicap';

export async function handleSuggestHandicapAction(input: SuggestHandicapInput): Promise<SuggestHandicapOutput | { error: string }> {
  try {
    const result = await suggestHandicap(input);
    return result;
  } catch (error: any) {
    console.error("Error suggesting handicap:", error);
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
    return { error: "An unexpected error occurred while getting handicap suggestions. Please try again later." };
  }
}
