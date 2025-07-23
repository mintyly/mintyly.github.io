import { defineCollection, z } from 'astro:content';

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

export const collections = {
  writing,
  ctfblog,
};
