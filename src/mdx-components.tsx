import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export const journalComponents: MDXComponents = {
  h2: (props) => (
    <h2
      className="text-3xl font-black tracking-tight mt-12 mb-4"
      style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="text-base font-bold mt-8 mb-3" style={{ color: 'var(--maroon)' }} {...props} />
  ),
  p: (props) => <p className="text-[length:var(--text-body-lg)] leading-[1.75] mb-5" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 mb-5 space-y-2 text-[length:var(--text-body-lg)] leading-[1.7]" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mb-5 space-y-2 text-[length:var(--text-body-lg)] leading-[1.7]" {...props} />,
  li: (props) => <li className="pl-1 marker:text-[var(--brass)]" {...props} />,
  strong: (props) => <strong className="font-bold" style={{ color: 'var(--ink)' }} {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-8 pl-5 italic [&_p]:text-2xl [&_p]:leading-snug [&_p]:mb-0"
      style={{ borderLeft: '3px solid var(--brass)', fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
      {...props}
    />
  ),
  hr: () => <hr className="my-10" style={{ borderColor: 'var(--border-subtle)' }} />,
  a: ({ href = '', ...props }) => {
    // react-markdown blanks unsafe URLs such as javascript: links.
    if (!href) return <span {...props} />;
    const style = { color: 'var(--brass-ink)', textDecoration: 'underline', textUnderlineOffset: '3px' };
    return href.startsWith('/')
      ? <Link href={href} style={style} {...props} />
      : <a href={href} target="_blank" rel="noopener noreferrer" style={style} {...props} />;
  },
};

export function useMDXComponents(): MDXComponents {
  return journalComponents;
}
