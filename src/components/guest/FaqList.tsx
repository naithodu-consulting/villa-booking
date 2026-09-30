import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQ } from '@/types';

/** Accordion of questions; shared by the home page (featured) and /faq (all). */
export default function FaqList({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="space-y-2">
      {faqs.map((faq) => (
        <details
          key={faq.id}
          className="rounded-2xl shadow-sm group"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <summary
            className="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer list-none font-semibold text-base select-none"
            style={{ color: 'var(--ink)' }}
          >
            {faq.question}
            <ChevronDown className="w-4 h-4 flex-shrink-0 group-open:rotate-180 transition-transform" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
          </summary>
          <p
            className="px-4 sm:px-5 pb-4 sm:pb-5 text-base leading-relaxed pt-4"
            style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
          >
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
