'use server';
/**
 * @fileOverview A Genkit flow for summarizing the content of a web page from its URL.
 *
 * - summarizeLink - A function that handles the web page summarization process.
 * - SummarizeLinkInput - The input type for the summarizeLink function.
 * - SummarizeLinkOutput - The return type for the summarizeLink function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLinkInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to summarize.'),
});
export type SummarizeLinkInput = z.infer<typeof SummarizeLinkInputSchema>;

const SummarizeLinkOutputSchema = z.object({
  summary: z.string().describe('The concise Japanese summary of the webpage content.'),
});
export type SummarizeLinkOutput = z.infer<typeof SummarizeLinkOutputSchema>;

export async function summarizeLink(input: SummarizeLinkInput): Promise<SummarizeLinkOutput> {
  return summarizeLinkFlow(input);
}

const summarizeLinkPrompt = ai.definePrompt({
  name: 'summarizeLinkPrompt',
  input: {schema: SummarizeLinkInputSchema},
  output: {schema: SummarizeLinkOutputSchema},
  prompt: `次のURLのウェブページの内容を読み込み、その内容を簡潔な日本語で要約してください。要約は、ウェブページの主要なポイントを網羅し、理解しやすいものにしてください。

URL: {{media url=url}}`,
});

const summarizeLinkFlow = ai.defineFlow(
  {
    name: 'summarizeLinkFlow',
    inputSchema: SummarizeLinkInputSchema,
    outputSchema: SummarizeLinkOutputSchema,
  },
  async input => {
    const {output} = await summarizeLinkPrompt(input);
    return output!;
  }
);
