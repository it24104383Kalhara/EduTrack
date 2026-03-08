import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface SelectOption {
    value: string | number;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface Props {
    value: string | number;
    onChange: (val: string | number) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = '— Select —', label, required, disabled, id, className }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (opt: SelectOption) => {
        if (opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
    };

    return (
        <div className={clsx('relative', className)} ref={ref}>
            {label && (
                <label htmlFor={id} className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
            )}

            {/* Trigger */}
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={clsx(
                    'w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all',
                    open
                        ? 'border-[#633194] ring-2 ring-[#633194]/15 bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-[#633194]/40 hover:bg-white',
                    disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
                    !selected && 'text-gray-400'
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
                <span className={clsx('flex-1 truncate', selected ? 'text-gray-800 font-medium' : '')}>
                    {selected ? selected.label : placeholder}
                </span>
                {/* Chevron */}
                <svg
                    className={clsx('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180 text-[#633194]')}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                    role="listbox"
                    style={{
                        animation: 'selectDropDown 0.15s ease-out',
                    }}
                >
                    <style>{`
            @keyframes selectDropDown {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>

                    <div className="max-h-60 overflow-y-auto py-1.5">
                        {/* Empty placeholder option */}
                        {placeholder && (
                            <div
                                onClick={() => { onChange(''); setOpen(false); }}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors',
                                    !value ? 'text-[#633194] font-semibold bg-[#F4F0FF]' : 'text-gray-400 hover:bg-gray-50'
                                )}
                            >
                                {!value && (
                                    <svg className="h-3 w-3 text-[#633194]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className={!value ? '' : 'ml-5'}>{placeholder}</span>
                            </div>
                        )}

                        {options.map(opt => {
                            const isSelected = opt.value === value;
                            return (
                                <div
                                    key={opt.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(opt)}
                                    className={clsx(
                                        'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                                        opt.disabled
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : isSelected
                                                ? 'text-[#633194] font-semibold bg-[#F4F0FF] cursor-pointer'
                                                : 'text-gray-700 cursor-pointer hover:bg-[#F4F0FF]/60 hover:text-[#633194]'
                                    )}
                                >
                                    {/* Checkmark slot */}
                                    <span className="w-4 flex-shrink-0 flex items-center justify-center">
                                        {isSelected && (
                                            <svg className="h-3.5 w-3.5 text-[#633194]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </span>
                                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                                    <div className="flex-1 min-w-0">
                                        <span className="block truncate">{opt.label}</span>
                                        {opt.description && (
                                            <span className="text-xs text-gray-400 block truncate">{opt.description}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
