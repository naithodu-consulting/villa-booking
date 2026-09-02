'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';

interface FormState {
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guestCount: string;
  message: string;
}

export default function EnquiryForm() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', checkIn: '', checkOut: '', guestCount: '', message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          checkIn: form.checkIn || undefined,
          checkOut: form.checkOut || undefined,
          guestCount: form.guestCount || undefined,
          message: form.message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not submit. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="p-8 rounded-3xl text-center space-y-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: 'var(--ok)' }} />
        <p className="font-bold text-base" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
          Enquiry Received
        </p>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Thank you, {form.name}. We will get back to you within 4 hours. For a faster response, WhatsApp us directly.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--paper-sunk)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--ink)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--ink-muted)',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            required
            placeholder="Your full name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="10-digit mobile number"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="your@email.com"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DatePicker
          label="Check-in"
          value={form.checkIn}
          onChange={v => setForm(prev => ({ ...prev, checkIn: v, checkOut: v && v >= prev.checkOut ? '' : prev.checkOut }))}
          min={new Date().toISOString().split('T')[0]}
          placeholder="dd mmm yyyy"
          clearable
        />
        <DatePicker
          label="Check-out"
          value={form.checkOut}
          onChange={v => setForm(prev => ({ ...prev, checkOut: v }))}
          min={form.checkIn || new Date().toISOString().split('T')[0]}
          placeholder="dd mmm yyyy"
          clearable
          dropdownAlign="right"
        />
        <div>
          <label style={labelStyle}>Guests</label>
          <input
            type="number"
            value={form.guestCount}
            onChange={set('guestCount')}
            min={1}
            max={12}
            placeholder="1 to 12"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Message *</label>
        <textarea
          value={form.message}
          onChange={set('message')}
          required
          rows={4}
          placeholder="Tell us about your stay, any questions, or special requirements..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
        />
      </div>

      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--error)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 hover:brightness-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Enquiry
          </>
        )}
      </button>
    </form>
  );
}
