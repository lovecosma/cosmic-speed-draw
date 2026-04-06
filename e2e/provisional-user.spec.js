import { test, expect, request as apiRequest } from '@playwright/test'

async function createProvisionalSession(request) {
  const res = await request.post('/api/provisional_sessions')
  expect(res.status()).toBe(201)

  const body = await res.json()
  const setCookie = res.headers()['set-cookie'] ?? ''
  const jwtMatch = setCookie.match(/jwt_token=([^;]+)/)
  expect(jwtMatch).not.toBeNull()

  return { id: body.user.id, jwt: jwtMatch[1] }
}

async function createFreshProvisionalSession(baseURL) {
  const freshRequest = await apiRequest.newContext({ baseURL })

  try {
    return await createProvisionalSession(freshRequest)
  } finally {
    await freshRequest.dispose()
  }
}

async function addJwtCookie(page, jwt, baseURL) {
  await page.context().addCookies([
    {
      name: 'jwt_token',
      value: jwt,
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

function cookieValue(cookies, name) {
  return cookies.find((cookie) => cookie.name === name)?.value
}

test.describe('provisional session', () => {
  test('creates a new provisional session on first visit', async ({ request }) => {
    const res = await request.post('/api/provisional_sessions')

    expect(res.status()).toBe(201)

    const body = await res.json()
    expect(body.user.provisional).toBe(true)
    expect(body.user.email).toBeNull()
    expect(body.user.id).toBeDefined()
  })

  test('bootstraps a provisional user in a cold browser session', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL

    await page.goto('/home')

    await expect(page.getByText("You're browsing as a guest.")).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign up to save your work' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in' })).toBeVisible()

    const cookies = await page.context().cookies(baseURL)
    expect(cookieValue(cookies, 'jwt_token')).toBeTruthy()
  })

  test('sets an HttpOnly jwt_token cookie', async ({ request }) => {
    const res = await request.post('/api/provisional_sessions')

    const setCookie = res.headers()['set-cookie'] ?? ''
    expect(setCookie).toMatch(/jwt_token=/)
    expect(setCookie).toMatch(/httponly/i)
  })

  test('reuses the same provisional user when the JWT cookie is present', async ({ request }) => {
    const first = await request.post('/api/provisional_sessions')
    const firstBody = await first.json()

    const second = await request.post('/api/provisional_sessions')
    expect(second.status()).toBe(200)

    const secondBody = await second.json()
    expect(secondBody.user.id).toBe(firstBody.user.id)
  })

  test('creates a fresh provisional user when no cookie is present', async ({ request }, testInfo) => {
    const first = await request.post('/api/provisional_sessions')
    const firstBody = await first.json()

    const freshRequest = await apiRequest.newContext({ baseURL: testInfo.project.use.baseURL })

    try {
      const second = await freshRequest.post('/api/provisional_sessions')
      expect(second.status()).toBe(201)

      const secondBody = await second.json()
      expect(secondBody.user.id).not.toBe(firstBody.user.id)
    } finally {
      await freshRequest.dispose()
    }
  })

  test('falls back to a fresh provisional session when the browser has an invalid JWT', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL

    await addJwtCookie(page, 'not.a.valid.token', baseURL)
    await page.goto('/home')

    await expect(page.getByText("You're browsing as a guest.")).toBeVisible()

    const cookies = await page.context().cookies(baseURL)
    expect(cookieValue(cookies, 'jwt_token')).toBeTruthy()
    expect(cookieValue(cookies, 'jwt_token')).not.toBe('not.a.valid.token')
  })

  test('provisional JWT is rejected by authenticated endpoints', async ({ request }) => {
    await request.post('/api/provisional_sessions')

    const res = await request.get('/api/user')
    expect(res.status()).toBe(401)
  })
})

