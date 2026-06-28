/**
 * ARIA — Animated AI Character
 * States: idle | listening | thinking | speaking | error
 */

export default function AriaAvatar({ state = "idle", size = 80, pulse = false }) {
  const isL = state === "listening";
  const isT = state === "thinking";
  const isS = state === "speaking";
  const isE = state === "error";

  const bgColor = isL ? "#dff5ff" : isT ? "#ede9ff" : isS ? "#d8f8f0" : isE ? "#ffe8e8" : "#eef5ff";
  const ringColor = isL ? "#7bc8f6" : isT ? "#c9c2ff" : isS ? "#5cd4c8" : isE ? "#ef7d7d" : "#7bc8f6";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor="#f0f7ff" />
        </radialGradient>
        <radialGradient id="skinGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fde8c8" />
          <stop offset="100%" stopColor="#f5c890" />
        </radialGradient>
        <radialGradient id="irisGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#9ee0ff" />
          <stop offset="100%" stopColor="#5e7ce2" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Pulse ring (listening/speaking) ── */}
      {(isL || isS || pulse) && (
        <>
          <circle cx="60" cy="60" r="57" fill="none" stroke={ringColor} strokeWidth="1.5" opacity="0.4">
            <animate attributeName="r" values="52;58;52" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="60" r="55" fill="none" stroke={ringColor} strokeWidth="0.8" opacity="0.25">
            <animate attributeName="r" values="56;62;56" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* ── Background ── */}
      <circle cx="60" cy="60" r="52" fill="url(#bgGrad)" />

      {/* ── Shirt ── */}
      <ellipse cx="60" cy="104" rx="26" ry="16" fill="#4560c0" />
      <ellipse cx="60" cy="100" rx="24" ry="13" fill="#5e7ce2" />
      {/* Collar */}
      <path d="M53 91 Q60 97 67 91" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* ── Neck ── */}
      <rect x="53" y="79" width="14" height="15" rx="6" fill="url(#skinGrad)" />

      {/* ── Head ── */}
      <ellipse cx="60" cy="60" rx="26" ry="27" fill="url(#skinGrad)" />

      {/* ── Hair back ── */}
      <ellipse cx="60" cy="43" rx="26" ry="18" fill="#5b4496" />

      {/* ── Hair top ── */}
      <path d="M34 50 Q34 26 60 26 Q86 26 86 50" fill="#5b4496" />
      {/* Hair highlight */}
      <path d="M46 34 Q60 29 74 34" stroke="#7d68c0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* ── Side hair strands ── */}
      <path d="M34 55 Q29 65 33 78" stroke="#5b4496" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M86 55 Q91 65 87 78" stroke="#5b4496" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* ── Ears ── */}
      <ellipse cx="34.5" cy="62" rx="4.5" ry="5.5" fill="url(#skinGrad)" />
      <ellipse cx="34.5" cy="62" rx="2.2" ry="3.2" fill="#f0c090" />
      <ellipse cx="85.5" cy="62" rx="4.5" ry="5.5" fill="url(#skinGrad)" />
      <ellipse cx="85.5" cy="62" rx="2.2" ry="3.2" fill="#f0c090" />

      {/* ── Eyebrows ── */}
      <path
        d={isT ? "M41 50 Q47 47.5 52 50" : isE ? "M41 49 Q47 51.5 52 49" : "M41 49 Q47 47 52 49"}
        stroke="#4a3880"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{ transition: "d 0.3s" }}
      />
      <path
        d={isT ? "M68 50 Q73 47.5 79 50" : isE ? "M68 49 Q73 51.5 79 49" : "M68 49 Q73 47 79 49"}
        stroke="#4a3880"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{ transition: "d 0.3s" }}
      />

      {/* ── Eyes ── */}
      {/* Left */}
      <ellipse cx="46.5" cy="60" rx="6" ry={isL ? "6.5" : "5.5"} fill="white" filter="url(#glow)" style={{ transition: "ry 0.2s" }} />
      <ellipse cx="46.5" cy="60" rx="3.8" ry={isL ? "4" : "3.5"} fill="url(#irisGrad)" />
      <ellipse cx="46.5" cy="60" rx="2" ry="2" fill="#1a2055" />
      <circle cx="48.2" cy="57.8" r="1.2" fill="white" opacity="0.9" />
      <circle cx="45.5" cy="62" r="0.5" fill="white" opacity="0.5" />

      {/* Right */}
      <ellipse cx="73.5" cy="60" rx="6" ry={isL ? "6.5" : "5.5"} fill="white" filter="url(#glow)" style={{ transition: "ry 0.2s" }} />
      <ellipse cx="73.5" cy="60" rx="3.8" ry={isL ? "4" : "3.5"} fill="url(#irisGrad)" />
      <ellipse cx="73.5" cy="60" rx="2" ry="2" fill="#1a2055" />
      <circle cx="75.2" cy="57.8" r="1.2" fill="white" opacity="0.9" />
      <circle cx="72.5" cy="62" r="0.5" fill="white" opacity="0.5" />

      {/* Blink (idle) */}
      {state === "idle" && (
        <g>
          <rect x="40.5" y="55" width="12" height="10" rx="5" fill="url(#skinGrad)" opacity="0">
            <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0" dur="5s" repeatCount="indefinite" />
          </rect>
          <rect x="67.5" y="55" width="12" height="10" rx="5" fill="url(#skinGrad)" opacity="0">
            <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0" dur="5s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      {/* ── Nose ── */}
      <ellipse cx="60" cy="69" rx="2.5" ry="1.8" fill="#e8b070" opacity="0.55" />

      {/* ── Mouth ── */}
      {isS ? (
        // Speaking — animated open mouth
        <g>
          <ellipse cx="60" cy="78" rx="7" ry="4" fill="#3d2060">
            <animate attributeName="ry" values="4;6;2.5;5;4" dur="0.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="60" cy="75.5" rx="6.5" ry="1.5" fill="#e8b8c8" opacity="0.7">
            <animate attributeName="ry" values="1.5;2;1;1.8;1.5" dur="0.5s" repeatCount="indefinite" />
          </ellipse>
        </g>
      ) : isE ? (
        // Error — slight frown
        <path d="M53 79 Q60 75 67 79" stroke="#3d2060" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : isT ? (
        // Thinking — pursed lips
        <path d="M54 77 Q60 76 66 77" stroke="#3d2060" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : isL ? (
        // Listening — slightly open smile
        <path d="M53 77 Q60 82 67 77" stroke="#3d2060" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        // Idle — gentle smile
        <path d="M53 76 Q60 81 67 76" stroke="#3d2060" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* ── Cheek blush ── */}
      <ellipse cx="37" cy="71" rx="6" ry="3.5" fill="#ffb8c8" opacity="0.25" />
      <ellipse cx="83" cy="71" rx="6" ry="3.5" fill="#ffb8c8" opacity="0.25" />

      {/* ── Thinking dots ── */}
      {isT && (
        <g transform="translate(0,6)">
          {[0,1,2].map((i) => (
            <circle key={i} cx={50 + i * 10} cy="92" r="3.5" fill="#7bc8f6">
              <animate attributeName="cy" values="92;87;92" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {/* ── Sound waves (listening) ── */}
      {isL && (
        <g>
          {[1,2,3].map((i) => (
            <g key={i}>
              <path
                d={`M${16 - i * 3} ${55 - i * 3} Q${12 - i * 3} 62 ${16 - i * 3} ${69 + i * 3}`}
                stroke={ringColor} strokeWidth="2" fill="none" strokeLinecap="round"
              >
                <animate attributeName="opacity" values={`${0.3 + i * 0.2};${0.8 + i * 0.1};${0.3 + i * 0.2}`}
                  dur={`${0.8 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
              </path>
              <path
                d={`M${104 + i * 3} ${55 - i * 3} Q${108 + i * 3} 62 ${104 + i * 3} ${69 + i * 3}`}
                stroke={ringColor} strokeWidth="2" fill="none" strokeLinecap="round"
              >
                <animate attributeName="opacity" values={`${0.3 + i * 0.2};${0.8 + i * 0.1};${0.3 + i * 0.2}`}
                  dur={`${0.8 + i * 0.15}s`} begin={`${(i + 1) * 0.1}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}
        </g>
      )}

      {/* ── Sparkles (speaking) ── */}
      {isS && (
        <g>
          <g transform="translate(18,18)">
            <path d="M0 0 L1.5 -5 L3 0 L8 1.5 L3 3 L1.5 8 L0 3 L-5 1.5 Z" fill="#7bc8f6">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
          <g transform="translate(96,22)">
            <path d="M0 0 L1 -3.5 L2 0 L5.5 1 L2 2 L1 5.5 L0 2 L-3.5 1 Z" fill="#c9c2ff">
              <animateTransform attributeName="transform" type="rotate" values="360;0" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" begin="0.5s" repeatCount="indefinite" />
            </path>
          </g>
          <g transform="translate(22,92)">
            <path d="M0 0 L0.8 -2.5 L1.6 0 L4 0.8 L1.6 1.6 L0.8 4 L0 1.6 L-2.5 0.8 Z" fill="#5cd4c8">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1s" begin="0.3s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      )}

      {/* ── Error X indicator ── */}
      {isE && (
        <g transform="translate(86, 18)">
          <circle cx="0" cy="0" r="10" fill="#ef7d7d" opacity="0.9" />
          <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
