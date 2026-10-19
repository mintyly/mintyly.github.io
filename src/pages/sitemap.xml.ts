import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const [blog, ctf, writing, writeups] = await Promise.all([
    getCollection('blog'), getCollection('ctfblog'),
    getCollection('writing'), getCollection('writeups'),
  ]);
  const paths = [
    '/', '/blog/', '/ctfblog/', '/writing/',
    ...blog.map(post => `/blog/${post.id}/`),
    ...ctf.map(post => `/ctfblog/${post.slug}/`),
    ...writing.map(post => `/writing/${post.slug}/`),
    ...writeups.map(post => `/ctfblog/writeups/${post.id}/`),
  ];
  const escapeXML = (value: string) => value.replace(/[<>&"']/g, char => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[char]!);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXML(new URL(path, site).href)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
