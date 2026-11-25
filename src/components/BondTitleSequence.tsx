import React, { useEffect, useRef, useState } from 'react';
import { FastForward, Film, Volume2, VolumeX } from 'lucide-react';

interface BondTitleSequenceProps {
  loading: boolean;
  loadProgress: number;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  onComplete: () => void;
}

type SequenceAct = 1 | 2 | 3 | 4;

// Large choreographed Dr. No (1962) Pop-Art geometric dots
const DR_NO_CHOREOGRAPHY = [
  { cx: '18%', cy: '32%', size: 84, color: '#D4AF37', delay: '0.05s', dur: '1.15s' },
  { cx: '34%', cy: '62%', size: 112, color: '#C42B2B', delay: '0.18s', dur: '1.20s' },
  { cx: '52%', cy: '26%', size: 68, color: '#38BDF8', delay: '0.30s', dur: '1.10s' },
  { cx: '66%', cy: '64%', size: 96, color: '#F4F1EA', delay: '0.12s', dur: '1.25s' },
  { cx: '80%', cy: '34%', size: 104, color: '#D4AF37', delay: '0.26s', dur: '1.15s' },
  { cx: '26%', cy: '48%', size: 58, color: '#10B981', delay: '0.42s', dur: '1.05s' },
  { cx: '72%', cy: '48%', size: 64, color: '#C42B2B', delay: '0.36s', dur: '1.10s' },
  { cx: '48%', cy: '52%', size: 124, color: '#D4AF37', delay: '0.48s', dur: '1.25s' },
];

