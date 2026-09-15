'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  clearable?: boolean;
  dropdownAlign?: 'left' | 'right';
  compact?: boolean; // smaller trigger, used inside BookingWidget
  /** Dates that exist in range but cannot be chosen (e.g. already booked). Rendered struck through. */
  isDateUnavailable?: (iso: string) => boolean;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  label,
  id,
  clearable = true,
  dropdownAlign = 'left',
  compact = false,
  isDateUnavailable,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseIso(value);
  const minDate = parseIso(min ?? '') ?? today;
  const maxDate = parseIso(max ?? '') ?? null;

  const initView = selected ?? minDate;
  const [viewYear, setViewYear] = useState(initView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initView.getMonth());
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(v => v - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(v => v + 1);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevDisabled =
    viewYear < minDate.getFullYear() ||
    (viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth());

  const selectDay = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toIso(d));
    setIsOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const isDayUnavailable = (day: number) =>
    !!isDateUnavailable?.(toIso(new Date(viewYear, viewMonth, day)));

  const isDayDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return isDayUnavailable(day);
  };

  const isDaySelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  const isDayToday = (day: number) =>
    new Date(viewYear, viewMonth, day).toDateString() === today.toDateString();

  const displayValue = selected
    ? selected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  // ── Trigger ──────────────────────────────────────────────────────────
  const triggerPad = compact ? '8px 12px' : '10px 14px';
  const triggerFontSize = compact ? '14px' : '16px';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink-muted)',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: triggerPad,
          borderRadius: '12px',
          border: `1px solid ${isOpen ? 'var(--brass)' : 'var(--border-subtle)'}`,
          backgroundColor: 'var(--paper-sunk)',
          color: displayValue ? 'var(--ink)' : 'var(--ink-faint)',
          fontSize: triggerFontSize,
          fontWeight: displayValue ? 600 : 400,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(168,116,50,0.15)' : 'none',
        }}
      >
        <CalendarDays
          style={{ width: compact ? 14 : 16, height: compact ? 14 : 16, flexShrink: 0, color: 'var(--brass)' }}
          aria-hidden="true"
        />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue || placeholder}
        </span>
      </button>

      {/* ── Calendar dropdown ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`${label ?? 'Date'} picker`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...(dropdownAlign === 'right' ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
            padding: '16px',
            width: '280px',
            maxWidth: 'calc(100vw - 32px)',
            userSelect: 'none',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={prevMonth}
              disabled={prevDisabled}
              aria-label="Previous month"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--paper-sunk)',
                cursor: prevDisabled ? 'not-allowed' : 'pointer',
                opacity: prevDisabled ? 0.35 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink)',
                transition: 'background-color 0.12s',
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>

            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--maroon)', letterSpacing: '-0.01em' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--paper-sunk)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink)',
                transition: 'background-color 0.12s',
              }}
            >
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-faint)',
                  padding: '4px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const disabled = isDayDisabled(day);
              const unavailable = isDayUnavailable(day);
              const sel = isDaySelected(day);
              const isToday = isDayToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && selectDay(day)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: isToday && !sel ? '1px solid var(--border-brass)' : '1px solid transparent',
                    fontSize: '13px',
                    fontWeight: sel ? 800 : isToday ? 700 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: sel ? 'var(--maroon)' : 'transparent',
                    color: sel ? 'white' : disabled ? 'var(--ink-faint)' : isToday ? 'var(--brass)' : 'var(--ink)',
                    opacity: disabled ? 0.38 : 1,
                    textDecoration: unavailable ? 'line-through' : 'none',
                    transition: 'background-color 0.1s',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (!disabled && !sel) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--maroon-tint)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!sel) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                  aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}${isToday ? ', today' : ''}${sel ? ', selected' : ''}${unavailable ? ', unavailable' : ''}`}
                  aria-pressed={sel}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer: clear */}
          {clearable && value && (
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '7px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--ink-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper-sunk)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
