'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_MANGALORE_VILLA } from '@/lib/mock-data';
import {
  Calendar as CalendarIcon, DollarSign, PlusCircle, CheckCircle,
  ArrowUpRight, ChevronRight, LogOut, Search, ChevronLeft,
  X, AlertCircle, Save, Loader2, Users,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────
type TabId = 'overview' | 'calendar' | 'pricing';
type BlockReason = 'maintenance' | 'owner_hold';

interface BlockedDay {
  day: number;
  reason: BlockReason;
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}

// ── Mock booking data ───────────────────────────────────
const MOCK_BOOKINGS = [
  { id: 'MNG-98A12', guest: 'Priya Nair', dates: '20 Aug – 22 Aug', checkInDay: 20, checkOutDay: 22, status: 'Confirmed', amount: '₹34,220', channel: 'Direct Online', guests: 6 },
  { id: 'MNG-77C01', guest: 'Vikram Mehta', dates: '25 Aug – 28 Aug', checkInDay: 25, checkOutDay: 28, status: 'Confirmed', amount: '₹51,330', channel: 'WhatsApp / Manual', guests: 8 },
  { id: 'MNG-12E44', guest: 'Ananya Rao', dates: '01 Sep – 03 Sep', checkInDay: 0, checkOutDay: 0, status: 'Pending Payment', amount: '₹34,220', channel: 'Direct Online', guests: 4 },
];

// ── Calendar helpers ────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const property = MOCK_MANGALORE_VILLA;
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([
    { day: 15, reason: 'owner_hold' },
    { day: 16, reason: 'owner_hold' },
  ]);
  const [blockReason, setBlockReason] = useState<BlockReason>('maintenance');
  const [blockMessage, setBlockMessage] = useState('');

  // Pricing state
  const [baseRate, setBaseRate] = useState((property.base_nightly_rate / 100).toString());
  const [weekendRate, setWeekendRate] = useState((property.weekend_nightly_rate / 100).toString());
  const [priceSave, setPriceSave] = useState<SaveState>({ status: 'idle' });

  // Manual booking form state
  const [manualForm, setManualForm] = useState({
    name: '', phone: '', email: '', checkIn: '', checkOut: '', adults: 2, children: 0, channel: 'whatsapp', notes: '',
  });
  const [manualSaving, setManualSaving] = useState(false);

  const stats = [
    { label: "Today's Check-ins", value: '1', sub: 'Rahul Sharma (6 guests)', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: "Today's Check-outs", value: '0', sub: 'No departures', icon: ArrowUpRight, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Month Revenue', value: '₹1,42,000', sub: '8 booked nights', icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Occupancy', value: '68%', sub: '+12% vs last month', icon: CalendarIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const filteredBookings = MOCK_BOOKINGS.filter((b) =>
    !searchQuery ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.guest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Calendar helpers ─────────────────────────────────
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth); // 0=Sun offset

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const isBookedDay = (day: number) =>
    MOCK_BOOKINGS.some((b) => b.checkInDay > 0 && day >= b.checkInDay && day < b.checkOutDay);
  const getBookingForDay = (day: number) =>
    MOCK_BOOKINGS.find((b) => b.checkInDay > 0 && day >= b.checkInDay && day < b.checkOutDay);
  const getBlockedDay = (day: number) => blockedDays.find((b) => b.day === day);

  const handleDayClick = (day: number) => {
    if (isBookedDay(day)) return; // Cannot block a booked day
    const existing = getBlockedDay(day);
    if (existing) {
      setBlockedDays((prev) => prev.filter((b) => b.day !== day));
      setBlockMessage(`Day ${day} unblocked.`);
    } else {
      setBlockedDays((prev) => [...prev, { day, reason: blockReason }]);
      setBlockMessage(`Day ${day} blocked as ${blockReason === 'owner_hold' ? 'Owner Hold' : 'Maintenance'}.`);
    }
    setTimeout(() => setBlockMessage(''), 3000);
  };

  // ── Pricing save ─────────────────────────────────────
  const handlePriceSave = async () => {
    const base = parseFloat(baseRate);
    const weekend = parseFloat(weekendRate);
    if (isNaN(base) || base <= 0 || isNaN(weekend) || weekend <= 0) {
      setPriceSave({ status: 'error', message: 'Please enter valid positive amounts.' });
      return;
    }
    setPriceSave({ status: 'saving' });
    // TODO: PATCH /api/admin/properties/[id]/pricing with { base_nightly_rate, weekend_nightly_rate }
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    setPriceSave({ status: 'saved', message: 'Rates updated successfully. Changes are live.' });
    setTimeout(() => setPriceSave({ status: 'idle' }), 4000);
  };

  // ── Manual booking submit ─────────────────────────────
  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true);
    // TODO: POST /api/admin/bookings/manual with form data
    await new Promise((r) => setTimeout(r, 1000));
    setManualSaving(false);
    setIsManualModalOpen(false);
    setManualForm({ name: '', phone: '', email: '', checkIn: '', checkOut: '', adults: 2, children: 0, channel: 'whatsapp', notes: '' });
  };

  // ── Render ───────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between flex-shrink-0 md:min-h-screen">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-500/20">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">Villa Admin</h2>
              <p className="text-[10px] text-amber-400 font-semibold tracking-wider mt-1">Property Control</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold" aria-label="Admin navigation">
            {([
              ['overview', 'Dashboard Overview'],
              ['calendar', 'Reservation Calendar'],
              ['pricing', 'Pricing & Rates'],
            ] as [TabId, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between ${
                  activeTab === id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{label}</span>
                {activeTab === id && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-2 px-2 py-1">
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Back to Guest Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Top header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Active Property</span>
            <h1 className="text-2xl font-black text-white">{property.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage bookings, block dates, and capture manual phone/WhatsApp reservations.
            </p>
          </div>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="btn-primary text-xs flex items-center gap-2 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" /> Create Manual Booking
          </button>
        </div>

        {/* ── Dashboard Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((st, i) => (
                <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                    <div className={`p-2 rounded-xl ${st.bg}`}>
                      <st.icon className={`w-4 h-4 ${st.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white tabular-nums">{st.value}</p>
                  <p className="text-[11px] text-slate-400">{st.sub}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 -mt-4">
              ⓘ Statistics above are demo data — will reflect live Supabase data once connected.
            </p>

            {/* Bookings table */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">Recent Reservations</h2>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guest or ref…"
                    aria-label="Search bookings"
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 w-full sm:w-48"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[580px]">
                  <thead className="text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="pb-3 px-2 font-bold">Ref #</th>
                      <th className="pb-3 px-2 font-bold">Guest</th>
                      <th className="pb-3 px-2 font-bold">Dates</th>
                      <th className="pb-3 px-2 font-bold">Guests</th>
                      <th className="pb-3 px-2 font-bold hidden sm:table-cell">Channel</th>
                      <th className="pb-3 px-2 font-bold">Status</th>
                      <th className="pb-3 px-2 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                          No bookings match your search.
                        </td>
                      </tr>
                    ) : filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-2 font-mono font-bold text-amber-400">{b.id}</td>
                        <td className="py-3.5 px-2 font-semibold text-white">{b.guest}</td>
                        <td className="py-3.5 px-2">{b.dates}</td>
                        <td className="py-3.5 px-2 tabular-nums">{b.guests}</td>
                        <td className="py-3.5 px-2 text-slate-400 hidden sm:table-cell">{b.channel}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            b.status === 'Confirmed'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right font-extrabold tabular-nums">{b.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Calendar ── */}
        {activeTab === 'calendar' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            {/* Calendar header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Reservation Calendar</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click an available date to block/unblock it.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" /> Blocked</span>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <h3 className="text-sm font-bold text-white">
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Block reason selector */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 font-semibold">Block as:</span>
              {(['maintenance', 'owner_hold'] as BlockReason[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setBlockReason(r)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                    blockReason === r
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {r === 'owner_hold' ? 'Owner Hold' : 'Maintenance'}
                </button>
              ))}
            </div>

            {/* Feedback message */}
            {blockMessage && (
              <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                {blockMessage}
              </div>
            )}

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Calendar grid — correct offset from first day */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-16" aria-hidden="true" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const booked = isBookedDay(day);
                const blocked = getBlockedDay(day);
                const booking = getBookingForDay(day);
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={booked}
                    aria-label={`${MONTH_NAMES[calMonth]} ${day}${booked ? ` — booked by ${booking?.guest}` : blocked ? ` — ${blocked.reason}` : ' — available'}`}
                    className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col justify-between text-left text-xs border transition-all ${
                      booked
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 cursor-default'
                        : blocked
                        ? 'bg-red-500/15 border-red-500/40 text-red-400 cursor-pointer hover:bg-red-500/25'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40 cursor-pointer'
                    }`}
                  >
                    <span className="font-bold text-xs">{day}</span>
                    <span className="text-[9px] font-semibold truncate leading-tight">
                      {booked ? booking?.guest?.split(' ')[0] : blocked ? (blocked.reason === 'owner_hold' ? 'Owner' : 'Maint.') : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pricing ── */}
        {activeTab === 'pricing' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-white">Base Rates & Nightly Pricing</h2>
            <p className="text-xs text-slate-400">
              Changes take effect immediately for new bookings. Existing confirmed bookings retain their original pricing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label htmlFor="baseRate" className="text-slate-400 font-bold block">
                  Weekday Rate (Mon–Thu) ₹/night
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">₹</span>
                  <input
                    id="baseRate"
                    type="number"
                    min="1000"
                    step="100"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-white font-extrabold text-base w-full focus:outline-none focus:border-amber-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label htmlFor="weekendRate" className="text-slate-400 font-bold block">
                  Weekend Rate (Fri–Sat) ₹/night
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">₹</span>
                  <input
                    id="weekendRate"
                    type="number"
                    min="1000"
                    step="100"
                    value={weekendRate}
                    onChange={(e) => setWeekendRate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-white font-extrabold text-base w-full focus:outline-none focus:border-amber-500 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {priceSave.status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {priceSave.message}
              </div>
            )}
            {priceSave.status === 'saved' && (
              <div className="flex items-center gap-2 text-teal-400 text-xs p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {priceSave.message}
              </div>
            )}

            <button
              onClick={handlePriceSave}
              disabled={priceSave.status === 'saving'}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {priceSave.status === 'saving' ? (
                <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" aria-hidden="true" /> Save Rate Changes</>
              )}
            </button>
          </div>
        )}
      </section>

      {/* ── Manual Booking Modal ── */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Create manual booking">
          <div className="max-w-lg w-full glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Create Offline Reservation</h2>
                <p className="text-xs text-slate-400 mt-0.5">For bookings received via phone, WhatsApp, or referral.</p>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} aria-label="Close dialog" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="space-y-4 text-xs">
              {/* Guest details */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest Information</p>
                <div>
                  <label htmlFor="m-name" className="text-slate-300 font-bold block mb-1">Full Name *</label>
                  <input id="m-name" type="text" required value={manualForm.name} onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ramesh Kumar" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="m-phone" className="text-slate-300 font-bold block mb-1">Mobile *</label>
                    <input id="m-phone" type="tel" required value={manualForm.phone} onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))} placeholder="9876543210" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label htmlFor="m-email" className="text-slate-300 font-bold block mb-1">Email</label>
                    <input id="m-email" type="email" value={manualForm.email} onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))} placeholder="guest@example.com" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stay Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="m-checkin" className="text-slate-300 font-bold block mb-1">Check-In *</label>
                    <input id="m-checkin" type="date" required value={manualForm.checkIn} onChange={(e) => setManualForm((f) => ({ ...f, checkIn: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label htmlFor="m-checkout" className="text-slate-300 font-bold block mb-1">Check-Out *</label>
                    <input id="m-checkout" type="date" required min={manualForm.checkIn} value={manualForm.checkOut} onChange={(e) => setManualForm((f) => ({ ...f, checkOut: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="m-adults" className="text-slate-300 font-bold block mb-1">Adults *</label>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                      <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      <input id="m-adults" type="number" min="1" max={property.max_occupancy} value={manualForm.adults} onChange={(e) => setManualForm((f) => ({ ...f, adults: parseInt(e.target.value) || 1 }))} className="bg-transparent text-white w-full focus:outline-none tabular-nums" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="m-children" className="text-slate-300 font-bold block mb-1">Children</label>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                      <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      <input id="m-children" type="number" min="0" max="6" value={manualForm.children} onChange={(e) => setManualForm((f) => ({ ...f, children: parseInt(e.target.value) || 0 }))} className="bg-transparent text-white w-full focus:outline-none tabular-nums" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking channel */}
              <div>
                <label htmlFor="m-channel" className="text-slate-300 font-bold block mb-1">Booking Channel *</label>
                <select id="m-channel" value={manualForm.channel} onChange={(e) => setManualForm((f) => ({ ...f, channel: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone Call</option>
                  <option value="referral">Referral</option>
                  <option value="instagram">Instagram</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="m-notes" className="text-slate-300 font-bold block mb-1">Internal Notes</label>
                <textarea id="m-notes" rows={2} value={manualForm.notes} onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any special arrangements, payment notes…" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="btn-secondary w-1/2 text-xs py-3">Cancel</button>
                <button type="submit" disabled={manualSaving} className="btn-primary w-1/2 text-xs py-3 flex items-center justify-center gap-2">
                  {manualSaving ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Creating…</> : 'Confirm & Lock Dates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
