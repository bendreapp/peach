"use client";

import {
  useAnalyticsOverview,
  useAnalyticsRevenueByMonth,
  useAnalyticsSessionsByMonth,
  useAnalyticsClientGrowth,
  useAnalyticsTopClients,
  useAnalyticsCategoryBreakdown,
} from "@/lib/api-hooks";
import {
  Activity,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from "lucide-react";
import {


  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Unwrap API response: handles both flat arrays and { data: [...] }
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}


function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function AnalyticsPage() {
  const overview = useAnalyticsOverview();
  const revenueByMonth = useAnalyticsRevenueByMonth();
  const sessionsByMonth = useAnalyticsSessionsByMonth();
  const clientGrowth = useAnalyticsClientGrowth();
  const topClients = useAnalyticsTopClients(5);
  const categoryBreakdown = useAnalyticsCategoryBreakdown();

  const isLoading =
    overview.isLoading ||
    revenueByMonth.isLoading ||
    sessionsByMonth.isLoading ||
    clientGrowth.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-bg rounded-small animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-card rounded-card border border-border shadow-card animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 bg-card rounded-card border border-border shadow-card animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-72 bg-card rounded-card border border-border shadow-card animate-pulse" />
          <div className="h-72 bg-card rounded-card border border-border shadow-card animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = overview.data as any;
  const revenueData = toArray(revenueByMonth.data);
  const sessionData = toArray(sessionsByMonth.data);
  const growthData = toArray(clientGrowth.data);
  const topClientsData = toArray(topClients.data);
  const categories = toArray(categoryBreakdown.data);
  const totalCategoryCount = categories.reduce(
    (sum: number, c: any) => sum + c.count,
    0
  );

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.totalSessions ?? 0,
      subtitle: "completed",
      icon: Activity,
      badgeClass: "badge-sage",
    },
    {
      label: "Total Revenue",
      value: formatPaise(stats?.totalRevenue ?? 0),
      subtitle: "collected",
      icon: IndianRupee,
      badgeClass: "badge-sage",
    },
    {
      label: "Active Clients",
      value: stats?.activeClients ?? 0,
      subtitle: "clients",
      icon: Users,
      badgeClass: "badge-teal",
    },
    {
      label: "Completion Rate",
      value: `${stats?.completionRate ?? 0}%`,
      subtitle: "of sessions",
      icon: CheckCircle2,
      badgeClass: "badge-success",
    },
    {
      label: "Pending Revenue",
      value: formatPaise(stats?.pendingRevenue ?? 0),
      subtitle: "unpaid",
      icon: Clock,
      badgeClass: "badge-warning",
    },
    {
      label: "No-Shows",
      value: stats?.noShows ?? 0,
      subtitle: "sessions",
      icon: XCircle,
      badgeClass: "badge-error",
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <BarChart3 size={22} className="text-sage" />
          <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
        </div>
        <p className="text-sm text-ink-secondary mt-1">
          Practice performance overview
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-card border border-border shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-small bg-sage-bg flex items-center justify-center">
                  <Icon size={16} className="text-sage" />
                </div>
                <span className="ui-section-label">{card.label}</span>
              </div>
              <div className="text-2xl font-semibold text-ink">{card.value}</div>
              <div className="text-xs text-ink-tertiary mt-0.5">
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-card rounded-card border border-border shadow-card p-7">
        <h3 className="font-semibold text-ink mb-5">Revenue Trend</h3>
        {revenueData.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-ink-tertiary">
              No revenue data yet. Revenue will appear here once sessions are
              invoiced.
            </p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="revenueGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#6B7E6C"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6B7E6C"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6B6B6B" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B6B6B" }}
                  tickFormatter={(v) =>
                    `₹${(v / 100).toLocaleString("en-IN")}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #E5E5E0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: "13px",
                  }}
                  formatter={(v) => [
                    `₹${(Number(v) / 100).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6B7E6C"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Sessions by Month + Client Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sessions by Month */}
        <div className="bg-card rounded-card border border-border shadow-card p-7">
          <h3 className="font-semibold text-ink mb-5">Sessions by Month</h3>
          {sessionData.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-sm text-ink-tertiary">No session data yet.</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B6B6B" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#6B6B6B" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #E5E5E0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#6B7E6C"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill="#9E8554"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="noShow"
                    name="No-show"
                    fill="#C62828"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Client Growth */}
        <div className="bg-card rounded-card border border-border shadow-card p-7">
          <h3 className="font-semibold text-ink mb-5">Client Growth</h3>
          {growthData.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-sm text-ink-tertiary">No client data yet.</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B6B6B" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#6B6B6B" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #E5E5E0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      fontSize: "13px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="newClients"
                    name="New Clients"
                    fill="#3D6B72"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalClients"
                    name="Total Clients"
                    stroke="#6B7E6C"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#6B7E6C" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Client Category Breakdown + Top Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Category Breakdown */}
        <div className="bg-card rounded-card border border-border shadow-card p-7">
          <h3 className="font-semibold text-ink mb-5">Client Categories</h3>
          {categories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-tertiary">
                No client categories yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat: any) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span className="text-sm text-ink-secondary w-20 truncate">
                    {cat.label}
                  </span>
                  <div className="flex-1 h-6 bg-bg rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-sage rounded-pill transition-all"
                      style={{
                        width: `${
                          totalCategoryCount > 0
                            ? (cat.count / totalCategoryCount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink w-8 text-right">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-card rounded-card border border-border shadow-card p-7">
          <h3 className="font-semibold text-ink mb-5">Top Clients</h3>
          {topClientsData.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-tertiary">No client data yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 pr-3 ui-section-label">#</th>
                    <th className="text-left py-2.5 pr-3 ui-section-label">
                      Client
                    </th>
                    <th className="text-right py-2.5 pr-3 ui-section-label">
                      Sessions
                    </th>
                    <th className="text-right py-2.5 ui-section-label">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsData.map((client: any, idx: number) => (
                    <tr
                      key={client.name}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 pr-3 text-ink-tertiary">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-3 font-medium text-ink">
                        {client.name}
                      </td>
                      <td className="py-3 pr-3 text-right text-ink-secondary">
                        {client.sessions}
                      </td>
                      <td className="py-3 text-right font-medium text-ink">
                        {formatPaise(client.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
