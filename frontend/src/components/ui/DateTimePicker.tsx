import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

// ─── Helpers ───────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y: number, m: number)  { return new Date(y, m, 1).getDay(); }
function pad2(n: number)                   { return String(n).padStart(2, '0'); }
function toLocalISO(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const SEL_BASE = [
    'appearance-none text-sm font-semibold bg-white',
    'border-2 border-gray-200 rounded-xl',
    'pl-3 pr-7 py-1.5',
    'focus:outline-none focus:border-[#633194]',
    'cursor-pointer transition-colors hover:border-[#633194]/50',
].join(' ');

// ─── Types ─────────────────────────────────────────────────────────────────
export interface DateTimePickerProps {
    value: string;
    onChange: (val: string) => void;
    mode?: 'datetime' | 'date';
    label?: string;
    placeholder?: string;
    required?: boolean;
    id?: string;
}

// ─── CalendarPicker ────────────────────────────────────────────────────────
function CalendarPicker({
    selectedDate, onConfirm,
}: { selectedDate: Date | null; onConfirm: (d: Date) => void }) {
    const now = new Date();
    const [viewYear,  setViewYear]  = useState(selectedDate?.getFullYear() ?? now.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth()    ?? now.getMonth());
    const [picked,    setPicked]    = useState<Date | null>(selectedDate);

    const total    = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOf(viewYear, viewMonth);
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    const isToday  = (d: number) => d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
    const isPicked = (d: number) => !!picked && d === picked.getDate() && viewMonth === picked.getMonth() && viewYear === picked.getFullYear();
    const years    = Array.from({ length: 12 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div className="flex flex-col gap-3">
            {/* Month / Year selectors */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-1 min-w-0">
                    {/* Month */}
                    <div className="relative flex-1 min-w-0">
                        <select value={viewMonth} onChange={e => setViewMonth(+e.target.value)} className={SEL_BASE + ' w-full'}>
                            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </span>
                    </div>
                    {/* Year */}
                    <div className="relative w-24 flex-shrink-0">
                        <select value={viewYear} onChange={e => setViewYear(+e.target.value)} className={SEL_BASE + ' w-full'}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </span>
                    </div>
                </div>
                {/* Badge */}
                <div className="h-12 w-12 rounded-xl flex flex-col items-center justify-center shadow-sm flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                    <span className="text-white/70 text-[8px] font-bold uppercase tracking-wider">
                        {MONTHS[picked ? picked.getMonth() : viewMonth].slice(0, 3)}
                    </span>
                    <span className="text-white text-lg font-extrabold leading-none">
                        {picked ? pad2(picked.getDate()) : '--'}
                    </span>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
                {DAYS.map((d, i) => (
                    <span key={d} className={clsx('text-[10px] font-bold py-1', i === 0 ? 'text-[#633194]' : 'text-gray-400')}>{d}</span>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {cells.map((day, idx) => {
                    if (!day) return <span key={`e-${idx}`} />;
                    const sun = idx % 7 === 0;
                    const sel = isPicked(day);
                    const tod = isToday(day);
                    return (
                        <button key={`${viewYear}-${viewMonth}-${day}`} type="button"
                            onClick={() => setPicked(new Date(viewYear, viewMonth, day))}
                            className={clsx(
                                'h-8 w-8 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center',
                                sel  && 'text-white font-bold shadow-md',
                                !sel && tod  && 'border-2 border-[#633194] text-[#633194] font-bold',
                                !sel && !tod && sun  && 'text-[#633194] hover:bg-[#F4F0FF]',
                                !sel && !tod && !sun && 'text-gray-700 hover:bg-gray-100',
                            )}
                            style={sel ? { background: 'linear-gradient(135deg,#633194,#9b59b6)' } : {}}
                        >{day}</button>
                    );
                })}
            </div>

            {/* Confirm */}
            <button type="button" disabled={!picked} onClick={() => picked && onConfirm(picked)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:shadow-lg hover:-translate-y-0.5 mt-1"
                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                Confirm Date
            </button>
        </div>
    );
}

// ─── TimePicker ────────────────────────────────────────────────────────────
function TimePicker({
    selectedDate, initialHour, initialMinute, onConfirm, onBack,
}: { selectedDate: Date; initialHour: number; initialMinute: number; onConfirm: (h: number, m: number) => void; onBack: () => void }) {
    const [hour,   setHour]   = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);
    const [ampm,   setAmpm]   = useState<'AM'|'PM'>(initialHour < 12 ? 'AM' : 'PM');
    const d12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-[#F4F0FF] rounded-xl px-3 py-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                    <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
                <span className="text-xs font-semibold text-[#633194] flex-1">
                    {selectedDate.toLocaleDateString('en-US', { weekday:'short', month:'long', day:'numeric', year:'numeric' })}
                </span>
                <button type="button" onClick={onBack}
                    className="text-[10px] text-[#633194]/60 hover:text-[#633194] font-bold transition-colors underline underline-offset-2">
                    Change
                </button>
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Set Time</p>

            <div className="flex items-center justify-center gap-2">
                {/* Hour */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => setHour(h => h + 1 > 23 ? 0 : h + 1)}
                        className="h-7 w-10 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all font-bold">▲</button>
                    <div className="h-12 w-14 rounded-xl flex items-center justify-center text-2xl font-extrabold text-gray-800 border-2 border-[#633194]/30 bg-[#F4F0FF]">{pad2(d12)}</div>
                    <button type="button" onClick={() => setHour(h => h - 1 < 0 ? 23 : h - 1)}
                        className="h-7 w-10 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all font-bold">▼</button>
                </div>
                <span className="text-2xl font-extrabold text-gray-400 pb-1">:</span>
                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => setMinute(m => m + 5 > 59 ? 0 : m + 5)}
                        className="h-7 w-10 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all font-bold">▲</button>
                    <div className="h-12 w-14 rounded-xl flex items-center justify-center text-2xl font-extrabold text-gray-800 border-2 border-[#633194]/30 bg-[#F4F0FF]">{pad2(minute)}</div>
                    <button type="button" onClick={() => setMinute(m => m - 5 < 0 ? 55 : m - 5)}
                        className="h-7 w-10 rounded-lg bg-gray-100 hover:bg-[#F4F0FF] hover:text-[#633194] text-gray-500 flex items-center justify-center transition-all font-bold">▼</button>
                </div>
                {/* AM/PM */}
                <div className="flex flex-col gap-1 ml-1">
                    {(['AM','PM'] as const).map(p => (
                        <button key={p} type="button"
                            onClick={() => { setAmpm(p); setHour(h => { if (p==='AM' && h>=12) return h-12; if (p==='PM' && h<12) return h+12; return h; }); }}
                            className={clsx('h-[46px] w-11 rounded-xl text-xs font-bold transition-all',
                                ampm===p ? 'text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-[#F4F0FF]')}
                            style={ampm===p ? { background:'linear-gradient(135deg,#633194,#9b59b6)' } : {}}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <button type="button" onClick={() => onConfirm(hour, minute)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
                Confirm Time
            </button>
        </div>
    );
}

// ─── Panel Portal ──────────────────────────────────────────────────────────
// Renders children via portal into document.body at a fixed position based on the trigger rect.
function PanelPortal({
    triggerRect, children, width = 296,
}: { triggerRect: DOMRect | null; children: React.ReactNode; width?: number }) {
    if (!triggerRect) return null;

    const PANEL_HEIGHT_APPROX = 420;
    const GAP = 6;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openUpward = spaceBelow < PANEL_HEIGHT_APPROX && triggerRect.top > PANEL_HEIGHT_APPROX;

    const style: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(triggerRect.left, window.innerWidth - width - 8),
        width,
        zIndex: 9999,
        ...(openUpward
            ? { bottom: window.innerHeight - triggerRect.top + GAP }
            : { top: triggerRect.bottom + GAP }),
    };

    return createPortal(
        <div style={style}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
                 style={{ animation: 'dtpFadeIn .15s ease-out' }}>
                <style>{`
                    @keyframes dtpFadeIn {
                        from { opacity:0; transform:translateY(${openUpward ? '6px' : '-6px'}) scale(.97); }
                        to   { opacity:1; transform:translateY(0) scale(1); }
                    }
                `}</style>
                {children}
            </div>
        </div>,
        document.body,
    );
}

// ─── Main DateTimePicker ────────────────────────────────────────────────────
export default function DateTimePicker({ value, onChange, mode = 'datetime', label, placeholder, required, id }: DateTimePickerProps) {
    const [open,        setOpen]        = useState(false);
    const [step,        setStep]        = useState<'date'|'time'>('date');
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const triggerRef                    = useRef<HTMLButtonElement>(null);
    const panelRef                      = useRef<HTMLDivElement>(null);

    const parsed      = value ? new Date(value) : null;
    const isValidDate = parsed && !isNaN(parsed.getTime());
    const displayVal  = isValidDate
        ? mode === 'datetime'
            ? parsed!.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })
            : parsed!.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
        : '';

    // Close on outside click — check both trigger and portal panel
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const inTrigger = triggerRef.current?.contains(target);
            const inPanel   = panelRef.current?.contains(target);
            if (!inTrigger && !inPanel) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on scroll / resize so portal doesn't drift
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
    }, [open]);

    const openPicker = () => {
        if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
        setStep('date');
        setOpen(true);
    };

    const handleDateConfirm = (d: Date) => {
        if (mode === 'date') {
            onChange(`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`);
            setOpen(false);
        } else {
            const base = isValidDate ? new Date(parsed!) : new Date();
            base.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
            onChange(toLocalISO(base));
            setStep('time');
            // Re-measure rect after state update
            if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
        }
    };

    const handleTimeConfirm = (h: number, m: number) => {
        const base = isValidDate ? new Date(parsed!) : new Date();
        base.setHours(h, m, 0, 0);
        onChange(toLocalISO(base));
        setOpen(false);
        setStep('date');
    };

    return (
        <div className="relative">
            {label && (
                <label htmlFor={id} className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
            )}

            {/* Trigger button */}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                onClick={openPicker}
                className={clsx(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all',
                    open
                        ? 'border-[#633194] ring-2 ring-[#633194]/15 bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-[#633194]/40 hover:bg-white',
                    !displayVal && 'text-gray-400',
                )}
            >
                <svg className="h-4 w-4 text-[#633194] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span className={clsx('flex-1 truncate', displayVal && 'text-gray-800 font-medium')}>
                    {displayVal || (placeholder ?? (mode === 'datetime' ? 'Select date & time' : 'Select date'))}
                </span>
                {displayVal && (
                    <button type="button" className="ml-auto text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                )}
            </button>

            {/* Portal panel — renders at document.body level, never clipped */}
            {open && (
                <PanelPortal triggerRect={triggerRect}>
                    <div ref={panelRef}>
                        {/* Step indicator */}
                        {mode === 'datetime' && (
                            <div className="flex items-center gap-2 mb-3">
                                {(['date','time'] as const).map((s, i) => (
                                    <div key={s} className="flex items-center gap-1.5">
                                        <div className={clsx(
                                                'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                                                (step===s || (i===0 && step==='time')) ? 'text-white' : 'bg-gray-100 text-gray-400',
                                            )}
                                            style={(step===s || (i===0&&step==='time')) ? { background:'linear-gradient(135deg,#633194,#9b59b6)' } : {}}>
                                            {i===0 && step==='time' ? '✓' : i+1}
                                        </div>
                                        <span className={clsx('text-[11px] font-semibold capitalize', step===s ? 'text-[#633194]' : 'text-gray-400')}>{s}</span>
                                        {i===0 && <span className="text-gray-300 text-xs ml-0.5">›</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        <h3 className="text-base font-bold text-gray-800 mb-3">
                            {step === 'date' ? 'Select Date' : 'Set Time'}
                        </h3>
                        {step === 'date'
                            ? <CalendarPicker selectedDate={isValidDate ? parsed! : null} onConfirm={handleDateConfirm}/>
                            : <TimePicker
                                selectedDate={isValidDate ? parsed! : new Date()}
                                initialHour={isValidDate ? parsed!.getHours() : 9}
                                initialMinute={isValidDate ? parsed!.getMinutes() : 0}
                                onConfirm={handleTimeConfirm}
                                onBack={() => setStep('date')}
                            />
                        }
                    </div>
                </PanelPortal>
            )}
        </div>
    );
}
