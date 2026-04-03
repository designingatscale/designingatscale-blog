import { useEffect, useState, Fragment } from 'react';
import { ArrowRight, Cpu, Database, Globe, BookOpen, Layers, GitBranch, Users } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import teamData from '../data/team.json';
import { AuthorCard } from '../components/AuthorCard';

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

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

      {/* Contact */}
      <div className="mb-16">
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
        >
          Get in touch
        </h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(17,17,16,0.5)' }}>
          For now, reach out to the founder directly. Team contact details will be added as we grow.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/anthanhphan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: '#111110', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2a2a28'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#111110'}
          >
            <GithubIcon size={15} /> GitHub
          </a>
          <a
            href="https://linkedin.com/in/anthanhphan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: '#0A66C2', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#084e99'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0A66C2'}
          >
            <LinkedinIcon size={15} /> LinkedIn
          </a>
          <a
            href="mailto:an.thanhphan.work@gmail.com"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(17,17,16,0.7)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.09)'; (e.currentTarget as HTMLElement).style.color = '#111110'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.7)'; }}
          >
            Email
          </a>
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
