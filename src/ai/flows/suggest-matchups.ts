
'use server';
/**
 * @fileOverview A Genkit flow for suggesting random player matchups for a game.
 *
 * - suggestMatchups - A function that suggests pairings for a list of players.
 * - SuggestMatchupsInput - The input type for the suggestMatchups function.
 * - SuggestMatchupsOutput - The output type for the suggestMatchups function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMatchupsInputSchema = z.object({
  gameName: z.string().describe('The name of the game for which to create matchups.'),
  playerNames: z.array(z.string()).min(2, 'At least two players are required.').describe('An array of player names to be paired.'),
  language: z.string().optional().describe('The language for the output, e.g., "en" or "ar".'),
});

export type SuggestMatchupsInput = z.infer<typeof SuggestMatchupsInputSchema>;

const SuggestMatchupsOutputSchema = z.object({
    pairings: z.array(z.object({
        player1: z.string().describe("The name of the first player in the pair."),
        player2: z.string().describe("The name of the second player in the pair."),
    })).describe("An array of player pairings."),
    bye: z.string().nullable().describe("The player who has a bye for this round, if any. Null if all players are paired."),
    commentary: z.string().optional().describe("A brief, fun commentary on the generated draw.")
});

export type SuggestMatchupsOutput = z.infer<typeof SuggestMatchupsOutputSchema>;

export async function suggestMatchups(input: SuggestMatchupsInput): Promise<SuggestMatchupsOutput> {
  return suggestMatchupsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMatchupsPrompt',
  input: {schema: SuggestMatchupsInputSchema},
  output: {schema: SuggestMatchupsOutputSchema},
  prompt: `You are an enthusiastic tournament organizer for the game "{{{gameName}}}". Your task is to create a random draw for the players provided.
{{#if language}}
The output 'commentary' field MUST be in the language specified by the language code: {{{language}}}. For example, 'ar' for Arabic.
{{/if}}

Players:
{{#each playerNames}}
- {{{this}}}
{{/each}}

Instructions:
1. Shuffle the list of players randomly.
2. Create pairs of players for the matchups.
3. If there is an odd number of players, one player must receive a "bye" and will not be paired for this round. The 'bye' field in the output should contain their name. If the number of players is even, the 'bye' field should be null.
4. Provide some fun, brief commentary about the draw, as if you were announcing it to the players.

Return the result as a valid JSON object matching the provided schema.
`,
});

const suggestMatchupsFlow = ai.defineFlow(
  {
    name: 'suggestMatchupsFlow',
    inputSchema: SuggestMatchupsInputSchema,
    outputSchema: SuggestMatchupsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
