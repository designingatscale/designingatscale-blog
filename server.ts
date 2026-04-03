import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { getDb } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, 'posts');
const IS_PROD = process.env.NODE_ENV === 'production';

// --- Helpers ---

/** Recursively collect all files under `dir`. */
function getFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? getFiles(full) : [full];
  });
}

/** Convert a filepath to a URL-safe slug relative to POSTS_DIR. */
function toSlug(filepath: string): string {
  return path
    .relative(POSTS_DIR, filepath)
    .replace(/\.md$/, '')
    .split(path.sep)
    .join('-');
}

// --- Post Cache ---

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  topic: string;
  featured: boolean;
  series: { name: string; order: number } | null;
  [key: string]: unknown;
}

interface CachedPost {
  meta: PostMeta;
  content: string;
  filepath: string;
  mtime: number;
}

/** In-memory post cache — avoids re-reading & re-parsing on every request. */
let postCache: Map<string, CachedPost> = new Map();
let cacheValid = false;

function invalidateCache() {
  cacheValid = false;
}

function ensureCache(): Map<string, CachedPost> {
  if (cacheValid) return postCache;

  const fresh = new Map<string, CachedPost>();
  const mdFiles = getFiles(POSTS_DIR).filter((f) => f.endsWith('.md'));

  for (const filepath of mdFiles) {
    const slug = toSlug(filepath);
    const stat = fs.statSync(filepath);
    const existing = postCache.get(slug);

    // Reuse cached entry if file hasn't changed
    if (existing && existing.mtime === stat.mtimeMs) {
      fresh.set(slug, existing);
      continue;
    }

    const raw = fs.readFileSync(filepath, 'utf-8');
    const { data, content } = matter(raw);

    fresh.set(slug, {
      filepath,
      content,
      mtime: stat.mtimeMs,
      meta: {
        ...data,
        slug,
        title: data.title || 'Untitled',
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        topic: data.topic || data.category || 'Uncategorized',
        featured: data.featured || false,
        series: data.series || null,
      },
    });
  }

  postCache = fresh;
  cacheValid = true;
  return fresh;
}

// --- Request helpers ---

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// --- Google JWT verification ---

interface GoogleJwtPayload {
  iss: string;
  sub: string;
  email: string;
  name: string;
  picture: string;
  aud: string;
  exp: number;
  iat: number;
}

