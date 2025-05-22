
"use server";
import { suggestHandicap } from '@/ai/flows/suggest-handicap';
import type { SuggestHandicapInput, SuggestHandicapOutput } from '@/ai/flows/suggest-handicap';

export async function handleSuggestHandicapAction(input: SuggestHandicapInput): Promise<SuggestHandicapOutput | { error: string }> {
  try {
    const result = await suggestHandicap(input);
    return result;
  } catch (error) {
    console.error("Error suggesting handicap:", error);
    return { error: "Failed to get handicap suggestions. Please try again." };
  }
}
