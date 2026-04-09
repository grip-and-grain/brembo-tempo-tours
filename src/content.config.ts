import { defineCollection, z } from 'astro:content';

const tourDateSchema = z.object({
  date: z.string(),
  spots: z.number().int().positive(),
  spotsLeft: z.number().int().min(0),
});

const routes = defineCollection({
  loader: async () => {
    const { fetchRoutes } = await import('./lib/sheets.js');
    return fetchRoutes();
  },
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    titleEn: z.string(),
    description: z.string(),
    descriptionEn: z.string(),
    distance: z.number(),
    duration: z.string(),
    durationEn: z.string(),
    difficulty: z.enum(['lätt', 'medel', 'krävande']),
    difficultyEn: z.enum(['easy', 'moderate', 'demanding']),
    region: z.string().default('Östergötland'),
    mapThumbnail: z.string().optional(),
    highlights: z.array(z.string()),
    dates: z.array(tourDateSchema),
    published: z.boolean().default(true),
  }),
});

export const collections = { routes };
