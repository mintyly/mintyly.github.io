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

const portfolio = defineCollection({
  schema: z.object({}),
});

const welcome = defineCollection({
  schema: z.object({
    roles: z.array(z.string()),
  }),
});

export const collections = {
  writing,
  ctfblog,
  portfolio,
  welcome,
};
