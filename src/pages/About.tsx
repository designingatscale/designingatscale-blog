import { useEffect, useState, Fragment } from 'react';
import { ArrowRight, Cpu, Database, Globe, BookOpen, Layers, GitBranch } from 'lucide-react';
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
      <div className="pb-10 border-b mb-12" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.03em' }}
        >
          About
        </h1>
        <p className="text-lg" style={{ color: 'rgba(17,17,16,0.45)' }}>
          An engineering blog that goes deeper than most. We write about the internals of systems you already rely on — storage engines, network protocols, distributed algorithms — and the design decisions that separate code that holds from code that falls apart.
        </p>
        <p className="text-base mt-3 leading-relaxed" style={{ color: 'rgba(17,17,16,0.38)' }}>
          Articles here assume you write code professionally. We skip the preamble and get straight to how things actually work: implementation details, real tradeoffs, and the kind of reasoning you'd find in a design doc or a postmortem, not a tutorial.
        </p>
      </div>

      {/* What we write about */}
      <div className="mb-12">
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.025em' }}
        >
          What we write about
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

      {/* Members */}
      <div id="team" className="mb-12 scroll-mt-24">
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
        >
          Members
        </h2>

        <div className="space-y-1">
          {teamData.map((member) => {
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
                <div
                  id={memberId}
                  className="relative flex items-center gap-4 px-4 py-4 -mx-4 rounded-xl scroll-mt-24 transition-colors duration-150"
                  style={{ background: isHighlighted ? `rgba(${ringRgb},0.04)` : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.025)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isHighlighted ? `rgba(${ringRgb},0.04)` : 'transparent'}
                >
                  {isHighlighted && (
                    <div style={{
                      position: 'absolute', inset: '0', borderRadius: '12px',
                      border: `1.5px solid ${ringColor}50`,
                      pointerEvents: 'none',
                      animation: 'authorRingFade 2.5s ease-out forwards',
                    }} />
                  )}

                  {/* Avatar circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: member.colorBg, color: member.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {member.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: '#111110', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {member.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: member.color, opacity: 0.7 }}>
                        {member.role}
                      </span>
                      <span style={{ color: 'rgba(17,17,16,0.15)', fontSize: '0.6rem' }}>·</span>
                      <AuthorCard member={member} variant="light" />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(17,17,16,0.4)' }}>
                      {member.title}
                    </p>
                  </div>
                </div>
              </Fragment>
            );
          })}

          <p className="text-xs font-mono px-4 pt-3" style={{ color: 'rgba(17,17,16,0.22)' }}>
            + More members coming
          </p>
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
            Browse all articles or start with a structured series.
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
