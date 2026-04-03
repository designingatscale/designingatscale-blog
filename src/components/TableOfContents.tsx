import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { slugify } from './MarkdownRenderer';
import katex from 'katex';

interface TocItem {
    level: number;
    text: string;
    id: string;
}

function extractHeadings(markdown: string): TocItem[] {
    const items: TocItem[] = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock) continue;

        const match = /^(#{2,3})\s+(.+)$/.exec(line);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            items.push({ level, text, id: slugify(text) });
        }
    }
    return items;
}

/** Shorten a heading by removing the "—" subtitle portion */
function shortenTitle(text: string): string {
    const idx = text.indexOf('—');
    if (idx > 0) return text.slice(0, idx).trim();
    const dash = text.indexOf(' - ');
    if (dash > 0) return text.slice(0, dash).trim();
    return text;
}

/** Render inline $...$ math in text using KaTeX */
function renderTextWithMath(text: string): string {
    return text.replace(/\$([^$]+)\$/g, (_, math) => {
        try {
            return katex.renderToString(math, { throwOnError: false, output: 'html' });
        } catch {
            return `$${math}$`;
        }
    });
}

export default function TableOfContents({ content }: { content: string }) {
    const [activeId, setActiveId] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const headings = useMemo(() => extractHeadings(content), [content]);
    const navRef = useRef<HTMLElement>(null);

    // Build section groups
    const sections = useMemo(() => {
        const groups: { heading: TocItem; children: TocItem[] }[] = [];
        for (const h of headings) {
            if (h.level === 2) {
                groups.push({ heading: h, children: [] });
            } else if (h.level === 3 && groups.length > 0) {
                groups[groups.length - 1].children.push(h);
            }
        }
        return groups;
    }, [headings]);

    const handleScroll = useCallback(() => {
        const ids = headings.map(h => h.id);
        let current = '';
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= 100) {
                current = id;
            }
        }
        setActiveId(current);

        const article = document.querySelector('article');
        const marker = document.querySelector('[data-article-end]');
        if (article && marker) {
            const articleTop = article.getBoundingClientRect().top + window.scrollY;
            const markerTop = marker.getBoundingClientRect().top + window.scrollY;
            const viewBottom = window.scrollY + window.innerHeight;
            const contentHeight = markerTop - articleTop;
            const p = contentHeight > 0 ? (viewBottom - articleTop) / contentHeight : 0;
            setProgress(Math.max(0, Math.min(p, 1)));
        }
    }, [headings]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    if (headings.length < 2) return null;

    // Find which section is currently active
    const activeSectionIdx = sections.findIndex(s =>
        s.heading.id === activeId || s.children.some(c => c.id === activeId)
    );

    return (
        <nav
            ref={navRef}
            className="toc-nav sticky top-24"
            style={{ width: '200px', maxHeight: 'calc(100vh - 7rem)', overflowY: 'auto' }}
        >
            {/* Progress bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '4px'
                }}>
                    <span style={{
                        fontSize: '10px', fontFamily: 'var(--font-mono)',
                        fontWeight: 600, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: '#94a3b8'
                    }}>
                        On this page
                    </span>
                    <span style={{
                        fontSize: '10px', fontFamily: 'var(--font-mono)',
                        color: '#cbd5e1', marginLeft: 'auto'
                    }}>
                        {Math.round(progress * 100)}%
                    </span>
                </div>
                <div style={{
                    height: '2px', background: '#f1f5f9', borderRadius: '1px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%', borderRadius: '1px',
                        width: `${progress * 100}%`,
                        background: '#8b5cf6',
                        transition: 'width 0.3s ease-out'
                    }} />
                </div>
            </div>

            {/* Section list */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sections.map((section, idx) => {
                    const isActive = activeSectionIdx === idx;
                    const isPast = activeSectionIdx >= 0 && idx < activeSectionIdx;
                    const shortTitle = shortenTitle(section.heading.text);

                    return (
                        <li key={section.heading.id} style={{ marginBottom: isActive && section.children.length > 0 ? '4px' : '2px' }}>
                            {/* H2 link */}
                            <a
                                href={`#${section.heading.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(section.heading.id);
                                    if (el) {
                                        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    padding: '4px 0',
                                    fontSize: '12.5px',
                                    lineHeight: '1.4',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#7c3aed' : isPast ? '#c4b5fd' : '#64748b',
                                    textDecoration: 'none',
                                    transition: 'color 0.15s',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) (e.currentTarget as HTMLElement).style.color = '#475569';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) (e.currentTarget as HTMLElement).style.color = isPast ? '#c4b5fd' : '#64748b';
                                }}
                            >
                                {/* Active dot */}
                                <span style={{
                                    flexShrink: 0,
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    marginTop: '5px',
                                    background: isActive ? '#8b5cf6' : 'transparent',
                                    transition: 'background 0.2s',
                                }} />
                                <span dangerouslySetInnerHTML={{ __html: renderTextWithMath(shortTitle) }} />
                            </a>

                            {/* H3 children — only show for active section */}
                            {isActive && section.children.length > 0 && (
                                <ul style={{
                                    listStyle: 'none', padding: 0, margin: '2px 0 6px 13px',
                                    borderLeft: '1.5px solid #ede9fe',
                                }}>
                                    {section.children.map((child) => {
                                        const isChildActive = activeId === child.id;
                                        const childTitle = shortenTitle(child.text);
                                        return (
                                            <li key={child.id}>
                                                <a
                                                    href={`#${child.id}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const el = document.getElementById(child.id);
                                                        if (el) {
                                                            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'block',
                                                        padding: '2px 0 2px 10px',
                                                        fontSize: '11px',
                                                        lineHeight: '1.5',
                                                        fontWeight: isChildActive ? 500 : 400,
                                                        color: isChildActive ? '#7c3aed' : '#94a3b8',
                                                        textDecoration: 'none',
                                                        transition: 'color 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isChildActive) (e.currentTarget as HTMLElement).style.color = '#64748b';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isChildActive) (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                                                    }}
                                                >
                                                <span dangerouslySetInnerHTML={{ __html: renderTextWithMath(childTitle) }} />
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
