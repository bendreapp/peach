"use client";

import { useState } from "react";
import {
  useAnalyticsOverview,
  useAnalyticsRevenueByMonth,
  useAnalyticsSessionsByMonth,
  useAnalyticsClientGrowth,
  useAnalyticsCategoryBreakdown,
} from "@/lib/api-hooks";
import {
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "7d" | "30d" | "3m" | "1y";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
  "1y": "This year",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toArray(d: unknown): unknown[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && Array.isArray((d as { data?: unknown }).data))
    return (d as { data: unknown[] }).data;
  return [];
}

function formatINR(paise: number): string {
  if (paise >= 100000)
    return `₹${(paise / 10000000).toFixed(1)}L`.replace(".0L", "L");
  if (paise >= 10000)
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
  return `₹${(paise / 100).toFixed(0)}`;
}

function formatINRFull(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function pct(value: number): string {
  return `${Math.round(value)}%`;
}

// ── Chart style constants ─────────────────────────────────────────────────────

const CHART_GRID_COLOR = "#E5E0D8";
const CHART_AXIS_STYLE = { fontSize: 11, fill: "#8A8480" };
const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #E5E0D8",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: 13,
  fontFamily: "Satoshi, sans-serif",
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div
      className="rounded-card p-5 animate-pulse"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E0D8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-small bg-[#E5E0D8]" />
        <div className="h-3 w-24 rounded bg-[#E5E0D8]" />
      </div>
      <div className="h-7 w-20 rounded bg-[#E5E0D8] mb-1.5" />
      <div className="h-3 w-16 rounded bg-[#E5E0D8]" />
    </div>
  );
}

function SkeletonChart({ height = "h-72" }: { height?: string }) {
  return (
    <div
      className={`${height} rounded animate-pulse`}
      style={{ background: "#F4F1EC" }}
    />
  );
}

// ── Time Range Filter ─────────────────────────────────────────────────────────

function TimeRangeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const options: TimeRange[] = ["7d", "30d", "3m", "1y"];
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-small"
      style={{ background: "#F4F1EC" }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="px-3 py-1.5 rounded-small text-xs font-medium transition-all duration-150"
          style={
            value === opt
              ? {
                  background: "#FFFFFF",
                  color: "#1C1C1E",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }
              : {
                  background: "transparent",
                  color: "#8A8480",
                }
          }
        >
          {TIME_RANGE_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
  highlightColor?: string;
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  highlight,
  highlightColor,
}: StatCardProps) {
  return (
    <div
      className="rounded-card p-5 transition-all duration-200"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${highlight ? highlightColor : "#E5E0D8"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-small flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <span
          className="text-xs font-medium uppercase"
          style={{ color: "#8A8480", letterSpacing: "0.06em" }}
        >
          {label}
        </span>
      </div>
      <div
        className="text-2xl font-bold"
        style={{ color: "#1C1C1E", fontFamily: "Satoshi, sans-serif" }}
      >
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: "#8A8480" }}>
        {subtitle}
      </div>
    </div>
  );
}

// ── Empty Chart State ─────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <BarChart3 size={28} style={{ color: "#C5BFB8", marginBottom: 8 }} />
      <p className="text-sm" style={{ color: "#8A8480" }}>
        {message}
      </p>
    </div>
  );
}

// ── Session Types Mini List ───────────────────────────────────────────────────

