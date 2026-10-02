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
