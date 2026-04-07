import { test, expect } from "@playwright/test";
import { cookieValue } from "./helpers.js";

async function signUp(page, email, password = "password123") {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-password-confirmation").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function signIn(page, email, password = "password123") {
  await page.goto("/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("authentication", () => {
  test("user can sign up, restore the session, sign out, and sign back in", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = "password123";

    await test.step("sign up", async () => {
      await signUp(page, email, password);

      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    });

    await test.step("session restore on reload", async () => {
      await page.reload();
      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    });

    await test.step("sign out returns to guest state", async () => {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: "Sign out" })
        .click();
      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText("You're browsing as a guest.")).toBeVisible();
    });

    await test.step("sign back in", async () => {
      await signIn(page, email, password);

      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    });
  });

  test("sign up issues persistent auth cookies and survives reload", async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL;
    const email = `e2e-signup-persist-${Date.now()}@example.com`;

    await signUp(page, email);

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    const cookies = await page.context().cookies(baseURL);
    expect(cookieValue(cookies, "jwt_token")).toBeTruthy();
    expect(cookieValue(cookies, "refresh_token")).toBeTruthy();

    await page.reload();
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  });

  test("sign in issues persistent auth cookies and survives reload", async ({
    page,
    request,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL;
    const email = `e2e-signin-persist-${Date.now()}@example.com`;

    await request.post("/api/users", {
      data: {
        user: {
          email,
          password: "password123",
          password_confirmation: "password123",
        },
      },
    });

    await signIn(page, email);

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    const cookies = await page.context().cookies(baseURL);
    expect(cookieValue(cookies, "jwt_token")).toBeTruthy();
    expect(cookieValue(cookies, "refresh_token")).toBeTruthy();

    await page.reload();
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  });

  test("real users are redirected away from guest-only routes", async ({
    page,
  }) => {
    const email = `e2e-guest-redirect-${Date.now()}@example.com`;

    await signUp(page, email);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  });

  test("sign in shows an error for invalid credentials and leaves the user signed out", async ({
    page,
    request,
  }) => {
    const email = `e2e-invalid-login-${Date.now()}@example.com`;

    await request.post("/api/users", {
      data: {
        user: {
          email,
          password: "password123",
          password_confirmation: "password123",
        },
      },
    });

    await signIn(page, email, "wrong-password");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("sign up shows validation errors for duplicate email and does not navigate away", async ({
    page,
    request,
  }) => {
    const email = `e2e-duplicate-${Date.now()}@example.com`;

    await request.post("/api/users", {
      data: {
        user: {
          email,
          password: "password123",
          password_confirmation: "password123",
        },
      },
    });

    await signUp(page, email);

    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText("Email has already been taken")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });
});
