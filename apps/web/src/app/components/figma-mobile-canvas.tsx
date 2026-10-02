"use client";

import { ArrowLeft, Eye, Search, X } from "lucide-react";
import FigmaArtboard from "./figma-artboard";
import { useFigmaCanvas } from "./figma-canvas-context";
import FigmaElement from "./figma-element";
import FigmaSection from "./figma-section";

interface FigmaMobileCanvasProps {
  activeScreenFilter?: string; // "all" | "signup" | "filter" | "explore"
}

export default function FigmaMobileCanvas({
  activeScreenFilter = "all",
}: FigmaMobileCanvasProps) {
  const { sections, screenPositions } = useFigmaCanvas();

  const showSignUp =
    activeScreenFilter === "all" || activeScreenFilter === "signup";
  const showFilter =
    activeScreenFilter === "all" || activeScreenFilter === "filter";
  const showExplore =
    activeScreenFilter === "all" || activeScreenFilter === "explore";

  return (
    <div
      className="relative font-sans select-none"
      style={{ minWidth: "1600px", minHeight: "1100px" }}
    >
      {/* ── Render Workflow Sections (Like OpenPencil & Figma) ─────── */}
      {Object.values(sections).map((sec) => (
        <FigmaSection key={sec.id} section={sec} />
      ))}
      {/* ──────────────────────────────────────────────────────────────────
       * Artboard 1: Sign Up Screen (iPhone 13 & 14)
       * ────────────────────────────────────────────────────────────────── */}
      {showSignUp && (
        <FigmaArtboard
          screenId="screen.signup"
          defaultX={60}
          defaultY={60}
          title="Sign Up"
          device="iPhone 13 & 14"
        >
          <div className="flex-1 overflow-y-auto px-6 pt-10 pb-8 flex flex-col justify-between">
            <div>
              <FigmaElement
                nodeId="signup.title"
                label="Title / Large"
                badge="Fill × Hug"
                initialText="Sign Up"
                isTextEditable
                className="mb-8"
              >
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Sign Up
                </h1>
              </FigmaElement>

              <div className="space-y-4">
                <FigmaElement
                  nodeId="signup.email"
                  label="Input Field"
                  badge="312 × 48"
                  initialText="Enter your email"
                  isTextEditable
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 shadow-xs">
                    Enter your email
                  </div>
                </FigmaElement>

                <FigmaElement
                  nodeId="signup.password"
                  label="Input Field"
                  badge="312 × 48"
                  initialText="Enter your password"
                  isTextEditable
                >
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 shadow-xs">
                    <span>Enter your password</span>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </div>
                </FigmaElement>
              </div>
            </div>

            <div className="pt-8">
              <FigmaElement
                nodeId="signup.submit"
                label="Primary Button"
                badge="Fill × Hug"
                semanticType="button"
              >
                <button
                  type="button"
                  className="w-full rounded-xl bg-slate-950 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-900"
                >
                  Sign Up
                </button>
              </FigmaElement>
            </div>
          </div>
        </FigmaArtboard>
      )}

      {/* ──────────────────────────────────────────────────────────────────
       * Artboard 2: Filter Screen (Matches User's Figma Upload Exactly)
       * ────────────────────────────────────────────────────────────────── */}
      {showFilter && (
        <FigmaArtboard
          screenId="screen.filter"
          defaultX={500}
          defaultY={60}
          title="Filter"
          device="iPhone 13 & 14"
        >
          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Top Bar with Reset button */}
              <div className="flex items-center justify-between">
                <FigmaElement
                  nodeId="filter.close"
                  label="Close Icon Button"
                  badge="24 × 24"
                  semanticType="button"
                >
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </FigmaElement>

                <FigmaElement
                  nodeId="filter.reset"
                  label="Reset Text Action"
                  badge="Hug × Hug"
                  semanticType="button"
                >
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Reset
                  </button>
                </FigmaElement>
              </div>

              {/* Title / Large: "Filter" */}
              <FigmaElement
                nodeId="filter.title"
                label="Title / Large"
                badge="Fill × Hug"
                initialText="Filter"
                isTextEditable
              >
                <h1 className="text-3xl font-bold tracking-tight text-[#1c1b1f]">
                  Filter
                </h1>
              </FigmaElement>

              {/* Search Location Input Field */}
              <FigmaElement
                nodeId="filter.search"
                label="Input Field / Search"
                badge="318 × 44"
                initialText="Search location"
                isTextEditable
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value="Search location"
                    className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </FigmaElement>

              {/* Price Range Slider */}
              <FigmaElement
                nodeId="filter.price"
                label="Slider / Range"
                badge="318 × 96"
              >
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                    <span>Price range</span>
                    <span className="font-mono text-[#0d99ff]">
                      $50 - $1,200
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-slate-200">
                    <div className="absolute left-1/4 right-1/4 h-full rounded-full bg-[#0d99ff]" />
                    <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-[#0d99ff] bg-white shadow-xs" />
                    <div className="absolute right-1/4 top-1/2 translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-[#0d99ff] bg-white shadow-xs" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>Min: $50</span>
                    <span>Max: $1,200</span>
                  </div>
                </div>
              </FigmaElement>

              {/* Type of Place (Entire place / Private room) */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Type of place
                </span>
                <div className="flex gap-2">
                  <FigmaElement
                    nodeId="filter.type.entire"
                    label="Choice Chip"
                    badge="154 × 38"
                    semanticType="button"
                    className="flex-1"
                  >
                    <div className="rounded-xl bg-slate-950 py-2 text-center text-xs font-semibold text-white shadow-xs">
                      Entire place
                    </div>
                  </FigmaElement>

                  <FigmaElement
                    nodeId="filter.type.room"
                    label="Choice Chip"
                    badge="154 × 38"
                    semanticType="button"
                    className="flex-1"
                  >
                    <div className="rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700">
                      Private room
                    </div>
                  </FigmaElement>
                </div>
              </div>
            </div>

            {/* Apply Filter Button */}
            <div className="pt-4">
              <FigmaElement
                nodeId="filter.apply"
                label="Primary Button"
                badge="Fill × Hug"
                semanticType="button"
              >
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#0d99ff] py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-600"
                >
                  Apply Filter
                </button>
              </FigmaElement>
            </div>
          </div>
        </FigmaArtboard>
      )}

      {/* ──────────────────────────────────────────────────────────────────
       * Artboard 3: Explore Screen (Destination of Filter)
       * ────────────────────────────────────────────────────────────────── */}
      {showExplore && (
        <FigmaArtboard
          screenId="screen.explore"
          defaultX={940}
          defaultY={60}
          title="Explore"
          device="iPhone 13 & 14"
        >
          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <FigmaElement
                  nodeId="explore.back"
                  label="Back Navigation"
                  badge="Hug × Hug"
                  semanticType="button"
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </button>
                </FigmaElement>

                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  32 Places
                </span>
              </div>

              <FigmaElement
                nodeId="explore.title"
                label="Title / Large"
                badge="Fill × Hug"
                initialText="Explore Stays"
                isTextEditable
              >
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Explore Stays
                </h1>
              </FigmaElement>

              {/* Cards list */}
              <div className="space-y-3">
                <FigmaElement
                  nodeId="explore.card.1"
                  label="Hotel Card"
                  badge="318 × 160"
                  semanticType="card"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="h-24 w-full rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 mb-2 flex items-end p-2 text-white font-bold text-xs">
                      Canal View Hotel
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        Amsterdam Center
                      </span>
                      <span className="font-bold text-[#0d99ff]">
                        $320 / night
                      </span>
                    </div>
                  </div>
                </FigmaElement>

                <FigmaElement
                  nodeId="explore.card.2"
                  label="Hotel Card"
                  badge="318 × 160"
                  semanticType="card"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="h-24 w-full rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 mb-2 flex items-end p-2 text-white font-bold text-xs">
                      Modern Loft Jordaan
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        Jordaan District
                      </span>
                      <span className="font-bold text-[#0d99ff]">
                        $480 / night
                      </span>
                    </div>
                  </div>
                </FigmaElement>
              </div>
            </div>
          </div>
        </FigmaArtboard>
      )}

      {/* ── Dynamic Custom Created Frames (from Frame tool / presets) ── */}
      {Object.entries(screenPositions)
        .filter(
          ([id]) =>
            !["screen.signup", "screen.filter", "screen.explore"].includes(id),
        )
        .map(([id, pos]) => (
          <FigmaArtboard
            key={id}
            screenId={id}
            defaultX={pos.x}
            defaultY={pos.y}
            width={pos.w}
            height={pos.h}
            title={pos.title}
            device={pos.device}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                {pos.device}
              </p>
              <p className="text-[11px] text-slate-400">
                Frame · Ready for AI Generative Design
              </p>
            </div>
          </FigmaArtboard>
        ))}
    </div>
  );
}
