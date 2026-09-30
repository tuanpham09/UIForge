import { expect, test } from "@playwright/test";

test("web shell renders the canonical editor projection", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Canonical UI Schema → tldraw" }),
  ).toBeVisible();
  await expect(page.getByTestId("uiforge-editor-canvas")).toBeVisible();
  await expect(page.getByTestId("editor-projection-status")).toHaveText(
    "3 nodes · 1 flow projection",
  );
  await expect(page).toHaveTitle("UIForge");
});
