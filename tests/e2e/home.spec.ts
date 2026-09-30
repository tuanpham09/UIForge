import { expect, test } from "@playwright/test";

test("web shell renders deterministic preview and editor projection", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Canonical UI Schema → Editor + Preview",
    }),
  ).toBeVisible();

  await expect(page.getByTestId("renderer-preview")).toBeVisible();
  await expect(page.getByTestId("renderer-viewport")).toHaveText("1440×900");
  await expect(page.getByTestId("renderer-diagnostics")).toContainText(
    "Preview transition → screen.mobile-list",
  );

  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.getByTestId("renderer-viewport")).toHaveText("390×844");
  await expect(page.getByTestId("renderer-preview")).toHaveAttribute(
    "data-viewport",
    "mobile",
  );

  await expect(page.getByTestId("uiforge-editor-canvas")).toBeVisible();
  await expect(page.getByTestId("editor-projection-status")).toHaveText(
    "3 nodes · 1 flow projection",
  );
  await expect(page).toHaveTitle("UIForge");

  await expect(page).toHaveScreenshot("renderer-preview-desktop-mobile.png", {
    fullPage: true,
  });
});
