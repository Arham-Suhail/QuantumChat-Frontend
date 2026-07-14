import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatKeyFile, downloadKeyFile } from '../crypto/keyFile.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Registration Form States
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation States
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Key backup view states
  const [keySet, setKeySet] = useState(null); 
  const [downloaded, setDownloaded] = useState(false);

  // Run validation on form changes
  useEffect(() => {
    const errors = {};
    
    if (form.username && form.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }
    
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    if (form.password && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    
    setValidationErrors(errors);
  }, [form]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Final check
    const errors = {};
    if (form.username.trim().length < 3) errors.username = 'Username must be at least 3 characters.';
    if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email address.';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouched({ username: true, email: true, password: true, confirmPassword: true });
      return;
    }
    
    setLoading(true);
    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password
      });
      setKeySet(result.keySet);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. User may already exist.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const content = formatKeyFile({ 
      username: form.username, 
      email: form.email, 
      secretKeys: keySet.map((k) => k.secretKey) 
    });
    downloadKeyFile(content);
    setDownloaded(true);
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // -------------------------------------------------------------
  // POST-REGISTER KEY BACKUP SCREEN
  // -------------------------------------------------------------
  if (keySet) {
    return (
      <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] flex flex-col items-center justify-center px-4 relative selection:bg-[#00d4ff]/30 selection:text-[#00d4ff]">
        {/* Top Bar with ThemeToggle from upstream */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-white">Quantum<span className="text-[#00d4ff]">Chat</span></span>
        </div>

        <div className="w-full max-w-[460px] bg-[#161b22] border border-[#21262d] rounded-xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Save your encryption keys</h1>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              These 5 secret keypairs are the only way to read your conversations on other devices.
            </p>
          </div>

          <div className="p-3 bg-[#e59819]/10 border border-[#e59819]/30 rounded-lg text-xs text-[#e59819] leading-relaxed">
            <strong>CRITICAL WARNING:</strong> We operate a zero-trust model. Your keys are <strong>never</strong> transmitted to our servers. If you clear your browser data or switch devices without this backup, your chat history is permanently lost.
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#8b949e]">Your Device Keyring (Private Keys)</span>
            <div className="max-h-[160px] overflow-y-auto bg-[#0a0e14] border border-[#30363d] rounded-lg p-3 space-y-2 font-mono text-[10px] text-[#e6edf3] scrollbar-thin">
              {keySet.map((k, i) => (
                <div key={i} className="flex justify-between items-center gap-2 border-b border-[#21262d]/50 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-[#00d4ff] font-semibold">Key {i + 1}:</span>
                  <span className="break-all">{k.secretKey}</span>
                </div>
              ))}
            </div>
          </div>

          {downloaded && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 font-medium flex items-center gap-2">
              <svg className="w-4.5 h-4.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Backup file downloaded as `keys.txt` — keep it secure!</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full bg-[#00d4ff] hover:bg-[#00b2d6] text-[#0a0e14] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] flex items-center justify-center gap-2"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download keys.txt
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full bg-transparent hover:bg-[#161b22] text-[#8b949e] hover:text-white border border-[#30363d] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm text-center"
            >
              I've saved my keys, continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FORM
  // -------------------------------------------------------------
  const isSubmitDisabled = loading || Object.keys(validationErrors).length > 0;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] flex flex-col items-center justify-center px-4 py-8 relative selection:bg-[#00d4ff]/30 selection:text-[#00d4ff]">
      {/* Top Bar with ThemeToggle from upstream */}
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

      {/* Card */}
      <div className="w-full max-w-[420px] bg-[#161b22] border border-[#21262d] rounded-xl p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1.5">Create your account</h1>
          <p className="text-xs text-[#8b949e]">Join and encrypt your messaging workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1">
            <label htmlFor="register-username" className="text-xs font-semibold text-[#8b949e]">Name (Username)</label>
            <div className="relative group">
              <span className="absolute left-3.5 top-[13px] text-[#8b949e] group-focus-within:text-[#00d4ff] transition-colors">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <input
                id="register-username"
                type="text"
                placeholder="quantum_dev"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onBlur={() => handleBlur('username')}
                required
                minLength={3}
                className="w-full bg-[#0a0e14] border border-[#30363d] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] text-[#e6edf3] placeholder-[#8b949e]/60 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
            {touched.username && validationErrors.username && (
              <span className="text-[11px] text-red-400 font-medium block mt-0.5">{validationErrors.username}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="register-email" className="text-xs font-semibold text-[#8b949e]">Email Address</label>
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
                id="register-email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                required
                className="w-full bg-[#0a0e14] border border-[#30363d] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] text-[#e6edf3] placeholder-[#8b949e]/60 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
            {touched.email && validationErrors.email && (
              <span className="text-[11px] text-red-400 font-medium block mt-0.5">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="register-password" className="text-xs font-semibold text-[#8b949e]">Password</label>
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
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => handleBlur('password')}
                required
                minLength={8}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && validationErrors.password && (
              <span className="text-[11px] text-red-400 font-medium block mt-0.5">{validationErrors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#8b949e]">Confirm Password</label>
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
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onBlur={() => handleBlur('confirmPassword')}
                required
                className="w-full bg-[#0a0e14] border border-[#30363d] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] text-[#e6edf3] placeholder-[#8b949e]/60 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-[13px] text-[#8b949e] hover:text-[#00d4ff] transition-colors"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.confirmPassword && validationErrors.confirmPassword && (
              <span className="text-[11px] text-red-400 font-medium block mt-0.5">{validationErrors.confirmPassword}</span>
            )}
          </div>

          {/* Under-form decryption keys warning note */}
          <div className="pt-2 text-[11px] text-[#8b949e] leading-relaxed">
            We'll generate your encryption keys automatically after signup — you'll get a chance to back them up.
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-[#00d4ff] hover:bg-[#00b2d6] text-[#0a0e14] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>

      {/* Switch to Login */}
      <p className="text-sm text-[#8b949e] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#00d4ff] hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
