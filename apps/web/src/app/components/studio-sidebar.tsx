"use client";

import type { UIDocument, UINode } from "@uiforge/ui-schema";
import {
  ArrowRight,
  ChevronDown,
  CornerDownRight,
  CreditCard,
  FormInput,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Minus,
  MousePointerClick,
  Smartphone,
  Square,
  Table,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";

type SidebarTab = "screens" | "layers" | "skills";

interface StudioSidebarProps {
  document: UIDocument;
  activeScreenId: string;
  onSelectScreen: (screenId: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const DESIGN_SKILLS = [
  {
    id: "skill.data-dense-dashboard",
    name: "Data-Dense Dashboard",
    category: "Information Architecture",
    description:
      "Compact metric cards, structured grids and low visual clutter.",
    active: true,
  },
  {
    id: "skill.wcag-aa-contrast",
    name: "WCAG 2.1 AA Contrast",
    category: "Accessibility",
    description: "Enforces 4.5:1 text and 3:1 graphical element contrast.",
    active: true,
  },
  {
    id: "skill.fluid-responsive",
    name: "Responsive Breakpoints",
    category: "Layout",
    description:
      "Canonical wide (1440), desktop (1024), tablet (768), mobile (390).",
    active: true,
  },
  {
    id: "skill.semantic-components",
    name: "Semantic Components",
    category: "Component Registry",
    description: "Maps button, card, input, and list to shadcn/ui and Base UI.",
    active: false,
  },
];

function NodeIcon({
  type,
  className = "h-3.5 w-3.5",
}: {
  type: string;
  className?: string;
}) {
  switch (type) {
    case "screen-root":
      return <Smartphone className={className} />;
    case "section":
      return <LayoutGrid className={className} />;
    case "button":
      return <MousePointerClick className={className} />;
    case "input":
      return <FormInput className={className} />;
    case "card":
      return <CreditCard className={className} />;
    case "text":
      return <Type className={className} />;
    case "list":
      return <List className={className} />;
    case "list-item":
      return <Minus className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    case "table":
      return <Table className={className} />;
    case "select":
      return <ChevronDown className={className} />;
    default:
      return <Square className={className} />;
  }
}

/** Rich preview nodes shown in the Layers tab for the dashboard screen */
const RICH_PREVIEW_NODES = [
  {
    id: "screen.dashboard.root",
    type: "screen-root",
    label: "Dashboard Root",
    depth: 0,
  },
  {
    id: "dashboard.summary",
    type: "section",
    label: "Overview Section",
    depth: 1,
  },
  {
    id: "dashboard.metric.revenue",
    type: "card",
    label: "Total Revenue",
    depth: 2,
  },
  {
    id: "dashboard.metric.users",
    type: "card",
    label: "Active Users",
    depth: 2,
  },
  {
    id: "dashboard.metric.conversion",
    type: "card",
    label: "Conversion",
    depth: 2,
  },
  { id: "dashboard.chart", type: "card", label: "Bar Chart", depth: 1 },
  { id: "dashboard.deal-status", type: "card", label: "Deal Status", depth: 1 },
  { id: "dashboard.table", type: "table", label: "Company Table", depth: 1 },
  { id: "dashboard.cta", type: "button", label: "Open Details CTA", depth: 1 },
];

/** Figma Mobile Screen Layers (Exact match to User's Uploaded Screenshot) */
const FIGMA_FILTER_LAYERS = [
  {
    id: "frame.iphone13",
    type: "screen-root",
    label: "# iPhone 13 & 14",
    depth: 0,
  },
  {
    id: "filter.home_indicator",
    type: "section",
    label: "System / iOS / Home Indicator",
    depth: 1,
  },
  {
    id: "filter.status_bar",
    type: "section",
    label: "System / iOS / Status Bar",
    depth: 1,
  },
  {
    id: "filter.top_bar",
    type: "section",
    label: "Navigation / Top Bar",
    depth: 1,
  },
  { id: "filter.back", type: "button", label: "Icon / Nav Back", depth: 2 },
  { id: "filter.title", type: "text", label: "Title / Large", depth: 1 },
  {
    id: "filter.search",
    type: "input",
    label: "Input Field / Search Bar",
    depth: 1,
  },
  { id: "filter.price", type: "card", label: "Slider / Range", depth: 1 },
  {
    id: "filter.amenities",
    type: "card",
    label: "Tags View / Amenities",
    depth: 1,
  },
  {
    id: "filter.property_type",
    type: "card",
    label: "Tags View / Property Type",
    depth: 1,
  },
  {
    id: "filter.apply_cta",
    type: "button",
    label: "Button / Apply Filters",
    depth: 1,
  },
];

const FIGMA_SIGNUP_LAYERS = [
  {
    id: "frame.signup",
    type: "screen-root",
    label: "# iPhone 13 & 14",
    depth: 0,
  },
  {
    id: "signup.status",
    type: "section",
    label: "System / iOS / Status Bar",
    depth: 1,
  },
  { id: "signup.title", type: "text", label: "Title / Sign Up", depth: 1 },
  { id: "signup.email", type: "input", label: "Input Field / Email", depth: 1 },
  {
    id: "signup.password",
    type: "input",
    label: "Input Field / Password",
    depth: 1,
  },
  {
    id: "signup.submit",
    type: "button",
    label: "Primary Button / Sign Up",
    depth: 1,
  },
  {
    id: "signup.forgot",
    type: "button",
    label: "Link / Forgot Password",
    depth: 1,
  },
];

const FIGMA_EXPLORE_LAYERS = [
  {
    id: "frame.explore",
    type: "screen-root",
    label: "# iPhone 13 & 14",
    depth: 0,
  },
  {
    id: "explore.status",
    type: "section",
    label: "System / iOS / Status Bar",
    depth: 1,
  },
  { id: "explore.title", type: "text", label: "Title / Explore", depth: 1 },
  {
    id: "explore.search",
    type: "input",
    label: "Input Field / Search",
    depth: 1,
  },
  {
    id: "explore.destinations",
    type: "section",
    label: "Popular Destinations",
    depth: 1,
  },
  {
    id: "explore.card.1",
    type: "card",
    label: "Card / Secluded Cottage",
    depth: 1,
  },
  {
    id: "explore.nav",
    type: "section",
    label: "Navigation / Tab Bar",
    depth: 1,
  },
];

export default function StudioSidebar({
  document,
  activeScreenId,
  onSelectScreen,
  selectedNodeId,
  onSelectNode,
}: StudioSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("screens");

  // Auto-switch to Layers when a node is selected from the preview
  useEffect(() => {
    if (selectedNodeId) {
      setActiveTab("layers");
    }
  }, [selectedNodeId]);

  const activeScreen = document.screens.find((s) => s.id === activeScreenId);
  const screenNodes = activeScreen
    ? activeScreen.nodeIds
        .map((id) => document.nodes[id])
        .filter((n): n is UINode => Boolean(n))
    : [];

  return (
    <aside className="flex h-full w-64 flex-none flex-col border-r border-slate-800 bg-slate-950">
      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-900/50 text-[11px]">
        {(
          [
            { id: "screens", label: "Screens", count: document.screens.length },
            { id: "layers", label: "Layers", count: screenNodes.length },
            { id: "skills", label: "Skills", count: DESIGN_SKILLS.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-cyan-400 bg-slate-900 text-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-bold text-xs">{tab.count}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* SCREENS TAB */}
        {activeTab === "screens" && (
          <div className="p-3 space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Project Screens
            </p>

            {document.screens.map((screen) => {
              const isSelected = screen.id === activeScreenId;
              return (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => onSelectScreen(screen.id)}
                  className={`group w-full rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-cyan-500/50 bg-cyan-950/30 shadow-sm"
                      : "border-slate-800/60 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${isSelected ? "text-cyan-300" : "text-slate-200 group-hover:text-white"}`}
                    >
                      {screen.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {screen.nodeIds.length}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500 truncate">
                    {screen.id}
                  </p>
                </button>
              );
            })}

            {/* Experience Flows */}
            <div className="mt-3">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Experience Flows
              </p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 space-y-2">
                {[
                  {
                    from: "Dashboard",
                    trigger: "CTA click",
                    to: "Mobile List",
                    color: "cyan",
                  },
                  {
                    from: "Login",
                    trigger: "Submit",
                    to: "Dashboard",
                    color: "violet",
                  },
                ].map((flow) => (
                  <div key={flow.from + flow.to} className="text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <ArrowRight
                        className={`h-3 w-3 text-${flow.color}-400 flex-none`}
                      />
                      <span className="font-medium">{flow.from}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-500">{flow.trigger}</span>
                    </div>
                    <div className="ml-3 mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <CornerDownRight className="h-3 w-3 text-slate-600 flex-none" />
                      <span className={`text-${flow.color}-400 font-medium`}>
                        {flow.to}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LAYERS TAB */}
        {activeTab === "layers" && (
          <div className="p-3">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {activeScreen?.name ?? "Screen"} · Semantic Nodes
            </p>

            <div className="space-y-0.5">
              {(selectedNodeId?.startsWith("filter.")
                ? FIGMA_FILTER_LAYERS
                : selectedNodeId?.startsWith("signup.")
                  ? FIGMA_SIGNUP_LAYERS
                  : selectedNodeId?.startsWith("explore.")
                    ? FIGMA_EXPLORE_LAYERS
                    : activeScreenId === "screen.dashboard"
                      ? RICH_PREVIEW_NODES
                      : screenNodes.map((node) => ({
                          id: node.id,
                          type: node.type,
                          label:
                            node.content?.label ??
                            node.id.split(".").pop() ??
                            node.id,
                          depth: node.parentId ? 1 : 0,
                        }))
              ).map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onSelectNode(isSelected ? null : node.id)}
                    style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
                    className={`flex w-full items-center justify-between rounded-md py-1.5 pr-2 text-xs transition-all ${
                      isSelected
                        ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex-none ${isSelected ? "text-cyan-400" : "text-slate-500"}`}
                      >
                        <NodeIcon type={node.type} />
                      </span>
                      <span className="truncate font-medium">{node.label}</span>
                    </div>
                    <span
                      className={`flex-none rounded px-1.5 py-0.5 font-mono text-[9px] ${
                        isSelected
                          ? "bg-cyan-950 text-cyan-400"
                          : "bg-slate-800/80 text-slate-500"
                      }`}
                    >
                      {node.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <div className="p-3 space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Active Design Skills
            </p>

            {DESIGN_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className={`rounded-lg border p-2.5 text-xs transition-colors ${
                  skill.active
                    ? "border-cyan-900/40 bg-cyan-950/15"
                    : "border-slate-800/60 bg-slate-900/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`font-semibold leading-tight ${skill.active ? "text-cyan-300" : "text-slate-300"}`}
                  >
                    {skill.name}
                  </span>
                  <span
                    className={`flex-none rounded px-1.5 py-0.5 text-[9px] font-medium ${
                      skill.active
                        ? "bg-cyan-950 text-cyan-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {skill.active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  {skill.category} · {skill.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
