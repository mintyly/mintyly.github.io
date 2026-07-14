import { defineCollection, z } from 'astro:content';
import { githubWriteups } from './loaders/githubWriteups';

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
    // add any other fields specific to CTF blog if you want
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
  writing,
  ctfblog,
  portfolio,
  welcome,
  writeups,
};
