/**
 * Original vector illustration of a fighter throwing a roundhouse kick.
 * (No stock photography is bundled; drop real images in /public/images and
 * swap this component if you license photography later.)
 */
export default function HeroArt({ className = '' }) {
  return (
    <svg viewBox="0 0 420 420" className={className} role="img" aria-label="Illustration of a Muay Thai fighter throwing a roundhouse kick">
      <defs>
        <radialGradient id="sun" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#ff6a45" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#e5341a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0a0a0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151518" />
          <stop offset="1" stopColor="#050506" />
        </linearGradient>
        <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb341" stopOpacity="0" />
          <stop offset="1" stopColor="#ffb341" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="215" cy="190" r="175" fill="url(#sun)" />
      <text x="210" y="390" textAnchor="middle" fontSize="74" fontWeight="800" fill="#ffffff" opacity="0.06" fontFamily="sans-serif">
        มวยไทย
      </text>

      {/* ring ropes */}
      {[250, 285, 320].map((y) => (
        <line key={y} x1="0" x2="420" y1={y} y2={y - 18} stroke="#ffffff" strokeOpacity="0.08" strokeWidth="3" />
      ))}

      {/* kick motion arcs */}
      <g fill="none" strokeLinecap="round" filter="url(#glow)">
        <path d="M205 245 Q120 255 70 165" stroke="url(#arc)" strokeWidth="5" opacity="0.8" />
        <path d="M215 268 Q110 285 52 190" stroke="url(#arc)" strokeWidth="3" opacity="0.5" />
        <path d="M190 225 Q130 225 92 140" stroke="url(#arc)" strokeWidth="2" opacity="0.4" />
      </g>

      {/* fighter silhouette */}
      <g stroke="url(#body)" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* support leg */}
        <path d="M232 222 L240 296 L252 362" strokeWidth="27" />
        <path d="M252 364 L284 370" strokeWidth="14" />
        {/* kicking leg */}
        <path d="M222 215 L158 186" strokeWidth="30" />
        <path d="M158 186 L84 150" strokeWidth="21" />
        <path d="M84 150 L62 140" strokeWidth="13" />
        {/* torso */}
        <path d="M252 130 L232 215" strokeWidth="44" />
        {/* rear arm counterbalance */}
        <path d="M262 140 L296 176 L318 206" strokeWidth="15" />
        {/* lead arm guarding face */}
        <path d="M245 138 L218 158 L222 116" strokeWidth="14" />
      </g>
      <g fill="#0b0b0d">
        <circle cx="258" cy="94" r="23" />
        <circle cx="222" cy="110" r="14" />
        <circle cx="320" cy="212" r="15" />
      </g>
      {/* gloves & mongkol accents */}
      <circle cx="222" cy="110" r="14" fill="#e5341a" />
      <circle cx="320" cy="212" r="15" fill="#e5341a" />
      <path d="M236 86 Q258 74 280 86" stroke="#ffb341" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* shorts */}
      <path d="M214 200 L252 206 L246 236 L222 232 Z" fill="#e5341a" />
      <path d="M216 205 L250 210" stroke="#ffb341" strokeWidth="3" />

      {/* impact spark */}
      <g transform="translate(46 132)" fill="#ffb341" filter="url(#glow)">
        <path d="M0 -18 L4 -4 L18 0 L4 4 L0 18 L-4 4 L-18 0 L-4 -4 Z" />
      </g>
    </svg>
  );
}
