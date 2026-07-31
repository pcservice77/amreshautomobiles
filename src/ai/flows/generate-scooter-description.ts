'use server';
/**
 * @fileOverview A Genkit flow for generating compelling product descriptions for electric scooters.
 *
 * - generateScooterDescription - A function that handles the generation of scooter descriptions.
 * - GenerateScooterDescriptionInput - The input type for the generateScooterDescription function.
 * - GenerateScooterDescriptionOutput - The return type for the generateScooterDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScooterDescriptionInputSchema = z.object({
  model: z.string().describe('The model name of the electric scooter.'),
  range: z
    .string()
    .describe('The maximum range of the scooter on a single charge (e.g., "100 km").'),
  price: z.string().describe('The price of the electric scooter (e.g., "₹ 1,20,000").'),
  topSpeed:
    z.string().optional().describe('The top speed of the electric scooter (e.g., "60 km/h").'),
  batteryCapacity:
    z.string().optional().describe('The battery capacity of the scooter (e.g., "2.5 kWh").'),
  chargingTime:
    z.string().optional().describe('The charging time of the scooter (e.g., "4 hours").'),
  features:
    z.array(z.string()).optional().describe('A list of key features of the scooter.'),
});
export type GenerateScooterDescriptionInput = z.infer<
  typeof GenerateScooterDescriptionInputSchema
>;

const GenerateScooterDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description for the scooter.'),
});
export type GenerateScooterDescriptionOutput = z.infer<
  typeof GenerateScooterDescriptionOutputSchema
>;

export async function generateScooterDescription(
  input: GenerateScooterDescriptionInput
): Promise<GenerateScooterDescriptionOutput> {
  return generateScooterDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScooterDescriptionPrompt',
  input: {schema: GenerateScooterDescriptionInputSchema},
  output: {schema: GenerateScooterDescriptionOutputSchema},
  prompt: `You are an expert copywriter for an electric scooter showroom named Amresh Volt.
Your task is to create a compelling, professional, and persuasive product description for an electric scooter based on its specifications.
Highlight the benefits of electric mobility and the unique selling points of the scooter.
Keep the description concise but informative, aiming for about 150-200 words.

Scooter Model: {{{model}}}
Range: {{{range}}}
Price: {{{price}}}

{{#if topSpeed}}
Top Speed: {{{topSpeed}}}
{{/if}}
{{#if batteryCapacity}}
Battery Capacity: {{{batteryCapacity}}}
{{/if}}
{{#if chargingTime}}
Charging Time: {{{chargingTime}}}
{{/if}}

{{#if features}}
Key Features:
{{#each features}}- {{{this}}}
{{/each}}
{{/if}}

Generate the product description now, focusing on attracting potential buyers with a modern and exciting tone.`,
});

const generateScooterDescriptionFlow = ai.defineFlow(
  {
    name: 'generateScooterDescriptionFlow',
    inputSchema: GenerateScooterDescriptionInputSchema,
    outputSchema: GenerateScooterDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
