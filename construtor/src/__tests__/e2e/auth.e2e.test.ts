import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.describe('Home Page', () => {
    test('should render home page with auth links', async ({ page }) => {
      await page.goto('/')

      await expect(page.locator('text=Construtor')).toBeVisible()
      await expect(page.locator('text=Entrar')).toBeVisible()
      await expect(page.locator('text=Começar Grátis')).toBeVisible()
    })

    test('should render editor button', async ({ page }) => {
      await page.goto('/')

      const editorButton = page.locator('text=Abrir Editor')
      await expect(editorButton).toBeVisible()
    })

    test('should show features on home page', async ({ page }) => {
      await page.goto('/')

      await expect(page.locator('text=Texto → Landing')).toBeVisible()
      await expect(page.locator('text=IA Gera Conteúdo')).toBeVisible()
      await expect(page.locator('text=Publica em 1 clique')).toBeVisible()
    })

    test('should render footer', async ({ page }) => {
      await page.goto('/')

      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
      await expect(footer.locator('text=2026 Construtor')).toBeVisible()
    })
  })

  test.describe('Signup Page', () => {
    test('should navigate to signup from home', async ({ page }) => {
      await page.goto('/')
      await page.locator('text=Começar Grátis').first().click()
      await expect(page).toHaveURL(/\/auth\/signup/)
    })

    test('should render signup form elements', async ({ page }) => {
      await page.goto('/auth/signup')

      await expect(page.locator('text=Criar Conta')).toBeVisible()
      await expect(page.locator('text=Comece seu teste gratuito de 7 dias')).toBeVisible()
      await expect(page.getByTestId('email-input')).toBeVisible()
      await expect(page.getByTestId('password-input')).toBeVisible()
      await expect(page.getByTestId('confirm-password-input')).toBeVisible()
      await expect(page.getByTestId('signup-button')).toBeVisible()
      await expect(page.locator('text=Já tem conta?')).toBeVisible()
    })

    test('should show validation error for empty email', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.getByTestId('password-input').fill('Test123456')
      await page.getByTestId('confirm-password-input').fill('Test123456')
      await page.getByTestId('signup-button').click()

      await expect(page.locator('text=Todos os campos são obrigatórios')).toBeVisible()
    })

    test('should show validation error for mismatched passwords', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('Test123456')
      await page.getByTestId('confirm-password-input').fill('Different123')
      await page.getByTestId('signup-button').click()

      await expect(page.locator('text=As senhas não coincidem')).toBeVisible()
    })

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('Test123')
      await page.getByTestId('confirm-password-input').fill('Test123')
      await page.getByTestId('signup-button').click()

      await expect(page.locator('text=Senha deve ter pelo menos 8 caracteres')).toBeVisible()
    })

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.locator('a:has-text("Entrar")').click()
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should display loading state during submission', async ({ page }) => {
      await page.goto('/auth/signup')

      const emailInput = page.getByTestId('email-input')
      const passwordInput = page.getByTestId('password-input')
      const confirmInput = page.getByTestId('confirm-password-input')
      const submitButton = page.getByTestId('signup-button')

      await emailInput.fill('newuser@example.com')
      await passwordInput.fill('ValidPass123')
      await confirmInput.fill('ValidPass123')

      await submitButton.click()

      await expect(submitButton).toContainText('Criando conta...')
    })
  })

  test.describe('Login Page', () => {
    test('should navigate to login from home', async ({ page }) => {
      await page.goto('/')
      await page.locator('text=Entrar').click()
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should render login form elements', async ({ page }) => {
      await page.goto('/auth/login')

      await expect(page.locator('text=Entrar')).toBeVisible()
      await expect(page.locator('text=Acesse sua conta de landing pages')).toBeVisible()
      await expect(page.getByTestId('email-input')).toBeVisible()
      await expect(page.getByTestId('password-input')).toBeVisible()
      await expect(page.getByTestId('login-button')).toBeVisible()
      await expect(page.locator('text=Esqueceu a senha?')).toBeVisible()
      await expect(page.locator('text=Não tem conta?')).toBeVisible()
    })

    test('should show demo credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await expect(page.locator('text=Demo (Teste Rápido):')).toBeVisible()
      await expect(page.locator('text=Email: test@example.com')).toBeVisible()
      await expect(page.locator('text=Senha: Test123456')).toBeVisible()
    })

    test('should show validation error for empty email', async ({ page }) => {
      await page.goto('/auth/login')

      await page.getByTestId('password-input').fill('Test123456')
      await page.getByTestId('login-button').click()

      await expect(page.locator('text=Email e senha são obrigatórios')).toBeVisible()
    })

    test('should show validation error for empty password', async ({ page }) => {
      await page.goto('/auth/login')

      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('login-button').click()

      await expect(page.locator('text=Email e senha são obrigatórios')).toBeVisible()
    })

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/auth/login')

      await page.locator('a:has-text("Criar conta grátis")').click()
      await expect(page).toHaveURL(/\/auth\/signup/)
    })

    test('should display loading state during login submission', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.getByTestId('email-input')
      const passwordInput = page.getByTestId('password-input')
      const submitButton = page.getByTestId('login-button')

      await emailInput.fill('test@example.com')
      await passwordInput.fill('Test123456')

      await submitButton.click()

      await expect(submitButton).toContainText('Entrando...')
    })

    test('should show password reset confirmation message', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.getByTestId('email-input')
      await emailInput.fill('test@example.com')

      await page.locator('button:has-text("Esqueceu a senha?")').click()

      await expect(page.locator('text=Email enviado!')).toBeVisible()
      await expect(page.locator('text=Verifique seu email para resetar a senha')).toBeVisible()
    })

    test('should return to login form from password reset state', async ({ page }) => {
      await page.goto('/auth/login')

      const emailInput = page.getByTestId('email-input')
      await emailInput.fill('test@example.com')

      await page.locator('button:has-text("Esqueceu a senha?")').click()
      await page.locator('button:has-text("Voltar")').click()

      await expect(page.getByTestId('login-button')).toBeVisible()
    })
  })

  test.describe('Dashboard & Auth Guard', () => {
    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should preserve redirect URL in query param', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.url()).toContain('redirect=%2Fdashboard')
    })

    test('should redirect unauthenticated user from editor to login', async ({ page }) => {
      await page.goto('/editor')
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
