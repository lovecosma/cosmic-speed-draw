import { test, expect } from "@playwright/test";

async function signUp(page, email, password = "password123") {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-password-confirmation").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/drawings$/);
}

async function createDrawing(page) {
  const res = await page.request.post("/api/drawings");
  const { id } = await res.json();
  return id;
}

async function drawOnCanvas(page) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 60, { steps: 10 });
  await page.mouse.up();
}

function waitForInk(page) {
  return page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return false;
    const { data } = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) return true;
    }
    return false;
  });
}

test.describe("drawing editor", () => {
  let drawingId;

  test.beforeEach(async ({ page }) => {
    const email = `e2e-drawing-page-${Date.now()}@example.com`;
    await signUp(page, email);
    drawingId = await createDrawing(page);
    await page.goto(`/drawings/${drawingId}`);
  });

  test("shows the canvas", async ({ page }) => {
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("shows the Pen button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Pen" })).toBeVisible();
  });

  test("shows the Eraser button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Eraser" })).toBeVisible();
  });

  test("shows the Clear button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
  });

  test("shows the Delete button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("drawing on the canvas shows 'Saved' after the autosave delay", async ({
    page,
  }) => {
    await drawOnCanvas(page);
    await expect(page.getByText("Saved")).toBeVisible();
  });

  test("canvas content is restored after page reload", async ({ page }) => {
    await drawOnCanvas(page);
    await expect(page.getByText("Saved")).toBeVisible();

    await page.reload();

    await waitForInk(page);
  });

  test("reloading stays on the same drawing URL", async ({ page }) => {
    const urlBefore = page.url();
    await page.reload();
    expect(page.url()).toBe(urlBefore);
  });

  test("clear wipes the canvas", async ({ page }) => {
    await drawOnCanvas(page);
    await expect(page.getByText("Saved")).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();

    const allWhite = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const { data } = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255)
          return false;
      }
      return true;
    });

    expect(allWhite).toBe(true);
  });

  test("clear triggers autosave", async ({ page }) => {
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Saved")).toBeVisible();
  });

  test("delete shows an inline confirmation", async ({ page }) => {
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Delete?")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Yes, delete" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("cancelling delete restores the Delete button", async ({ page }) => {
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Delete?")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("confirming delete navigates to the drawings index", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();

    await expect(page).toHaveURL(/\/drawings$/);
  });

  test("deleted drawing no longer appears on the index", async ({ page }) => {
    await drawOnCanvas(page);
    await expect(page.getByText("Saved")).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();

    await expect(page).toHaveURL(/\/drawings$/);
    await expect(page.locator("img")).toHaveCount(0);
  });
});
