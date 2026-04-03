import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPost } from '../services/api';
import { Post } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Layers, Folder, Clock } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import TableOfContents from '../components/TableOfContents';
import teamData from '../data/team.json';
import { AuthorCard } from '../components/AuthorCard';

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug)
        .then(setPost)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
  if (error || !post) return <div className="text-center py-20 text-red-600 font-mono">Error: {error || 'Post not found'}</div>;

  const postContent = (post.content || '').replace(/^\s*#\s+.+\n*/m, '');
  const readTime = estimateReadTime(postContent);

  // Lookup author contact info from team.json
  const authorName = post.author || 'An Thanh Phan';
  const authorSlug = authorName.toLowerCase().replace(/\s+/g, '-');
  const teamMember = teamData.find(m => m.slug === authorSlug) ?? null;

  return (
    <div className="post-page">
      {/* Hero header */}
      <div className="post-hero">
        <div className="post-hero-inner">
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] mb-8 font-mono transition-colors group" style={{ color: 'rgba(110,231,183,0.5)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6EE7B7'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(110,231,183,0.5)'}>
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Index
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-white/70 font-mono uppercase tracking-wider backdrop-blur-sm border border-white/10">
              <Folder size={10} />
              {post.topic || 'Uncategorized'}
            </span>
            {post.series && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-200 font-mono uppercase tracking-wider backdrop-blur-sm border border-violet-400/20">
                <Layers size={10} />
                Series: {post.series.name}
              </span>
            )}
          </div>

          <h1
            className="font-bold font-sans leading-[1.1] tracking-[-0.035em] text-white mb-6"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              maxWidth: '52ch',
              textWrap: 'balance',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {post.title}
          </h1>

          {/* Meta row: date + read time only */}
          <div className="flex items-center gap-3 text-white/35 text-[12px] mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <time className="font-mono">{format(new Date(post.date), 'MMM d, yyyy')}</time>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span className="font-mono">{readTime} min read</span>
            </div>
          </div>

          {/* Author card */}
          {teamMember
            ? <AuthorCard member={teamMember} variant="hero" />
            : (
              /* Fallback if author not in team.json */
              <Link
                to={`/about?author=${authorSlug}#team`}
                className="text-sm font-mono transition-colors hover:underline"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {authorName}
              </Link>
            )
          }
        </div>
      </div>

      {/* Content area */}
      <div className="post-body-wrapper">
        <div className="post-body-grid">
          {/* Main content — white surface */}
          <article className="post-article">
            {post.series && post.seriesPosts && post.seriesPosts.length > 0 && (
              <div className="mb-10 bg-gradient-to-br from-slate-50 to-violet-50/30 border border-slate-200/60 rounded-xl p-5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers size={11} />
                  Series: {post.series.name}
                </h3>
                <div className="flex flex-col gap-0.5">
                  {post.seriesPosts.map(p => (
                    <Link
                      key={p.slug}
                      to={`/post/${p.slug}`}
                      className={`text-sm py-1.5 px-3 rounded-lg transition-colors flex items-center gap-3 ${p.slug === post.slug
                        ? 'bg-violet-100/60 text-violet-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                        }`}
                    >
                      <span className={`font-mono text-[11px] w-10 flex-shrink-0 ${p.slug === post.slug ? 'opacity-100' : 'opacity-40'}`}>Part {p.order}</span>
                      <span className="truncate">{p.title}</span>
                      {p.slug === post.slug && <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-violet-400 hidden sm:inline-block">Reading</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pb-10">
              <MarkdownRenderer content={postContent} />
            </div>

            {/* Tags */}
            <div className="pb-8">
              <div className="pt-8 border-t border-slate-100">
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 font-mono hover:bg-violet-50 hover:text-violet-600 transition-all duration-200 cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div data-article-end />
          </article>

          {/* TOC sidebar */}
          <aside className="post-toc-sidebar hidden xl:block">
            <TableOfContents content={postContent} />
          </aside>
        </div>

        {/* Comments — full width, outside the grid */}
        {slug && (
          <div className="max-w-[860px] mx-auto px-2 pb-12">
            <CommentSection slug={slug} />
          </div>
        )}
      </div>
    </div>
  );
}
