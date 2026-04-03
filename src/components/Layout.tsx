import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ArrowUpRight, Copy, Check } from 'lucide-react';

const GithubIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

const LinkedinIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

// Brand logo mark — emerald D on light bg
const LogoMark = () => (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="30" rx="7" fill="#059669" />
        <text
            x="15"
            y="21.5"
            textAnchor="middle"
            fontFamily="'Bricolage Grotesque', sans-serif"
            fontWeight="800"
            fontSize="15"
            fill="#FFFFFF"
            letterSpacing="-0.5"
        >
            D
        </text>
    </svg>
);

function ContactLink({ href, icon: Icon, text, copyText }: {
    href: string;
    icon: React.ElementType;
    text: string;
    copyText?: string;
}) {
    const [copied, setCopied] = React.useState(false);
    const isMail = href.startsWith('mailto:');

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isMail) {
            const textToCopy = copyText || text;
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } else {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-3 text-sm transition-all group w-full text-left cursor-pointer"
            style={{ color: 'rgba(240,238,232,0.45)' }}
        >
            <Icon size={15} className="flex-shrink-0" />
            <span className="truncate group-hover:text-white transition-colors">{text}</span>
            {isMail && (
                <span className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied ? (
                        <Check size={13} style={{ color: '#6EE7B7' }} />
                    ) : (
                        <Copy size={13} />
                    )}
                </span>
            )}
            {!isMail && (
                <ArrowUpRight size={13} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isVisible, setIsVisible] = React.useState(true);
    const lastScrollY = React.useRef(0);

    const isActive = (path: string) => location.pathname === path;

    React.useEffect(() => {
        setIsVisible(true);
    }, [location.pathname]);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (location.pathname.startsWith('/post/')) {
                if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
            } else {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F7F6F2', color: '#111110' }}>
            {/* Header */}
            <header
                className={`sticky top-0 z-20 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
            >
                {/* Accent line */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #059669, transparent)', opacity: 0.5 }} />
                <div style={{ background: 'rgba(247,246,242,0.92)', backdropFilter: 'blur(20px)' }}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 group">
                            <LogoMark />
                            <span
                                className="font-bold text-base tracking-tight transition-colors"
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#111110', letterSpacing: '-0.02em' }}
                            >
                                DesigningAtScale
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1">
                            <Link
                                to="/posts"
                                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                                style={isActive('/posts')
                                    ? { color: '#059669', background: 'rgba(5,150,105,0.07)' }
                                    : { color: 'rgba(17,17,16,0.45)' }}
                                onMouseEnter={e => { if (!isActive('/posts')) (e.currentTarget as HTMLElement).style.color = '#111110'; }}
                                onMouseLeave={e => { if (!isActive('/posts')) (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.45)'; }}
                            >
                                Posts
                            </Link>
                            <Link
                                to="/series"
                                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                                style={isActive('/series')
                                    ? { color: '#059669', background: 'rgba(5,150,105,0.07)' }
                                    : { color: 'rgba(17,17,16,0.45)' }}
                                onMouseEnter={e => { if (!isActive('/series')) (e.currentTarget as HTMLElement).style.color = '#111110'; }}
                                onMouseLeave={e => { if (!isActive('/series')) (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.45)'; }}
                            >
                                Series
                            </Link>
                            <Link
                                to="/topics"
                                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                                style={isActive('/topics')
                                    ? { color: '#059669', background: 'rgba(5,150,105,0.07)' }
                                    : { color: 'rgba(17,17,16,0.45)' }}
                                onMouseEnter={e => { if (!isActive('/topics')) (e.currentTarget as HTMLElement).style.color = '#111110'; }}
                                onMouseLeave={e => { if (!isActive('/topics')) (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.45)'; }}
                            >
                                Topics
                            </Link>
                            <Link
                                to="/about"
                                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                                style={isActive('/about')
                                    ? { color: '#059669', background: 'rgba(5,150,105,0.07)' }
                                    : { color: 'rgba(17,17,16,0.45)' }}
                                onMouseEnter={e => { if (!isActive('/about')) (e.currentTarget as HTMLElement).style.color = '#111110'; }}
                                onMouseLeave={e => { if (!isActive('/about')) (e.currentTarget as HTMLElement).style.color = 'rgba(17,17,16,0.45)'; }}
                            >
                                About
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </main>

            {/* Footer */}
            <footer style={{ background: '#1a1a18', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
                        {/* Brand column */}
                        <div className="md:col-span-5 space-y-5">
                            <div className="flex items-center gap-3">
                                <LogoMark />
                                <span
                                    className="font-bold text-lg tracking-tight"
                                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#F0EEE8', letterSpacing: '-0.02em' }}
                                >
                                    DesigningAtScale
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'rgba(240,238,232,0.35)' }}>
                                Distributed systems, database internals, and the engineering discipline of building reliable software at scale.
                            </p>
                        </div>

                        {/* Navigation column */}
                        <div className="md:col-span-3">
                            <h3
                                className="text-xs uppercase tracking-widest mb-5"
                                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(240,238,232,0.2)', letterSpacing: '0.12em' }}
                            >
                                Navigate
                            </h3>
                            <ul className="space-y-3">
                                {[{ to: '/', label: 'Home' }, { to: '/posts', label: 'Posts' }, { to: '/series', label: 'Series' }, { to: '/topics', label: 'Topics' }, { to: '/about', label: 'About' }].map(({ to, label }) => (
                                    <li key={to}>
                                        <Link
                                            to={to}
                                            className="text-sm transition-colors inline-flex items-center gap-1.5 group"
                                            style={{ color: 'rgba(240,238,232,0.35)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6EE7B7'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(240,238,232,0.35)'}
                                        >
                                            {label}
                                            <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact column */}
                        <div className="md:col-span-4">
                            <h3
                                className="text-xs uppercase tracking-widest mb-5"
                                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(240,238,232,0.2)', letterSpacing: '0.12em' }}
                            >
                                Get in touch
                            </h3>
                            <div className="space-y-4">
                                <ContactLink href="mailto:an.thanhphan.work@gmail.com" icon={Mail} text="an.thanhphan.work@gmail.com" copyText="an.thanhphan.work@gmail.com" />
                                <ContactLink href="https://github.com/anthanhphan" icon={GithubIcon} text="github.com/anthanhphan" />
                                <ContactLink href="https://linkedin.com/in/anthanhphan" icon={LinkedinIcon} text="linkedin.com/in/anthanhphan" />
                            </div>
                        </div>
                    </div>

                    {/* Copyright bar */}
                    <div
                        className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <p className="text-xs font-mono" style={{ color: 'rgba(240,238,232,0.2)' }}>
                            &copy; {new Date().getFullYear()} An Thanh Phan
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'rgba(240,238,232,0.12)' }}>
                            Built with React &middot; Crafted with care
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
