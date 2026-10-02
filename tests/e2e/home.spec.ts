import { expect, test } from "@playwright/test";

test("web shell renders the primary semantic canvas workspace", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();
  await expect(page.getByTestId("renderer-preview")).toBeVisible();
  await expect(page.getByTestId("renderer-diagnostics")).toContainText(
    "Preview transition → screen.mobile-list",
  );
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
  await expect(page.getByLabel("Viewport zoom")).toHaveValue("100");

  await expect(page.getByTestId("responsive-validation")).toBeVisible();

  await expect(page.getByTestId("design-stage-switcher")).toBeVisible();
  await expect(page.getByTestId("design-ui")).toBeEnabled();
  await page.getByTestId("design-ui").click();
  await expect(page.getByTestId("design-ui")).toBeDisabled();
  await expect(page.getByText("Editable visual design")).toBeVisible();
  await page.screenshot({
    path: "artifacts/editor/issue-48-visual-design.png",
    fullPage: true,
  });

  await page.getByTestId("present-button").click();
  await expect(page.getByTestId("prototype-runner")).toBeVisible();
  await expect(page.getByTestId("prototype-runner")).toContainText("Visual Design");
  await page.getByTestId("prototype-runner").getByRole("button", { name: "✕ Exit" }).click();
  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();

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
