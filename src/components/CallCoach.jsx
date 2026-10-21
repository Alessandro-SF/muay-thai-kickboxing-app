import { Phone, Copy, Check, CircleAlert, Smartphone } from 'lucide-react';
import { COACH } from '../config';
import { useCopy } from '../hooks/useCopy';

/** Primary call button — always a real tel: link to the existing AI phone coach. */
export function CallCoachButton({ size = 'md', label = 'Call Thai Coach', className = '', pulse = false }) {
  const sizes = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-7 py-4 text-lg',
  };
  return (
    <a
      href={COACH.telHref}
      className={`btn btn-primary ${sizes[size]} ${pulse ? 'animate-pulse-ring' : ''} ${className}`}
      aria-label={`${label}: ${COACH.phoneDisplay}`}
      data-testid="call-coach"
    >
      <Phone className="h-5 w-5" aria-hidden="true" />
      {label}
    </a>
  );
}

export function CopyNumberButton({ className = '' }) {
  const { copy, status } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(COACH.phoneDisplay)}
      className={`btn btn-secondary ${className}`}
      aria-live="polite"
      data-testid="copy-number"
    >
      {status === 'copied' ? (
        <>
          <Check className="h-5 w-5 text-emerald-400" aria-hidden="true" /> Copied!
        </>
      ) : status === 'error' ? (
        <>
          <CircleAlert className="h-5 w-5 text-amber-400" aria-hidden="true" /> Copy failed — select the number
        </>
      ) : (
        <>
          <Copy className="h-5 w-5" aria-hidden="true" /> Copy number
        </>
      )}
    </button>
  );
}

/** Big phone number panel with call + copy actions and a desktop hint. */
export function PhonePanel({ compact = false }) {
  return (
    <div className={`card relative overflow-hidden ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
      <p className="eyebrow">{COACH.name}</p>
      <a
        href={COACH.telHref}
        className="mt-3 block font-display text-3xl font-bold tracking-wide whitespace-nowrap select-all hover:text-brand-300 sm:text-5xl"
        data-testid="coach-number"
      >
        {COACH.phoneDisplay}
      </a>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <CallCoachButton size="lg" pulse />
        <CopyNumberButton />
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm text-white/55">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          On a computer? Dial the number from your phone. Standard carrier calling rates and service availability may apply.
        </span>
      </p>
    </div>
  );
}
