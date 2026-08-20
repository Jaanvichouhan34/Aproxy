import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Radio,
  ArrowUpRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from './ui/Button';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-brand-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pre-Footer Call to Action Card */}
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-900/60 via-slate-900 to-indigo-950/60 border border-brand-500/30 p-8 sm:p-12 mb-16 shadow-2xl overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-mono border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" /> ZERO FRAUD GUARANTEE
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to eliminate proxy attendance in your institution?
            </h3>
            <p className="text-sm text-slate-300">
              Deploy Aproxy in minutes. Compatible with all existing student mobile devices and lecture projectors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link to="/auth?mode=register">
              <Button variant="glow" size="lg" className="w-full sm:w-auto font-semibold">
                Get Started Free
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Launch Sandbox
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Aproxy
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The first cryptographic, zero-trust attendance protocol combining 1-second rotating HMAC tokens and edge 3D biometric liveness.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Jaanvichouhan34"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/in/jaanvi-chouhan"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#0A66C2] hover:text-white border border-slate-800 transition-colors"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features Bento
                </a>
              </li>
              <li>
                <a href="#threat-defense" className="hover:text-white transition-colors">
                  Threat Matrix
                </a>
              </li>
              <li>
                <Link to="/demo" className="hover:text-white transition-colors flex items-center gap-1">
                  Live Sandbox <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded font-mono">Demo</span>
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  System Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Crypto */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Security & Crypto
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  HMAC-SHA256 Token Spec
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  3D Liveness Neural Model
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  Merkle Ledger Audit
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  Zero-Knowledge Storage
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional / Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Institutional
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Faculty Portal
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <span className="text-slate-500">GDPR & FERPA Compliant</span>
              </li>
              <li>
                <span className="text-slate-500">SOC-2 Type II Verified</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Operational Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-mono">
              All Systems Operational • 99.99% Uptime (Epoch 10482)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span>© {new Date().getFullYear()} Aproxy Inc.</span>
            <span>•</span>
            <span>Developed by{' '}
              <a
                href="https://linkedin.com/in/jaanvi-chouhan"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-brand-400 underline font-medium transition-colors"
              >
                Jaanvi Chouhan
              </a>
            </span>
            <span>(</span>
            <a
              href="https://github.com/Jaanvichouhan34"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              GitHub
            </a>
            <span>•</span>
            <a
              href="https://linkedin.com/in/jaanvi-chouhan"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-[#0A66C2] underline transition-colors"
            >
              LinkedIn
            </a>
            <span>)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
