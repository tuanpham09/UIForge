import { expect, test } from "@playwright/test";

test("project-first production flow starts from real product intent", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("project-dashboard")).toBeVisible();
  await expect(page.getByText("No projects yet")).toBeVisible();

  await page.getByTestId("create-project").click();
  await page.getByTestId("project-name").fill("E2E Expense App");
  await page
    .getByTestId("project-description")
    .fill(
      "An expense management app for tracking spending and understanding monthly cash flow.",
    );
  await page
    .getByTestId("project-features")
    .fill(
      "Expenses, categories, monthly reports, dashboard and navigation flows.",
    );
  await page.getByTestId("create-project-submit").click();

  await expect(page.getByTestId("project-bootstrap")).toBeVisible();
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "E2E Expense App",
  );
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "real empty semantic document",
  );

  await page.getByTestId("start-agent-workspace").click();

  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();
  await expect(page.getByTestId("agent-design-chat")).toBeVisible();
  await expect(page.getByTestId("generate-initial-wireframe")).toBeVisible();

  // The production project must not be seeded with the old dashboard fixture.
  await expect(page.getByText("Dashboard")).toHaveCount(0);
  await expect(page.getByText("Mobile List")).toHaveCount(0);

  await page.getByRole("button", { name: "⚙ AI" }).click();
  await expect(page.getByTestId("agent-settings-modal")).toBeVisible();
  await expect(page.getByTestId("agent-api-key")).toBeVisible();
  await expect(page.getByTestId("agent-model")).toBeVisible();
  await expect(page.getByTestId("agent-base-url")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("agent-settings-modal")).toBeHidden();
});
