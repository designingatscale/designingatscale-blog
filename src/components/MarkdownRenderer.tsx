import React, { useState, useEffect, useRef, useId, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

const SortingVisualizer = lazy(() => import('./SortingVisualizer'));

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  fontFamily: 'Inter, sans-serif',
  securityLevel: 'loose',
});

interface MarkdownRendererProps {
  content: string;
}

function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '_');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [svgContent, setSvgContent] = React.useState('');

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return;
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        containerRef.current.innerHTML = svg;
        setSvgContent(svg);
      } catch {
        containerRef.current.innerHTML = `<pre style="color:#ef4444;font-size:13px;">Failed to render diagram</pre>`;
        // Mermaid v11 appends error elements to document.body on render failure — clean them up
        const strayEl = document.getElementById(`dmermaid-${id}`);
        if (strayEl) strayEl.remove();
      }
    };
    render();
  }, [chart, id]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen && fullRef.current && svgContent) {
      fullRef.current.innerHTML = svgContent;
      const svg = fullRef.current.querySelector('svg');
      if (svg) {
        // Remove fixed dimensions so SVG scales via viewBox
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.removeAttribute('style');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxHeight = '80vh';
      }
    }
  }, [isFullscreen, svgContent]);

  // detect diagram type label from chart
  const typeMatch = /^\s*(\w[\w-]*)/m.exec(chart);
  const diagramType = typeMatch ? typeMatch[1].replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim() : 'Diagram';

  return (
    <>
      <div className="mermaid-container my-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden group">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/60 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            </div>
            <span className="ml-2 text-xs font-mono text-gray-400 uppercase tracking-wider">{diagramType}</span>
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-white/80 transition-all cursor-pointer"
            title="View fullscreen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Expand
          </button>
        </div>
        {/* Diagram */}
        <div
          ref={containerRef}
          className="flex justify-center overflow-x-auto p-8"
          style={{ minHeight: '120px' }}
        />
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 flex-shrink-0">
              <span className="text-sm font-mono text-gray-500 uppercase tracking-wider">{diagramType}</span>
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Close
              </button>
            </div>
            <div ref={fullRef} className="flex-1 flex items-center justify-center overflow-auto p-8" />
          </div>
        </div>
      )}
    </>
  );
}

const Code = React.memo(function Code({
  className,
  children,
  ...props
}: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps) {
  const match = /language-([\w-]+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  if (match && match[1] === 'mermaid') {
    return <Mermaid chart={code} />;
  }

  if (match && match[1] === 'sorting-visualizer') {
    return (
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>Loading visualizer…</div>}>
        <SortingVisualizer config={code} />
      </Suspense>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return match ? (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{match[1]}</span>
        <button onClick={handleCopy} className="code-block-copy" title="Copy code">
          {copied ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={dracula}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '0.9rem',
          padding: '1rem 1.25rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
});
// Heading anchor ID generation
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function HeadingRenderer(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  return function Heading({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    const text = typeof children === 'string' ? children : String(children);
    const id = slugify(text);
    return <Tag id={id} {...props}>{children}</Tag>;
  };
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{
        code: Code,
        h1: HeadingRenderer('h1'),
        h2: HeadingRenderer('h2'),
        h3: HeadingRenderer('h3'),
        h4: HeadingRenderer('h4'),
      }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
