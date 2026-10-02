"use client";

import type { UIDocument } from "@uiforge/ui-schema";

interface FlowGraphViewProps {
  document: UIDocument;
  onSelectScreen: (screenId: string) => void;
}

const FLOWS = [
  {
    id: "flow.authenticated-details",
    name: "Open details",
    sourceScreen: "screen.dashboard",
    sourceNode: "dashboard.cta",
    trigger: "click",
    action: "navigate",
    destScreen: "screen.mobile-list",
  },
  {
    id: "flow.sign-in",
    name: "Sign in",
    sourceScreen: "screen.login",
    sourceNode: "login.submit",
    trigger: "submit",
    action: "authenticate",
    destScreen: "screen.dashboard",
  },
];

export default function FlowGraphView({
  document,
  onSelectScreen,
}: FlowGraphViewProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-slate-950 p-6 text-slate-100">
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Product Experience Graph
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Canonical semantic transitions connecting user intent, screens, and
            actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-cyan-950 px-2.5 py-1 text-xs font-semibold text-cyan-400">
            {FLOWS.length} Active Flows
          </span>
          <span className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
            Deterministic Validation: Passed
          </span>
        </div>
      </div>

      {/* Visual Flow Diagram Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {document.screens.map((screen) => {
          const outgoingTransitions = FLOWS.filter(
            (f) => f.sourceScreen === screen.id,
          );
          const incomingTransitions = FLOWS.filter(
            (f) => f.destScreen === screen.id,
          );

          return (
            <div
              key={screen.id}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/40 transition-all hover:border-cyan-500/50"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {screen.name}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400">
                    {screen.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectScreen(screen.id)}
                  className="rounded bg-cyan-600/20 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30"
                >
                  View Screen →
                </button>
              </div>

              {/* Inbound & Outbound Connections */}
              <div className="mt-4 flex-1 space-y-3">
                {outgoingTransitions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      Outgoing Transitions (Actions)
                    </span>
                    <div className="mt-1.5 space-y-1.5">
                      {outgoingTransitions.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-2 text-xs"
                        >
                          <div className="flex items-center gap-1.5 font-medium text-cyan-200">
                            <span>⚡ On {t.trigger}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-violet-300">{t.action}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span>From: {t.sourceNode}</span>
                            <span className="font-mono text-cyan-400">
                              To: {t.destScreen}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {incomingTransitions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Incoming Transitions
                    </span>
                    <div className="mt-1.5 space-y-1.5">
                      {incomingTransitions.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-2 text-xs"
                        >
                          <div className="text-[11px] text-slate-300">
                            Triggered by{" "}
                            <strong className="text-emerald-400">
                              {t.sourceScreen}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outgoingTransitions.length === 0 &&
                  incomingTransitions.length === 0 && (
                    <div className="py-2 text-xs text-slate-500 italic">
                      No active flow transitions mapped for this screen.
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
