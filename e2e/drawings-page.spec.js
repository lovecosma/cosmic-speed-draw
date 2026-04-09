import { test, expect } from "@playwright/test";

async function signUp(page, email, password = "password123") {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-password-confirmation").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/drawings$/);
}

// Creates a drawing with canvas_data so it appears in the index.
async function createSavedDrawing(page) {
  const createRes = await page.request.post("/api/drawings");
  const { id } = await createRes.json();
  await page.request.patch(`/api/drawings/${id}`, {
    data: { drawing: { canvas_data: "data:image/png;base64,iVBORw0KGgo=" } },
  });
  return id;
}

test.describe("drawings index", () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-drawings-${Date.now()}@example.com`;
    await signUp(page, email);
  });

  test("shows the page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "My Drawings" }),
    ).toBeVisible();
  });

  test("shows the New Drawing button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "New Drawing" }),
    ).toBeVisible();
  });

  test("shows no drawing tiles when the user has no saved drawings", async ({
    page,
  }) => {
    await expect(page.locator("img")).toHaveCount(0);
  });

  test("clicking New Drawing navigates to the drawing editor", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Drawing" }).click();
    await expect(page).toHaveURL(/\/drawings\/\d+$/);
  });

  test("shows a tile for each saved drawing", async ({ page }) => {
    await createSavedDrawing(page);
    await createSavedDrawing(page);
    await page.reload();

    await expect(page.locator("img")).toHaveCount(2);
  });

  test("clicking a drawing tile navigates to that drawing", async ({
    page,
  }) => {
    const id = await createSavedDrawing(page);
    await page.reload();

    await page.locator("img").first().click();

    await expect(page).toHaveURL(new RegExp(`/drawings/${id}$`));
  });

  test("deleting a drawing removes it from the list", async ({ page }) => {
    await createSavedDrawing(page);
    await page.reload();

    await expect(page.locator("img")).toHaveCount(1);

    const tile = page.locator(".group").first();
    await tile.hover();
    await page.getByRole("button", { name: "Delete drawing" }).click();

    await expect(page.locator("img")).toHaveCount(0);
  });

  test("deleting a drawing does not navigate away from the index", async ({
    page,
  }) => {
    await createSavedDrawing(page);
    await page.reload();

    const tile = page.locator(".group").first();
    await tile.hover();
    await page.getByRole("button", { name: "Delete drawing" }).click();

    await expect(page).toHaveURL(/\/drawings$/);
  });

  test("New Drawing button shows 'Creating…' while the request is in flight", async ({
    page,
  }) => {
    await page.route("/api/drawings", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await page.getByRole("button", { name: "New Drawing" }).click();
    await expect(page.getByText("Creating…")).toBeVisible();
  });
});
