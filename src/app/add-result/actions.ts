
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
    if (errorMessage.includes('API_KEY_SERVICE_BLOCKED') || errorMessage.includes('403 Forbidden')) {
      return { error: "The Generative Language API is not enabled for your project. Please enable it in the Google Cloud Console and ensure a billing account is linked. See the README for instructions." };
    }
    if (errorMessage.includes('API_KEY_INVALID')) {
      return { error: "The provided API key is invalid. Please check your Firebase configuration." };
    }
    return { error: "Failed to get handicap suggestions. Please try again." };
  }
}
