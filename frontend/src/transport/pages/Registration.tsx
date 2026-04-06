import { useState, type FormEvent } from 'react';
import defaultDrivers from '../data/drivers.json';

interface FormData {
    firstName: string;
    lastName: string;
    phone: string;
    nic: string;
    busPlate: string;
    busNumber: string;
    username: string;
    password: string;
    confirmPass: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    phone?: string;
    nic?: string;
    busPlate?: string;
    busNumber?: string;
    username?: string;
    password?: string;
    confirmPass?: string;
}

// NIC validation:
//   Old format: 9 digits followed by 'V' or 'v'  → e.g. 123456789V
//   New format: exactly 12 digits                 → e.g. 200012345678
const NIC_REGEX = /^(\d{9}[Vv]|\d{12})$/;

// Phone: exactly 10 digits
const PHONE_REGEX = /^\d{10}$/;

const Field = ({
    id, label, placeholder, type = 'text', value, onChange, error, hint,
}: {
    id: string; label: string; placeholder: string;
    type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string; hint?: string;
}) => (
    <div className={`reg-field ${error ? 'has-error' : ''}`}>
        <label htmlFor={id}>{label}</label>
        <input
            id={id} type={type} placeholder={placeholder}
            value={value} onChange={onChange} autoComplete="off"
        />
        {hint && !error && <span className="reg-hint">{hint}</span>}
        {error && <span className="reg-error">{error}</span>}
    </div>
);

export default function Registration() {
    const [form, setForm] = useState<FormData>({
        firstName: '', lastName: '', phone: '', nic: '',
        busPlate: '', busNumber: '', username: '', password: '', confirmPass: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        // Clear field error on edit
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    function validate(): FormErrors {
        const e: FormErrors = {};
        if (!form.firstName.trim()) e.firstName = 'First name is required.';
        if (!form.lastName.trim()) e.lastName = 'Last name is required.';
        if (!PHONE_REGEX.test(form.phone.trim()))
            e.phone = 'Phone must be exactly 10 digits.';
        if (!NIC_REGEX.test(form.nic.trim()))
            e.nic = 'NIC must be 9 digits + V/v (old) or exactly 12 digits (new).';
        if (!form.busPlate.trim()) e.busPlate = 'Bus plate is required.';
        if (!form.busNumber.trim()) e.busNumber = 'Bus number is required.';
        if (!form.username.trim()) e.username = 'Username is required.';
        if (form.password.length < 6)
            e.password = 'Password must be at least 6 characters.';
        if (form.password !== form.confirmPass)
            e.confirmPass = 'Passwords do not match.';
        return e;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setSubmitting(true);
        setTimeout(() => {
            try {
                const local = localStorage.getItem('edutrack_drivers');
                // Use default data if empty so we don't start blank
                const driversList = local ? JSON.parse(local) : defaultDrivers;

                // duplicate username check
                if (driversList.some((d: any) => d.username === form.username)) {
                    throw new Error('Username already taken. Choose another.');
                }

                const newDriver = {
                    driver_id: Date.now(),
                    first_name: form.firstName,
                    last_name: form.lastName,
                    phone: form.phone,
                    nic_number: form.nic,
                    bus_plate: form.busPlate,
                    bus_number: form.busNumber,
                    username: form.username,
                    status: 'active'
                };

                // Add new driver to the top
                driversList.unshift(newDriver);
                localStorage.setItem('edutrack_drivers', JSON.stringify(driversList));

                setToast({ type: 'success', msg: 'Driver registered successfully!' });
                setForm({ firstName: '', lastName: '', phone: '', nic: '', busPlate: '', busNumber: '', username: '', password: '', confirmPass: '' });
                setTimeout(() => setToast(null), 4000);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Storage error. Please try again.';
                setToast({ type: 'error', msg });
                setTimeout(() => setToast(null), 5000);
            } finally {
                setSubmitting(false);
            }
        }, 600); // simulate network latency
    }



    return (
        <div className="reg-page">
            {/* Toast */}
            {toast && (
                <div className={`reg-toast ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <div className="page-header">
                <h1>Driver Registration</h1>
                <p>Register a new bus driver and assign credentials for the driver mobile app.</p>
            </div>

            <form className="reg-form" onSubmit={handleSubmit} noValidate>
                {/* Personal Info */}
                <div className="reg-section">
                    <div className="reg-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Personal Information
                    </div>
                    <div className="reg-grid-2">
                        <Field id="firstName" label="First Name *" placeholder="e.g. Suresh"
                            value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
                        <Field id="lastName" label="Last Name *" placeholder="e.g. Perera"
                            value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
                    </div>
                    <div className="reg-grid-2">
                        <Field id="phone" label="Phone Number *" placeholder="0771234567" type="tel"
                            value={form.phone} onChange={set('phone')} error={errors.phone}
                            hint="Exactly 10 digits, no spaces or dashes" />
                        <Field id="nic" label="NIC Number *" placeholder="123456789V or 200012345678"
                            value={form.nic} onChange={set('nic')} error={errors.nic}
                            hint="Old: 9 digits + V/v  |  New: 12 digits" />
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="reg-section">
                    <div className="reg-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 5v3h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        Vehicle Assignment
                    </div>
                    <div className="reg-grid-2">
                        <Field id="busPlate" label="Bus Number Plate *" placeholder="e.g. WP-AB-1234"
                            value={form.busPlate} onChange={set('busPlate')} error={errors.busPlate}
                            hint="Enter the full plate number for emergency tracking" />
                        <Field id="busNumber" label="Bus Fleet Number *" placeholder="e.g. BUS-03"
                            value={form.busNumber} onChange={set('busNumber')} error={errors.busNumber}
                            hint="Internal fleet/route number" />
                    </div>
                </div>

                {/* App Credentials */}
                <div className="reg-section">
                    <div className="reg-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Driver App Credentials
                    </div>
                    <div className="reg-grid-2">
                        <Field id="username" label="Username *" placeholder="e.g. driver_suresh"
                            value={form.username} onChange={set('username')} error={errors.username}
                            hint="Used to log in to the driver mobile app" />
                        <div /> {/* spacer */}
                    </div>
                    <div className="reg-grid-2">
                        <Field id="password" label="Password *" placeholder="Min 6 characters" type="password"
                            value={form.password} onChange={set('password')} error={errors.password} />
                        <Field id="confirmPass" label="Confirm Password *" placeholder="Repeat password" type="password"
                            value={form.confirmPass} onChange={set('confirmPass')} error={errors.confirmPass} />
                    </div>
                </div>

                <div className="reg-actions">
                    <button type="button" className="reg-reset-btn"
                        onClick={() => { setForm({ firstName: '', lastName: '', phone: '', nic: '', busPlate: '', busNumber: '', username: '', password: '', confirmPass: '' }); setErrors({}); }}>
                        Clear
                    </button>
                    <button type="submit" className="reg-submit-btn" disabled={submitting}>
                        {submitting ? (
                            <span className="reg-spinner" />
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        )}
                        {submitting ? 'Registering…' : 'Register Driver'}
                    </button>
                </div>
            </form>
        </div>
    );
}
