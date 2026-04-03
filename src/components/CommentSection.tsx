import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchComments, postComment } from '../services/api';
import { Comment } from '../types';
import { MessageSquare, Send, LogIn, Reply, Code, ChevronDown, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Google Identity Services types
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        config: {
                            theme?: string;
                            size?: string;
                            text?: string;
                            shape?: string;
                            width?: number;
                        }
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleUser {
    name: string;
    picture: string;
    credential: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

const AVATAR_COLORS = [
    ['#6366f1', '#e0e7ff'], // indigo
    ['#0891b2', '#cffafe'], // cyan
    ['#059669', '#d1fae5'], // emerald
    ['#d97706', '#fef3c7'], // amber
    ['#e11d48', '#ffe4e6'], // rose
    ['#7c3aed', '#ede9fe'], // violet
    ['#0d9488', '#ccfbf1'], // teal
    ['#db2777', '#fce7f3'], // pink
];

function getAvatarColor(name: string): [string, string] {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function UserAvatar({ src, name, size = 32 }: { src: string; name: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const [fg, bg] = getAvatarColor(name);

    if (failed || !src) {
        return (
            <div
                style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size * 0.35 }}
                className="rounded-full flex items-center justify-center font-bold select-none flex-shrink-0"
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            style={{ width: size, height: size }}
            className="rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setFailed(true)}
        />
    );
}

/** Render content with code block support */
function CommentContent({ content }: { content: string }) {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="text-[13.5px] leading-[1.7] text-[#374151]">
            {parts.map((part, i) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const inner = part.slice(3, -3);
                    const newlineIdx = inner.indexOf('\n');
                    const lang = newlineIdx > 0 && newlineIdx < 20 && !/\s/.test(inner.slice(0, newlineIdx))
                        ? inner.slice(0, newlineIdx).trim() : '';
                    const code = lang ? inner.slice(newlineIdx + 1) : inner;

                    return (
                        <div key={i} className="my-2.5 rounded-lg overflow-hidden border border-black/[0.06]">
                            {lang && (
                                <div className="px-4 py-1.5 bg-black/[0.04] border-b border-black/[0.06]">
                                    <span className="text-[10px] text-black/40 uppercase tracking-wider font-mono">
                                        {lang}
                                    </span>
                                </div>
                            )}
                            <SyntaxHighlighter
                                language={lang || 'text'}
                                style={oneLight}
                                customStyle={{
                                    margin: 0,
                                    padding: '12px 16px',
                                    fontSize: '12px',
                                    lineHeight: '1.6',
                                    background: 'rgba(0,0,0,0.02)',
                                    border: 'none',
                                    borderRadius: 0,
                                }}
                                codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
                            >
                                {code.trim()}
                            </SyntaxHighlighter>
                        </div>
                    );
                }
                return part ? <span key={i} className="whitespace-pre-wrap">{part}</span> : null;
            })}
        </div>
    );
}

// --- Code Snippet Editor (Teams-style) ---

const LANGUAGES = [
    'Plain Text', 'Bash', 'C', 'C++', 'C#', 'CSS', 'Dart', 'Dockerfile',
    'Go', 'GraphQL', 'HTML', 'Java', 'JavaScript', 'JSON', 'Kotlin',
    'Markdown', 'Python', 'Ruby', 'Rust', 'SQL', 'Swift', 'TypeScript',
    'YAML',
];

