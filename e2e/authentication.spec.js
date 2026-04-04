import { test, expect } from '@playwright/test'

test('user can sign up, restore the session, sign out, and sign back in', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const password = 'password123'

  await test.step('sign up', async () => {
    await page.goto('/signup')
    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill(password)
    await page.locator('#signup-password-confirmation').fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })

  await test.step('session restore on reload', async () => {
    await page.reload()
    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })

  await test.step('sign out', async () => {
    await page.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  await test.step('sign back in', async () => {
    await page.locator('#login-email').fill(email)
    await page.locator('#login-password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })
})
