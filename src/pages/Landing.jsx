import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-height-screen bg-[#0a0e14] text-[#e6edf3] font-sans selection:bg-[#00d4ff]/30 selection:text-[#00d4ff] scroll-smooth">
      {/* Sticky Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0e14]/90 backdrop-blur-md border-b border-[#161b22] py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <svg
              className="w-7 h-7 text-[#00d4ff] transition-transform duration-300 group-hover:rotate-12"
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-[#8b949e] hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[#8b949e] hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              How it works
            </a>
            <a
              href="#security"
              className="text-[#8b949e] hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              Security
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded bg-transparent hover:bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff] hover:border-[#00d4ff] text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
            >
              Get started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#8b949e] hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-[#0a0e14] pt-24 px-6 transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-6 text-lg font-medium">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8b949e] hover:text-white py-2 border-b border-[#161b22]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8b949e] hover:text-white py-2 border-b border-[#161b22]"
          >
            How it works
          </a>
          <a
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8b949e] hover:text-white py-2 border-b border-[#161b22]"
          >
            Security
          </a>
          <div className="flex flex-col gap-4 mt-6">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-center rounded border border-[#161b22] text-[#e6edf3] font-semibold hover:bg-[#161b22] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-center rounded bg-[#00d4ff] hover:bg-[#00b2d6] text-black font-semibold transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(22,27,34,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(22,27,34,0.3)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00d4ff]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#161b22] border border-[#30363d] text-[#00d4ff] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            Trustless Cryptographic Messaging
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Chat without compromise.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#00a3ff]">
              Absolute privacy.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#8b949e] max-w-2xl mx-auto mb-10 leading-relaxed">
            QuantumChat uses client-side NaCl-box cryptography. Your messages and attachments are sealed before leaving your browser. The server never sees your private keys or plaintext.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded bg-[#00d4ff] hover:bg-[#00b2d6] text-black font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)] text-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded bg-[#161b22] hover:bg-[#21262d] text-white border border-[#30363d] font-bold transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 md:py-28 border-t border-[#161b22]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Designed for cryptographic sovereignty.
            </h2>
            <p className="text-base text-[#8b949e]">
              A clean, high-performance web messenger backed by mathematically proven security models.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#21262d] transition-all duration-200 hover:border-[#30363d]">
              <div className="w-10 h-10 rounded bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Client-Side Encryption</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Key generation and encryption happen purely in your browser. The host never touches your private keys or unsealed messages.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#21262d] transition-all duration-200 hover:border-[#30363d]">
              <div className="w-10 h-10 rounded bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Device Backups</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Export a simple human-readable `keys.txt` file to securely backup your key pairs and load your secure context onto other devices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#21262d] transition-all duration-200 hover:border-[#30363d]">
              <div className="w-10 h-10 rounded bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Messaging</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Instant delivery using WebSockets, keeping conversations snappy and fluid without compromising on client-side safety.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-lg bg-[#161b22] border border-[#21262d] transition-all duration-200 hover:border-[#30363d]">
              <div className="w-10 h-10 rounded bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Encrypted File Sharing</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Share files, images, and audio sealed via binary box-encryption. The server hosts only randomized byte structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 border-t border-[#161b22] bg-[#0c1017]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Get up and running in 60 seconds
            </h2>
            <p className="text-base text-[#8b949e]">
              A straightforward process designed with cryptographic best practices in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="w-8 h-8 rounded-full border border-[#00d4ff] flex items-center justify-center text-xs font-bold text-[#00d4ff] mb-6">
                1
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Register Your Account</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Create a password-backed account with standard credentials. Your email/username are used strictly for identifier lookups.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="w-8 h-8 rounded-full border border-[#00d4ff] flex items-center justify-center text-xs font-bold text-[#00d4ff] mb-6">
                2
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Generate Device Keys</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Your browser automatically constructs a pool of 5 Curve25519 keypairs. Save the generated key backup text to local storage and offline text files.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="w-8 h-8 rounded-full border border-[#00d4ff] flex items-center justify-center text-xs font-bold text-[#00d4ff] mb-6">
                3
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Commence Chatting</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Connect with contacts. Incoming messages are matched against your private key set and deciphered instantaneously within your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section id="security" className="py-20 md:py-28 border-t border-[#161b22]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 md:p-12 rounded-lg bg-[#161b22] border border-[#21262d] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 text-[#00d4ff] mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h3 className="text-lg font-bold uppercase tracking-wider">Cryptographic Credibility</h3>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Zero-Trust Architecture by Design
            </h2>

            <p className="text-base text-[#8b949e] mb-6 leading-relaxed">
              QuantumChat uses the TweetNaCl cryptographic wrapper to run standard <code className="text-white bg-[#0a0e14] px-1.5 py-0.5 rounded font-mono text-sm">nacl.box</code> operations. For every message, the client performs authenticated encryption via an ephemeral Curve25519 key exchange, Salsa20 stream cipher, and Poly1305 authenticator.
            </p>

            <div className="border-t border-[#21262d] pt-6 grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Double-Envelope Model</h4>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Every DM compiles into separate, dedicated envelopes target-sealed to both the sender's and recipient's active device key.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Decentralized Backups</h4>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Encryption keys are entirely disconnected from passwords. Restoring messages is strictly dependent on possession of local keyring backups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Wrapper */}
      <footer className="border-t border-[#161b22] bg-[#0a0e14]">
        {/* Footer Top Links */}
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="font-bold text-white">QuantumChat</span>
            </Link>
            <p className="text-xs text-[#8b949e] leading-relaxed max-w-xs">
              Open-source, end-to-end encrypted messaging systems focused on true digital sovereignty and user-focused cryptography.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#8b949e]">
              <li>
                <Link to="/register" className="hover:text-[#00d4ff] transition-colors">
                  Web App
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-[#00d4ff] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#00d4ff] transition-colors">
                  Security Model
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Resources</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#8b949e]">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00d4ff] transition-colors flex items-center gap-1"
                >
                  GitHub
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://tweetnacl.js.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00d4ff] transition-colors">
                  TweetNaCl Spec
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[#8b949e]">
              <li>
                <span className="cursor-not-allowed opacity-60">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-not-allowed opacity-60">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div className="max-w-7xl mx-auto px-6 py-6 border-t border-[#161b22] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#8b949e]">
            &copy; {new Date().getFullYear()} Quantum Logics. All rights reserved.
          </p>
          <p className="text-[11px] text-[#8b949e] flex items-center gap-1">
            Built securely for the modern web.
          </p>
        </div>
      </footer>
    </div>
  );
}
