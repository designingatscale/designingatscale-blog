import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import { Post } from '../types';
import { format } from 'date-fns';
import { ArrowRight, Star, Layers } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredPosts = useMemo(() => {
    return posts
      .filter(p => p.featured)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [posts]);

  // Recent posts: exclude featured, sort latest first, show max 10
  const recentPosts = useMemo(() => {
    return posts
      .filter(p => !p.featured)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [posts]);

  const hasMore = posts.filter(p => !p.featured).length > 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#059669' }} />
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero ────────────────────────────────────── */}
      <section className="pt-0 pb-10 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>

        <h1
          className="text-5xl sm:text-6xl font-bold leading-[1.06] mb-5 max-w-3xl"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.035em', color: '#111110' }}
        >
          Building systems that{' '}
          <em className="not-italic whitespace-nowrap" style={{ color: '#059669' }}>don't break</em>{' '}
          at scale.
        </h1>

        <p className="text-lg max-w-xl leading-relaxed mb-6" style={{ color: 'rgba(17,17,16,0.42)', fontWeight: 400 }}>
          Distributed systems, database internals, protocol design — and the engineering discipline of building reliable software.
        </p>

        <div className="flex items-center gap-4">
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: '#059669', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#047857'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#059669'}
          >
            Browse all posts <ArrowRight size={15} />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(17,17,16,0.7)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.color = '#111110'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.7)'; }}
          >
            About
          </Link>
        </div>
      </section>

      {/* ── Featured Posts ───────────────────────────── */}
      {featuredPosts.length > 0 && (
        <section className="py-8 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <Star size={12} style={{ color: '#d97706' }} className="fill-current" />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(17,17,16,0.28)' }}>
              Featured
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {featuredPosts.map((post, idx) => (
              <Link
                key={post.slug}
                to={`/post/${post.slug}`}
                className={`group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden ${idx === 0 ? 'lg:col-span-2' : ''}`}
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(5,150,105,0.3)';
                  el.style.boxShadow = '0 8px 32px rgba(5,150,105,0.07)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(0,0,0,0.07)';
                  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(5,150,105,0.04), transparent 60%)' }} />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.15)' }}
                    >
                      {post.topic}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'rgba(17,17,16,0.28)' }}>
                      {format(new Date(post.date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <h2
                    className={`font-bold leading-tight mb-3 transition-colors group-hover:text-[#047857] ${idx === 0 ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.025em' }}
                  >
                    {post.title}
                  </h2>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(17,17,16,0.45)' }}>
                    {post.excerpt}
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#059669' }}>
                    Read article <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Posts ────────────────────────────── */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
          >
            Recent writings
          </h2>
          <Link
            to="/posts"
            className="text-[12px] font-medium inline-flex items-center gap-1 transition-colors"
            style={{ color: 'rgba(17,17,16,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#059669'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.35)'; }}
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>

        <div>
          {recentPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col sm:flex-row gap-4 items-start py-4 -mx-3 px-3 rounded-xl transition-colors duration-200"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.015)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {/* Date */}
              <div className="sm:w-12 flex-shrink-0 pt-0.5">
                <span className="block text-lg font-bold font-mono leading-none" style={{ color: 'rgba(0,0,0,0.22)' }}>
                  {format(new Date(post.date), 'dd')}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wider font-mono mt-0.5" style={{ color: 'rgba(0,0,0,0.28)' }}>
                  {format(new Date(post.date), 'MMM')}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(17,17,16,0.4)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    {post.topic}
                  </span>
                  {post.series && (
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#059669' }}>
                      <Layers size={9} /> {post.series.name}
                    </span>
                  )}
                </div>

                <Link to={`/post/${post.slug}`} className="block">
                  <h3
                    className="text-base font-bold mb-1 transition-colors group-hover:text-[#059669]"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.015em' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-1" style={{ color: 'rgba(17,17,16,0.42)' }}>
                    {post.excerpt}
                  </p>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* View all CTA */}
        {hasMore && (
          <div className="mt-8 text-center">
            <Link
              to="/posts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(17,17,16,0.65)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.08)'; (e.currentTarget as HTMLElement).style.color = '#059669'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.65)'; }}
            >
              View all writings <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#FFFFFF', border: '1px dashed rgba(0,0,0,0.1)' }}>
            <p style={{ color: 'rgba(17,17,16,0.35)' }}>No writings yet. Stay tuned.</p>
          </div>
        )}
      </section>
    </div>
  );
}
