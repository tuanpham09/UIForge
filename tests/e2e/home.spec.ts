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

  await page.route("**/api/agent/design", async (route) => {
    const request = route.request().postDataJSON() as {
      document: { screens: Array<{ id: string; rootNodeId: string }> };
    };
    const screen = request.document.screens[0];
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
              type: "CreateNode",
              commandId: "command.e2e.hero",
              node: {
                id: "node.e2e.hero",
                screenId: screen.id,
                parentId: screen.rootNodeId,
                childrenIds: [],
                type: "section",
                layout: { mode: "stack", direction: "column" },
                content: { label: "Expense overview" },
              },
            },
          ],
          summary: "Create the initial expense overview wireframe.",
          preview: ["Create section node.e2e.hero"],
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

  await page.getByTestId("generate-initial-wireframe").click();
  await expect(page.getByTestId("agent-chat-input")).toHaveValue(
    /Build the initial product flow/,
  );
  await page.getByTestId("agent-chat-send").click();

  await expect(page.getByTestId("agent-proposal")).toBeVisible();
  await expect(page.getByTestId("agent-proposal")).toContainText(
    "Create the initial expense overview wireframe.",
  );
  await expect(page.getByText(/deterministic mutation rule/i)).toHaveCount(0);
});
