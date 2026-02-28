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
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Helper function to fetch and parse webpage content (reused from tags flow)
async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let content = '';
    content += $('title').text() + '\n';
    content += $('meta[name="description"]').attr('content') + '\n';
    content += $('h1').text() + '\n';
    $('p').each((_i, el) => {
      content += $(el).text() + '\n';
    });

    return content.trim().substring(0, 5000); // Limit to first 5000 characters
  } catch (error) {
    console.error(`Failed to fetch or parse URL: ${url}`, error);
    throw new Error('Failed to fetch or parse webpage content.');
  }
}

const summarizeLinkPrompt = ai.definePrompt({
  name: 'summarizeLinkPrompt',
  input: {
    schema: z.object({ webpageContent: z.string() })
  },
  output: {
    schema: SummarizeLinkOutputSchema
  },
  prompt: `次のウェブページの内容を読み、その内容を簡潔な日本語で要約してください。要約は、主要なポイントを網羅し、理解しやすいものにしてください。

内容:
{{{webpageContent}}}`,
});

const summarizeLinkFlow = ai.defineFlow(
  {
    name: 'summarizeLinkFlow',
    inputSchema: SummarizeLinkInputSchema,
    outputSchema: SummarizeLinkOutputSchema,
  },
  async input => {
    const webpageContent = await fetchWebpageContent(input.url);
    if (!webpageContent) {
      throw new Error('Could not extract content from the provided URL.');
    }
    const {output} = await summarizeLinkPrompt({ webpageContent });
    return output!;
  }
);