function SessionTypesList({
  categories,
}: {
  categories: { label: string; count: number }[];
}) {
  const total = categories.reduce((s, c) => s + c.count, 0);
  const COLORS = ["#5C7A6B", "#7BAF9E", "#D4956A", "#C0705A", "#8A8480"];

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Users size={28} style={{ color: "#C5BFB8", marginBottom: 8 }} />
        <p className="text-sm" style={{ color: "#8A8480" }}>
          No session type data yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat, idx) => {
        const pctVal = total > 0 ? (cat.count / total) * 100 : 0;
        const color = COLORS[idx % COLORS.length];
        return (
          <div key={cat.label} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            <span
              className="text-sm w-28 truncate"
              style={{ color: "#5C5856" }}
            >
              {cat.label}
            </span>
            <div className="flex-1 h-1.5 rounded-pill overflow-hidden" style={{ background: "#E5E0D8" }}>
              <div
                className="h-full rounded-pill transition-all"
                style={{ width: `${pctVal}%`, background: color }}
              />
            </div>
            <span
              className="text-xs font-medium w-6 text-right"
              style={{ color: "#8A8480" }}
            >
              {cat.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const overview = useAnalyticsOverview();
  const revenueByMonth = useAnalyticsRevenueByMonth();
  const sessionsByMonth = useAnalyticsSessionsByMonth();
  const clientGrowth = useAnalyticsClientGrowth();
  const categoryBreakdown = useAnalyticsCategoryBreakdown();

  const isLoadingCore =
    overview.isLoading ||
    revenueByMonth.isLoading ||
    sessionsByMonth.isLoading ||
    clientGrowth.isLoading;

  const stats = overview.data as Record<string, number> | undefined;
  const revenueData = toArray(revenueByMonth.data) as Record<string, number>[];
  const sessionData = toArray(sessionsByMonth.data) as Record<string, number>[];
  const growthData = toArray(clientGrowth.data) as Record<string, number>[];
  const categories = toArray(categoryBreakdown.data) as {
    label: string;
    count: number;
  }[];

  const totalSessions = stats?.totalSessions ?? 0;
  const completionRate = stats?.completionRate ?? 0;
  const cancellationRate = stats?.cancellationRate ?? 0;
  const noShowRate = stats?.noShowRate ?? 0;

  return (
    <div
      className="mx-auto space-y-6"
      style={{ maxWidth: 1200 }}
    >
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 size={20} style={{ color: "#5C7A6B" }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: "#1C1C1E", fontFamily: "Satoshi, sans-serif" }}
            >
              Analytics
            </h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#8A8480" }}>
            Practice performance at a glance
          </p>
        </div>

        {/* Time Range Filter — top right */}
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Section 1: Stat Cards */}
      {isLoadingCore ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sessions"
            value={String(totalSessions)}
            subtitle="completed sessions"
            icon={<Activity size={16} />}
            iconBg="rgba(92,122,107,0.08)"
            iconColor="#5C7A6B"
          />
          <StatCard
            label="Completion Rate"
            value={pct(completionRate)}
            subtitle="sessions completed"
            icon={<CheckCircle2 size={16} />}
            iconBg="#EAF4F1"
            iconColor="#3D8B7A"
          />
          <StatCard
            label="Cancellation Rate"
            value={pct(cancellationRate)}
            subtitle="sessions cancelled"
            icon={<XCircle size={16} />}
            iconBg="rgba(192,112,90,0.08)"
            iconColor="#C0705A"
          />
          <StatCard
            label="No-show Rate"
            value={pct(noShowRate)}
            subtitle="clients didn't attend"
            icon={<AlertTriangle size={16} />}
            iconBg="rgba(212,149,106,0.10)"
            iconColor="#D4956A"
          />
        </div>
      )}

      {/* Section 2: Revenue Line Chart — full width */}
      <div
        className="rounded-card p-6"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "#1C1C1E" }}
            >
              Revenue
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
              Monthly billed revenue
            </p>
          </div>
          {revenueData.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} style={{ color: "#3D8B7A" }} />
              <span className="text-xs font-medium" style={{ color: "#3D8B7A" }}>
                {formatINRFull(
                  (revenueData[revenueData.length - 1]?.revenue as number) ?? 0
                )}{" "}
                this month
              </span>
            </div>
          )}
        </div>

        {isLoadingCore ? (
          <SkeletonChart height="h-72" />
        ) : revenueData.length === 0 ? (
          <div className="h-72">
            <EmptyChart message="No revenue data yet. Revenue appears once sessions are invoiced." />
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_GRID_COLOR}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatINR(v)}
                  width={64}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [
                    formatINRFull(Number(v)),
                    "Revenue",
                  ]}
                  cursor={{ stroke: "#E5E0D8", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5C7A6B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#5C7A6B", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#5C7A6B", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Section 3: Client Growth + Session Types — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Growth */}
        <div
          className="rounded-card p-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div className="mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: "#1C1C1E" }}
            >
              Client Growth
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
              New and cumulative clients over time
            </p>
          </div>

          {isLoadingCore ? (
            <SkeletonChart height="h-56" />
          ) : growthData.length === 0 ? (
            <div className="h-56">
              <EmptyChart message="No client data yet." />
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_GRID_COLOR}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={CHART_AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={CHART_AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{ stroke: "#E5E0D8", strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#8A8480" }}
                  />
                  <Bar
                    dataKey="newClients"
                    name="New Clients"
                    fill="rgba(92,122,107,0.20)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalClients"
                    name="Total Clients"
                    stroke="#7BAF9E"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#7BAF9E", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#7BAF9E", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Session Types */}
        <div
          className="rounded-card p-6"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0D8",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div className="mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: "#1C1C1E" }}
            >
              Session Types
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
              Distribution by category
            </p>
          </div>

          {categoryBreakdown.isLoading ? (
            <SkeletonChart height="h-56" />
          ) : (
            <div className="h-56 flex flex-col justify-center">
              <SessionTypesList categories={categories} />
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Sessions by Month (bar chart) */}
      <div
        className="rounded-card p-6"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E0D8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="mb-5">
          <h2
            className="text-base font-semibold"
            style={{ color: "#1C1C1E" }}
          >
            Sessions by Month
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#8A8480" }}>
            Completed, cancelled, and no-show breakdown
          </p>
        </div>

        {isLoadingCore ? (
          <SkeletonChart height="h-64" />
        ) : sessionData.length === 0 ? (
          <div className="h-64">
            <EmptyChart message="No session data yet." />
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_GRID_COLOR}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(229,224,216,0.30)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#8A8480" }}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#7BAF9E"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="cancelled"
                  name="Cancelled"
                  fill="#D4956A"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name="No-show"
                  fill="#C0705A"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
