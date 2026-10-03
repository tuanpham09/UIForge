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
  await expect(page).toHaveURL(/\/project\//, { timeout: 15000 });

  await expect(page.getByTestId("project-bootstrap")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "E2E Expense App",
  );
  await expect(page.getByTestId("project-bootstrap")).toContainText(
    "real empty semantic document",
  );

  await page.getByTestId("start-agent-workspace").click();

  await expect(page.getByTestId("uiforge-editor-workspace")).toBeVisible();
  await expect(page.getByTestId("agent-design-chat")).toBeVisible();

  // The production project must not be seeded with the old dashboard fixture.
  await expect(page.getByText("Dashboard")).toHaveCount(0);
  await expect(page.getByText("Mobile List")).toHaveCount(0);

  await page.getByRole("button", { name: "⚙ AI" }).click();
  await expect(page.getByTestId("agent-settings-modal")).toBeVisible();
  await expect(page.getByTestId("agent-api-key")).toBeVisible();
  await expect(page.getByTestId("agent-model")).toBeVisible();
  await expect(page.getByTestId("agent-base-url")).toBeVisible();

  await page.getByRole("button", { name: "Close AI settings" }).click();
  await expect(page.getByTestId("agent-settings-modal")).toBeHidden();
  await expect(page.getByTestId("agent-design-chat")).toBeVisible();

  await page.route("**/api/agent/design", async (route) => {
    const request = route.request().postDataJSON() as {
      document: { screens: Array<{ id: string; rootNodeId: string }> };
    };
    const screen = request.document.screens[0];
    if (!screen) throw new Error("E2E project screen missing");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Generated a semantic product flow proposal for review.",
        plan: {
          goal: "Bootstrap the initial product flow and wireframe.",
          steps: [
            "Inspect project intent",
            "Create screens",
            "Create semantic wireframe",
            "Validate proposal",
          ],
        },
        events: [],
        proposal: {
          id: "proposal.e2e.bootstrap",
          baseRevision: 1,
          commands: [
            {
              type: "CreateScreen",
              commandId: "command.e2e.expenses",
              screen: {
                id: "screen.e2e.expenses",
                name: "Expenses",
                route: "/expenses",
                rootNodeId: "node.e2e.expenses.root",
                nodeIds: ["node.e2e.expenses.root"],
              },
              rootNode: {
                id: "node.e2e.expenses.root",
                screenId: "screen.e2e.expenses",
                parentId: null,
                childrenIds: [],
                type: "screen-root",
                layout: { mode: "stack", direction: "column" },
              },
            },
            {
              type: "CreateNode",
              commandId: "command.e2e.hero",
              node: {
                id: "node.e2e.hero",
                screenId: "screen.e2e.expenses",
                parentId: "node.e2e.expenses.root",
                childrenIds: [],
                type: "card",
                layout: { mode: "stack", direction: "column" },
                content: { label: "Expense overview" },
              },
            },
            {
              type: "CreateNode",
              commandId: "command.e2e.expense-list",
              node: {
                id: "node.e2e.expense-list",
                screenId: "screen.e2e.expenses",
                parentId: "node.e2e.expenses.root",
                childrenIds: [],
                type: "list",
                layout: { mode: "stack", direction: "column" },
                content: { label: "Recent expenses" },
              },
            },
            {
              type: "CreateNode",
              commandId: "command.e2e.add-expense",
              node: {
                id: "node.e2e.add-expense",
                screenId: "screen.e2e.expenses",
                parentId: "node.e2e.expenses.root",
                childrenIds: [],
                type: "button",
                layout: { mode: "flex", direction: "row" },
                content: { label: "Add expense" },
              },
            },
          ],
          summary: "Create the initial expense overview and expense list flow.",
          preview: [
            "Create card node.e2e.hero",
            "Create list node.e2e.expense-list",
            "Create button node.e2e.add-expense",
          ],
          risk: "safe",
          status: "pending",
        },
        status: "completed",
        iterations: 3,
        sessionId: "e2e.bootstrap",
        memory: [],
      }),
    });
  });

  await page
    .getByTestId("agent-chat-input")
    .fill(
      "Build the initial product flow and semantic wireframe for this project.",
    );
  await page.getByTestId("agent-chat-send").click();

  await expect(page.getByTestId("agent-proposal")).toBeVisible();
  await expect(page.getByTestId("agent-proposal")).toContainText(
    "Create the initial expense overview and expense list flow.",
  );
  await expect(page.getByText(/deterministic mutation rule/i)).toHaveCount(0);
  await page.getByTestId("agent-apply").click();
  await expect(page.getByTestId("design-stage-status")).toContainText(
    "Structural wireframe",
  );
  await expect(
    page.getByTestId("canvas").getByText("Expense overview"),
  ).toBeVisible();
  await expect(
    page.getByTestId("canvas").getByText("Recent expenses"),
  ).toBeVisible();
  await expect(
    page.getByTestId("canvas").getByText("Add expense"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Expenses" }).click();

  // Visual design must render the same semantic schema through the real renderer,
  // not merely recolor/project tldraw rectangles.
  await page
    .getByTestId("design-ui")
    .evaluate((element) => (element as HTMLButtonElement).click());
  const designError = page.getByTestId("design-error");
  if (await designError.count()) {
    throw new Error(
      `Design UI failed: ${await designError.first().innerText()}`,
    );
  }
  await expect(page.getByTestId("design-stage-status")).toContainText(
    "Editable visual design",
  );
  await expect(page.getByTestId("visual-design-canvas")).toBeVisible();
  await expect(page.getByTestId("visual-design-frame")).toBeVisible();
  await expect(
    page.getByTestId("visual-design-canvas").getByText("Expense overview"),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("visual-design-canvas")
      .locator('[data-semantic-type="card"]'),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("visual-design-canvas")
      .locator('[data-component-id="uiforge.button"]'),
  ).toHaveCount(1);
});