test.describe('provisional user → real user migration on sign up', () => {
  test('sign up migrates the provisional session to the new account', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-migrate-signup-${Date.now()}@example.com`
    const { jwt } = await createFreshProvisionalSession(baseURL)

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/signup')
    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill('password123')
    await page.locator('#signup-password-confirmation').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })

  test('sign up returns a non-provisional user', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-nonprovisional-signup-${Date.now()}@example.com`
    const { jwt } = await createFreshProvisionalSession(baseURL)

    let signUpResponseBody
    await page.route('/api/users', async (route) => {
      const res = await route.fetch()
      signUpResponseBody = await res.json()
      await route.fulfill({ response: res })
    })

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/signup')
    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill('password123')
    await page.locator('#signup-password-confirmation').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    expect(signUpResponseBody.user.provisional).toBe(false)
    expect(signUpResponseBody.user.email).toBe(email)
  })

  test('sign up replaces the provisional session with a persistent real session', async ({ page, request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-signup-persist-${Date.now()}@example.com`
    const { jwt } = await createFreshProvisionalSession(baseURL)

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/signup')
    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill('password123')
    await page.locator('#signup-password-confirmation').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()

    const cookies = await page.context().cookies(baseURL)
    expect(cookieValue(cookies, 'jwt_token')).toBeTruthy()
    expect(cookieValue(cookies, 'refresh_token')).toBeTruthy()
    expect(cookieValue(cookies, 'jwt_token')).not.toBe(jwt)

    await page.reload()
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()

    const staleRes = await request.get('/api/user', {
      headers: { Cookie: `jwt_token=${jwt}` },
    })
    expect(staleRes.status()).toBe(401)
  })
})

test.describe('provisional user → real user migration on sign in', () => {
  test('sign in migrates the provisional session to the existing account', async ({ page, request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-migrate-signin-${Date.now()}@example.com`

    await request.post('/api/users', {
      data: { user: { email, password: 'password123', password_confirmation: 'password123' } },
    })

    const { jwt } = await createFreshProvisionalSession(baseURL)

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/login')
    await page.locator('#login-email').fill(email)
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()
  })

  test('sign in returns a non-provisional user', async ({ page, request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-signin-nonprovisional-${Date.now()}@example.com`

    await request.post('/api/users', {
      data: { user: { email, password: 'password123', password_confirmation: 'password123' } },
    })

    const { jwt } = await createFreshProvisionalSession(baseURL)

    let signInResponseBody
    await page.route('/api/users/sign_in', async (route) => {
      const res = await route.fetch()
      signInResponseBody = await res.json()
      await route.fulfill({ response: res })
    })

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/login')
    await page.locator('#login-email').fill(email)
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/home$/)
    expect(signInResponseBody.user.provisional).toBe(false)
    expect(signInResponseBody.user.email).toBe(email)
  })

  test('sign in replaces the provisional session with a persistent real session', async ({ page, request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-revoke-signin-${Date.now()}@example.com`

    await request.post('/api/users', {
      data: { user: { email, password: 'password123', password_confirmation: 'password123' } },
    })

    const { jwt } = await createFreshProvisionalSession(baseURL)

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/login')
    await page.locator('#login-email').fill(email)
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()

    const cookies = await page.context().cookies(baseURL)
    expect(cookieValue(cookies, 'jwt_token')).toBeTruthy()
    expect(cookieValue(cookies, 'refresh_token')).toBeTruthy()
    expect(cookieValue(cookies, 'jwt_token')).not.toBe(jwt)

    await page.reload()
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()

    const staleRes = await request.get('/api/user', {
      headers: { Cookie: `jwt_token=${jwt}` },
    })
    expect(staleRes.status()).toBe(401)
  })
})

test.describe('real user sign out after provisional upgrade', () => {
  test('sign out returns the browser to a fresh provisional session', async ({ page, request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    const email = `e2e-provisional-signout-${Date.now()}@example.com`
    const { jwt } = await createFreshProvisionalSession(baseURL)

    await addJwtCookie(page, jwt, baseURL)

    await page.goto('/signup')
    await page.locator('#signup-email').fill(email)
    await page.locator('#signup-password').fill('password123')
    await page.locator('#signup-password-confirmation').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible()

    await page.getByRole('navigation').getByRole('button', { name: 'Sign out' }).click()

    await expect(page).toHaveURL(/\/home$/)
    await expect(page.getByText("You're browsing as a guest.")).toBeVisible()

    const cookies = await page.context().cookies(baseURL)
    const newJwt = cookieValue(cookies, 'jwt_token')
    expect(newJwt).toBeTruthy()
    expect(newJwt).not.toBe(jwt)
    expect(cookieValue(cookies, 'refresh_token')).toBeFalsy()

    const userRes = await request.get('/api/user', {
      headers: { Cookie: `jwt_token=${newJwt}` },
    })
    expect(userRes.status()).toBe(401)
  })
})
