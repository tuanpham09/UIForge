import { expect, test } from "@playwright/test";

test("web shell renders all canonical responsive viewports", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Canonical UI Schema → Editor + Preview",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("renderer-preview")).toBeVisible();
  await expect(page.getByTestId("renderer-diagnostics")).toContainText(
    "Preview transition → screen.mobile-list",
  );
  await expect(page.getByTestId("uiforge-editor-canvas")).toBeVisible();
  await expect(page.getByTestId("editor-projection-status")).toHaveText(
    "3 nodes · 1 flow projection",
  );
  await expect(page).toHaveTitle("UIForge");

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
