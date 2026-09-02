import React from 'react';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      {children}
    </div>
  );
}
