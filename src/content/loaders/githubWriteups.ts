import type { Loader } from 'astro/loaders';
import { load as loadYaml } from 'js-yaml';

const REPO = 'mintyly/ctf-questions-writeups';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg)$/i;
const METADATA_FILENAMES = ['chall.yaml', 'challenge.yml', 'chall.json'];

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
}

interface ChallengeMeta {
  category: string | null;
  difficulty: string | null;
  description: string | null;
  flag: string | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

function rawUrl(path: string): string {
  return `${RAW_BASE}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Retries transient network failures (timeouts, DNS blips) - GitHub itself returning
 * an error status is not retried, since that won't change on a retry. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

async function fetchText(path: string): Promise<string> {
  const res = await withRetry(() => fetch(rawUrl(path)));
  if (!res.ok) {
    throw new Error(`Failed to fetch "${path}" from GitHub (${res.status})`);
  }
  return res.text();
}

/** Best-effort extraction of the fields we care about when a metadata file isn't valid YAML/JSON. */
function extractMetaWithRegex(raw: string): ChallengeMeta {
  const field = (key: string) => {
    const match = raw.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  const flagMatch = raw.match(/[A-Za-z0-9_]+\{[^}]+\}/);
  return {
    category: field('category'),
    difficulty: field('difficulty'),
    description: null, // the field most likely to contain the unescaped quote that broke parsing
    flag: flagMatch ? flagMatch[0] : null,
  };
}

function normalizeMeta(parsed: any): ChallengeMeta {
  const challenge = parsed?.challenge ?? parsed ?? {};
  const flags = challenge.flags;
  let flag: string | null = null;
  if (Array.isArray(flags) && flags.length > 0) {
    flag = typeof flags[0] === 'string' ? flags[0] : (flags[0]?.flag ?? null);
  }
  return {
    category: challenge.category ?? null,
    difficulty: challenge.difficulty ?? null,
    description: challenge.description ?? null,
    flag,
  };
}

async function loadChallengeMeta(challengeDir: string, entries: TreeEntry[], logger: { warn: (msg: string) => void }): Promise<ChallengeMeta> {
  for (const filename of METADATA_FILENAMES) {
    const found = entries.find((e) => e.path === `${challengeDir}/${filename}`);
    if (!found) continue;

    const raw = await fetchText(found.path);
    try {
      const parsed = filename.endsWith('.json') ? JSON.parse(raw) : loadYaml(raw);
      return normalizeMeta(parsed);
    } catch (err) {
      logger.warn(`Could not parse ${found.path} (${(err as Error).message}); falling back to partial metadata extraction.`);
      return extractMetaWithRegex(raw);
    }
  }
  return { category: null, difficulty: null, description: null, flag: null };
}

/** Writeup image links in this repo are sometimes broken absolute local paths, sometimes
 * correct relative paths - in both cases the actual file lives somewhere under this
 * challenge's `solution/` folder, so we rewrite by matching on basename.
 *
 * Some of those broken paths contain literal parentheses (e.g. a folder named
 * "Audiophile (nothing added bro wtf)"), so the URL group can't stop at the first `)` -
 * it's anchored on the image extension instead, since every link here ends in one. */
function fixImageLinks(markdown: string, imageByBasename: Map<string, string>): string {
  return markdown.replace(/!\[([^\]]*)\]\((.+?\.(?:png|jpe?g|gif|webp|svg))\)/gi, (match, alt, src) => {
    let name = basename(src.trim());
    try {
      name = decodeURIComponent(name);
    } catch {
      // leave as-is if it's not validly percent-encoded
    }
    const actualPath = imageByBasename.get(name);
    return actualPath ? `![${alt}](${rawUrl(actualPath)})` : match;
  });
}

export function githubWriteups(): Loader {
  return {
    name: 'github-writeups-loader',
    load: async ({ store, parseData, renderMarkdown, generateDigest, logger }) => {
      logger.info(`Fetching CTF writeups from ${REPO}...`);

      const treeRes = await withRetry(() =>
        fetch(`${API_BASE}/git/trees/${BRANCH}?recursive=1`, {
          headers: { Accept: 'application/vnd.github+json' },
        }),
      );
      if (!treeRes.ok) {
        throw new Error(`Failed to list ${REPO} (${treeRes.status}). Skipping CTF writeup sync.`);
      }
      const { tree: entries }: { tree: TreeEntry[] } = await treeRes.json();

      const writeupEntries = entries.filter(
        (e) => e.type === 'blob' && /\/solution\/writeup\.md$/.test(e.path),
      );

      store.clear();

      for (const writeupEntry of writeupEntries) {
        const [competition, challenge] = writeupEntry.path.split('/');
        const challengeDir = `${competition}/${challenge}`;

        const imageByBasename = new Map(
          entries
            .filter((e) => e.type === 'blob' && e.path.startsWith(`${challengeDir}/solution/`) && IMAGE_EXTENSIONS.test(e.path))
            .map((e) => [basename(e.path), e.path]),
        );

        const [meta, rawWriteup] = await Promise.all([
          loadChallengeMeta(challengeDir, entries, logger),
          fetchText(writeupEntry.path),
        ]);

        const writeupBody = fixImageLinks(rawWriteup, imageByBasename);
        const id = slugify(challengeDir);

        const data = await parseData({
          id,
          data: {
            competition,
            challenge,
            category: meta.category,
            difficulty: meta.difficulty,
            description: meta.description,
            flag: meta.flag,
            sourceUrl: `https://github.com/${REPO}/tree/${BRANCH}/${challengeDir.split('/').map(encodeURIComponent).join('/')}`,
          },
        });

        store.set({
          id,
          data,
          rendered: await renderMarkdown(writeupBody),
          digest: generateDigest(writeupBody),
        });
      }

      logger.info(`Loaded ${writeupEntries.length} CTF writeup(s) from ${REPO}.`);
    },
  };
}
