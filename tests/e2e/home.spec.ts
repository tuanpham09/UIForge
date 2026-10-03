import { expect, test } from "@playwright/test";

test("project dashboard creates an AI-first project and opens the workspace", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("project-dashboard")).toBeVisible();
  await expect(page.getByTestId("create-project")).toBeVisible();
  await page.getByTestId("create-project").click();
  await expect(page.getByTestId("create-project-modal")).toBeVisible();
  await page.getByTestId("project-name").fill("E2E Expense App");
  await page
    .getByTestId("project-description")
    .fill(\n      "An expense management app for tracking spending and understanding monthly cash flow.",
    );
  await page
    .getByTestId("project-features")
    .fill(\n      "Expenses, categories, monthly reports, dashboard and navigation flows.",
    );
  await page.getByTestId("create-project-submit").click();
  await expect(page.getByTestId("project-bootstrap")).toBeVisible();
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "E2E Expense App",
  );
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "Understand intent",
  );
  await page.getByTestId("start-agent-workspace").click();

  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();
  await expect(page.getByTestId("uiforge-editor-workspace")).toHaveAttribute(
    "data-client-ready",
    "true",
  );
  await page.getByTestId("preview-button").click();
  await expect(page.getByTestId("renderer-preview")).toBeVisible();
  await expect(page.getByTestId("renderer-diagnostics")).toContainText(
    "Preview transition → screen.mobile-list",
  );
  await page
    .getByRole("dialog", { name: "Renderer preview" })
    .getByRole("button", { name: "✕ Close" })
    .click();
  await expect(page.getByTestId("renderer-preview")).toBeHidden();
  await expect(page).toHaveTitle("UIForge");

  await expect(page.getByTestId("semantic-inspector")).toBeVisible();
  await expect(
    page.getByText("Select a Frame, Section, Component or Layer"),
  ).toBeVisible();
  await expect(page.getByText("LAYERS")).toBeVisible();

  await page.locator("summary").filter({ hasText: "Frame +" }).click();
  const menu = page.getByTestId("frame-preset-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("iPhone 13 / 13 Pro")).toBeVisible();
  await expect(menu.getByText("Desktop 1440")).toBeVisible();

  await page.getByTestId("device-preset-trigger").click();
  const deviceMenu = page.getByTestId("responsive-device-preview");
  await expect(deviceMenu.getByText("iPhone 14 / 14 Pro")).toBeVisible();
  await expect(deviceMenu.getByText("iPhone 18 / 18 Pro")).toBeVisible();

  await page.getByTestId("device-preset-trigger").click();
  await page.locator("summary").filter({ hasText: "Frame +" }).click();

  await expect(page.getByTestId("viewport-orientation")).toContainText(
    "Portrait",
  );
  await expect(page.getByLabel("Viewport zoom")).toHaveValue(/^(50|100)$/);

  await expect(page.getByTestId("responsive-validation")).toBeVisible();

  await expect(page.getByTestId("design-chat-toggle")).toBeVisible();
  await page.getByTestId("design-chat-toggle").click();
  await expect(page.getByTestId("agent-design-chat")).toBeVisible();
  await page.getByTestId("agent-chat-input").fill("add button");
  await page.getByTestId("agent-chat-send").click();
  await expect(page.getByTestId("agent-proposal")).toContainText(
    "Add a button",
  );
  await page.getByTestId("agent-reject").click();
  await expect(page.getByTestId("agent-proposal")).toBeHidden();
  await page.getByTestId("agent-chat-input").fill("add button");
  await page.getByTestId("agent-chat-send").click();
  await expect(page.getByTestId("agent-proposal")).toBeVisible();
  await page.getByTestId("agent-apply").click();
  await expect(page.getByTestId("agent-proposal")).toContainText(
    "Applied to UI Schema.",
  );
  await page.getByRole("button", { name: "Close Design Chat" }).click();

  await expect(page.getByTestId("design-stage-switcher")).toBeVisible();
  await expect(page.getByTestId("design-ui")).toBeEnabled();
  await page.getByTestId("design-ui").click();
  await expect(page.getByTestId("design-stage-status")).not.toContainText(
    "Design error:",
  );
  await expect(page.getByText("Editable visual design")).toBeVisible();
  await expect(page.getByTestId("design-ui")).toBeDisabled();

  await page
    .getByRole("button", { name: /Open details/ })
    .first()
    .click();
  await page.getByTestId("ask-uiforge").click();
  await expect(page.getByTestId("contextual-ai-menu")).toBeVisible();
  await expect(page.getByTestId("contextual-ai-menu")).toContainText(
    "Improve hierarchy",
  );
  await page.getByRole("button", { name: "Improve hierarchy" }).click();

  await page.screenshot({
    path: "artifacts/editor/issue-48-visual-design.png",
    fullPage: true,
  });

  await page.getByTestId("present-button").click();
  await expect(page.getByTestId("prototype-runner")).toBeVisible();
  await expect(page.getByTestId("prototype-runner")).toContainText(
    "Visual Design",
  );
  await page.screenshot({
    path: "artifacts/editor/issue-55-prototype-runner.png",
    fullPage: true,
  });
  await page.getByTestId("hotspot-hint").click();
  await expect(page.getByTestId("hotspot-hint")).toContainText("Hotspots on");

  const runner = page.getByTestId("prototype-runner");
  await runner.getByRole("button", { name: "Open details" }).click();
  await expect(runner).toContainText("Mobile List");
  await page.screenshot({
    path: "artifacts/editor/issue-48-prototype-runner.png",
    fullPage: true,
  });
  await runner.getByRole("button", { name: "← Back" }).click();
  await expect(runner).toContainText("Dashboard");

  await runner.getByRole("button", { name: "✕ Exit" }).click();
  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();

  await page.getByTestId("preview-button").click();
  await expect(page.getByTestId("renderer-preview")).toBeVisible();

  await page.screenshot({
    path: "artifacts/responsive/issue-47-device-preview.png",
    fullPage: true,
  });

  await page.screenshot({
    path: "artifacts/editor/issue-46-workspace.png",
    fullPage: true,
  });

  const viewports = [
    ["wide", "1440×900"],
    ["desktop", "1024×768"],
    ["tablet", "768×1024"],
    ["mobile", "390×844"],
  ] as const;

  for (const [preset, label] of viewports) {
    await page.getByTestId(`viewport-${preset}`).click();
    await expect(page.getByTestId("renderer-viewport")).toHaveText(label);
    await page.getByTestId("renderer-preview").screenshot({
      path: `artifacts/responsive/viewport-${label.replace("×", "x")}.png`,
    });
  }
});
