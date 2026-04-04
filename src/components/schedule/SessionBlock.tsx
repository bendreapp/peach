import { formatTimeIST } from "@/lib/date-utils";

interface SessionBlockProps {
  id: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  sessionTypeName: string | null;
  top: number;
  height: number;
  onClick: (id: string) => void;
}

// Map session type name to one of the 3 design-system colors
function getSessionTypeColor(typeName: string | null): {
  bg: string;
  border: string;
  text: string;
  textMuted: string;
} {
  const name = (typeName ?? "").toLowerCase();
  if (name.includes("online") || name.includes("video") || name.includes("virtual") || name.includes("tele")) {
    // Online: accent/sage #7BAF9E
    return {
      bg: "rgba(123,175,158,0.14)",
      border: "#7BAF9E",
      text: "#244840",
      textMuted: "#457A6C",
    };
  }
  if (name.includes("group") || name.includes("family") || name.includes("couple") || name.includes("workshop")) {
    // Group: warning #D4956A
    return {
      bg: "rgba(212,149,106,0.14)",
      border: "#D4956A",
      text: "#502A0C",
      textMuted: "#A8622E",
    };
  }
  // Default / in-person: primary #5C7A6B
  return {
    bg: "rgba(74,111,165,0.12)",
    border: "#5C7A6B",
    text: "#1E2F52",
    textMuted: "#496158",
  };
}

// Status overlay modifiers
const STATUS_OVERLAY: Record<string, string> = {
  pending_approval: "ring-1 ring-warning/50",
  scheduled: "",
  completed: "opacity-50",
  cancelled: "opacity-30",
  no_show: "ring-1 ring-danger/40 opacity-60",
};

export default function SessionBlock({
  id,
  clientName,
  startsAt,
  endsAt,
  status,
  sessionTypeName,
  top,
  height,
  onClick,
}: SessionBlockProps) {
  const isCompact = height < 38;
  const colors = getSessionTypeColor(sessionTypeName);
  const statusOverlay = STATUS_OVERLAY[status] ?? "";

  return (
    <button
      onClick={() => onClick(id)}
      className={`absolute left-[3px] right-[3px] rounded-[8px] px-2 py-1 text-left overflow-hidden cursor-pointer transition-all hover:brightness-95 hover:shadow-sm ${statusOverlay}`}
      style={{
        top: `${top}px`,
        height: `${Math.max(20, height - 2)}px`,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
      }}
      title={`${clientName} · ${formatTimeIST(startsAt)} – ${formatTimeIST(endsAt)}${sessionTypeName ? ` · ${sessionTypeName}` : ""}`}
    >
      {isCompact ? (
        <span className="text-[10px] font-semibold truncate block leading-none" style={{ color: colors.text }}>
          {clientName}
        </span>
      ) : (
        <>
          <span
            className="text-[11px] font-semibold truncate block leading-snug"
            style={{ color: colors.text }}
          >
            {clientName}
          </span>
          <span
            className="text-[10px] truncate block leading-snug"
            style={{ color: colors.textMuted }}
          >
            {formatTimeIST(startsAt)} – {formatTimeIST(endsAt)}
          </span>
          {sessionTypeName && height >= 58 && (
            <span
              className="text-[9px] truncate block leading-snug mt-0.5 opacity-75"
              style={{ color: colors.textMuted }}
            >
              {sessionTypeName}
            </span>
          )}
          {status === "pending_approval" && height >= 44 && (
            <span
              className="text-[9px] font-semibold block leading-snug mt-0.5"
              style={{ color: "#B5733A" }}
            >
              Pending approval
            </span>
          )}
        </>
      )}
    </button>
  );
}

interface BlockedSlotBlockProps {
  id: string;
  reason: string | null;
  startAt: string;
  endAt: string;
  top: number;
  height: number;
  onClick: (block: { id: string; start_at: string; end_at: string; reason: string | null }) => void;
}

export function BlockedSlotBlock({
  id,
  reason,
  startAt,
  endAt,
  top,
  height,
  onClick,
}: BlockedSlotBlockProps) {
  return (
    <button
      onClick={() => onClick({ id, start_at: startAt, end_at: endAt, reason })}
      className="absolute left-[3px] right-[3px] rounded-[8px] px-2 py-1 text-left overflow-hidden cursor-pointer transition-colors hover:brightness-95"
      style={{
        top: `${top}px`,
        height: `${Math.max(20, height - 2)}px`,
        background: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.025) 4px, rgba(0,0,0,0.025) 8px)",
        backgroundColor: "rgba(229,224,216,0.5)",
        border: "1px dashed #C8C0B8",
      }}
      title={reason ? `Break: ${reason} (click to edit)` : "Break (click to edit)"}
    >
      <span className="text-[10px] text-ink-tertiary truncate block leading-snug">
        {reason || "Break"}
      </span>
    </button>
  );
}
