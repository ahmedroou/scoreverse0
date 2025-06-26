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
    if (errorMessage.includes('API_KEY_SERVICE_BLOCKED') || errorMessage.includes('403 Forbidden')) {
      return { error: "The Generative Language API is not enabled for your project. Please enable it in the Google Cloud Console and ensure a billing account is linked. See the README for instructions." };
    }
    if (errorMessage.includes('API_KEY_INVALID')) {
      return { error: "The provided API key is invalid. Please check your Firebase configuration." };
    }
     if (error instanceof Error) {
        return { error: `Failed to get matchups: ${error.message}` };
    }
    return { error: "Failed to get matchups. An unknown error occurred." };
  }
}
