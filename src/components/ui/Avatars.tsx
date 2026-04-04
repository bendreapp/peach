"use client";

// ── Bendre Avatar Library ─────────────────────────────────────────────────────
// 8 sage-toned geometric/organic SVG avatars for therapist profiles.
// Each is a 80×80 SVG, circular, with warm sage palette.
// Colors: #5C7A6B (deep sage), #8FAF8A (sage), #A8C2A8 (light sage),
//         #D4E0D4 (pale sage), #EBF0EB (mist), #F4F1EC (parchment bg)

export const AVATAR_KEYS = [
  "sage-01",
  "sage-02",
  "sage-03",
  "sage-04",
  "sage-05",
  "sage-06",
  "sage-07",
  "sage-08",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

// ── Individual SVG patterns ───────────────────────────────────────────────────

function Sage01({ size }: { size: number }) {
  // Concentric leaf rings
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F4F1EC" />
      <circle cx="40" cy="40" r="30" fill="#EBF0EB" />
      <circle cx="40" cy="40" r="20" fill="#D4E0D4" />
      <circle cx="40" cy="40" r="10" fill="#8FAF8A" />
      {/* Leaf petals */}
      <path d="M40 14 C44 22 44 30 40 40 C36 30 36 22 40 14Z" fill="#5C7A6B" opacity="0.55" />
      <path d="M66 40 C58 44 50 44 40 40 C50 36 58 36 66 40Z" fill="#5C7A6B" opacity="0.55" />
      <path d="M40 66 C36 58 36 50 40 40 C44 50 44 58 40 66Z" fill="#5C7A6B" opacity="0.55" />
      <path d="M14 40 C22 36 30 36 40 40 C30 44 22 44 14 40Z" fill="#5C7A6B" opacity="0.55" />
    </svg>
  );
}

function Sage02({ size }: { size: number }) {
  // Wave pattern
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#EBF0EB" />
      <path d="M0 28 Q10 20 20 28 Q30 36 40 28 Q50 20 60 28 Q70 36 80 28 L80 80 L0 80Z" fill="#D4E0D4" />
      <path d="M0 38 Q10 30 20 38 Q30 46 40 38 Q50 30 60 38 Q70 46 80 38 L80 80 L0 80Z" fill="#A8C2A8" />
      <path d="M0 50 Q10 42 20 50 Q30 58 40 50 Q50 42 60 50 Q70 58 80 50 L80 80 L0 80Z" fill="#8FAF8A" />
      <path d="M0 62 Q10 54 20 62 Q30 70 40 62 Q50 54 60 62 Q70 70 80 62 L80 80 L0 80Z" fill="#5C7A6B" opacity="0.7" />
      {/* Clip to circle */}
      <circle cx="40" cy="40" r="40" fill="none" stroke="none" />
    </svg>
  );
}

function Sage03({ size }: { size: number }) {
  // Dot grid pattern
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F4F1EC" />
      {/* 5x5 dot grid, centered */}
      {[16, 26, 36, 46, 56, 66].map((x) =>
        [16, 26, 36, 46, 56, 66].map((y) => {
          const dist = Math.sqrt((x - 40) ** 2 + (y - 40) ** 2);
          if (dist > 36) return null;
          const opacity = dist < 16 ? 0.9 : dist < 26 ? 0.65 : 0.35;
          const r = dist < 16 ? 3.5 : dist < 26 ? 2.5 : 1.8;
          return (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              fill="#5C7A6B"
              opacity={opacity}
            />
          );
        })
      )}
    </svg>
  );
}

function Sage04({ size }: { size: number }) {
  // Organic blob shapes
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#EBF0EB" />
      <ellipse cx="40" cy="44" rx="22" ry="20" fill="#D4E0D4" />
      <ellipse cx="36" cy="36" rx="16" ry="14" fill="#A8C2A8" />
      <ellipse cx="44" cy="42" rx="12" ry="10" fill="#8FAF8A" />
      <ellipse cx="40" cy="38" rx="7" ry="8" fill="#5C7A6B" opacity="0.75" />
      {/* Small accent */}
      <circle cx="52" cy="30" r="5" fill="#D4E0D4" />
      <circle cx="28" cy="52" r="4" fill="#A8C2A8" />
    </svg>
  );
}

function Sage05({ size }: { size: number }) {
  // Triangle geometric mosaic
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F4F1EC" />
      <polygon points="40,10 70,65 10,65" fill="#D4E0D4" />
      <polygon points="40,20 62,58 18,58" fill="#A8C2A8" />
      <polygon points="40,30 56,52 24,52" fill="#8FAF8A" />
      <polygon points="40,38 52,48 28,48" fill="#5C7A6B" opacity="0.7" />
      {/* Top accents */}
      <circle cx="40" cy="10" r="3" fill="#8FAF8A" />
      <circle cx="70" cy="65" r="3" fill="#A8C2A8" />
      <circle cx="10" cy="65" r="3" fill="#A8C2A8" />
    </svg>
  );
}

