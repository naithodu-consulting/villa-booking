import React from 'react';
import Markdown, { type Components } from 'react-markdown';
import { journalComponents } from '@/mdx-components';
import type { JournalBody as Body } from '@/lib/journal';

const TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'blockquote', 'hr', 'a'] as const;

// react-markdown passes a `node` prop that must not reach the DOM.
const styled = journalComponents as Record<string, React.ComponentType<Record<string, unknown>>>;
const MARKDOWN_COMPONENTS = Object.fromEntries(
  TAGS.map((tag) => {
    const Styled = styled[tag];
    const Wrapped = (props: Record<string, unknown>) => {
      const domProps = { ...props };
      delete domProps.node;
      return <Styled {...domProps} />;
    };
    Wrapped.displayName = `Journal_${tag}`;
    return [tag, Wrapped];
  }),
) as Components;

// A stray "# " in Ooruda Villa's editor must not add a second h1 to the page.
MARKDOWN_COMPONENTS.h1 = MARKDOWN_COMPONENTS.h2;

export default function JournalBody({ body }: { body: Body }) {
  if (body.kind === 'mdx') {
    const { Content } = body;
    return <Content />;
  }
  // Raw HTML is dropped, not shown as text. Inline images are dropped too:
  // they would load from any host, bypassing next/image.
  return (
    <Markdown components={MARKDOWN_COMPONENTS} skipHtml disallowedElements={['img']}>
      {body.markdown}
    </Markdown>
  );
}
