import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordClicked, setForgotPasswordClicked] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setForgotPasswordClicked(false);
    setLoading(true);
    try {
      await login(form);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection failure.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] flex flex-col items-center justify-center px-4 relative selection:bg-[#00d4ff]/30 selection:text-[#00d4ff]">
      {/* Top bar with ThemeToggle from upstream */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Brand Logo Link */}
      <Link to="/" className="flex items-center gap-2 group mb-6 transition-transform hover:scale-[1.02]">
        <svg
          className="w-6 h-6 text-[#00d4ff] transition-transform duration-300 group-hover:rotate-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="text-xl font-bold tracking-tight text-white">
          Quantum<span className="text-[#00d4ff]">Chat</span>
        </span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-[#161b22] border border-[#21262d] rounded-xl p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back</h1>
          <p className="text-xs text-[#8b949e]">Sign in to decrypt your conversations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-semibold text-[#8b949e]">Email Address</label>
            <div className="relative group">
              <span className="absolute left-3.5 top-[13px] text-[#8b949e] group-focus-within:text-[#00d4ff] transition-colors">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                  />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-[#0a0e14] border border-[#30363d] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] text-[#e6edf3] placeholder-[#8b949e]/60 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="text-xs font-semibold text-[#8b949e]">Password</label>
              <button
                type="button"
                onClick={() => setForgotPasswordClicked(!forgotPasswordClicked)}
                className="text-xs text-[#8b949e] hover:text-[#00d4ff] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative group">
              <span className="absolute left-3.5 top-[13px] text-[#8b949e] group-focus-within:text-[#00d4ff] transition-colors">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-[#0a0e14] border border-[#30363d] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] text-[#e6edf3] placeholder-[#8b949e]/60 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[13px] text-[#8b949e] hover:text-[#00d4ff] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Info warnings and error messages */}
          {forgotPasswordClicked && (
            <div className="p-3 bg-[#e59819]/10 border border-[#e59819]/30 rounded-lg text-xs text-[#e59819] leading-relaxed">
              <strong>Account Recovery Notice:</strong> QuantumChat uses end-to-end encryption. Passwords cannot be reset by the server. You can only recover access to your conversation history by importing your downloaded <code className="bg-[#0a0e14] px-1 py-0.5 rounded font-mono text-[10px]">keys.txt</code> file.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00d4ff] hover:bg-[#00b2d6] text-[#0a0e14] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Switch to Register */}
      <p className="text-sm text-[#8b949e] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#00d4ff] hover:underline font-semibold">
          Register
        </Link>
      </p>
    </div>
  );
}
