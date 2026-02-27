'use server';
/**
 * @fileOverview A Genkit flow for suggesting AI tags for a given URL.
 *
 * - suggestAITagsForLink - A function that handles the AI tag suggestion process.
 * - SuggestAITagsForLinkInput - The input type for the suggestAITagsForLink function.
 * - SuggestAITagsForLinkOutput - The return type for the suggestAITagsForLink function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SuggestAITagsForLinkInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to analyze.'),
});
export type SuggestAITagsForLinkInput = z.infer<typeof SuggestAITagsForLinkInputSchema>;

const SuggestAITagsForLinkOutputSchema = z.array(z.string()).describe('An array of suggested tags for the webpage content in Japanese.');
export type SuggestAITagsForLinkOutput = z.infer<typeof SuggestAITagsForLinkOutputSchema>;

export async function suggestAITagsForLink(input: SuggestAITagsForLinkInput): Promise<SuggestAITagsForLinkOutput> {
  return suggestAITagsForLinkFlow(input);
}

// Helper function to fetch and parse webpage content
async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract relevant text content from the webpage
    let content = '';
    content += $('title').text() + '\n';
    content += $('meta[name="description"]').attr('content') + '\n';
    content += $('h1').text() + '\n';
    $('p').each((_i, el) => {
      content += $(el).text() + '\n';
    });

    // Limit content size to avoid exceeding token limits
    // A more sophisticated approach might summarize or chunk the text.
    return content.trim().substring(0, 5000); // Limit to first 5000 characters for now
  } catch (error) {
    console.error(`Failed to fetch or parse URL: ${url}`, error);
    throw new Error('Failed to fetch or parse webpage content.');
  }
}

const aiSuggestTagsForLinkPrompt = ai.definePrompt({
  name: 'aiSuggestTagsForLinkPrompt',
  input: {
    schema: z.object({ webpageContent: z.string() })
  },
  output: {
    schema: SuggestAITagsForLinkOutputSchema
  },
  prompt: `You are an AI assistant that analyzes webpage content and suggests relevant tags in Japanese.
Analyze the following webpage content and provide a list of up to 5 concise and relevant tags.
The tags should be in Japanese and should accurately describe the main topics or keywords of the content.
Return the tags as a JSON array of strings.

Webpage Content:
{{{webpageContent}}}`,
});

const suggestAITagsForLinkFlow = ai.defineFlow(
  {
    name: 'suggestAITagsForLinkFlow',
    inputSchema: SuggestAITagsForLinkInputSchema,
    outputSchema: SuggestAITagsForLinkOutputSchema,
  },
  async (input) => {
    const webpageContent = await fetchWebpageContent(input.url);
    if (!webpageContent) {
        throw new Error('Could not extract content from the provided URL.');
    }
    const {output} = await aiSuggestTagsForLinkPrompt({ webpageContent });
    return output!;
  }
);
