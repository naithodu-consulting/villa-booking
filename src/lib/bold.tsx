import React from 'react';

/**
 * Renders a string that may contain **bold** markers as React nodes,
 * converting **text** into <strong> elements.
 */
export function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: 'var(--ink)', fontWeight: 700 }}>{part}</strong>
      : part
  );
}
