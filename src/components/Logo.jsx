import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d2e" />
          <stop offset="1" stopColor="#ff9a1f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#141418" stroke="rgba(255,255,255,0.08)" />
      <path d="M14 18h36l-4 8H36v24h-9V26H14z" fill="url(#tc-logo)" />
      <path d="M40 34l10 8-10 8z" fill="#fff" />
    </svg>
  );
}

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Thai Coach home">
      <LogoMark />
      {!compact && (
        <span className="font-display text-xl font-bold tracking-wide uppercase">
          Thai<span className="text-gradient">Coach</span>
        </span>
      )}
    </Link>
  );
}
