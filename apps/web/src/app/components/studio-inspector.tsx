"use client";

import type { UIDocument } from "@uiforge/ui-schema";
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  ArrowLeftRight,
  ArrowUpDown,
  Eye,
  FolderKanban,
  Frame,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useFigmaCanvas } from "./figma-canvas-context";

interface StudioInspectorProps {
  document: UIDocument;
  activeScreenId: string;
  selectedNodeId: string | null;
  onOpenAiPrompt?: () => void;
}

interface FigmaProps {
  x: number;
  y: number;
  w: number;
  h: number;
  layout: string;
  font?: string;
  weight?: string;
  size?: string;
  lineHeight?: string;
  fill?: string;
}

/** Metadata for rich-preview nodes that don't have a full schema entry */
const RICH_NODE_META: Record<
  string,
  {
    label: string;
    type: string;
    component: string;
    variant: string;
    interactive: boolean;
    action?: string;
    destination?: string;
    gapToken: string;
    paddingToken: string;
    radiusToken: string;
    wcagRatio: string;
    rationale: string;
    code: string;
    figma?: FigmaProps;
  }
> = {
  /* ── Filter Screen Nodes (from User's Figma Screenshot) ── */
  "filter.close": {
    label: "Close Icon Button",
    type: "button",
    component: "icon-button",
    variant: "ghost",
    interactive: true,
    action: "dismiss",
    destination: "screen.signup",
    gapToken: "space.0",
    paddingToken: "space.1",
    radiusToken: "radius.full (9999px)",
    wcagRatio: "12.5:1 (AAA)",
    rationale:
      "24×24 circular close button. Navigates back or dismisses the filter sheet.",
    figma: {
      x: 20,
      y: 12,
      w: 28,
      h: 28,
      layout: "Fixed 28 × 28",
      fill: "transparent",
    },
    code: `<button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-4 w-4" /></button>`,
  },
  "filter.reset": {
    label: "Reset Action Button",
    type: "button",
    component: "text-button",
    variant: "ghost",
    interactive: true,
    action: "reset-state",
    gapToken: "space.0",
    paddingToken: "space.1",
    radiusToken: "radius.sm",
    wcagRatio: "8.2:1 (AA)",
    rationale: "Quick action to clear applied filters and restore defaults.",
    figma: {
      x: 300,
      y: 16,
      w: 48,
      h: 20,
      layout: "Hug × Hug",
      fill: "transparent",
    },
    code: `<button className="text-xs font-semibold text-slate-500 uppercase hover:text-slate-900">Reset</button>`,
  },
  "filter.type.entire": {
    label: "Choice Chip / Entire Place",
    type: "button",
    component: "choice-chip",
    variant: "selected",
    interactive: true,
    action: "select-option",
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.xl (12px)",
    wcagRatio: "18.5:1 (AAA)",
    rationale:
      "Selected chip for property type filter. Active dark styling with high contrast.",
    figma: {
      x: 20,
      y: 260,
      w: 154,
      h: 38,
      layout: "Fill × Hug",
      fill: "#0B0F17",
    },
    code: `<div className="rounded-xl bg-slate-950 py-2 text-center text-xs font-semibold text-white">Entire place</div>`,
  },
  "filter.type.room": {
    label: "Choice Chip / Private Room",
    type: "button",
    component: "choice-chip",
    variant: "outline",
    interactive: true,
    action: "select-option",
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.xl (12px)",
    wcagRatio: "9.2:1 (AAA)",
    rationale: "Unselected chip for room type with subtle outline border.",
    figma: {
      x: 184,
      y: 260,
      w: 154,
      h: 38,
      layout: "Fill × Hug",
      fill: "#FFFFFF",
    },
    code: `<div className="rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700">Private room</div>`,
  },
  "filter.apply": {
    label: "Apply Filter CTA",
    type: "button",
    component: "button",
    variant: "primary",
    interactive: true,
    action: "apply-and-navigate",
    destination: "screen.explore",
    gapToken: "space.2",
    paddingToken: "space.4",
    radiusToken: "radius.xl (12px)",
    wcagRatio: "4.8:1 (AA)",
    rationale:
      "Figma blue CTA button linking to Explore screen upon submission.",
    figma: {
      x: 20,
      y: 710,
      w: 320,
      h: 50,
      layout: "Fill × Hug",
      fill: "#0D99FF",
    },
    code: `<button className="w-full rounded-xl bg-[#0d99ff] py-3.5 text-center text-sm font-semibold text-white">Apply Filter</button>`,
  },
  "explore.back": {
    label: "Back Navigation Button",
    type: "button",
    component: "nav-button",
    variant: "ghost",
    interactive: true,
    action: "go-back",
    destination: "screen.filter",
    gapToken: "space.1.5",
    paddingToken: "space.1",
    radiusToken: "radius.md",
    wcagRatio: "7.8:1 (AA)",
    rationale:
      "Breadcrumb back navigation returning user to filter configuration.",
    figma: {
      x: 20,
      y: 12,
      w: 64,
      h: 24,
      layout: "Hug × Hug",
      fill: "transparent",
    },
    code: `<button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" /><span>Filter</span></button>`,
  },
  "signup.email": {
    label: "Email Input Field",
    type: "input",
    component: "input",
    variant: "default",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.xl (12px)",
    wcagRatio: "4.6:1 (AA)",
    rationale: "Email entry input field.",
    figma: {
      x: 24,
      y: 110,
      w: 312,
      h: 48,
      layout: "Fill × Hug",
      fill: "#F8FAFC",
    },
    code: `<input type="email" placeholder="Enter your email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />`,
  },
  "signup.password": {
    label: "Password Input Field",
    type: "input",
    component: "input",
    variant: "password",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.xl (12px)",
    wcagRatio: "4.6:1 (AA)",
    rationale: "Password entry input with visibility eye icon toggle.",
    figma: {
      x: 24,
      y: 174,
      w: 312,
      h: 48,
      layout: "Fill × Hug",
      fill: "#F8FAFC",
    },
    code: `<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="password" /><Eye className="h-4 w-4 text-slate-400" /></div>`,
  },
  "explore.card.1": {
    label: "Canal View Hotel Card",
    type: "card",
    component: "hotel-card",
    variant: "elevated",
    interactive: true,
    action: "view-details",
    gapToken: "space.3",
    paddingToken: "space.3",
    radiusToken: "radius.2xl (16px)",
    wcagRatio: "7.5:1 (AA)",
    rationale:
      "Interactive stay result card with price and gradient thumbnail.",
    figma: {
      x: 20,
      y: 100,
      w: 320,
      h: 160,
      layout: "Fill × Hug",
      fill: "#FFFFFF",
    },
    code: `<div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">...</div>`,
  },
  "explore.card.2": {
    label: "Modern Loft Jordaan Card",
    type: "card",
    component: "hotel-card",
    variant: "elevated",
    interactive: true,
    action: "view-details",
    gapToken: "space.3",
    paddingToken: "space.3",
    radiusToken: "radius.2xl (16px)",
    wcagRatio: "7.5:1 (AA)",
    rationale:
      "Interactive stay result card with price and gradient thumbnail.",
    figma: {
      x: 20,
      y: 280,
      w: 320,
      h: 160,
      layout: "Fill × Hug",
      fill: "#FFFFFF",
    },
    code: `<div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">...</div>`,
  },
  "filter.title": {
    label: "Title / Large",
    type: "text",
    component: "heading",
    variant: "display",
    interactive: false,
    gapToken: "space.0",
    paddingToken: "space.0",
    radiusToken: "0px",
    wcagRatio: "16.2:1 (AAA)",
    rationale:
      "Selected in Figma. Auto Layout: Fill × Hug. Typography: Inter 32px Semi Bold.",
    figma: {
      x: 16,
      y: 8,
      w: 358,
      h: 40,
      layout: "Fill × Hug",
      font: "Inter",
      weight: "Semi Bold",
      size: "32px",
      lineHeight: "40px",
      fill: "#1C1B1F",
    },
    code: `<h1 className="text-3xl font-bold tracking-tight text-[#1c1b1f]">Filter</h1>`,
  },
  "filter.search": {
    label: "Input Field / Search Bar",
    type: "input",
    component: "search-input",
    variant: "rounded",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.lg (12px)",
    wcagRatio: "6.8:1",
    rationale:
      "Location search input with icon prefix inside iPhone 13 & 14 frame.",
    figma: {
      x: 16,
      y: 56,
      w: 358,
      h: 44,
      layout: "Fill × Hug",
      fill: "#F1F5F9",
    },
    code: `<input type="text" placeholder="Search by location" className="w-full rounded-xl bg-slate-100 px-4 py-2.5" />`,
  },
  "filter.price": {
    label: "Slider / Range",
    type: "slider",
    component: "slider",
    variant: "dual-thumb",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.2",
    radiusToken: "radius.full",
    wcagRatio: "8.1:1",
    rationale: "Price dual range slider component.",
    figma: {
      x: 16,
      y: 112,
      w: 358,
      h: 56,
      layout: "Fill × Hug",
    },
    code: `<Slider defaultValue={[200, 800]} max={1000} step={10} className="w-full" />`,
  },
  "filter.amenities": {
    label: "Tags View / Amenities",
    type: "tags",
    component: "chip-group",
    variant: "filter",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.2",
    radiusToken: "radius.full",
    wcagRatio: "9.5:1",
    rationale: "Amenity tag group (Swimming Pool, Balcony, Garden).",
    figma: {
      x: 16,
      y: 180,
      w: 358,
      h: 68,
      layout: "Fill × Hug",
    },
    code: `<div className="flex flex-wrap gap-2">{amenities.map(a => <Chip key={a}>{a}</Chip>)}</div>`,
  },
  "filter.property_type": {
    label: "Tags View / Property Type",
    type: "tags",
    component: "chip-group",
    variant: "filter",
    interactive: true,
    gapToken: "space.2",
    paddingToken: "space.2",
    radiusToken: "radius.full",
    wcagRatio: "9.5:1",
    rationale: "Property type selection (House, Apartment, Condo, Townhouse).",
    figma: {
      x: 16,
      y: 260,
      w: 358,
      h: 68,
      layout: "Fill × Hug",
    },
    code: `<div className="flex flex-wrap gap-2">{types.map(t => <Chip key={t}>{t}</Chip>)}</div>`,
  },
  "filter.apply_cta": {
    label: "Button / Apply Filters",
    type: "button",
    component: "button",
    variant: "primary",
    interactive: true,
    action: "apply-filter",
    gapToken: "space.2",
    paddingToken: "space.4",
    radiusToken: "radius.xl (14px)",
    wcagRatio: "16.8:1 (AAA)",
    rationale: "Primary CTA button to apply filters to explore listing.",
    figma: {
      x: 16,
      y: 720,
      w: 358,
      h: 52,
      layout: "Fill × Hug",
      fill: "#0B0F17",
    },
    code: `<Button className="w-full bg-slate-950 py-3.5 text-white">Apply Filters</Button>`,
  },

  /* ── Sign Up & Explore Nodes ── */
  "signup.title": {
    label: "Title / Sign Up",
    type: "text",
    component: "heading",
    variant: "display",
    interactive: false,
    gapToken: "space.0",
    paddingToken: "space.0",
    radiusToken: "0px",
    wcagRatio: "15.4:1 (AAA)",
    rationale: "Sign Up page display heading.",
    figma: {
      x: 24,
      y: 48,
      w: 312,
      h: 44,
      layout: "Fill × Hug",
      fill: "#0B0F17",
    },
    code: `<h1 className="text-3xl font-bold">Sign Up</h1>`,
  },
  "signup.submit": {
    label: "Primary Button / Sign Up",
    type: "button",
    component: "button",
    variant: "primary",
    interactive: true,
    action: "authenticate",
    destination: "screen.dashboard",
    gapToken: "space.2",
    paddingToken: "space.4",
    radiusToken: "radius.xl (14px)",
    wcagRatio: "16.8:1 (AAA)",
    rationale: "Authentication trigger button leading to Dashboard.",
    figma: {
      x: 24,
      y: 280,
      w: 312,
      h: 52,
      layout: "Fill × Hug",
      fill: "#0B0F17",
    },
    code: `<Button className="w-full bg-slate-950 text-white">Sign Up</Button>`,
  },
  "explore.title": {
    label: "Title / Explore",
    type: "text",
    component: "heading",
    variant: "display",
    interactive: false,
    gapToken: "space.0",
    paddingToken: "space.0",
    radiusToken: "0px",
    wcagRatio: "15.4:1 (AAA)",
    rationale: "Explore screen main header.",
    figma: {
      x: 24,
      y: 24,
      w: 312,
      h: 36,
      layout: "Fill × Hug",
      fill: "#0B0F17",
    },
    code: `<h1 className="text-2xl font-bold">Explore</h1>`,
  },

  /* ── Dashboard Nodes ── */
  "dashboard.cta": {
    label: "Open Details Button",
    type: "button",
    component: "button",
    variant: "primary",
    interactive: true,
    action: "navigate",
    destination: "screen.mobile-list",
    gapToken: "space.2",
    paddingToken: "space.3",
    radiusToken: "radius.md (8px)",
    wcagRatio: "7.2:1",
    rationale: "Primary CTA navigating to the mobile list screen.",
    figma: {
      x: 1140,
      y: 90,
      w: 180,
      h: 44,
      layout: "Hug × Hug",
      fill: "#06B6D4",
    },
    code: `<Button className="bg-cyan-500 text-slate-950" onClick={() => navigate("screen.mobile-list")}>Open Details →</Button>`,
  },
  "dashboard.summary": {
    label: "Overview Section",
    type: "section",
    component: "section",
    variant: "grid-3",
    interactive: false,
    gapToken: "space.4",
    paddingToken: "space.0",
    radiusToken: "radius.lg (12px)",
    wcagRatio: "N/A",
    rationale: "3-column grid section grouping KPI metric cards.",
    figma: { x: 24, y: 96, w: 840, h: 120, layout: "Fill × Hug" },
    code: `<section className="grid grid-cols-3 gap-4">{metrics.map(m => <MetricCard key={m.id} {...m} />)}</section>`,
  },
  "dashboard.metric.revenue": {
    label: "Total Revenue Card",
    type: "card",
    component: "metric-card",
    variant: "kpi",
    interactive: false,
    gapToken: "space.4",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "8.5:1",
    rationale: "KPI card showing revenue with sparkline trend.",
    figma: {
      x: 24,
      y: 96,
      w: 260,
      h: 110,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p>Total Revenue</p><h2>$39.6K</h2></div>`,
  },
  "dashboard.metric.users": {
    label: "Active Users Card",
    type: "card",
    component: "metric-card",
    variant: "kpi",
    interactive: false,
    gapToken: "space.4",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "8.5:1",
    rationale: "KPI card for active user count.",
    figma: {
      x: 300,
      y: 96,
      w: 260,
      h: 110,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p>Active Users</p><h2>18.8K</h2></div>`,
  },
  "dashboard.metric.conversion": {
    label: "Conversion Card",
    type: "card",
    component: "metric-card",
    variant: "kpi",
    interactive: false,
    gapToken: "space.4",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "8.5:1",
    rationale: "Third KPI completing the top-row triad.",
    figma: {
      x: 580,
      y: 96,
      w: 260,
      h: 110,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p>Conversion</p><h2>$1.2K</h2></div>`,
  },
  "dashboard.chart": {
    label: "Bar Chart — Dashboard Results",
    type: "card",
    component: "chart-bar",
    variant: "monthly",
    interactive: false,
    gapToken: "space.4",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "N/A",
    rationale: "Monthly bar chart showing trend over 8 months.",
    figma: {
      x: 24,
      y: 220,
      w: 500,
      h: 240,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<div className="rounded-xl border border-slate-800 p-4"><BarChart data={monthlyData} /></div>`,
  },
  "dashboard.deal-status": {
    label: "Deal Status Card",
    type: "card",
    component: "status-panel",
    variant: "deals",
    interactive: false,
    gapToken: "space.3",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "N/A",
    rationale: "Active deals status list with badges.",
    figma: {
      x: 540,
      y: 220,
      w: 320,
      h: 240,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<div className="rounded-xl border border-slate-800 p-4"><DealStatusList items={deals} /></div>`,
  },
  "dashboard.table": {
    label: "Company Overview Table",
    type: "table",
    component: "data-table",
    variant: "financial",
    interactive: false,
    gapToken: "space.2",
    paddingToken: "space.4",
    radiusToken: "radius.xl (16px)",
    wcagRatio: "7.8:1",
    rationale: "Full-width data table listing company metrics.",
    figma: {
      x: 24,
      y: 480,
      w: 840,
      h: 220,
      layout: "Fill × Hug",
      fill: "#0F172A",
    },
    code: `<DataTable data={companies} columns={columns} />`,
  },
};

export default function StudioInspector({
  document,
  activeScreenId,
  selectedNodeId,
  onOpenAiPrompt,
}: StudioInspectorProps) {
  const [activeTab, setActiveTab] = useState<
    "design" | "tokens" | "rationale" | "code"
  >("design");
  const [copied, setCopied] = useState(false);
  const canvas = useFigmaCanvas();

  const selectedSection = canvas.selectedSectionId
    ? canvas.sections[canvas.selectedSectionId]
    : null;
  const selectedScreen =
    !selectedSection && !canvas.selectedNodeId && canvas.selectedScreenId
      ? canvas.screenPositions[canvas.selectedScreenId]
      : null;

  // ── Render Section Inspector (OpenPencil / Figma Section properties) ──
  if (selectedSection) {
    const enclosedScreens = Object.entries(canvas.screenPositions).filter(
      ([_, pos]) => {
        const cx = pos.x + pos.w / 2;
        const cy = pos.y + pos.h / 2;
        return (
          cx >= selectedSection.x &&
          cx <= selectedSection.x + selectedSection.w &&
          cy >= selectedSection.y &&
          cy <= selectedSection.y + selectedSection.h
        );
      },
    );

    const THEME_COLORS = [
      { name: "Blue", hex: "#0d99ff", class: "bg-[#0d99ff]" },
      { name: "Purple", hex: "#a855f7", class: "bg-purple-500" },
      { name: "Emerald", hex: "#10b981", class: "bg-emerald-500" },
      { name: "Amber", hex: "#f59e0b", class: "bg-amber-500" },
      { name: "Rose", hex: "#f43f5e", class: "bg-rose-500" },
      { name: "Indigo", hex: "#6366f1", class: "bg-indigo-500" },
    ];

    return (
      <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950 text-slate-300">
        <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <FolderKanban className="h-4 w-4" />
            <span className="text-slate-200">SECTION</span>
          </div>
          <span className="max-w-[140px] truncate rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
            {selectedSection.id}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Section Title
            </span>
            <input
              type="text"
              value={selectedSection.title}
              onChange={(e) =>
                canvas.updateSection(selectedSection.id, {
                  title: e.target.value,
                })
              }
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g. Onboarding Flow"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Accent Color
            </span>
            <div className="flex items-center gap-2 pt-1">
              {THEME_COLORS.map((c) => {
                const isActive = (selectedSection.color || "#0d99ff") === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() =>
                      canvas.updateSection(selectedSection.id, {
                        color: c.hex,
                      })
                    }
                    className={`h-6 w-6 rounded-full transition-transform ${c.class} ${
                      isActive
                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Section Dimensions</span>
              <span className="font-mono text-cyan-400 font-bold">
                {selectedSection.w} × {selectedSection.h}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">X</span>
                <input
                  type="number"
                  value={selectedSection.x}
                  onChange={(e) =>
                    canvas.updateSection(selectedSection.id, {
                      x: Number(e.target.value),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">Y</span>
                <input
                  type="number"
                  value={selectedSection.y}
                  onChange={(e) =>
                    canvas.updateSection(selectedSection.id, {
                      y: Number(e.target.value),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">W</span>
                <input
                  type="number"
                  value={selectedSection.w}
                  onChange={(e) =>
                    canvas.updateSection(selectedSection.id, {
                      w: Math.max(100, Number(e.target.value)),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">H</span>
                <input
                  type="number"
                  value={selectedSection.h}
                  onChange={(e) =>
                    canvas.updateSection(selectedSection.id, {
                      h: Math.max(100, Number(e.target.value)),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Enclosed Frames</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-400 font-mono">
                {enclosedScreens.length}
              </span>
            </div>

            {enclosedScreens.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                No frames currently inside this section. Drag or create frames
                inside to group them.
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {enclosedScreens.map(([sId, sPos]) => (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => {
                      canvas.setSelectedScreenId(sId);
                      canvas.setSelectedSectionId(null);
                    }}
                    className="flex w-full items-center justify-between rounded border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-left text-slate-300 hover:border-cyan-500/50 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Frame className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate font-medium">{sPos.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {sPos.w}×{sPos.h}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => canvas.deleteSection(selectedSection.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:border-red-500/50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Section
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Render Frame Inspector (Artboard properties) ──
  if (selectedScreen && canvas.selectedScreenId) {
    const screenId = canvas.selectedScreenId;
    return (
      <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950 text-slate-300">
        <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Frame className="h-4 w-4" />
            <span className="text-slate-200">FRAME / ARTBOARD</span>
          </div>
          <span className="max-w-[140px] truncate rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
            {screenId}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Frame Name
            </span>
            <input
              type="text"
              value={selectedScreen.title}
              onChange={(e) =>
                canvas.updateScreenPosition(screenId, {
                  title: e.target.value,
                })
              }
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="Screen Name"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Device Preset</span>
              <div className="flex items-center gap-1 text-cyan-400 font-medium">
                <Smartphone className="h-3 w-3" />
                <span>{selectedScreen.device || "Custom"}</span>
              </div>
            </div>
            <div className="rounded bg-slate-950 px-2.5 py-1.5 border border-slate-800 text-[11px] text-slate-400 font-mono">
              Base Canvas: {selectedScreen.w} × {selectedScreen.h} px
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Position &amp; Size</span>
              <span className="font-mono text-cyan-400 font-bold">
                {selectedScreen.w} × {selectedScreen.h}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">X</span>
                <input
                  type="number"
                  value={selectedScreen.x}
                  onChange={(e) =>
                    canvas.updateScreenPosition(screenId, {
                      x: Number(e.target.value),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">Y</span>
                <input
                  type="number"
                  value={selectedScreen.y}
                  onChange={(e) =>
                    canvas.updateScreenPosition(screenId, {
                      y: Number(e.target.value),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">W</span>
                <input
                  type="number"
                  value={selectedScreen.w}
                  onChange={(e) =>
                    canvas.updateScreenPosition(screenId, {
                      w: Math.max(100, Number(e.target.value)),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                <span className="text-slate-500">H</span>
                <input
                  type="number"
                  value={selectedScreen.h}
                  onChange={(e) =>
                    canvas.updateScreenPosition(screenId, {
                      h: Math.max(100, Number(e.target.value)),
                    })
                  }
                  className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => canvas.deleteScreen(screenId)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:border-red-500/50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Frame
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Try schema node first, fall back to rich-preview meta, then screen root
  const schemaNode = selectedNodeId
    ? document.nodes[selectedNodeId]
    : undefined;
  const richMeta = selectedNodeId ? RICH_NODE_META[selectedNodeId] : undefined;
  const activeScreen = document.screens.find((s) => s.id === activeScreenId);
  const fallbackNode = activeScreen
    ? document.nodes[activeScreen.rootNodeId]
    : null;

  // Resolved display values
  const displayId = selectedNodeId ?? fallbackNode?.id ?? "filter.title";
  const effectiveMeta = richMeta ?? RICH_NODE_META["filter.title"];

  const displayLabel =
    effectiveMeta?.label ??
    schemaNode?.content?.label ??
    schemaNode?.id ??
    "Title / Large";
  const displayType = effectiveMeta?.type ?? schemaNode?.type ?? "text";
  const displayComponent =
    effectiveMeta?.component ??
    schemaNode?.component?.registryId ??
    displayType;
  const displayVariant =
    effectiveMeta?.variant ?? schemaNode?.component?.variant ?? "default";
  const displayInteractive =
    effectiveMeta?.interactive ?? !!schemaNode?.interaction?.interactive;
  const displayAction =
    effectiveMeta?.action ?? schemaNode?.interaction?.action;
  const displayDestination =
    effectiveMeta?.destination ?? schemaNode?.interaction?.targetScreenId;
  const displayGap =
    effectiveMeta?.gapToken ?? schemaNode?.layout?.gap?.token ?? "space.4";
  const displayPadding =
    effectiveMeta?.paddingToken ??
    schemaNode?.responsive?.[0]?.layout?.padding?.block?.token ??
    "space.4";
  const displayRadius = effectiveMeta?.radiusToken ?? "radius.md (8px)";
  const displayWcag = effectiveMeta?.wcagRatio ?? "16.2:1";
  const displayRationale =
    effectiveMeta?.rationale ??
    (schemaNode
      ? `Node ${schemaNode.id} was registered as ${schemaNode.component?.registryId ?? schemaNode.type}.`
      : "Selected element inspected on Figma Canvas.");
  const displayCode =
    effectiveMeta?.code ??
    (schemaNode
      ? `// ${schemaNode.type} — ${schemaNode.id}`
      : "// Select a node to view generated React code");

  const figmaData = effectiveMeta?.figma ?? {
    x: 16,
    y: 8,
    w: 358,
    h: 40,
    layout: "Fill × Hug",
    font: "Inter",
    weight: "Semi Bold",
    size: "32px",
    lineHeight: "40px",
    fill: "#1C1B1F",
  };

  const liveTransform = canvas.elementTransforms[displayId];
  const liveW =
    liveTransform?.w && liveTransform.w > 0 ? liveTransform.w : figmaData.w;
  const liveH =
    liveTransform?.h && liveTransform.h > 0 ? liveTransform.h : figmaData.h;
  const liveX =
    liveTransform?.x !== undefined && liveTransform.x !== 0
      ? liveTransform.x
      : figmaData.x;
  const liveY =
    liveTransform?.y !== undefined && liveTransform.y !== 0
      ? liveTransform.y
      : figmaData.y;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950 text-slate-300">
      {/* Inspector Header */}
      <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-semibold">
        <span className="text-slate-200">INSPECTOR</span>
        <span className="max-w-[140px] truncate rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
          {displayId}
        </span>
      </div>

      {/* Tab Switcher (Design, Tokens, Rationale, Code) */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 text-xs">
        {(["design", "tokens", "rationale", "code"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded py-1.5 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-slate-800 text-cyan-400 font-semibold shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {/* ── Figma Design Tab (Exact Match to User's Uploaded Screenshot) ── */}
        {activeTab === "design" && (
          <div className="space-y-4">
            {/* Alignment Tools Bar */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-slate-400">
              <button
                type="button"
                title="Align left"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Align horizontal center"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Align right"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                title="Align top"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignStartVertical className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Align vertical center"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignCenterVertical className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Align bottom"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignEndVertical className="h-3.5 w-3.5" />
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                title="Distribute spacing"
                className="hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <AlignHorizontalDistributeCenter className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Position & Sizing Section (X, Y, W, H, Fill x Hug) */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Frame &amp; Geometry</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {figmaData.layout}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                  <span className="text-slate-500">X</span>
                  <input
                    type="number"
                    value={liveX}
                    onChange={(e) =>
                      canvas.updateTransform(displayId, {
                        x: Number(e.target.value),
                      })
                    }
                    className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                  <span className="text-slate-500">Y</span>
                  <input
                    type="number"
                    value={liveY}
                    onChange={(e) =>
                      canvas.updateTransform(displayId, {
                        y: Number(e.target.value),
                      })
                    }
                    className="w-16 bg-transparent text-right font-mono text-slate-200 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                  <span className="text-slate-500">W</span>
                  <input
                    type="number"
                    value={liveW}
                    onChange={(e) =>
                      canvas.updateTransform(displayId, {
                        w: Number(e.target.value),
                      })
                    }
                    className="w-16 bg-transparent text-right font-mono text-cyan-300 font-bold outline-none"
                  />
                </div>
                <div className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 border border-slate-800">
                  <span className="text-slate-500">H</span>
                  <input
                    type="number"
                    value={liveH}
                    onChange={(e) =>
                      canvas.updateTransform(displayId, {
                        h: Number(e.target.value),
                      })
                    }
                    className="w-16 bg-transparent text-right font-mono text-cyan-300 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Ask AI Copilot Button */}
              {onOpenAiPrompt && (
                <button
                  type="button"
                  onClick={onOpenAiPrompt}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/40 bg-purple-950/30 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 hover:text-white transition-all shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ask AI Copilot to modify node</span>
                </button>
              )}

              {/* Sizing Constraints */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 font-mono">
                    Fill
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ArrowUpDown className="h-3 w-3" />
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200 font-mono">
                    Hug
                  </span>
                </div>
                <span className="text-slate-500 font-mono">∠ 0°</span>
              </div>
            </div>

            {/* Typography Section (Inter, 32px, Semi Bold) */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Text / Typography</span>
                <span className="text-cyan-400 font-normal">Inter</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-slate-950 px-2 py-1 border border-slate-800 text-slate-300 font-medium">
                  {figmaData.weight ?? "Semi Bold"}
                </div>
                <div className="rounded bg-slate-950 px-2 py-1 border border-slate-800 text-slate-300 font-mono">
                  {figmaData.size ?? "32"}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Line Height: {figmaData.lineHeight ?? "40px"}</span>
                <span>Letter Spacing: 0%</span>
              </div>
            </div>

            {/* Fill Color Section */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Fill</span>
                <span className="text-slate-500">100%</span>
              </div>

              <div className="flex items-center justify-between rounded bg-slate-950 px-2.5 py-1.5 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-sm border border-slate-700"
                    style={{ backgroundColor: figmaData.fill ?? "#1C1B1F" }}
                  />
                  <span className="font-mono text-slate-200 font-semibold">
                    {figmaData.fill ?? "#1C1B1F"}
                  </span>
                </div>
                <Eye className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            {/* WCAG AA Contrast Pill */}
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-2.5 flex items-center justify-between">
              <span className="font-medium text-emerald-300">
                WCAG Contrast
              </span>
              <span className="rounded bg-emerald-900/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                {displayWcag} AA Badge
              </span>
            </div>
          </div>
        )}

        {/* ── Tokens Tab ── */}
        {activeTab === "tokens" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
              <div>
                <p className="font-semibold text-slate-200">{displayLabel}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  {displayId}
                </p>
              </div>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                {displayType}
              </span>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Semantic Design Tokens
              </div>
              <div className="space-y-2">
                {[
                  { label: "Spacing Gap", value: displayGap, note: "16px" },
                  {
                    label: "Padding Block",
                    value: displayPadding,
                    note: "16px",
                  },
                  { label: "Radius", value: displayRadius, note: "" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/70 p-2"
                  >
                    <span className="text-slate-400">{row.label}</span>
                    <div className="flex items-center gap-1.5 font-mono text-cyan-300">
                      <span>{row.value}</span>
                      {row.note && (
                        <span className="text-slate-500">({row.note})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interaction Metadata */}
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Node Metadata
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-900">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-slate-200">{displayType}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-900">
                  <span className="text-slate-500">Component:</span>
                  <span className="text-slate-200">{displayComponent}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-900">
                  <span className="text-slate-500">Variant:</span>
                  <span className="text-cyan-400">{displayVariant}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-900">
                  <span className="text-slate-500">Interactive:</span>
                  <span
                    className={
                      displayInteractive ? "text-emerald-400" : "text-slate-500"
                    }
                  >
                    {String(displayInteractive)}
                  </span>
                </div>
                {displayAction && (
                  <div className="flex justify-between py-0.5 border-b border-slate-900">
                    <span className="text-slate-500">Action:</span>
                    <span className="text-amber-400">{displayAction}</span>
                  </div>
                )}
                {displayDestination && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Destination:</span>
                    <span className="text-cyan-400">{displayDestination}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Rationale Tab ── */}
        {activeTab === "rationale" && (
          <div className="space-y-3">
            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                Design Decision
              </p>
              <p className="text-slate-300 leading-relaxed">
                {displayRationale}
              </p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">
                Semantic Enforcement
              </p>
              <p>
                Rule D: Design intent is semantic. Component choices reflect
                purpose, context, state, and accessibility tokens.
              </p>
            </div>
          </div>
        )}

        {/* ── Code Tab ── */}
        {activeTab === "code" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                React / Tailwind Spec
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 hover:bg-slate-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-cyan-300">
              <code>{displayCode}</code>
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
