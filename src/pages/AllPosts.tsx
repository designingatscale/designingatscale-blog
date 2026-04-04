import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchPosts, getPostsCache } from '../services/api';
import { Post } from '../types';
import { format } from 'date-fns';
import { ArrowRight, Search, Star, Layers, X, Cpu, Database, Globe, Zap, Tag, User } from 'lucide-react';

const topicIcons: Record<string, React.ElementType> = {
  'Systems': Cpu,
  'Database': Database,
  'Networking': Globe,
  'Performance': Zap,
};

function TopicIcon({ topic }: { topic: string }) {
  const Icon = topicIcons[topic] || Tag;
  return <Icon size={13} />;
}

/** Get initials from a name, e.g. "An Thanh Phan" → "AT" */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable hue from a string for avatar background */
function stringHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function AuthorAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const hue = stringHue(name);
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 55%, 92%)`,
        color: `hsl(${hue}, 55%, 35%)`,
        fontSize: size * 0.36,
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: '-0.01em',
      }}
    >
      {initials(name)}
    </div>
  );
}

export default function AllPosts() {
  const cached = getPostsCache();
  const [posts, setPosts] = useState<Post[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const selectedTopic = searchParams.get('topic') || 'All';
  const selectedAuthor = searchParams.get('author') || 'All';

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topics = useMemo(() => {
    const topicSet = new Set(posts.map(p => p.topic || 'Uncategorized'));
    return ['All', ...Array.from(topicSet)];
  }, [posts]);

  const authors = useMemo(() => {
    const authorSet = new Set(posts.map(p => p.author || 'An Thanh Phan'));
    return ['All', ...Array.from(authorSet).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const postAuthor = post.author || 'An Thanh Phan';
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTopic = selectedTopic === 'All' || post.topic === selectedTopic;
      const matchesAuthor = selectedAuthor === 'All' || postAuthor === selectedAuthor;
      return matchesSearch && matchesTopic && matchesAuthor;
    });
  }, [posts, searchQuery, selectedTopic, selectedAuthor]);

  const authorPostCount = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => {
      const a = p.author || 'An Thanh Phan';
      counts[a] = (counts[a] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, Post[]> = {};
    filteredPosts.forEach(post => {
      const year = new Date(post.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });
    return groups;
  }, [filteredPosts]);

  const years = Object.keys(groupedPosts).sort((a, b) => parseInt(b) - parseInt(a));

  const updateSearch = useCallback((val: string) => {
    setSearchParams(prev => {
      if (val) prev.set('q', val); else prev.delete('q');
      return prev;
    });
  }, [setSearchParams]);

  const updateTopic = useCallback((val: string) => {
    setSearchParams(prev => {
      if (val && val !== 'All') prev.set('topic', val); else prev.delete('topic');
      return prev;
    });
  }, [setSearchParams]);

  const updateAuthor = useCallback((val: string) => {
    setSearchParams(prev => {
      if (val && val !== 'All') prev.set('author', val); else prev.delete('author');
      return prev;
    });
  }, [setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const hasFilters = searchQuery || selectedTopic !== 'All' || selectedAuthor !== 'All';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#059669' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="pb-8 border-b mb-8" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.03em' }}
        >
          All Posts
        </h1>
        <p className="text-sm" style={{ color: 'rgba(17,17,16,0.4)' }}>
          {posts.length} articles. Storage engines, consensus algorithms, network protocols, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-8">

            {/* Search */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(17,17,16,0.28)', letterSpacing: '0.1em' }}>
                Search
              </p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(17,17,16,0.3)' }} />
                <input
                  type="text"
                  placeholder="Search posts…"
                  value={searchQuery}
                  onChange={e => updateSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', color: '#111110' }}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(5,150,105,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(5,150,105,0.07)'; }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                />
                {searchQuery && (
                  <button
                    onClick={() => updateSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(17,17,16,0.3)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#111110'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.3)'}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Authors */}
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(17,17,16,0.28)', letterSpacing: '0.1em' }}>
                  Authors
                </p>
                <div className="flex flex-col gap-1.5">
                  {/* All authors row */}
                  <button
                    onClick={() => updateAuthor('All')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left w-full"
                    style={selectedAuthor === 'All'
                      ? { background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)' }
                      : { background: 'transparent', color: 'rgba(17,17,16,0.5)', border: '1px solid transparent' }
                    }
                    onMouseEnter={e => { if (selectedAuthor !== 'All') { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.color = '#111110'; } }}
                    onMouseLeave={e => { if (selectedAuthor !== 'All') { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.5)'; } }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: selectedAuthor === 'All' ? 'rgba(5,150,105,0.15)' : 'rgba(0,0,0,0.06)' }}
                    >
                      <User size={12} style={{ color: selectedAuthor === 'All' ? '#059669' : 'rgba(17,17,16,0.35)' }} />
                    </div>
                    <span className="flex-1 truncate">All authors</span>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: selectedAuthor === 'All' ? '#059669' : 'rgba(17,17,16,0.25)' }}>
                      {posts.length}
                    </span>
                  </button>

                  {/* Separator */}
                  <div className="my-0.5 h-px mx-3" style={{ background: 'rgba(0,0,0,0.06)' }} />

                  {/* Individual authors */}
                  {authors.filter(a => a !== 'All').map(author => {
                    const isActive = selectedAuthor === author;
                    const count = authorPostCount[author] || 0;
                    return (
                      <button
                        key={author}
                        onClick={() => updateAuthor(author)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left w-full"
                        style={isActive
                          ? { background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)' }
                          : { background: 'transparent', color: 'rgba(17,17,16,0.6)', border: '1px solid transparent' }
                        }
                        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; (e.currentTarget as HTMLElement).style.color = '#111110'; } }}
                        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.6)'; } }}
                      >
                        <AuthorAvatar name={author} size={28} />
                        <span className="flex-1 truncate text-[13px] font-medium">{author}</span>
                        <span
                          className="text-[11px] font-mono flex-shrink-0 tabular-nums"
                          style={{ color: isActive ? '#059669' : 'rgba(17,17,16,0.25)' }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            {/* Topics */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(17,17,16,0.28)', letterSpacing: '0.1em' }}>
                Topics
              </p>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => updateTopic(topic)}
                    className="text-left px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={selectedTopic === topic
                      ? { background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }
                      : { background: 'transparent', color: 'rgba(17,17,16,0.45)', border: '1px solid transparent' }
                    }
                    onMouseEnter={e => { if (selectedTopic !== topic) { (e.currentTarget as HTMLElement).style.color = '#111110'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; } }}
                    onMouseLeave={e => { if (selectedTopic !== topic) { (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.45)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                  >
                    <TopicIcon topic={topic} />
                    <span className="truncate">{topic}</span>
                    {selectedTopic === topic && <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: '#059669' }} />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Post list */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgba(17,17,16,0.3)' }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            </span>
            <div className="flex items-center gap-3">
              {/* Active filter chips */}
              {selectedAuthor !== 'All' && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
                  style={{ background: 'rgba(5,150,105,0.07)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)' }}
                >
                  <AuthorAvatar name={selectedAuthor} size={16} />
                  {selectedAuthor}
                  <button onClick={() => updateAuthor('All')} className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              )}
              {selectedTopic !== 'All' && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
                  style={{ background: 'rgba(5,150,105,0.07)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)' }}
                >
                  <TopicIcon topic={selectedTopic} />
                  {selectedTopic}
                  <button onClick={() => updateTopic('All')} className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              )}
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
                  style={{ color: 'rgba(17,17,16,0.35)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#059669'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.35)'}
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          </div>

          {years.length === 0 ? (
            <div className="text-center py-20 rounded-2xl" style={{ background: '#FFFFFF', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <p style={{ color: 'rgba(17,17,16,0.35)' }}>No posts match your filters.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {years.map(year => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest uppercase"
                      style={{ color: 'rgba(0,0,0,0.25)' }}
                    >
                      {year}
                    </span>
                    <div className="h-px flex-1" style={{ background: 'rgba(0,0,0,0.07)' }} />
                  </div>

                  <div>
                    {groupedPosts[year].map(post => {
                      const postAuthor = post.author || 'An Thanh Phan';
                      return (
                        <article
                          key={post.slug}
                          className="group flex flex-col sm:flex-row gap-4 items-start py-5 -mx-3 px-3 rounded-xl transition-colors duration-200"
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
                                style={post.featured
                                  ? { background: 'rgba(217,119,6,0.08)', color: '#d97706', border: '1px solid rgba(217,119,6,0.15)' }
                                  : { background: 'rgba(0,0,0,0.04)', color: 'rgba(17,17,16,0.4)', border: '1px solid rgba(0,0,0,0.06)' }
                                }
                              >
                                {post.topic}
                              </span>
                              {post.featured && (
                                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#d97706' }}>
                                  <Star size={9} className="fill-current" /> Featured
                                </span>
                              )}
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
                              <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(17,17,16,0.42)' }}>
                                {post.excerpt}
                              </p>
                            </Link>

                            <div className="flex items-center gap-3 mt-2.5">
                              {/* Author chip */}
                              <button
                                onClick={() => updateAuthor(postAuthor)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-mono transition-colors"
                                style={{ color: 'rgba(17,17,16,0.3)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#059669'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.3)'}
                                title={`Filter by ${postAuthor}`}
                              >
                                <AuthorAvatar name={postAuthor} size={16} />
                                {postAuthor}
                              </button>

                              {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[11px] font-mono cursor-default" style={{ color: 'rgba(17,17,16,0.22)' }}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center self-center flex-shrink-0">
                            <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" style={{ color: '#059669' }} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