function Sage06({ size }: { size: number }) {
  // Spiral / fibonacci-like arcs
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#EBF0EB" />
      <path d="M40 40 Q40 16 64 16 Q64 40 40 40Z" fill="#D4E0D4" />
      <path d="M40 40 Q64 40 64 64 Q40 64 40 40Z" fill="#A8C2A8" />
      <path d="M40 40 Q40 64 16 64 Q16 40 40 40Z" fill="#8FAF8A" />
      <path d="M40 40 Q16 40 16 16 Q40 16 40 40Z" fill="#5C7A6B" opacity="0.65" />
      <circle cx="40" cy="40" r="5" fill="#5C7A6B" />
    </svg>
  );
}

function Sage07({ size }: { size: number }) {
  // Hexagonal cells (honeycomb fragment)
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F4F1EC" />
      {/* Center hex */}
      <polygon points="40,24 54,32 54,48 40,56 26,48 26,32" fill="#D4E0D4" stroke="#EBF0EB" strokeWidth="1.5" />
      {/* Surrounding partial hexes */}
      <polygon points="40,8 54,16 54,32 40,24 26,32 26,16" fill="#A8C2A8" stroke="#EBF0EB" strokeWidth="1.5" />
      <polygon points="54,32 68,40 68,56 54,64 54,48 54,32" fill="#8FAF8A" stroke="#EBF0EB" strokeWidth="1.5" />
      <polygon points="26,48 40,56 40,72 26,72 12,64 12,48" fill="#8FAF8A" stroke="#EBF0EB" strokeWidth="1.5" />
      <polygon points="54,48 68,56 68,72 54,72 40,72 40,56" fill="#A8C2A8" stroke="#EBF0EB" strokeWidth="1.5" />
      {/* Inner accent */}
      <polygon points="40,30 48,35 48,45 40,50 32,45 32,35" fill="#5C7A6B" opacity="0.6" stroke="#EBF0EB" strokeWidth="1" />
    </svg>
  );
}

function Sage08({ size }: { size: number }) {
  // Soft radial lines (sun/flower)
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#EBF0EB" />
      {/* 8 soft petal lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = 40 + 14 * Math.cos(angle);
        const y1 = 40 + 14 * Math.sin(angle);
        const x2 = 40 + 32 * Math.cos(angle);
        const y2 = 40 + 32 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 2 === 0 ? "#5C7A6B" : "#8FAF8A"}
            strokeWidth={i % 2 === 0 ? "3.5" : "2"}
            strokeLinecap="round"
            opacity={i % 2 === 0 ? 0.7 : 0.5}
          />
        );
      })}
      {/* Rings */}
      <circle cx="40" cy="40" r="32" fill="none" stroke="#D4E0D4" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="20" fill="#D4E0D4" opacity="0.5" />
      <circle cx="40" cy="40" r="10" fill="#A8C2A8" />
      <circle cx="40" cy="40" r="5" fill="#5C7A6B" />
    </svg>
  );
}

// ── Component map ─────────────────────────────────────────────────────────────

const AVATAR_COMPONENTS: Record<AvatarKey, (props: { size: number }) => JSX.Element> = {
  "sage-01": Sage01,
  "sage-02": Sage02,
  "sage-03": Sage03,
  "sage-04": Sage04,
  "sage-05": Sage05,
  "sage-06": Sage06,
  "sage-07": Sage07,
  "sage-08": Sage08,
};

// ── Initials fallback ─────────────────────────────────────────────────────────

function InitialsFallback({ name, size }: { name?: string; size: number }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  const fontSize = Math.round(size * 0.3);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#EBF0EB" />
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#5C7A6B"
        fontFamily="Satoshi, system-ui, sans-serif"
        fontWeight="600"
        fontSize={fontSize}
      >
        {initials}
      </text>
    </svg>
  );
}

// ── Public Avatar component ───────────────────────────────────────────────────

interface AvatarProps {
  avatarKey?: string | null;
  size?: number;
  name?: string;
  className?: string;
}

export function Avatar({ avatarKey, size = 80, name, className }: AvatarProps) {
  const Component = avatarKey
    ? AVATAR_COMPONENTS[avatarKey as AvatarKey]
    : undefined;

  const content = Component ? (
    <Component size={size} />
  ) : (
    <InitialsFallback name={name} size={size} />
  );

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {content}
    </span>
  );
}

export default Avatar;