/** Decode and verify a Google ID token via Google's tokeninfo endpoint. */
async function verifyGoogleToken(
  credential: string
): Promise<GoogleJwtPayload | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    if (!res.ok) return null;

    const payload = (await res.json()) as GoogleJwtPayload;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      console.error('Token audience mismatch');
      return null;
    }

    if (payload.exp * 1000 < Date.now()) {
      console.error('Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
}

// --- Post API Handlers ---

/** GET /api/posts — list all posts sorted by date desc */
function handleGetPosts(res: ServerResponse) {
  try {
    const cache = ensureCache();
    const posts = Array.from(cache.values())
      .map((c) => c.meta)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    sendJson(res, posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    sendJson(res, { error: 'Failed to fetch posts' }, 500);
  }
}

/** GET /api/posts/:slug — single post with content + series info */
function handleGetPost(slug: string, res: ServerResponse) {
  try {
    const cache = ensureCache();
    const cached = cache.get(slug);

    if (!cached) {
      sendJson(res, { error: 'Post not found' }, 404);
      return;
    }

    const { meta, content: markdown } = cached;

    // Collect sibling posts from cache (single pass, no extra fs reads)
    let seriesPosts: { slug: string; title: string; order: number }[] = [];
    if (meta.series) {
      for (const entry of cache.values()) {
        if (entry.meta.series?.name === meta.series.name) {
          seriesPosts.push({
            slug: entry.meta.slug,
            title: entry.meta.title,
            order: entry.meta.series.order,
          });
        }
      }
      seriesPosts.sort((a, b) => a.order - b.order);
    }

    sendJson(res, {
      ...meta,
      content: markdown,
      seriesPosts,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    sendJson(res, { error: 'Failed to fetch post' }, 500);
  }
}

// --- Comment API Handlers ---

/** GET /api/posts/:slug/comments */
async function handleGetComments(slug: string, res: ServerResponse) {
  try {
    const db = await getDb();
    const allComments = await db
      .collection('comments')
      .find({ slug })
      .sort({ createdAt: 1 })
      .toArray();

    // Thread comments: group replies under their parent
    const topLevel: any[] = [];
    const replyMap = new Map<string, any[]>();

    for (const c of allComments) {
      const comment = { ...c, _id: c._id.toString() };
      if (c.parentId) {
        const parentKey = c.parentId.toString();
        if (!replyMap.has(parentKey)) replyMap.set(parentKey, []);
        replyMap.get(parentKey)!.push(comment);
      } else {
        topLevel.push(comment);
      }
    }

    // Attach replies to top-level comments, newest top-level first
    const threaded = topLevel.reverse().map((c) => ({
      ...c,
      replies: replyMap.get(c._id) || [],
    }));

    sendJson(res, threaded);
  } catch (error) {
    console.error('Error fetching comments:', error);
    sendJson(res, { error: 'Failed to fetch comments' }, 500);
  }
}

/** POST /api/posts/:slug/comments */
async function handlePostComment(
  slug: string,
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const body = JSON.parse(await readBody(req));
    const { content, credential, parentId } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      sendJson(res, { error: 'Comment content is required' }, 400);
      return;
    }

    if (!credential) {
      sendJson(res, { error: 'Google credential is required' }, 401);
      return;
    }

    const user = await verifyGoogleToken(credential);
    if (!user) {
      sendJson(res, { error: 'Invalid Google credential' }, 401);
      return;
    }

    const db = await getDb();
    const comment: Record<string, unknown> = {
      slug,
      name: user.name,
      avatar: user.picture,
      content: content.trim(),
      createdAt: new Date(),
    };

    if (parentId) {
      comment.parentId = parentId;
    }

    const result = await db.collection('comments').insertOne(comment);

    sendJson(res, { ...comment, _id: result.insertedId }, 201);
  } catch (error) {
    console.error('Error posting comment:', error);
    sendJson(res, { error: 'Failed to post comment' }, 500);
  }
}

// --- Server ---

async function startServer() {
  const PORT = 3000;

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // Watch posts directory in dev mode — invalidate cache on changes
  if (!IS_PROD) {
    fs.watch(POSTS_DIR, { recursive: true }, () => invalidateCache());
  }

  // Pre-warm the cache
  ensureCache();

  // Set up Vite dev server or production static files
  let vite: Awaited<ReturnType<typeof createViteServer>> | null = null;
  if (!IS_PROD) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  const COMMENT_RE = /^\/api\/posts\/(.+)\/comments$/;
  const POST_RE = /^\/api\/posts\/(.+?)(?:\.json)?$/;

  const server = createHttpServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    // --- API Routes ---

    // GET /api/posts
    if ((url.pathname === '/api/posts' || url.pathname === '/api/posts.json') && req.method === 'GET') {
      handleGetPosts(res);
      return;
    }

    // Comment routes: /api/posts/:slug/comments
    const commentMatch = url.pathname.match(COMMENT_RE);
    if (commentMatch) {
      const slug = decodeURIComponent(commentMatch[1]);
      if (req.method === 'GET') {
        await handleGetComments(slug, res);
        return;
      }
      if (req.method === 'POST') {
        await handlePostComment(slug, req, res);
        return;
      }
    }

    // GET /api/posts/:slug
    const postMatch = url.pathname.match(POST_RE);
    if (postMatch && req.method === 'GET') {
      handleGetPost(decodeURIComponent(postMatch[1]), res);
      return;
    }

    // --- Vite Dev or Static Files ---
    if (vite) {
      vite.middlewares(req, res);
    } else {
      // Production: serve static files from dist/
      const distPath = path.join(__dirname, 'dist');
      let filePath = path.join(distPath, url.pathname);

      // SPA fallback
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html');
      }

      if (fs.existsSync(filePath)) {
        const file = Bun.file(filePath);
        res.writeHead(200, { 'Content-Type': file.type });
        file.arrayBuffer().then((buf) => {
          res.end(Buffer.from(buf));
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
