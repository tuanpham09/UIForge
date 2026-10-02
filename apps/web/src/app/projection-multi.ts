import {
  dashboardFixture,
  loginFixture,
  mobileListFixture,
} from "@uiforge/ui-schema";
import { createShapeId, type TLShapePartial, toRichText } from "tldraw";

export interface MultiScreenCanvasData {
  shapes: TLShapePartial[];
  screenCount: number;
  flowCount: number;
  nodeCount: number;
}

/**
 * Builds a Figma-style multi-screen canvas projection containing:
 * 1. Screen Artboard Frames (Login, Dashboard, Mobile List)
 * 2. Nested UI Components (Cards, Inputs, Buttons, Charts, Lists)
 * 3. Workflow Connectors (Curved arrows linking buttons to destination screens)
 */
export function buildMultiScreenWorkspace(): MultiScreenCanvasData {
  const shapes: TLShapePartial[] = [];

  /* ──────────────────────────────────────────────────────────────────────────
   * Screen 1: Login Screen (Mobile Artboard Frame: 360 x 580)
   * ────────────────────────────────────────────────────────────────────────── */
  const S1_X = 60;
  const S1_Y = 80;
  const S1_W = 340;
  const S1_H = 580;

  // Frame Background & Border
  shapes.push({
    id: createShapeId("frame:screen.login"),
    type: "geo",
    x: S1_X,
    y: S1_Y,
    props: {
      w: S1_W,
      h: S1_H,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "m",
    },
    meta: {
      screenId: "screen.login",
      nodeId: loginFixture.screens[0]?.rootNodeId ?? "screen.login.root",
      semanticType: "screen-root",
      title: "Login Screen",
    },
  });

  // Artboard Title Header
  shapes.push({
    id: createShapeId("header:screen.login"),
    type: "geo",
    x: S1_X,
    y: S1_Y - 42,
    props: {
      w: S1_W,
      h: 36,
      geo: "rectangle",
      color: "grey",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("📱 Screen: Login (360×640 Mobile)"),
    },
    meta: { screenId: "screen.login", title: "Login Screen Header" },
  });

  // App Logo / Title
  shapes.push({
    id: createShapeId("login.logo"),
    type: "geo",
    x: S1_X + 20,
    y: S1_Y + 24,
    props: {
      w: S1_W - 40,
      h: 70,
      geo: "rectangle",
      color: "blue",
      fill: "semi",
      dash: "solid",
      size: "m",
      richText: toRichText("🛡️ UIForge Security\nSign in to account"),
    },
    meta: { screenId: "screen.login", semanticType: "section" },
  });

  // Email Field
  shapes.push({
    id: createShapeId("login.email"),
    type: "geo",
    x: S1_X + 20,
    y: S1_Y + 120,
    props: {
      w: S1_W - 40,
      h: 64,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText("✉️ Email Address\nyou@example.com"),
    },
    meta: {
      screenId: "screen.login",
      nodeId: "login.email",
      semanticType: "input",
    },
  });

  // Password Field
  shapes.push({
    id: createShapeId("login.password"),
    type: "geo",
    x: S1_X + 20,
    y: S1_Y + 204,
    props: {
      w: S1_W - 40,
      h: 64,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText("🔒 Password\n••••••••••••"),
    },
    meta: {
      screenId: "screen.login",
      nodeId: "login.password",
      semanticType: "input",
    },
  });

  // Submit Button (Interactive trigger for workflow)
  shapes.push({
    id: createShapeId("login.submit"),
    type: "geo",
    x: S1_X + 20,
    y: S1_Y + 296,
    props: {
      w: S1_W - 40,
      h: 56,
      geo: "rectangle",
      color: "light-blue",
      fill: "solid",
      dash: "solid",
      size: "m",
      richText: toRichText("Sign In ➔"),
    },
    meta: {
      screenId: "screen.login",
      nodeId: "login.submit",
      semanticType: "button",
      targetScreenId: "screen.dashboard",
      trigger: "submit",
      action: "authenticate",
    },
  });

  // Security Note
  shapes.push({
    id: createShapeId("login.note"),
    type: "geo",
    x: S1_X + 20,
    y: S1_Y + 380,
    props: {
      w: S1_W - 40,
      h: 70,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "dotted",
      size: "s",
      richText: toRichText(
        "2FA Protected · TLS 1.3\nRole-Based Access Control",
      ),
    },
    meta: { screenId: "screen.login" },
  });

  /* ──────────────────────────────────────────────────────────────────────────
   * Screen 2: Overview Dashboard (Desktop Artboard Frame: 860 x 580)
   * ────────────────────────────────────────────────────────────────────────── */
  const S2_X = 540;
  const S2_Y = 80;
  const S2_W = 840;
  const S2_H = 580;

  // Frame Background & Border
  shapes.push({
    id: createShapeId("frame:screen.dashboard"),
    type: "geo",
    x: S2_X,
    y: S2_Y,
    props: {
      w: S2_W,
      h: S2_H,
      geo: "rectangle",
      color: "light-blue",
      fill: "none",
      dash: "solid",
      size: "m",
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId:
        dashboardFixture.screens[0]?.rootNodeId ?? "screen.dashboard.root",
      semanticType: "screen-root",
      title: "Overview Dashboard",
    },
  });

  // Artboard Title Header
  shapes.push({
    id: createShapeId("header:screen.dashboard"),
    type: "geo",
    x: S2_X,
    y: S2_Y - 42,
    props: {
      w: S2_W,
      h: 36,
      geo: "rectangle",
      color: "light-blue",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("💻 Screen: Overview Dashboard (1440×900 Desktop)"),
    },
    meta: { screenId: "screen.dashboard", title: "Dashboard Header" },
  });

  // Top Nav Bar
  shapes.push({
    id: createShapeId("dashboard.navbar"),
    type: "geo",
    x: S2_X + 20,
    y: S2_Y + 18,
    props: {
      w: 580,
      h: 50,
      geo: "rectangle",
      color: "grey",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("📊 FinTech Analytics v2 · Overview Dashboard"),
    },
    meta: { screenId: "screen.dashboard", semanticType: "section" },
  });

  // Open Details CTA Button (Interactive trigger for workflow)
  shapes.push({
    id: createShapeId("dashboard.cta"),
    type: "geo",
    x: S2_X + 620,
    y: S2_Y + 18,
    props: {
      w: 200,
      h: 50,
      geo: "rectangle",
      color: "light-blue",
      fill: "solid",
      dash: "solid",
      size: "s",
      richText: toRichText("Open Details ➔"),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.cta",
      semanticType: "button",
      targetScreenId: "screen.mobile-list",
      trigger: "click",
      action: "navigate",
    },
  });

  // KPI 1: Revenue
  shapes.push({
    id: createShapeId("dashboard.metric.revenue"),
    type: "geo",
    x: S2_X + 20,
    y: S2_Y + 86,
    props: {
      w: 250,
      h: 88,
      geo: "rectangle",
      color: "blue",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("Total Revenue\n$39.6K  ▲ +6.2%"),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.metric.revenue",
      semanticType: "card",
    },
  });

  // KPI 2: Active Users
  shapes.push({
    id: createShapeId("dashboard.metric.users"),
    type: "geo",
    x: S2_X + 295,
    y: S2_Y + 86,
    props: {
      w: 250,
      h: 88,
      geo: "rectangle",
      color: "blue",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("Active Users\n18.8K  ▲ +0.59%"),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.metric.users",
      semanticType: "card",
    },
  });

  // KPI 3: Conversion
  shapes.push({
    id: createShapeId("dashboard.metric.conversion"),
    type: "geo",
    x: S2_X + 570,
    y: S2_Y + 86,
    props: {
      w: 250,
      h: 88,
      geo: "rectangle",
      color: "blue",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("Conversion Rate\n$1.2K  ▲ +1.08%"),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.metric.conversion",
      semanticType: "card",
    },
  });

  // Bar Chart Panel
  shapes.push({
    id: createShapeId("dashboard.chart.results"),
    type: "geo",
    x: S2_X + 20,
    y: S2_Y + 192,
    props: {
      w: 480,
      h: 220,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "Monthly Revenue Breakdown\n[ Jan | Feb | Mar | Apr | May | Jun | Jul | Aug ]\nPeak: $42.5K in August",
      ),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.chart.results",
      semanticType: "card",
    },
  });

  // Deal Status Panel
  shapes.push({
    id: createShapeId("dashboard.deals.panel"),
    type: "geo",
    x: S2_X + 520,
    y: S2_Y + 192,
    props: {
      w: 300,
      h: 220,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "Deal Status (32 Active Deals)\n• Maurie Vance: $100.20 (Negotiating)\n• Tetrick Medie: $29.00 (Prospect)\n• Merke Kooler: $23.50 (Closing)",
      ),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.deals.panel",
      semanticType: "card",
    },
  });

  // Table Overview Section
  shapes.push({
    id: createShapeId("dashboard.summary"),
    type: "geo",
    x: S2_X + 20,
    y: S2_Y + 430,
    props: {
      w: 800,
      h: 120,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "Company Overview (4 Records Listed)\nIndexation ($26.05) · IndoSection ($3.53) · Listeization ($9.03) · Breadiozation ($23.35)",
      ),
    },
    meta: {
      screenId: "screen.dashboard",
      nodeId: "dashboard.summary",
      semanticType: "table",
    },
  });

  /* ──────────────────────────────────────────────────────────────────────────
   * Screen 3: Mobile List (Mobile Artboard Frame: 340 x 580)
   * ────────────────────────────────────────────────────────────────────────── */
  const S3_X = 1480;
  const S3_Y = 80;
  const S3_W = 340;
  const S3_H = 580;

  // Frame Background & Border
  shapes.push({
    id: createShapeId("frame:screen.mobile-list"),
    type: "geo",
    x: S3_X,
    y: S3_Y,
    props: {
      w: S3_W,
      h: S3_H,
      geo: "rectangle",
      color: "violet",
      fill: "none",
      dash: "solid",
      size: "m",
    },
    meta: {
      screenId: "screen.mobile-list",
      nodeId:
        mobileListFixture.screens[0]?.rootNodeId ?? "screen.mobile-list.root",
      semanticType: "screen-root",
      title: "Mobile List",
    },
  });

  // Artboard Title Header
  shapes.push({
    id: createShapeId("header:screen.mobile-list"),
    type: "geo",
    x: S3_X,
    y: S3_Y - 42,
    props: {
      w: S3_W,
      h: 36,
      geo: "rectangle",
      color: "violet",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText("📱 Screen: Mobile List (375×812 Mobile)"),
    },
    meta: { screenId: "screen.mobile-list", title: "Mobile List Header" },
  });

  // Search & Filters
  shapes.push({
    id: createShapeId("mobile.search"),
    type: "geo",
    x: S3_X + 20,
    y: S3_Y + 20,
    props: {
      w: S3_W - 40,
      h: 50,
      geo: "rectangle",
      color: "grey",
      fill: "none",
      dash: "solid",
      size: "s",
      richText: toRichText("🔍 Search Transactions..."),
    },
    meta: { screenId: "screen.mobile-list", semanticType: "input" },
  });

  // List Item 1
  shapes.push({
    id: createShapeId("mobile-list.item.1"),
    type: "geo",
    x: S3_X + 20,
    y: S3_Y + 86,
    props: {
      w: S3_W - 40,
      h: 76,
      geo: "rectangle",
      color: "violet",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "🏢 Indexation Inc.\nRevenue: $26.05 · Growth: +4.00%",
      ),
    },
    meta: {
      screenId: "screen.mobile-list",
      nodeId: "mobile-list.item",
      semanticType: "list-item",
    },
  });

  // List Item 2
  shapes.push({
    id: createShapeId("mobile-list.item.2"),
    type: "geo",
    x: S3_X + 20,
    y: S3_Y + 176,
    props: {
      w: S3_W - 40,
      h: 76,
      geo: "rectangle",
      color: "violet",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "🏢 IndoSection Ltd.\nRevenue: $3.53 · Growth: +2.10%",
      ),
    },
    meta: {
      screenId: "screen.mobile-list",
      nodeId: "mobile-list.item",
      semanticType: "list-item",
    },
  });

  // List Item 3
  shapes.push({
    id: createShapeId("mobile-list.item.3"),
    type: "geo",
    x: S3_X + 20,
    y: S3_Y + 266,
    props: {
      w: S3_W - 40,
      h: 76,
      geo: "rectangle",
      color: "violet",
      fill: "semi",
      dash: "solid",
      size: "s",
      richText: toRichText(
        "🏢 Listeization Corp.\nRevenue: $9.03 · Status: Active",
      ),
    },
    meta: {
      screenId: "screen.mobile-list",
      nodeId: "mobile-list.item",
      semanticType: "list-item",
    },
  });

  // Return Button
  shapes.push({
    id: createShapeId("mobile.back.cta"),
    type: "geo",
    x: S3_X + 20,
    y: S3_Y + 470,
    props: {
      w: S3_W - 40,
      h: 54,
      geo: "rectangle",
      color: "grey",
      fill: "solid",
      dash: "solid",
      size: "s",
      richText: toRichText("← Back to Dashboard"),
    },
    meta: {
      screenId: "screen.mobile-list",
      nodeId: "mobile.back.cta",
      semanticType: "button",
      targetScreenId: "screen.dashboard",
      trigger: "click",
      action: "navigate",
    },
  });

  /* ──────────────────────────────────────────────────────────────────────────
   * Prototype Flow Connectors (Interactive Arrows linking Buttons to Screens)
   * ────────────────────────────────────────────────────────────────────────── */

  // Arrow 1: Login "Sign In" Button -> Dashboard Artboard
  // Login button center-right is at: x: S1_X + S1_W - 20 = 380, y: S1_Y + 296 + 28 = 404
  // Target: Dashboard left edge at: x: S2_X = 540, y: S2_Y + 290 = 370
  shapes.push({
    id: createShapeId("flow:login_to_dashboard"),
    type: "arrow",
    x: S1_X + S1_W - 20,
    y: S1_Y + 324,
    props: {
      start: { x: 0, y: 0 },
      end: { x: S2_X - (S1_X + S1_W - 20), y: -30 },
      bend: -25,
      color: "light-blue",
      arrowheadStart: "dot",
      arrowheadEnd: "arrow",
      size: "m",
      richText: toRichText("submit ➔ authenticate ➔ Dashboard"),
    },
    meta: {
      source: "uiforge",
      flowId: "login_to_dashboard",
      sourceNodeId: "login.submit",
      destinationScreenId: "screen.dashboard",
      trigger: "submit",
      action: "authenticate",
    },
  });

  // Arrow 2: Dashboard "Open Details" Button -> Mobile List Artboard
  // Dashboard CTA center-right is at: x: S2_X + 620 + 200 = 1360, y: S2_Y + 18 + 25 = 123
  // Target: Mobile list left edge at: x: S3_X = 1480, y: S3_Y + 45 = 125
  shapes.push({
    id: createShapeId("flow:dashboard_to_mobile_list"),
    type: "arrow",
    x: S2_X + 820,
    y: S2_Y + 43,
    props: {
      start: { x: 0, y: 0 },
      end: { x: S3_X - (S2_X + 820), y: 40 },
      bend: 25,
      color: "violet",
      arrowheadStart: "dot",
      arrowheadEnd: "arrow",
      size: "m",
      richText: toRichText("click ➔ navigate ➔ Mobile List"),
    },
    meta: {
      source: "uiforge",
      flowId: "dashboard_to_mobile_list",
      sourceNodeId: "dashboard.cta",
      destinationScreenId: "screen.mobile-list",
      trigger: "click",
      action: "navigate",
    },
  });

  return {
    shapes,
    screenCount: 3,
    flowCount: 2,
    nodeCount: shapes.length - 2, // minus the 2 arrows
  };
}
