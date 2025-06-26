
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
      return { error: "The AI service is currently unavailable. Please check the service configuration." };
    }
    
    // Specific check for an invalid API key
    if (errorMessage.includes('API_KEY_INVALID')) {
      return { error: "The provided API key is invalid. Please check the application configuration." };
    }
    
    // Generic fallback for other errors
    return { error: "An unexpected error occurred while getting handicap suggestions. Please try again later." };
  }
}
