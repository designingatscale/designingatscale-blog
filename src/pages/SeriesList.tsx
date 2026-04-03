import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import { Post } from '../types';
import { Layers } from 'lucide-react';

export default function SeriesList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const seriesGroups = useMemo(() => {
    const groups: Record<string, Post[]> = {};
    posts.forEach(post => {
      if (post.series) {
        if (!groups[post.series.name]) groups[post.series.name] = [];
        groups[post.series.name].push(post);
      }
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.series?.order || 0) - (b.series?.order || 0));
    });
    return groups;
  }, [posts]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#059669' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="pb-10 border-b mb-12" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.03em' }}
        >
          Series
        </h1>
        <p className="text-lg" style={{ color: 'rgba(17,17,16,0.45)' }}>
          Curated multi-part articles on specific engineering topics, meant to be read in order.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(seriesGroups).map(([seriesName, seriesPosts]) => (
          <div
            key={seriesName}
            className="rounded-2xl p-7"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}
              >
                <Layers size={17} />
              </div>
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
              >
                {seriesName}
              </h2>
              <span className="ml-auto text-[11px] font-mono flex-shrink-0" style={{ color: 'rgba(17,17,16,0.3)' }}>
                {seriesPosts.length} parts
              </span>
            </div>

            <div className="relative pl-5" style={{ borderLeft: '2px solid rgba(0,0,0,0.07)' }}>
              <div className="space-y-5">
                {seriesPosts.map((post, index) => (
                  <Link
                    key={post.slug}
                    to={`/post/${post.slug}`}
                    className="group flex items-start gap-4"
                  >
                    <span
                      className="text-[11px] font-mono font-bold flex-shrink-0 mt-0.5 w-10"
                      style={{ color: index === 0 ? '#059669' : 'rgba(17,17,16,0.25)' }}
                    >
                      {String(post.series?.order).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className="text-sm font-semibold mb-0.5 transition-colors group-hover:text-[#059669]"
                        style={{ color: '#111110', letterSpacing: '-0.01em' }}
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-1" style={{ color: 'rgba(17,17,16,0.4)' }}>
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}

        {Object.keys(seriesGroups).length === 0 && (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px dashed rgba(0,0,0,0.1)' }}
          >
            <p style={{ color: 'rgba(17,17,16,0.35)' }}>No series yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
