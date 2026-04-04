import { useEffect, useState, Fragment } from 'react';
import { ArrowRight, Cpu, Database, Globe, BookOpen, Layers, GitBranch, Users } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import teamData from '../data/team.json';
import { AuthorCard } from '../components/AuthorCard';


const focusAreas = [
  {
    icon: Database,
    title: 'Database Internals',
    description: 'Storage engines, indexing structures, query planners, and the tradeoffs that define how data systems behave under pressure.',
  },
  {
    icon: Globe,
    title: 'Networking & Protocols',
    description: 'Transport layer mechanics, protocol design, connection management — understanding the infrastructure that holds distributed systems together.',
  },
  {
    icon: Cpu,
    title: 'Systems Design',
    description: 'Distributed consensus, consistency models, failure modes, and the architectural decisions that separate robust systems from fragile ones.',
  },
  {
    icon: GitBranch,
    title: 'Data Structures & Algorithms',
    description: 'The foundations that everything else is built on. B-trees, hash tables, graph algorithms, amortized complexity — explored with real implementation depth.',
  },
  {
    icon: Layers,
    title: 'Software Craftsmanship',
    description: 'Clean abstractions, observable systems, and the engineering discipline of writing code that other humans can actually maintain at scale.',
  },
];

export default function About() {
  const { hash } = useLocation();
  const [searchParams] = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (hash !== '#team') return;
    const authorSlug = searchParams.get('author');

    // Scroll to the team section
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById('team');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    if (!authorSlug) return () => clearTimeout(scrollTimer);

    // Highlight specific author after scroll settles
    const highlightTimer = setTimeout(() => {
      setHighlightedId(`team-${authorSlug}`);
    }, 500);
    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 3200);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
      clearTimeout(clearTimer);
    };
  }, [hash, searchParams]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-8 border-b mb-10" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.03em' }}
        >
          What is DesigningAtScale?
        </h1>

        <div className="space-y-3 text-base leading-relaxed" style={{ color: 'rgba(17,17,16,0.6)' }}>
          <p>
            <strong style={{ color: '#111110', fontWeight: 600 }}>DesigningAtScale</strong> is an engineering blog focused on technical depth. We cover systems programming, distributed infrastructure, and the implementation details that most introductory content skips.
          </p>
          <p>
            Articles here start from the internals — storage engines, network protocols, data structures, consensus algorithms — and work outward to design decisions and tradeoffs. The writing assumes you already write code professionally.
          </p>
        </div>
      </div>

      {/* What we cover */}
      <div className="mb-10">
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.025em' }}
        >
          What we cover
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {focusAreas.slice(0, 4).map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl p-5"
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}
                >
                  <Icon size={14} />
                </div>
                <h3
                  className="font-semibold text-sm"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.01em' }}
                >
                  {title}
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed pl-10" style={{ color: 'rgba(17,17,16,0.48)' }}>
                {description}
              </p>
            </div>
          ))}
        </div>
        {focusAreas.length > 4 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs font-mono" style={{ color: 'rgba(17,17,16,0.3)' }}>and more:</span>
            {focusAreas.slice(4).map(({ title }) => (
              <span
                key={title}
                className="text-xs font-mono px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(17,17,16,0.45)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                {title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Philosophy */}
      <div className="mb-10 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
        >
          How we approach writing
        </h2>
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(17,17,16,0.58)' }}>
          <p>
            Each article focuses on a specific concept or system component. We try to be precise rather than broad — covering one thing well rather than surveying a topic at surface level.
          </p>
          <p>
            Posts include implementation details where relevant: real code, actual complexity tradeoffs, concrete examples from production systems. Diagrams are used when they clarify, not to fill space.
          </p>
        </div>
      </div>

      {/* Team */}
      <div id="team" className="mb-10 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>
            <Users size={15} />
          </div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
          >
            The team
          </h2>
        </div>

        <div className="rounded-2xl p-7" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          {teamData.map((member, idx) => {
            const memberId = `team-${member.slug}`;
            const isHighlighted = highlightedId === memberId;
            const ringColor = member.color;
            const ringRgb = member.color === '#059669'
              ? '5,150,105'
              : member.color === '#6366f1'
                ? '99,102,241'
                : '17,17,16';

            return (
              <Fragment key={member.slug}>
                {idx > 0 && (
                  <div className="my-6 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
                )}
                <div id={memberId} className="relative flex items-start gap-5 scroll-mt-24">
                  {/* Focus ring */}
                  {isHighlighted && (
                    <div style={{
                      position: 'absolute', inset: '-8px', borderRadius: '18px',
                      border: `1.5px solid ${ringColor}80`,
                      boxShadow: `0 0 0 4px rgba(${ringRgb},0.07)`,
                      pointerEvents: 'none',
                      animation: 'authorRingFade 2.5s ease-out forwards',
                    }} />
                  )}

                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                    style={{ background: member.colorBg, color: member.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {member.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-bold" style={{ color: '#111110', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {member.name}
                      </h3>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          background: `${member.color}12`,
                          color: member.color,
                          border: `1px solid ${member.color}26`,
                        }}
                      >
                        {member.role}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(17,17,16,0.5)' }}>
                      {member.title}
                    </p>

                    {/* Contact links via shared AuthorCard (light variant) */}
                    <AuthorCard member={member} variant="light" />
                  </div>
                </div>
              </Fragment>
            );
          })}

          {/* More authors placeholder */}
          <div
            className="mt-6 pt-6 flex items-center gap-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div
              className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center flex-shrink-0"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            >
              <span style={{ color: 'rgba(17,17,16,0.2)', fontSize: '1rem' }}>+</span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(17,17,16,0.35)' }}>More authors joining soon.</p>
          </div>
        </div>
      </div>


      {/* CTA */}
      <div
        className="rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={15} style={{ color: '#059669' }} />
            <span className="text-sm font-semibold" style={{ color: '#111110' }}>Start reading</span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(17,17,16,0.5)' }}>
            Browse all articles or follow a structured series.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: '#059669', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#047857'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#059669'}
          >
            All posts <ArrowRight size={14} />
          </Link>
          <Link
            to="/series"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(17,17,16,0.65)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.color = '#111110'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.65)'; }}
          >
            Series
          </Link>
        </div>
      </div>
    </div>
  );
}
