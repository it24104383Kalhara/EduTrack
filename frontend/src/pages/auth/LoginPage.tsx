import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../utils/auth";
import { motion } from "framer-motion";

const LoginPage = () => {
    const [role, setRole] = useState("Coach");
    const [name, setName] = useState("John Doe");
    const { login } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(role, name);
        
        // Redirect to the page they tried to visit, or dashboard
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex font-sans"
        >
            {/* Left Panel – Branding */}
            <div
                className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 60%, #c39bd3 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 relative z-10 hover:opacity-80 transition-all group">
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xl font-bold text-white tracking-wide">EduTrack</span>
                        <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Management</p>
                    </div>
                </Link>

                {/* Center content */}
                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Manage your school<br />with confidence.
                    </h2>
                    <p className="text-white/75 text-base leading-relaxed max-w-sm">
                        A comprehensive platform for managing student activities, attendance, achievements, and administrative workflows — all in one place.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {['Attendance Tracking', 'Activity Management', 'Principal Reports', 'Teacher Alerts'].map(f => (
                            <span key={f} className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white border border-white/20 font-medium">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Bottom quote */}
                <div className="relative z-10">
                    <p className="text-white/60 text-sm italic">
                        "Education is the most powerful weapon which you can use to change the world."
                    </p>
                    <p className="text-white/50 text-xs mt-1">— Nelson Mandela</p>
                </div>
            </div>

            {/* Right Panel – Login Form */}
            <div className="flex-1 flex items-center justify-center bg-[#F9FAFB] p-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden hover:opacity-80 transition-all group">
                        <div className="h-9 w-9 bg-[#633194] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-[#633194]">EduTrack</span>
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back 👋</h1>
                        <p className="text-gray-500 text-sm mt-1">Sign in to your EduTrack account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Your Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/15 transition-all placeholder:text-gray-400 shadow-sm"
                            />
                        </div>

                        {/* Role Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Your Role
                            </label>
                        </div>

                        {/* Role Pills */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['Admin', 'Coach', 'Teacher', 'Student'].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all placeholder:text-gray-400 shadow-sm duration-300 ${role === r
                                            ? 'bg-[#F4F0FF] text-[#633194] border-[#633194] shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#633194]/30 hover:text-[#633194] hover:bg-gray-50'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 mt-2"
                            style={{ background: 'linear-gradient(135deg, #633194 0%, #9b59b6 100%)' }}
                        >
                            Sign In to EduTrack
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">
                            Demo application — select any role to proceed
                        </p>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default LoginPage;
