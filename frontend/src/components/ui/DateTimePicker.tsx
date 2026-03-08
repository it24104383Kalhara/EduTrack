import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

// ─── helpers ───────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOf(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function pad2(n: number) { return String(n).padStart(2, '0'); }

function toLocalISO(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Props {
    value: string;                    // datetime-local string "YYYY-MM-DDThh:mm" or date "YYYY-MM-DD"
    onChange: (val: string) => void;
    mode?: 'datetime' | 'date';
    label?: string;
    placeholder?: string;
    required?: boolean;
    id?: string;
}

// ─── Sub-component: CalendarPicker ─────────────────────────────────────────
interface CalendarProps {
    selectedDate: Date | null;
    onConfirm: (d: Date) => void;
}
function CalendarPicker({ selectedDate, onConfirm }: CalendarProps) {
    const now = new Date();
    const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? now.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? now.getMonth());
    const [picked, setPicked] = useState<Date | null>(selectedDate ?? null);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOf(viewYear, viewMonth);
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
    // pad to complete grid
    while (cells.length % 7 !== 0) cells.push(null);

    const isSunday = (col: number) => col % 7 === 0;
    const isToday = (d: number) => d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
    const isPicked = (d: number) => picked && d === picked.getDate() && viewMonth === picked.getMonth() && viewYear === picked.getFullYear();

    const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div className="flex flex-col gap-4">
            {/* Header row: Month/Year dropdowns + calendar icon */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {/* Month */}
                    <select
                        value={viewMonth}
                        onChange={e => setViewMonth(Number(e.target.value))}
                        className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#633194] cursor-pointer"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    {/* Year */}
                    <select
                        value={viewYear}
                        onChange={e => setViewYear(Number(e.target.value))}
                        className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#633194] cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Calendar icon display */}
                <div className="h-14 w-14 rounded-xl flex flex-col items-center justify-center shadow-md flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                    <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider">
                        {MONTHS[picked ? picked.getMonth() : viewMonth].slice(0, 3)}
                    </span>
                    <span className="text-white text-xl font-extrabold leading-tight">
                        {picked ? pad2(picked.getDate()) : '--'}
                    </span>
                </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 text-center">
                {DAYS.map((d, i) => (
                    <span key={d} className={clsx('text-[11px] font-bold py-1', i === 0 ? 'text-[#633194]' : 'text-gray-400')}>
                        {d}
                    </span>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
                {cells.map((day, idx) => {
                    if (!day) return <span key={`empty-${idx}`} />;
                    const col = idx % 7;
                    const sun = isSunday(col);
                    const today = isToday(day);
                    const sel = isPicked(day);
                    return (
                        <button
                            key={`${viewYear}-${viewMonth}-${day}`}
                            type="button"
                            onClick={() => setPicked(new Date(viewYear, viewMonth, day))}
                            className={clsx(
                                'h-8 w-8 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center',
                                sel && 'text-white font-bold shadow-md',
                                !sel && today && 'border-2 border-[#633194] text-[#633194] font-bold',
                                !sel && !today && sun && 'text-[#633194] hover:bg-[#F4F0FF]',
                                !sel && !today && !sun && 'text-gray-700 hover:bg-gray-100',
                            )}
                            style={sel ? { background: 'linear-gradient(135deg,#633194,#9b59b6)' } : {}}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Confirm Date */}
            <button
                type="button"
                disabled={!picked}
                onClick={() => picked && onConfirm(picked)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
            >
                Confirm Date
            </button>
        </div>
    );
}

// ─── Sub-component: TimePicker ─────────────────────────────────────────────
interface TimeProps {
    selectedDate: Date;
    initialHour: number;
    initialMinute: number;
    onConfirm: (h: number, m: number) => void;
    onBack: () => void;
}
function TimePicker({ selectedDate, initialHour, initialMinute, onConfirm, onBack }: TimeProps) {
    const [hour, setHour] = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialHour < 12 ? 'AM' : 'PM');

    const display12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return (
        <div className="flex flex-col gap-5">
            {/* Date summary bar */}
            <div className="flex items-center gap-2 bg-[#F4F0FF] rounded-xl px-4 py-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <span className="text-sm font-semibold text-[#633194]">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <button type="button" onClick={onBack} className="ml-auto text-xs text-[#633194]/60 hover:text-[#633194] font-medium transition-colors">
                    Change
                </button>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Set Time</p>

            {/* Time display — big */}
            <div className="flex items-center justify-center gap-3">
                {/* Hour */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => setHour(h => { const v = h + 1; return v > 23 ? 0 : v; })}
                        className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all text-lg font-bold">▲</button>
                    <div className="h-14 w-16 rounded-xl flex items-center justify-center text-3xl font-extrabold text-gray-800 border-2 border-[#633194]/30 bg-[#F4F0FF]">
                        {pad2(display12)}
                    </div>
                    <button type="button" onClick={() => setHour(h => { const v = h - 1; return v < 0 ? 23 : v; })}
                        className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all text-lg font-bold">▼</button>
                </div>

                <span className="text-3xl font-extrabold text-gray-400 mb-1">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => setMinute(m => m + 5 > 59 ? 0 : m + 5)}
                        className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all text-lg font-bold">▲</button>
                    <div className="h-14 w-16 rounded-xl flex items-center justify-center text-3xl font-extrabold text-gray-800 border-2 border-[#633194]/30 bg-[#F4F0FF]">
                        {pad2(minute)}
                    </div>
                    <button type="button" onClick={() => setMinute(m => m - 5 < 0 ? 55 : m - 5)}
                        className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all text-lg font-bold">▼</button>
                </div>

                {/* AM/PM toggle */}
                <div className="flex flex-col gap-1 ml-1">
                    {(['AM', 'PM'] as const).map(p => (
                        <button
                            key={p} type="button"
                            onClick={() => { setAmpm(p); setHour(h => { if (p === 'AM' && h >= 12) return h - 12; if (p === 'PM' && h < 12) return h + 12; return h; }); }}
                            className={clsx('h-[52px] w-12 rounded-xl text-sm font-bold transition-all',
                                ampm === p ? 'text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-[#F4F0FF]')}
                            style={ampm === p ? { background: 'linear-gradient(135deg,#633194,#9b59b6)' } : {}}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Confirm Time */}
            <button
                type="button"
                onClick={() => onConfirm(hour, minute)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
            >
                Confirm Time
            </button>
        </div>
    );
}

// ─── Main DateTimePicker ────────────────────────────────────────────────────
export default function DateTimePicker({ value, onChange, mode = 'datetime', label, placeholder, required, id }: Props) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'date' | 'time'>('date');
    const panelRef = useRef<HTMLDivElement>(null);

    // Parse current value
    const parsed = value ? new Date(value) : null;
    const isValidDate = parsed && !isNaN(parsed.getTime());
    const displayVal = isValidDate
        ? mode === 'datetime'
            ? parsed!.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
            : parsed!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDateConfirm = (d: Date) => {
        if (mode === 'date') {
            onChange(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
            setOpen(false);
        } else {
            // Move to time step, preserve existing time if any
            const existing = isValidDate ? parsed! : new Date();
            existing.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
            onChange(toLocalISO(existing));
            setStep('time');
        }
    };

    const handleTimeConfirm = (h: number, m: number) => {
        const current = isValidDate ? new Date(parsed!) : new Date();
        current.setHours(h, m, 0, 0);
        onChange(toLocalISO(current));
        setOpen(false);
        setStep('date');
    };

    const openPicker = () => { setStep('date'); setOpen(true); };

    return (
        <div className="relative" ref={panelRef}>
            {label && (
                <label htmlFor={id} className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
            )}

            {/* Trigger */}
            <button
                id={id}
                type="button"
                onClick={openPicker}
                className={clsx(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all',
                    open
                        ? 'border-[#633194] ring-2 ring-[#633194]/15 bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-[#633194]/40 hover:bg-white',
                    !displayVal && 'text-gray-400'
                )}
            >
                <svg className="h-4 w-4 text-[#633194] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={displayVal ? 'text-gray-800 font-medium' : ''}>{displayVal || (placeholder ?? (mode === 'datetime' ? 'Select date & time' : 'Select date'))}</span>
                {displayVal && (
                    <button
                        type="button"
                        className="ml-auto text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        onClick={e => { e.stopPropagation(); onChange(''); }}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-72"
                    style={{ minWidth: 288 }}>
                    {/* Step header */}
                    {mode === 'datetime' && (
                        <div className="flex items-center gap-2 mb-4">
                            {(['date', 'time'] as const).map((s, i) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={clsx('h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                        step === s ? 'text-white' : (i === 0 && step === 'time') ? 'text-white' : 'bg-gray-100 text-gray-400')}
                                        style={(step === s || (i === 0 && step === 'time')) ? { background: 'linear-gradient(135deg,#633194,#9b59b6)' } : {}}>
                                        {(i === 0 && step === 'time') ? '✓' : i + 1}
                                    </div>
                                    <span className={clsx('text-xs font-semibold capitalize', step === s ? 'text-[#633194]' : 'text-gray-400')}>
                                        {s}
                                    </span>
                                    {i === 0 && <span className="text-gray-200 text-xs">›</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {step === 'date' ? 'Select Date' : 'Set Time'}
                    </h3>

                    {step === 'date' ? (
                        <CalendarPicker
                            selectedDate={isValidDate ? parsed! : null}
                            onConfirm={handleDateConfirm}
                        />
                    ) : (
                        <TimePicker
                            selectedDate={isValidDate ? parsed! : new Date()}
                            initialHour={isValidDate ? parsed!.getHours() : 9}
                            initialMinute={isValidDate ? parsed!.getMinutes() : 0}
                            onConfirm={handleTimeConfirm}
                            onBack={() => setStep('date')}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