export const BondTitleSequence: React.FC<BondTitleSequenceProps> = ({
  loading,
  loadProgress,
  isPlayingAudio,
  onToggleAudio,
  onComplete,
}) => {
  const [act, setAct] = useState<SequenceAct>(1);
  const [minSequenceElapsed, setMinSequenceElapsed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // 4-Act Nostalgic 007 Sequence:
  // Act I (0.0s -> 1.45s): Maurice Binder Gun-Barrel Walk, Shot & Crimson Blood Wash
  // Act II (1.45s -> 2.75s): Dr. No Large Pop-Art Dots + Brownjohn Projected Goldfinger DB5 Silhouette
  // Act III (2.75s -> 3.65s): Daniel Kleinman Mechanical Q-Branch Symbolism & Stream Telemetry
  // Act IV (3.65s -> 4.25s): Gun-Barrel Iris Reveal into Live 3D Studio
  useEffect(() => {
    const t2 = window.setTimeout(() => setAct(2), 1450);
    const t3 = window.setTimeout(() => setAct(3), 2750);
    const tReady = window.setTimeout(() => setMinSequenceElapsed(true), 3650);

    return () => {
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tReady);
    };
  }, []);

  useEffect(() => {
      if (!loading && minSequenceElapsed && act < 4) {
        setAct(4);
      }
}, [loading, minSequenceElapsed, act]);

useEffect(() => {
  if (act !== 4) return;
  const tDone = window.setTimeout(() => {
    onCompleteRef.current();
  }, 620);
  return () => window.clearTimeout(tDone);
}, [act]);

const handleSkip = () => {
  if (loading) return;
  setAct(4);
};

return (
  <div
    className={`fixed inset-0 z-50 overflow-hidden bg-[#050505] text-[#F4F1EA] select-none transition-all duration-700 ease-out ${act === 4 ? 'opacity-0 pointer-events-none scale-[1.08]' : 'opacity-100'
      }`}
    aria-label="007 Opening Title Sequence"
  >
    {/* 35mm Film Grain & Projector Vignette */}
    <div className="absolute inset-0 gf-projector-vignette pointer-events-none" />
    <div className="absolute inset-0 gf-film-grain opacity-85 pointer-events-none" />

    {/* 35mm Optical Gate Registration Corners */}
    <div className="absolute top-6 left-6 w-7 h-7 border-t-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
    <div className="absolute top-6 right-6 w-7 h-7 border-t-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />
    <div className="absolute bottom-6 left-6 w-7 h-7 border-b-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
    <div className="absolute bottom-6 right-6 w-7 h-7 border-b-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />

    {/* Top Film-Strip Telemetry Header */}
    <div className="relative z-20 flex items-center justify-between px-8 pt-7 font-mono-bj text-[10px] tracking-[0.26em] uppercase text-[#F4F1EA]/55">
      <div className="flex items-center gap-2.5">
        <Film className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>EON / Q-BRANCH · 35MM OPTICAL PRINT</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[#D4AF37]">
          {act === 1
            ? 'ACT I · BINDER GUN BARREL'
            : act === 2
              ? 'ACT II · DR. NO DOTS × BROWNJOHN DB5'
              : act === 3
                ? 'ACT III · KLEINMAN SYMBOLISM'
                : 'ACT IV · IRIS REVEAL'}
        </span>
        <span className="text-[#F4F1EA]/35">|</span>
        <span>{loadProgress > 0 ? `${loadProgress}%` : 'INIT'}</span>
      </div>
    </div>

    {/* Main Center Stage */}
    <div className="relative z-10 w-full h-[calc(100%-120px)] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* ACT I: AUTHENTIC MAURICE BINDER GUN BARREL + WALKING DOT + CRIMSON WASH */}
      {act === 1 && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Classic Binder White Dot Marching Left-to-Center Before Expanding */}
          <div
            className="absolute w-9 h-9 rounded-full bg-[#F4F1EA] pointer-events-none"
            style={{ animation: 'binder-walk-dot 0.95s ease-in-out forwards' }}
          />

          {/* Full-Scale Rifled Gun-Barrel Aperture */}
          <div
            className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center rounded-full overflow-hidden border border-[#F4F1EA]/20 shadow-[0_0_90px_rgba(0,0,0,0.95)]"
            style={{ animation: 'barrel-pan 1.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
          >
            {/* Crimson Blood Wash Dripping Down Inside the Barrel After the Shot */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#C42B2B]/85 via-[#991B1B]/65 to-transparent pointer-events-none z-10"
              style={{ animation: 'blood-drip 0.65s ease-in 0.72s both' }}
            />

            {/* Muzzle Flash Ring */}
            <div
              className="absolute w-28 h-28 rounded-full border-4 border-[#FFF3C4] bg-[#D4AF37]/30 pointer-events-none z-20"
              style={{ animation: 'muzzle-flash-ring 1.35s ease-out forwards' }}
            />

            <svg viewBox="0 0 320 320" className="w-full h-full relative z-0">
              <defs>
                <radialGradient id="binderBarrelShade" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#18181b" />
                  <stop offset="55%" stopColor="#09090b" />
                  <stop offset="100%" stopColor="#020203" />
                </radialGradient>
              </defs>
              <circle cx="160" cy="160" r="158" fill="url(#binderBarrelShade)" />
              {/* 10 Classic Spiraling Rifling Lands & Grooves */}
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i * 36 * Math.PI) / 180;
                const xInner = 160 + Math.cos(a) * 62;
                const yInner = 160 + Math.sin(a) * 62;
                const xMid = 160 + Math.cos(a + 0.24) * 112;
                const yMid = 160 + Math.sin(a + 0.24) * 112;
                const xOuter = 160 + Math.cos(a + 0.44) * 158;
                const yOuter = 160 + Math.sin(a + 0.44) * 158;
                return (
                  <g key={i}>
                    <path
                      d={`M ${xInner} ${yInner} Q ${xMid} ${yMid} ${xOuter} ${yOuter}`}
                      fill="none"
                      stroke="#F4F1EA"
                      strokeOpacity="0.48"
                      strokeWidth="6"
                    />
                    <path
                      d={`M ${xInner} ${yInner} Q ${xMid} ${yMid} ${xOuter} ${yOuter}`}
                      fill="none"
                      stroke="#050505"
                      strokeOpacity="0.65"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
              {/* Inner Crisp Sight Aperture */}
              <circle
                cx="160"
                cy="160"
                r="64"
                fill="#050505"
                stroke="#F4F1EA"
                strokeOpacity="0.7"
                strokeWidth="2"
              />
              {/* Bond Silhouette / 007 Sight Crosshair */}
              <line x1="160" y1="108" x2="160" y2="128" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="160" y1="192" x2="160" y2="212" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="108" y1="160" x2="128" y2="160" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="192" y1="160" x2="212" y2="160" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.8" />
              <text
                x="160"
                y="167"
                textAnchor="middle"
                className="font-display-bj"
                fill="#F4F1EA"
                fontSize="24"
                fontWeight="700"
                letterSpacing="6"
              >
                007
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* ACT II: LARGE DR. NO POP-ART DOTS + ROBERT BROWNJOHN PROJECTED DB5 SILHOUETTE */}
      {act === 2 && (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
          {/* Large Choreographed Retro Dr. No Pop-Art Dots */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {DR_NO_CHOREOGRAPHY.map((dot, idx) => (
              <div
                key={idx}
                className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
                style={{
                  left: dot.cx,
                  top: dot.cy,
                  width: dot.size,
                  height: dot.size,
                  backgroundColor: dot.color,
                  animation: `dr-no-dot-pop ${dot.dur} cubic-bezier(0.22, 1, 0.36, 1) ${dot.delay} infinite`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-3xl w-full flex flex-col items-center">
            <div className="font-mono-bj text-[10px] tracking-[0.38em] uppercase text-[#D4AF37] mb-2">
              ALBERT R. BROCCOLI &amp; HARRY SALTZMAN PRESENT
            </div>

            {/* Authentic 1964 Aston Martin DB5 Vantage Fastback Silhouette (Facing Left) */}
            <div className="relative w-full max-w-2xl py-4 px-2 border-y border-[#D4AF37]/35 bg-[#050505]/70">
              <svg
                viewBox="0 0 760 230"
                className="w-full h-44 sm:h-48 mx-auto"
                aria-label="1964 Aston Martin DB5 Vantage Silhouette"
              >
                <defs>
                  <filter id="brownjohnWarp">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.012 0.035"
                      numOctaves="2"
                      result="noise"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="4.5"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                  <linearGradient id="db5SilverGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1f2024" />
                    <stop offset="32%" stopColor="#D4AF37" stopOpacity="0.42" />
                    <stop offset="55%" stopColor="#F4F1EA" stopOpacity="0.28" />
                    <stop offset="82%" stopColor="#D4AF37" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#121316" />
                  </linearGradient>
                  <clipPath id="db5BodyClip">
                    <path d="M 74 156 C 68 144, 72 122, 84 111 C 94 102, 118 96, 152 93 C 192 89, 240 87, 276 86 C 288 85, 314 60, 344 50 C 378 39, 434 38, 474 44 C 520 51, 568 72, 608 90 C 638 93, 668 97, 682 106 C 691 112, 694 128, 690 148 L 672 156 L 620 156 A 46 46 0 0 0 528 156 L 238 156 A 46 46 0 0 0 146 156 Z" />
                  </clipPath>
                </defs>

                {/* Ground Shadow Line */}
                <line x1="48" y1="196" x2="712" y2="196" stroke="#D4AF37" strokeOpacity="0.35" strokeWidth="1" />

                {/* Main Sculpted DB5 Coachwork */}
                <path
                  d="M 74 156 C 68 144, 72 122, 84 111 C 94 102, 118 96, 152 93 C 192 89, 240 87, 276 86 C 288 85, 314 60, 344 50 C 378 39, 434 38, 474 44 C 520 51, 568 72, 608 90 C 638 93, 668 97, 682 106 C 691 112, 694 128, 690 148 L 672 156 L 620 156 A 46 46 0 0 0 528 156 L 238 156 A 46 46 0 0 0 146 156 Z"
                  fill="url(#db5SilverGold)"
                  stroke="#D4AF37"
                  strokeWidth="1.6"
                />

                {/* Brownjohn Projected Typography Clipped & Warped Inside the DB5 Coachwork */}
                <g clipPath="url(#db5BodyClip)">
                  <text
                    x="385"
                    y="138"
                    textAnchor="middle"
                    filter="url(#brownjohnWarp)"
                    className="font-display-bj"
                    fill="#D4AF37"
                    fillOpacity="0.95"
                    fontSize="58"
                    fontWeight="700"
                    letterSpacing="11"
                  >
                    GOLDFINGER
                  </text>
                </g>

                {/* DB5 Hood Power-Bulge & Scoop */}
                <path
                  d="M 134 95 C 180 88, 224 84, 260 84"
                  fill="none"
                  stroke="#F4F1EA"
                  strokeOpacity="0.45"
                  strokeWidth="1.4"
                />
                {/* Faired-in Sloped Lucas Headlamp Cowl */}
                <path
                  d="M 76 116 C 84 107, 102 103, 116 105 C 110 117, 94 122, 76 121 Z"
                  fill="#F4F1EA"
                  fillOpacity="0.22"
                  stroke="#F4F1EA"
                  strokeOpacity="0.65"
                  strokeWidth="1.1"
                />
                {/* Front Wing Side-Vent Strake */}
                <path
                  d="M 244 108 L 274 106 M 246 114 L 276 112"
                  stroke="#D4AF37"
                  strokeOpacity="0.85"
                  strokeWidth="1.5"
                />
                {/* Greenhouse Window Cutout (Raked Windscreen + Thin Pillars + Fastback Quarter Glass) */}
                <path
                  d="M 294 84 C 312 63, 338 51, 368 47 L 424 47 L 424 85 L 294 85 Z"
                  fill="#050505"
                  fillOpacity="0.72"
                  stroke="#F4F1EA"
                  strokeOpacity="0.45"
                  strokeWidth="1.1"
                />
                <path
                  d="M 432 47 L 468 48 C 504 53, 542 68, 574 85 L 432 85 Z"
                  fill="#050505"
                  fillOpacity="0.72"
                  stroke="#F4F1EA"
                  strokeOpacity="0.45"
                  strokeWidth="1.1"
                />
                {/* Chrome Beltline & Door Cut */}
                <path
                  d="M 284 89 L 284 148 M 446 88 L 446 146"
                  stroke="#F4F1EA"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                />
                {/* Front & Rear Chrome Bumpers with Over-Riders */}
                <rect x="64" y="137" width="22" height="8" rx="3" fill="#F4F1EA" fillOpacity="0.85" />
                <rect x="70" y="128" width="6" height="20" rx="2" fill="#D4AF37" />
                <rect x="676" y="137" width="22" height="8" rx="3" fill="#F4F1EA" fillOpacity="0.85" />
                <rect x="684" y="128" width="6" height="20" rx="2" fill="#D4AF37" />
                {/* Vertical Stacked Lucas Taillight Cluster */}
                <rect x="682" y="106" width="6" height="22" rx="2" fill="#C42B2B" />

                {/* Front & Rear Borrani Wire Wheels + 3-Eared Knock-Off Spinners */}
                {[192, 574].map((wx) => (
                  <g key={wx} transform={`translate(${wx}, 156)`}>
                    <circle r="39" fill="#050505" stroke="#F4F1EA" strokeOpacity="0.75" strokeWidth="2.5" />
                    <circle r="27" fill="none" stroke="#D4AF37" strokeOpacity="0.8" strokeWidth="1.4" />
                    {Array.from({ length: 12 }).map((_, sIdx) => {
                      const sa = (sIdx * 30 * Math.PI) / 180;
                      return (
                        <line
                          key={sIdx}
                          x1={Math.cos(sa) * 7}
                          y1={Math.sin(sa) * 7}
                          x2={Math.cos(sa + 0.35) * 26}
                          y2={Math.sin(sa + 0.35) * 26}
                          stroke="#F4F1EA"
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {/* 3-Eared Knock-Off Hub */}
                    <circle r="6" fill="#D4AF37" />
                    <line x1="-10" y1="4" x2="10" y2="-4" stroke="#F4F1EA" strokeWidth="2" />
                    <line x1="0" y1="-10" x2="0" y2="3" stroke="#F4F1EA" strokeWidth="2" />
                  </g>
                ))}
              </svg>

              <div className="mt-1 font-display-bj text-2xl sm:text-3xl font-bold tracking-[0.28em] gf-gold-sweep-text">
                1964 ASTON MARTIN DB5 VANTAGE
              </div>
            </div>

            <div className="font-mono-bj text-[10px] tracking-[0.32em] uppercase text-[#F4F1EA]/65 mt-4">
              DR. NO CHROMATIC MOTIF × BROWNJOHN OPTICAL PROJECTION
            </div>
          </div>
        </div>
      )}

      {/* ACT III: DANIEL KLEINMAN — Q-BRANCH MECHANICAL SYMBOLISM */}
      {(act === 3 || act === 4) && (
        <div className="relative max-w-2xl w-full flex flex-col items-center text-center">
          <div className="font-mono-bj text-[10px] tracking-[0.34em] uppercase text-[#D4AF37] mb-4">
            Q-BRANCH TECHNICAL DOSSIER · BMT 216A
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
            {[
              { code: '01', name: 'BROWNING .30', sub: 'WING GUNS' },
              { code: '02', name: 'BORRANI HUB', sub: 'TYRE SLASHERS' },
              { code: '03', name: 'MARTIN-BAKER', sub: 'EJECTOR SEAT' },
              { code: '04', name: 'REVOLVING', sub: 'BMT 216A' },
            ].map((item) => (
              <div
                key={item.code}
                className="relative p-3 border border-[#D4AF37]/40 bg-[#08080a] text-left"
              >
                <div className="font-mono-bj text-[9px] text-[#D4AF37] tracking-widest">
                    //{item.code}
                </div>
                <div className="font-display-bj text-sm font-bold tracking-wider text-[#F4F1EA] mt-1">
                  {item.name}
                </div>
                <div className="font-mono-bj text-[9px] text-[#F4F1EA]/55 tracking-wider mt-0.5">
                  {item.sub}
                </div>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D4AF37]" />
              </div>
            ))}
          </div>

          <div className="mt-6 w-full max-w-md">
            <div className="w-full h-[2px] bg-[#F4F1EA]/15 overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-150 ease-out"
                style={{ width: `${loading ? Math.max(12, loadProgress) : 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 font-mono-bj text-[10px] tracking-[0.22em] uppercase text-[#F4F1EA]/60">
              <span>
                {loading ? 'STREAMING 3D COACHWORK…' : 'READY FOR BRIEFING'}
              </span>
              <span className="text-[#D4AF37] font-bold">
                {loading ? `${loadProgress}%` : '100%'}
              </span>
            </div>
          </div>

          <div className="font-mono-bj text-[10px] tracking-[0.32em] uppercase text-[#F4F1EA]/55 mt-4">
            DANIEL KLEINMAN · MECHANICAL SYMBOLISM
          </div>
        </div>
      )}
    </div>

    {/* Bottom Controls: 007 Audio Sync + Skip Titles */}
    <div className="relative z-20 flex items-center justify-between px-8 pb-7">
      <button
        onClick={onToggleAudio}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-[1px] font-mono-bj text-[10px] font-bold uppercase tracking-[0.18em] border transition cursor-pointer ${isPlayingAudio
            ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]'
            : 'bg-[#0a0a0c] text-[#F4F1EA]/80 border-[#F4F1EA]/25 hover:border-[#D4AF37]'
          }`}
      >
        {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span>{isPlayingAudio ? '007 THEME PLAYING' : 'PLAY 007 THEME'}</span>
      </button>

      <button
        onClick={handleSkip}
        disabled={loading}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[1px] font-display-bj text-xs font-bold tracking-[0.18em] border transition ${loading
            ? 'bg-[#0a0a0c] text-[#F4F1EA]/30 border-[#F4F1EA]/10 cursor-not-allowed'
            : 'bg-[#0a0a0c] text-[#D4AF37] border-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#050505] cursor-pointer'
          }`}
      >
        <span>{loading ? `LOADING ${loadProgress}%` : 'SKIP TITLES'}</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
};
