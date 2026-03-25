import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tourDateSchema = z.object({
  date: z.string(),
  spots: z.number().int().positive(),
  spotsLeft: z.number().int().min(0),
  notes: z.string().optional(),
});

const routes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/routes' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string(),
    slug: z.string(),
    description: z.string(),
    descriptionEn: z.string(),
    distance: z.number(),
    duration: z.string(),
    durationEn: z.string(),
    difficulty: z.enum(['lätt', 'medel', 'krävande']),
    difficultyEn: z.enum(['easy', 'moderate', 'demanding']),
    region: z.string().default('Östergötland'),
    coverImage: z.string(),
    gallery: z.array(z.string()),
    mapEmbedUrl: z.string(),
    gpxFile: z.string().optional(),
    highlights: z.array(z.string()),
    dates: z.array(tourDateSchema),
    published: z.boolean().default(true),
  }),
});

export const collections = { routes };