function CodeSnippetEditor({ open, onClose, onInsert }: {
    open: boolean;
    onClose: () => void;
    onInsert: (block: string) => void;
}) {
    const [lang, setLang] = useState('Plain Text');
    const [code, setCode] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const codeRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && codeRef.current) codeRef.current.focus();
    }, [open]);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    if (!open) return null;

    const handleInsert = () => {
        if (!code.trim()) return;
        const langTag = lang === 'Plain Text' ? '' : lang.toLowerCase();
        const block = `\`\`\`${langTag}\n${code.trim()}\n\`\`\``;
        onInsert(block);
        setCode('');
        setLang('Plain Text');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20" />
            {/* Panel */}
            <div
                className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/8">
                    <div className="flex items-center gap-2">
                        <Code size={14} className="text-black/40" />
                        <span className="text-sm font-semibold text-black/80">Code Snippet</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 text-black/40 hover:text-black/70 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Language selector */}
                <div className="px-4 py-2.5 border-b border-black/5 bg-black/[0.02]">
                    <div ref={dropdownRef} className="relative inline-block">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white border border-black/10 rounded-md hover:border-black/20 transition-colors"
                        >
                            <span className="text-black/70">{lang}</span>
                            <ChevronDown size={11} className="text-black/30" />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-44 max-h-52 overflow-y-auto bg-white border border-black/10 rounded-lg shadow-lg z-10">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => { setLang(l); setDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${l === lang ? 'bg-black/5 text-black font-medium' : 'text-black/60 hover:bg-black/[0.03] hover:text-black'
                                            }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Code editor with live syntax highlighting */}
                <div className="px-4 py-3">
                    <div className="relative rounded-lg border border-black/8 overflow-hidden focus-within:border-black/20 transition-colors" style={{ minHeight: '200px' }}>
                        {/* Highlighted layer (behind) */}
                        <SyntaxHighlighter
                            language={lang === 'Plain Text' ? 'text' : lang.toLowerCase()}
                            style={oneLight}
                            customStyle={{
                                margin: 0,
                                padding: '12px 16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                background: 'rgba(0,0,0,0.02)',
                                border: 'none',
                                borderRadius: 0,
                                minHeight: '200px',
                                overflow: 'auto',
                            }}
                            codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
                        >
                            {code || ' '}
                        </SyntaxHighlighter>
                        {/* Transparent textarea (on top) */}
                        <textarea
                            ref={codeRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="Paste or type your code here..."
                            spellCheck={false}
                            className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-black focus:outline-none"
                            style={{
                                padding: '12px 16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                caretColor: '#1a1a2e',
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-black/5 bg-black/[0.02]">
                    <button
                        onClick={() => { setCode(''); setLang('Plain Text'); onClose(); }}
                        className="px-4 py-1.5 text-xs font-mono text-black/50 hover:text-black/70 rounded-md hover:bg-black/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!code.trim()}
                        className="px-4 py-1.5 text-xs font-mono bg-black/90 text-white rounded-md hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                    >
                        <Code size={11} /> Insert
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Session ---
const SESSION_KEY = 'anpt_google_user';
const SESSION_TTL = 24 * 60 * 60 * 1000;

function loadSession(): GoogleUser | null {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;
        const { data, savedAt } = JSON.parse(stored);
        if (Date.now() - savedAt > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
        return data;
    } catch { localStorage.removeItem(SESSION_KEY); return null; }
}
function saveSession(user: GoogleUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ data: user, savedAt: Date.now() }));
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// --- Main ---

export default function CommentSection({ slug }: { slug: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<GoogleUser | null>(loadSession);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [codeEditorOpen, setCodeEditorOpen] = useState(false);
    const [codeEditorTarget, setCodeEditorTarget] = useState<'comment' | 'reply'>('comment');
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    const totalComments = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

    useEffect(() => {
        fetchComments(slug).then(setComments).catch(() => setComments([])).finally(() => setLoading(false));
    }, [slug]);

    const handleGoogleCallback = useCallback((response: { credential: string }) => {
        try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const userData: GoogleUser = { name: payload.name, picture: payload.picture, credential: response.credential };
            setUser(userData);
            saveSession(userData);
        } catch { setError('Failed to process Google sign-in'); }
    }, []);

    useEffect(() => {
        if (initializedRef.current) return;
        const initGoogle = () => {
            if (!window.google || !GOOGLE_CLIENT_ID) return;
            initializedRef.current = true;
            window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCallback });
        };
        if (window.google) { initGoogle(); }
        else {
            const interval = setInterval(() => { if (window.google) { clearInterval(interval); initGoogle(); } }, 100);
            return () => clearInterval(interval);
        }
    }, [handleGoogleCallback]);

    useEffect(() => {
        if (user || !window.google || !GOOGLE_CLIENT_ID || !googleBtnRef.current) return;
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular' });
    }, [user]);

    // Focus reply input when opening
    useEffect(() => {
        if (replyingTo && replyInputRef.current) replyInputRef.current.focus();
    }, [replyingTo]);

    const handlePost = async (content: string, parentId?: string) => {
        if (!user || submitting || !content.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            const newComment = await postComment(slug, content.trim(), user.credential, parentId);
            if (parentId) {
                setComments(prev => prev.map(c => c._id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c));
                setReplyingTo(null);
                setReplyContent('');
            } else {
                setComments(prev => [{ ...newComment, replies: [] }, ...prev]);
                setCommentContent('');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to post comment');
        } finally { setSubmitting(false); }
    };

    // Auto-detect ``` and open code editor
    const handleTextChange = (value: string, setter: (v: string) => void, target: 'comment' | 'reply') => {
        if (value.endsWith('```')) {
            setter(value.slice(0, -3));
            setCodeEditorTarget(target);
            setCodeEditorOpen(true);
            return;
        }
        setter(value);
    };

    return (
        <section className="mt-14 pt-8 border-t border-black/8">
            {/* Header — simple like the blog's h2 style */}
            <h2 className="font-mono font-bold text-base mb-6 flex items-center gap-2">
                <MessageSquare size={16} className="opacity-40" />
                Comments
                {totalComments > 0 && (
                    <span className="font-normal text-xs text-black/30 ml-1">({totalComments})</span>
                )}
            </h2>

            {/* Auth & Write */}
            {!user ? (
                <div className="flex flex-col items-center gap-3 py-8 border border-dashed border-black/10 rounded-lg mb-8">
                    <LogIn size={18} className="text-black/25" />
                    <p className="text-sm text-black/40 font-mono">Sign in to comment</p>
                    {GOOGLE_CLIENT_ID ? <div ref={googleBtnRef} /> : (
                        <p className="text-xs text-red-400 font-mono">Google Client ID not configured</p>
                    )}
                </div>
            ) : (
                <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-3">
                        <UserAvatar src={user.picture} name={user.name} size={28} />
                        <span className="text-sm font-medium text-black/80">{user.name}</span>
                        <button
                            onClick={() => { setUser(null); clearSession(); }}
                            className="ml-auto text-[11px] font-mono text-black/30 hover:text-red-500 transition-colors"
                        >
                            sign out
                        </button>
                    </div>
                    <div>
                        <textarea
                            value={commentContent}
                            onChange={e => handleTextChange(e.target.value, setCommentContent, 'comment')}
                            placeholder="Write a comment... (type ``` for code)"
                            rows={2}
                            className="w-full px-3 py-2.5 text-sm bg-black/[0.03] border border-black/8 rounded-lg resize-none focus:outline-none focus:border-black/20 placeholder:text-black/20 transition-colors"
                        />
                        <div className="flex items-center justify-between mt-1.5">
                            <button
                                type="button"
                                onClick={() => { setCodeEditorTarget('comment'); setCodeEditorOpen(true); }}
                                className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono text-black/35 hover:text-black/60 hover:bg-black/[0.04] rounded-md transition-colors"
                            >
                                <Code size={12} /> code
                            </button>
                            <button
                                onClick={() => handlePost(commentContent)}
                                disabled={submitting || !commentContent.trim()}
                                className="px-3.5 py-1.5 bg-black/90 text-white text-xs font-mono rounded-lg hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                            >
                                <Send size={12} /> post
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500 font-mono mt-2">{error}</p>}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-center text-sm text-black/25 font-mono py-10">
                    No comments yet
                </p>
            ) : (
                <div>
                    {comments.map((comment, idx) => (
                        <div key={comment._id} className={idx > 0 ? 'border-t border-black/5' : ''}>
                            {/* Comment */}
                            <div className="flex gap-3 py-5">
                                <UserAvatar src={comment.avatar} name={comment.name} size={34} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="text-sm font-semibold">{comment.name}</span>
                                        <span className="text-[11px] font-mono text-black/30">{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    <CommentContent content={comment.content} />
                                    {user && (
                                        <button
                                            onClick={() => { setReplyingTo(replyingTo === comment._id ? null : comment._id); setReplyContent(''); }}
                                            className="flex items-center gap-1 mt-1.5 text-[11px] font-mono text-black/30 hover:text-black/60 transition-colors"
                                        >
                                            <Reply size={11} /> reply
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-[46px] border-l border-black/8 pl-4 pb-2">
                                    {comment.replies.map((reply) => (
                                        <div key={reply._id} className="flex gap-2.5 py-2.5">
                                            <UserAvatar src={reply.avatar} name={reply.name} size={26} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-[13px] font-semibold">{reply.name}</span>
                                                    <span className="text-[10px] font-mono text-black/25">{timeAgo(reply.createdAt)}</span>
                                                </div>
                                                <CommentContent content={reply.content} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply input */}
                            {replyingTo === comment._id && user && (
                                <div className="ml-[46px] pl-4 pb-4 border-l border-black/8">
                                    <div>
                                        <textarea
                                            ref={replyInputRef}
                                            value={replyContent}
                                            onChange={e => handleTextChange(e.target.value, setReplyContent, 'reply')}
                                            placeholder={`Reply to ${comment.name}... (type \`\`\` for code)`}
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm bg-black/[0.03] border border-black/8 rounded-lg resize-none focus:outline-none focus:border-black/20 placeholder:text-black/20 transition-colors"
                                            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handlePost(replyContent, comment._id); }}
                                        />
                                        <div className="flex items-center justify-between mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => { setCodeEditorTarget('reply'); setCodeEditorOpen(true); }}
                                                className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono text-black/35 hover:text-black/60 hover:bg-black/[0.04] rounded-md transition-colors"
                                            >
                                                <Code size={11} /> code
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                                    className="text-[11px] font-mono text-black/30 hover:text-black/50 transition-colors"
                                                >
                                                    cancel
                                                </button>
                                                <button
                                                    onClick={() => handlePost(replyContent, comment._id)}
                                                    disabled={submitting || !replyContent.trim()}
                                                    className="px-3 py-1.5 bg-black/90 text-white text-xs font-mono rounded-lg hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                                >
                                                    <Send size={11} /> reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Code Snippet Editor Modal */}
            <CodeSnippetEditor
                open={codeEditorOpen}
                onClose={() => setCodeEditorOpen(false)}
                onInsert={(block) => {
                    if (codeEditorTarget === 'reply') {
                        setReplyContent(prev => prev ? prev + '\n' + block : block);
                    } else {
                        setCommentContent(prev => prev ? prev + '\n' + block : block);
                    }
                }}
            />
        </section>
    );
}
