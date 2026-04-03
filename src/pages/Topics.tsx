import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import { Post } from '../types';
import { ArrowRight, BookOpen, Cpu, Database, Globe, Zap, Hash } from 'lucide-react';

const topicIcons: Record<string, React.ElementType> = {
  'Systems': Cpu,
  'Database': Database,
  'Networking': Globe,
  'Performance': Zap,
};

export default function Topics() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topics = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    posts.forEach(post => {
      const topic = post.topic || 'Uncategorized';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    return Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#059669' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="pb-10 border-b mb-12" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.03em' }}
        >
          Topics
        </h1>
        <p className="text-lg" style={{ color: 'rgba(17,17,16,0.45)' }}>
          Browse articles by subject area. From database internals to distributed system theory.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map(([topic, count]) => {
          const Icon = topicIcons[topic] || Hash;
          return (
            <Link
              key={topic}
              to={`/posts?topic=${encodeURIComponent(topic)}`}
              className="group rounded-2xl p-6 transition-all duration-200 overflow-hidden relative"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(5,150,105,0.3)';
                el.style.boxShadow = '0 8px 24px rgba(5,150,105,0.07)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(0,0,0,0.07)';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'rgba(5,150,105,0.04)' }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}
              >
                <Icon size={18} />
              </div>

              <h2
                className="text-lg font-bold mb-1.5 transition-colors group-hover:text-[#047857]"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
              >
                {topic}
              </h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(17,17,16,0.4)' }}>
                  <BookOpen size={13} />
                  {count} {count === 1 ? 'article' : 'articles'}
                </div>
                <ArrowRight
                  size={15}
                  className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  style={{ color: '#059669' }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
