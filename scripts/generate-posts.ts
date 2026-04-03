/**
 * Build-time script: generates static JSON files for blog posts.
 * Run before `vite build` so that posts are available as static assets.
 *
 * Output:
 *   public/api/posts.json          — array of post metadata (sorted by date desc)
 *   public/api/posts/{slug}.json   — full post (metadata + markdown content)
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR = path.join(ROOT, 'public', 'api');

// --- Helpers (mirrored from server.ts) ---

function getFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? getFiles(full) : [full];
  });
}

function toSlug(filepath: string): string {
  return path
    .relative(POSTS_DIR, filepath)
    .replace(/\.md$/, '')
    .split(path.sep)
    .join('-');
}

// --- Main ---

function generate() {
  // Ensure output directories exist
  const postsOutDir = path.join(OUT_DIR, 'posts');
  fs.mkdirSync(postsOutDir, { recursive: true });

  const mdFiles = getFiles(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const allMeta: Record<string, unknown>[] = [];

  for (const filepath of mdFiles) {
    const slug = toSlug(filepath);
    const raw = fs.readFileSync(filepath, 'utf-8');
    const { data, content } = matter(raw);

    const meta = {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      topic: data.topic || data.category || 'Uncategorized',
      featured: data.featured || false,
      series: data.series || null,
      ...data,
    };

    allMeta.push(meta);

    // Write individual post JSON (metadata + content)
    const postData = { ...meta, content, seriesPosts: [] as unknown[] };

    // Collect series siblings
    if (meta.series) {
      // Deferred — will be filled in a second pass
    }

    fs.writeFileSync(
      path.join(postsOutDir, `${slug}.json`),
      JSON.stringify(postData, null, 0),
    );
  }

  // Sort by date descending
  allMeta.sort(
    (a, b) =>
      new Date(b.date as string).getTime() - new Date(a.date as string).getTime(),
  );

  // Second pass: fill series posts
  for (const meta of allMeta) {
    if ((meta as any).series) {
      const seriesName = (meta as any).series.name;
      const seriesPosts = allMeta
        .filter((m: any) => m.series?.name === seriesName)
        .map((m: any) => ({ slug: m.slug, title: m.title, order: m.series.order }))
        .sort((a, b) => a.order - b.order);

      const slug = meta.slug as string;
      const postPath = path.join(postsOutDir, `${slug}.json`);
      const postData = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
      postData.seriesPosts = seriesPosts;
      fs.writeFileSync(postPath, JSON.stringify(postData, null, 0));
    }
  }

  // Write posts list (metadata only, no content)
  fs.writeFileSync(
    path.join(OUT_DIR, 'posts.json'),
    JSON.stringify(allMeta, null, 0),
  );

  console.log(
    `✅ Generated ${mdFiles.length} post(s) → public/api/posts.json + public/api/posts/*.json`,
  );
}

generate();
