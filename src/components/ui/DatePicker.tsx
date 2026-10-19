'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Star } from 'lucide-react';
import { formatCompactINR } from '@/lib/format';

/** What the calendar knows about one night. Undefined from getDayInfo means "not loaded yet". */
export interface DayInfo {
  available: boolean;
  /** Nightly price in paise. */
  rate?: number;
  /** Pricing rule name when the night has a special price, e.g. "New Year's Eve and New Year's Day". */
  special?: string | null;
}

export type MonthStatus = 'loading' | 'ready' | 'error';

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
  /** Availability and price per night. When given, cells are colour-coded and a legend is shown. */
  getDayInfo?: (iso: string) => DayInfo | undefined;
  /** Load state of the month starting on this date, for the line under the grid. */
  getMonthStatus?: (firstOfMonthIso: string) => MonthStatus;
  /** Called with the first day of the month whenever the calendar opens or changes month. */
  onViewMonthChange?: (firstOfMonthIso: string) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Calendar status colours. Green = can book, gold = can book at a special price,
// rose = cannot book: the convention guests already know from hotel and airline
// calendars, drawn from the site palette (--ok, --brass, --error families).
//
// The first version used 9% tints, about 1.15:1 against the white popup, which
// guests could not tell apart on a real screen. Each state now has a visible fill
// plus a border. Status is never colour alone: unavailable nights are struck
// through and labelled "Not available", special prices carry a star, and every
// cell's aria-label spells out the state and the full price. All label inks are
// 5.6:1 or better on their fill.
const STATUS = {
  availableBg:     '#E3F1E8',
  availableBorder: '#8FC4A3',
  availableInk:    '#1F6B47',  // 5.6:1 on the fill
  specialBg:       '#F6E8CE',
  specialBorder:   '#D6AE6E',
  specialInk:      '#7A5118',  // 6.0:1 on the fill
  unavailableBg:   'repeating-linear-gradient(135deg, #F6E5E2 0 5px, #EFD6D2 5px 7px)',
  unavailableBorder: '#DDB1AB',
  unavailableInk:  '#8F2D25',  // 6.7:1 on the fill
};

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function LegendSwatch({ background, border, color, icon, children }: {
  background: string; border: string; color?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        aria-hidden="true"
        style={{
          width: 16, height: 16, borderRadius: 4, background, color,
          border: `1px solid ${border}`, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {icon}
      </span>
      {children}
    </span>
  );
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
  getDayInfo,
  getMonthStatus,
  onViewMonthChange,
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
  // Where the popup renders. It is portalled out of its container because the
  // booking column is position: sticky, which creates a stacking context: inside
  // it the popup's z-index only competed with its siblings, so the cookie banner
  // (z-50) and sticky header drew over the calendar. Inside the booking pop-up it
  // must stay within the <dialog>, which is in the browser's top layer.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const showStatus = !!getDayInfo;

  // The popup is position: fixed and placed against the trigger, so no ancestor can
  // clip it. It used to be absolute, and was cut off by the booking card
  // (overflow-hidden) and by the booking pop-up, a scrolling <dialog>. It opens below
  // the trigger, flips above when there is not enough room, and stays inside the
  // viewport on both axes. Styles are written straight to the node, not through
  // state, so placement never costs a re-render.
  const place = useCallback(() => {
    const pop = popupRef.current;
    const trigger = triggerRef.current;
    if (!pop || !trigger) return;
    const gap = 8;
    const margin = 8;
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;

    pop.style.maxHeight = `${vh - margin * 2}px`;
    const w = pop.offsetWidth;
    const h = Math.min(pop.scrollHeight, vh - margin * 2);

    let left = dropdownAlign === 'right' ? r.right - w : r.left;
    left = Math.max(margin, Math.min(left, vw - w - margin));

    let top = r.bottom + gap;
    if (top + h > vh - margin) {
      const above = r.top - gap - h;
      top = above >= margin ? above : Math.max(margin, vh - h - margin);
    }
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  }, [dropdownAlign]);

  // Re-place after every render while open. Content height changes when prices
  // load ("Checking availability" becomes the two-line legend) or the month changes,
  // and React can replace the popup node itself, so an observer bound once at open
  // time ends up watching a detached element. Placement is one rect read and two
  // style writes, so doing it per render is cheap.
  useLayoutEffect(() => {
    if (isOpen) place();
  });

  // Size changes that do not come from a render of this component (fonts loading,
  // a parent resizing) are caught by an observer that follows the current node.
  const observerRef = useRef<ResizeObserver | null>(null);
  const setPopupNode = useCallback((node: HTMLDivElement | null) => {
    popupRef.current = node;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (node) {
      observerRef.current = new ResizeObserver(() => place());
      observerRef.current.observe(node);
    }
  }, [place]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true); // capture: also scrolling inside a dialog
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, place]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) && !popupRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /**
   * Closes the calendar, putting focus back on the trigger when the guest
   * closed it themselves (Escape, or picking a date).
   *
   * Without this, dismissing the calendar left focus on a button that had just
   * been removed from the document, so the browser dropped focus to <body> and
   * the next Tab started again from the top of the page.
   */
  const closePicker = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  /**
   * Move focus into the calendar when it opens.
   *
   * The popup is portalled to document.body, which appends it at the very end
   * of the document, and nothing used to move focus into it. So a keyboard
   * guest who opened the calendar still had focus on the trigger, and the next
   * Tab went to the next form field rather than into the grid: the day cells
   * were reachable only by tabbing through the whole rest of the page.
   *
   * Lands on the selected day where there is one, else the first day that can
   * be booked, so arrow-free tabbing starts somewhere useful.
   */
  useEffect(() => {
    if (!isOpen) return;
    const pop = popupRef.current;
    if (!pop) return;
    const target =
      pop.querySelector<HTMLElement>('button[data-day-selected="true"]') ??
      pop.querySelector<HTMLElement>('button[data-day]:not([disabled])') ??
      pop;
    target.focus();
  }, [isOpen]);

  // Escape closes; Tab cycles within the calendar rather than escaping into the
  // page behind it, which is what aria-modal on the popup already promises.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // preventDefault, not just stopPropagation. Inside the booking pop-up
        // the picker sits within a native <dialog> opened with showModal(),
        // and Escape there is a browser close request, not an ordinary key
        // event: stopping propagation does nothing to it. Without this, one
        // Escape dismissed the calendar *and* threw away the whole booking
        // dialog behind it, when the guest only meant to close the calendar.
        e.preventDefault();
        e.stopPropagation();
        closePicker(true);
        return;
      }
      if (e.key !== 'Tab') return;

      const pop = popupRef.current;
      if (!pop) return;
      const focusable = pop.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closePicker]);

  // Show the month the selected date is in. Adjusting state during render is
  // React's own pattern for state derived from a prop: an effect would paint
  // the old month first and only then correct itself.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
  }

  // Let the parent load prices and availability for whichever month is on screen.
  useEffect(() => {
    if (isOpen) onViewMonthChange?.(toIso(new Date(viewYear, viewMonth, 1)));
  }, [isOpen, viewYear, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(v => v - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(v => v + 1);
  };

  /**
   * Paging forward was unbounded while paging back was correctly stopped at
   * minDate. Past the months the calendar has loaded, getDayInfo returns
   * undefined, so cells render with no fill, no price and no "Not available"
   * strike: they look like ordinary bookable days. A guest could page years out
   * and pick a check-in priced at today's rack rate with no seasonal rule in
   * place to correct it. Now symmetric with prevDisabled.
   */
  const nextDisabled = !!maxDate && (
    viewYear > maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth())
  );

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStatus = getMonthStatus?.(toIso(new Date(viewYear, viewMonth, 1))) ?? 'ready';

  const prevDisabled =
    viewYear < minDate.getFullYear() ||
    (viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth());

  const selectDay = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toIso(d));
    closePicker(true);
  }, [viewYear, viewMonth, onChange, closePicker]);

  /** Outside min/max: past dates, or beyond the latest allowed check-out. */
  const isOutOfRange = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < minDate || (!!maxDate && d > maxDate);
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
  const triggerPad = compact ? '10px 12px' : '10px 14px';
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
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => {
          setPortalTarget(triggerRef.current?.closest('dialog') ?? document.body);
          setIsOpen(v => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          minHeight: '44px',
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
          /* No `outline: 'none'` here. It used to suppress the site's
             :focus-visible ring (globals.css) — an inline style beats any
             stylesheet rule, whatever its layer or specificity — and the
             boxShadow below is keyed to `isOpen`, not to focus, so a keyboard
             guest tabbing onto the trigger saw nothing at all. This is the
             first control in the booking flow and it is a <button>, so there
             is no text input to fall back on. */
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
      {isOpen && portalTarget && createPortal(
        <div
          ref={setPopupNode}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-label={`${label ?? 'Date'} picker`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            overflowY: 'auto',
            zIndex: 200,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
            padding: '16px',
            width: showStatus ? '392px' : '280px',
            maxWidth: 'calc(100vw - 16px)',
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

            <span aria-live="polite" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--maroon)', letterSpacing: '-0.01em' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              disabled={nextDisabled}
              aria-label="Next month"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--paper-sunk)',
                cursor: nextDisabled ? 'not-allowed' : 'pointer',
                opacity: nextDisabled ? 0.35 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink)',
                transition: 'background-color 0.12s',
              }}
            >
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: showStatus ? '4px' : '3px', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  padding: '4px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: showStatus ? '4px' : '3px' }}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const iso = toIso(new Date(viewYear, viewMonth, day));
              const outOfRange = isOutOfRange(day);
              const info = outOfRange ? undefined : getDayInfo?.(iso);
              const booked = info?.available === false;
              const disabled = outOfRange || booked;
              const sel = isDaySelected(day);
              const isToday = isDayToday(day);
              const special = !disabled && !!info?.special;
              const rate = !disabled ? info?.rate : undefined;

              let background = 'transparent';
              let borderColor = 'transparent';
              let numberInk = 'var(--ink)';
              let subInk = 'var(--ink-muted)';
              if (sel) { background = 'var(--maroon)'; borderColor = 'var(--maroon)'; numberInk = 'white'; subInk = 'rgba(255,255,255,0.9)'; }
              else if (booked) { background = STATUS.unavailableBg; borderColor = STATUS.unavailableBorder; numberInk = STATUS.unavailableInk; subInk = STATUS.unavailableInk; }
              else if (outOfRange) { numberInk = 'var(--ink-faint)'; }
              else if (special) { background = STATUS.specialBg; borderColor = STATUS.specialBorder; subInk = STATUS.specialInk; }
              else if (info?.available) { background = STATUS.availableBg; borderColor = STATUS.availableBorder; subInk = STATUS.availableInk; }
              if (isToday && !sel) borderColor = 'var(--maroon)';

              const ariaParts = [
                `${day} ${MONTHS[viewMonth]} ${viewYear}`,
                isToday && 'today',
                sel && 'selected',
                (booked || outOfRange) && 'not available',
                rate !== undefined && `₹${(rate / 100).toLocaleString('en-IN')} per night`,
                special && info?.special,
              ].filter(Boolean);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  data-day={day}
                  data-day-selected={sel ? 'true' : undefined}
                  onClick={() => !disabled && selectDay(day)}
                  style={{
                    width: '100%',
                    minHeight: showStatus ? '54px' : undefined,
                    aspectRatio: showStatus ? undefined : '1',
                    borderRadius: '8px',
                    border: `1px solid ${showStatus ? borderColor : (isToday && !sel ? 'var(--brass)' : 'transparent')}`,
                    background,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: outOfRange ? 0.45 : 1,
                    transition: 'box-shadow 0.1s',
                    /* No `outline: 'none'`: the boxShadow below is set in
                       onMouseEnter and cleared in onMouseLeave, so it is
                       mouse-only. Arrowing or tabbing across the grid produced
                       no visible change whatsoever. The site's :focus-visible
                       ring now applies. */
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px 1px',
                  }}
                  onMouseEnter={e => {
                    if (!disabled && !sel) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px var(--maroon)';
                  }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  aria-label={ariaParts.join(', ')}
                  aria-pressed={sel}
                >
                  <span
                    style={{
                      fontSize: showStatus ? '14px' : '13px',
                      lineHeight: 1,
                      fontWeight: sel ? 800 : isToday ? 800 : 600,
                      color: numberInk,
                      textDecoration: booked ? 'line-through' : 'none',
                    }}
                  >
                    {day}
                  </span>
                  {showStatus && (booked || rate !== undefined) && (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        fontSize: booked ? '9px' : '10px',
                        fontWeight: 700,
                        lineHeight: 1.05,
                        textAlign: 'center',
                        color: subInk,
                        whiteSpace: booked ? 'normal' : 'nowrap',
                      }}
                    >
                      {booked ? <>Not<br />available</> : (
                        <>
                          {special && <Star style={{ width: 8, height: 8 }} fill="currentColor" strokeWidth={0} />}
                          {formatCompactINR(rate!)}
                        </>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Legend / load state ─────────────────────────────────────── */}
          {showStatus && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--ink-muted)',
              }}
            >
              {monthStatus === 'loading' ? (
                <p role="status" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} aria-hidden="true" />
                  Checking availability and prices…
                </p>
              ) : monthStatus === 'error' ? (
                <p role="status" style={{ margin: 0, color: 'var(--error)' }}>
                  Could not load availability for this month. You can still choose dates; we confirm before payment.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '12px', color: 'var(--ink)' }}>
                    <LegendSwatch background={STATUS.availableBg} border={STATUS.availableBorder}>Available</LegendSwatch>
                    <LegendSwatch
                      background={STATUS.specialBg}
                      border={STATUS.specialBorder}
                      color={STATUS.specialInk}
                      icon={<Star style={{ width: 9, height: 9 }} fill="currentColor" strokeWidth={0} />}
                    >
                      Special price
                    </LegendSwatch>
                    <LegendSwatch background={STATUS.unavailableBg} border={STATUS.unavailableBorder}>Not available</LegendSwatch>
                  </div>
                  <p style={{ margin: '6px 0 0', color: 'var(--ink-muted)' }}>
                    Prices are per night, before GST.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Footer: clear */}
          {clearable && value && (
            <button
              type="button"
              onClick={() => { onChange(''); closePicker(true); }}
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
        </div>,
        portalTarget,
      )}
    </div>
  );
}
