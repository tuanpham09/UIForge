"use client";

import { ArrowLeft, ArrowRight, RotateCcw, Search, X } from "lucide-react";
import { useState } from "react";
import { useFigmaCanvas } from "./figma-canvas-context";

export default function FigmaPrototypePlayer() {
  const { isPresenting, setIsPresenting } = useFigmaCanvas();
  const [currentScreen, setCurrentScreen] = useState<
    "signup" | "filter" | "explore"
  >("signup");
  const [showHotspotHint, setShowHotspotHint] = useState(false);
  const [transitionDir, setTransitionDir] = useState<"forward" | "back">(
    "forward",
  );

  // Filter state inside player
  const [selectedCity, setSelectedCity] = useState("Amsterdam");
  const [roomType, setRoomType] = useState<"entire" | "room">("entire");
  const [priceMax, setPriceMax] = useState(850);

  if (!isPresenting) return null;

  const navigateTo = (
    screen: "signup" | "filter" | "explore",
    dir: "forward" | "back" = "forward",
  ) => {
    setTransitionDir(dir);
    setCurrentScreen(screen);
  };

  const handleBackgroundClick = () => {
    setShowHotspotHint(true);
    setTimeout(() => setShowHotspotHint(false), 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Figma Prototype Player"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top Player Chrome */}
      <div className="flex w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-3 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">
            Figma Prototype Player
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            iPhone 13 &amp; 14 · Flow 1: Sign Up ➔ Filter ➔ Explore
          </span>
          <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-400 border border-cyan-800/60">
            Current: {currentScreen.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("signup", "back")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPresenting(false)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60"
          >
            <X className="h-3.5 w-3.5" />
            <span>Close (Esc)</span>
          </button>
        </div>
      </div>

      {/* Device Viewport Stage */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Prototype backdrop for hotspot hints */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click handler for visual hint */}
      <div
        onClick={handleBackgroundClick}
        className="flex flex-1 w-full items-center justify-center p-8 overflow-hidden"
      >
        <div className="relative h-[780px] w-[360px] overflow-hidden rounded-[40px] border-4 border-slate-700 bg-white text-slate-900 shadow-2xl shadow-black flex flex-col">
          {/* iOS Status Bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-black select-none">
            <span>9:41 AM</span>
            <div className="flex items-center gap-1.5 text-slate-900">
              {/* Cellular Bars */}
              <svg
                className="h-2.5 w-4"
                viewBox="0 0 18 12"
                fill="currentColor"
              >
                <title>Cellular Signal</title>
                <rect x="1" y="9" width="2.5" height="3" rx="0.5" />
                <rect x="5" y="6" width="2.5" height="6" rx="0.5" />
                <rect x="9" y="3" width="2.5" height="9" rx="0.5" />
                <rect x="13" y="0" width="2.5" height="12" rx="0.5" />
              </svg>
              {/* WiFi */}
              <svg
                className="h-2.5 w-3.5"
                viewBox="0 0 16 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <title>Wi-Fi</title>
                <path d="M1 3.5C4.8 0 11.2 0 15 3.5" />
                <path d="M3.5 6.5C6 4.3 10 4.3 12.5 6.5" />
                <circle cx="8" cy="10" r="1.2" fill="currentColor" />
              </svg>
              {/* Battery */}
              <svg
                className="h-2.5 w-5"
                viewBox="0 0 24 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <title>Battery</title>
                <rect x="1" y="1" width="19" height="10" rx="3" />
                <rect
                  x="3"
                  y="3"
                  width="12"
                  height="6"
                  rx="1.5"
                  fill="currentColor"
                />
                <path d="M22 4.5v3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Screen Content Container with transitions */}
          <div className="relative flex-1 overflow-y-auto flex flex-col">
            {/* ── Screen 1: Sign Up ─────────────────────────────── */}
            {currentScreen === "signup" && (
              <div
                className={`flex-1 px-6 pt-10 pb-8 flex flex-col justify-between ${
                  transitionDir === "forward"
                    ? "animate-in slide-in-from-right duration-250"
                    : "animate-in slide-in-from-left duration-250"
                }`}
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-2">
                    Sign Up
                  </h1>
                  <p className="text-xs text-slate-500 mb-8">
                    Welcome to UIForge Travel. Create an account to explore.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Email
                      </span>
                      <input
                        type="email"
                        defaultValue="alex.designer@uiforge.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-xs focus:ring-2 focus:ring-[#0d99ff]"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Password
                      </span>
                      <input
                        type="password"
                        defaultValue="••••••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-xs focus:ring-2 focus:ring-[#0d99ff]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo("filter", "forward");
                    }}
                    className={`w-full rounded-xl bg-slate-950 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-900 active:scale-98 flex items-center justify-center gap-2 ${
                      showHotspotHint
                        ? "ring-4 ring-[#0d99ff] ring-offset-2"
                        : ""
                    }`}
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-3">
                    Click Sign Up to trigger workflow link to Filter Screen
                  </p>
                </div>
              </div>
            )}

            {/* ── Screen 2: Filter (Figma Upload Reference) ─────── */}
            {currentScreen === "filter" && (
              <div
                className={`flex-1 px-5 pt-4 pb-6 flex flex-col justify-between ${
                  transitionDir === "forward"
                    ? "animate-in slide-in-from-right duration-250"
                    : "animate-in slide-in-from-left duration-250"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo("signup", "back");
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Close Filter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Reset
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-[#1c1b1f]">
                    Filter
                  </h1>

                  {/* Location Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      placeholder="Search destination"
                      className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none"
                    />
                  </div>

                  {/* Price Range */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                      <span>Price range</span>
                      <span className="font-mono text-[#0d99ff]">
                        ${priceMax} / night
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={2000}
                      value={priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className="w-full accent-[#0d99ff]"
                    />
                  </div>

                  {/* Room Type */}
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block mb-2">
                      Type of place
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomType("entire");
                        }}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold border ${
                          roomType === "entire"
                            ? "bg-slate-950 text-white border-slate-950"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Entire place
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomType("room");
                        }}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold border ${
                          roomType === "room"
                            ? "bg-slate-950 text-white border-slate-950"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Private room
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo("explore", "forward");
                    }}
                    className={`w-full rounded-xl bg-[#0d99ff] py-3.5 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-600 active:scale-98 flex items-center justify-center gap-2 ${
                      showHotspotHint
                        ? "ring-4 ring-cyan-400 ring-offset-2"
                        : ""
                    }`}
                  >
                    <span>Apply Filter</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Explore</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Screen 3: Explore ─────────────────────────────── */}
            {currentScreen === "explore" && (
              <div
                className={`flex-1 px-5 pt-4 pb-6 flex flex-col justify-between ${
                  transitionDir === "forward"
                    ? "animate-in slide-in-from-right duration-250"
                    : "animate-in slide-in-from-left duration-250"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo("filter", "back");
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </button>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      32 Places found
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {selectedCity}
                  </h1>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                      <div className="h-28 w-full rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 mb-2 flex items-end p-2.5 text-white font-bold text-xs">
                        Canal View Boutique Hotel
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          Central Canal Ring
                        </span>
                        <span className="font-bold text-[#0d99ff]">
                          ${Math.min(priceMax, 420)} / night
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                      <div className="h-28 w-full rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 mb-2 flex items-end p-2.5 text-white font-bold text-xs">
                        Modern Heritage Loft
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          Jordaan District
                        </span>
                        <span className="font-bold text-[#0d99ff]">
                          ${Math.min(priceMax, 580)} / night
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo("filter", "back");
                    }}
                    className="w-full rounded-xl border border-slate-300 py-3 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Filter</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="flex justify-center pb-2 pt-1 pointer-events-none">
            <div className="h-1 w-32 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
