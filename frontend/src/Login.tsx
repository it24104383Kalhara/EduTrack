import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data: { message: string; role?: string } = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessageType("success");
      setMessage(data.message);
      if (data.role === "librarian") {
        localStorage.setItem("libAuth", "true");
        navigate("/dashboard");
      } else if (data.role === "roomUser") navigate("/roomsBooking");
    } catch (err) {
      setMessageType("error");
      setMessage(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#faf8ff] to-[#e8f5fe]">
      <div className="w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue to EduTrack</p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#633194] focus:ring-2 focus:ring-[#633194]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            className="mt-2 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg,#633194,#9b59b6)' }}
          >
            Sign In
          </button>
        </form>

        {message && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm text-center ${
            messageType === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}