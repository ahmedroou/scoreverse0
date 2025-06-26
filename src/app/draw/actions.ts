"use server";
import { suggestMatchups } from '@/ai/flows/suggest-matchups';
import type { SuggestMatchupsInput, SuggestMatchupsOutput } from '@/ai/flows/suggest-matchups';

export async function handleSuggestMatchupsAction(input: SuggestMatchupsInput): Promise<SuggestMatchupsOutput | { error: string }> {
  try {
    const result = await suggestMatchups(input);
    return result;
  } catch (error) {
    console.error("Error suggesting matchups:", error);
    if (error instanceof Error) {
        return { error: `Failed to get matchups: ${error.message}` };
    }
    return { error: "Failed to get matchups. An unknown error occurred." };
  }
}
