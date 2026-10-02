"use client";

import { X } from "lucide-react";

/**
 * Rich Dashboard Preview — A high-fidelity presentation layer for the
 * UIForge dashboard fixture. The canonical source-of-truth remains the
 * UI Schema; this component is purely a projection for visual demonstration.
 *
 * Nodes carry `data-node-id` attributes so the parent can track selection.
 * Clicking a node calls `onSelectNode` to synchronise with the Sidebar
 * Layers tab and the Inspector panel.
 */

const NODE_CLASSES =
  "relative cursor-pointer outline outline-2 outline-transparent transition-all duration-100 hover:outline-cyan-500/50";

const SELECTED_OVERLAY =
  "outline outline-2 outline-cyan-400 ring-4 ring-cyan-500/20";

interface RichDashboardPreviewProps {
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export default function RichDashboardPreview({
  selectedNodeId,
  onSelectNode,
}: RichDashboardPreviewProps) {
  const select = (nodeId: string) => {
    onSelectNode?.(selectedNodeId === nodeId ? null : nodeId);
  };

  const nodeProps = (nodeId: string, extra?: string) => ({
    "data-node-id": nodeId,
    "data-semantic-type": nodeId.includes("root")
      ? "screen-root"
      : nodeId.includes("summary")
        ? "section"
        : "card",
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      select(nodeId);
    },
    className: `${NODE_CLASSES} ${extra ?? ""} ${
      selectedNodeId === nodeId ? SELECTED_OVERLAY : ""
    }`,
  });

