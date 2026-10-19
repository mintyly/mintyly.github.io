import { defineCollection, z } from 'astro:content';
import { githubWriteups } from './loaders/githubWriteups';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }),
});

const writing = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

const ctfblog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.string(),
    type: z.enum(['created', 'solved']).default('solved'),
  }),
});

const portfolio = defineCollection({
  schema: z.object({}),
});

const welcome = defineCollection({
  schema: z.object({
    roles: z.array(z.string()),
  }),
});

const writeups = defineCollection({
  loader: githubWriteups(),
  schema: z.object({
    competition: z.string(),
    challenge: z.string(),
    category: z.string().nullable(),
    difficulty: z.string().nullable(),
    description: z.string().nullable(),
    flag: z.string().nullable(),
    sourceUrl: z.string(),
  }),
});

export const collections = {
  blog,
  writing,
  ctfblog,
  portfolio,
  welcome,
  writeups,
};
