import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const RestrictedPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] mx-auto max-w-5xl">
            {/* Illustration Area */}
            <div className="relative mb-8 sm:mb-12">
                {/* Background Large Text */}
                <h1 className="text-[120px] sm:text-[180px] font-black text-gray-100/80 select-none leading-none tracking-tighter">
                    403
                </h1>
                
                {/* Floating Elements/Illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative group">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 bg-red-400/20 rounded-full blur-3xl group-hover:bg-red-400/30 transition-all duration-700" />
                        
                        {/* Main Icon */}
                        <div className="relative h-32 w-32 sm:h-40 sm:w-40 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                            <ShieldExclamationIcon className="h-16 w-16 sm:h-20 sm:w-20 text-red-500 drop-shadow-sm" />
                            
                            {/* Decorative Dots */}
                            <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <div className="absolute -bottom-1 -left-1 h-3 w-3 bg-[#633194] rounded-full animate-bounce delay-150" />
                        </div>
                    </div>
                </div>

                {/* Decorative floating shapes */}
                <div className="absolute -top-10 -left-10 h-16 w-16 bg-purple-50 rounded-full blur-xl animate-pulse" />
                <div className="absolute -bottom-10 -right-10 h-20 w-20 bg-blue-50 rounded-full blur-xl animate-pulse delay-700" />
            </div>

            {/* Content Section */}
            <div className="max-w-md relative z-10 px-4">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-4 leading-tight">
                    We are <span className="text-[#633194]">Sorry...</span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-10">
                    The page you're trying to access has <span className="font-semibold text-gray-700 underline decoration-red-400 decoration-2 underline-offset-4">restricted access</span>. 
                    Please refer to your system administrator for more information.
                </p>

                {/* Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-[#633194] text-white font-bold text-sm shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Go Back</span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        Return Dashboard
                    </button>
                </div>

                {/* Status Indicator */}
                <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] select-none">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse" />
                    Access Denied
                </div>
            </div>
        </div>
    );
};

export default RestrictedPage;