  return (
    <main
      className="min-h-full w-full bg-slate-950 p-6 font-sans text-slate-100"
      data-node-id="screen.dashboard.root"
      data-semantic-type="screen-root"
      onClick={() => onSelectNode?.(null)}
      onKeyDown={(e) => e.key === "Escape" && onSelectNode?.(null)}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            FinTech Analytics v2
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white">
            Overview Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-white"
          >
            Monthly ▾
          </button>
          <button
            type="button"
            {...nodeProps(
              "dashboard.cta",
              "rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400",
            )}
          >
            Open Details →
          </button>
        </div>
      </header>

      {/* ── KPI Metric Cards ───────────────────────────────────── */}
      <section
        {...nodeProps(
          "dashboard.summary",
          "mb-6 grid grid-cols-3 gap-4 rounded-lg",
        )}
      >
        <MetricCard
          nodeId="dashboard.metric.revenue"
          label="Total Revenue"
          value="$39.6K"
          delta="+6.2%"
          positive
          trend={[28, 35, 30, 42, 38, 50, 45, 60, 55, 62]}
          selected={selectedNodeId === "dashboard.metric.revenue"}
          onSelect={select}
        />
        <MetricCard
          nodeId="dashboard.metric.users"
          label="Active Users"
          value="18.8K"
          delta="+0.59%"
          positive
          trend={[40, 38, 42, 45, 41, 48, 43, 50, 47, 52]}
          selected={selectedNodeId === "dashboard.metric.users"}
          onSelect={select}
        />
        <MetricCard
          nodeId="dashboard.metric.conversion"
          label="Conversion"
          value="$1.2K"
          delta="+1.08%"
          positive
          trend={[20, 22, 19, 25, 23, 28, 24, 30, 27, 32]}
          selected={selectedNodeId === "dashboard.metric.conversion"}
          onSelect={select}
        />
      </section>

      {/* ── Chart + Table Row ──────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-5 gap-4">
        {/* Bar Chart Area */}
        <div
          {...nodeProps(
            "dashboard.chart",
            "col-span-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Dashboard Results
            </h2>
            <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
              This Month
            </span>
          </div>
          <MiniBarChart />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map(
              (m) => (
                <span key={m}>{m}</span>
              ),
            )}
          </div>
        </div>

        {/* Deal Status Panel */}
        <div
          {...nodeProps(
            "dashboard.deal-status",
            "col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Deal Status</h2>
            <span className="text-[11px] text-slate-400">32 active</span>
          </div>
          <div className="space-y-2.5">
            <DealItem
              name="Maurie Vance"
              amount="$100.20"
              status="Negotiating"
              statusColor="amber"
            />
            <DealItem
              name="Tetrick Medie"
              amount="$29.00"
              status="Prospect"
              statusColor="blue"
            />
            <DealItem
              name="Merke Kooler"
              amount="$23.50"
              status="Closing"
              statusColor="emerald"
            />
          </div>
          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Total</span>
              <span className="font-semibold text-white">$399.08</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Table ─────────────────────────────────────────── */}
      <div
        {...nodeProps(
          "dashboard.table",
          "rounded-xl border border-slate-800 bg-slate-900/80",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Company Overview</h2>
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            placeholder="Search..."
            type="text"
          />
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Revenue</th>
              <th className="px-4 py-2">Average</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Growth</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row) => (
              <tr
                key={row.company}
                className="border-b border-slate-800/60 hover:bg-slate-800/30"
              >
                <td className="px-4 py-2 font-medium text-slate-200">
                  {row.company}
                </td>
                <td className="px-4 py-2 text-slate-300">{row.amount}</td>
                <td className="px-4 py-2 text-slate-300">{row.revenue}</td>
                <td className="px-4 py-2 text-slate-300">{row.average}</td>
                <td className="px-4 py-2 text-slate-300">{row.total}</td>
                <td
                  className={`px-4 py-2 font-semibold ${row.positive ? "text-emerald-400" : "text-red-400"}`}
                >
                  {row.growth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selection status strip — inline, no overlap */}
      <div
        className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 ${
          selectedNodeId
            ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-300"
            : "border-slate-800/40 bg-slate-900/30 text-slate-500"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 flex-none rounded-full ${selectedNodeId ? "bg-cyan-400" : "bg-slate-600"}`}
        />
        {selectedNodeId ? (
          <>
            <span>Selected:</span>
            <span className="font-mono font-semibold text-cyan-200">
              {selectedNodeId}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              Click AI Prompt to patch this node
            </span>
            <button
              type="button"
              onClick={() => onSelectNode?.(null)}
              className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-200 text-xs"
            >
              <X className="h-3 w-3" />
              <span>deselect</span>
            </button>
          </>
        ) : (
          <span>Click any node in the preview to select it</span>
        )}
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function MetricCard({
  nodeId,
  label,
  value,
  delta,
  positive,
  trend,
  selected,
  onSelect,
}: {
  nodeId: string;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  trend: number[];
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      data-node-id={nodeId}
      data-semantic-type="card"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(nodeId);
      }}
      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-100 hover:border-cyan-500/50 ${
        selected
          ? "border-cyan-400 ring-4 ring-cyan-500/20 bg-slate-900"
          : "border-slate-800 bg-slate-900/80"
      }`}
    >
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}
        >
          {positive ? "▲" : "▼"} {delta}
        </span>
        <MiniSparkline values={trend} positive={positive} />
      </div>
    </button>
  );
}

function MiniSparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const h = 28;
  const w = 64;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <title>Metric trend</title>
      <polyline
        fill="none"
        stroke={positive ? "#34d399" : "#f87171"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function MiniBarChart() {
  const bars = [45, 72, 55, 88, 65, 92, 78, 85];
  const max = Math.max(...bars);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {bars.map((v, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static chart bars
          key={i}
          className="flex-1 rounded-t-sm bg-cyan-500/70 transition-all hover:bg-cyan-400"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function DealItem({
  name,
  amount,
  status,
  statusColor,
}: {
  name: string;
  amount: string;
  status: string;
  statusColor: "amber" | "blue" | "emerald";
}) {
  const colorMap = {
    amber: "bg-amber-950/60 text-amber-400",
    blue: "bg-blue-950/60 text-blue-400",
    emerald: "bg-emerald-950/60 text-emerald-400",
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] text-slate-300">
          {name[0]}
        </div>
        <span className="text-xs text-slate-200">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-white">{amount}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colorMap[statusColor]}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

const TABLE_ROWS = [
  {
    company: "Indexation",
    amount: "20,301",
    revenue: "$26.05",
    average: "$25.86",
    total: "$4.00%",
    growth: "+4.00%",
    positive: true,
  },
  {
    company: "IndoSection",
    amount: "18,373",
    revenue: "$3.53",
    average: "$29.00",
    total: "$2.09%",
    growth: "+2.09%",
    positive: true,
  },
  {
    company: "Listeization",
    amount: "11,532",
    revenue: "$9.03",
    average: "$23.35",
    total: "$5.32%",
    growth: "-5.32%",
    positive: false,
  },
  {
    company: "Breadiozation",
    amount: "8,753",
    revenue: "$23.35",
    average: "$15.00",
    total: "$3.22%",
    growth: "+3.22%",
    positive: true,
  },
];
