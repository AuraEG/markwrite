# E2E Testing with Playwright

## Running Tests

```bash
pnpm test:e2e              # Run all tests
pnpm test:e2e:ui           # Interactive UI mode
pnpm test:e2e:headed       # See browser
pnpm test:e2e:report       # View report
```

## Test Coverage

- **auth.spec.ts** - Authentication flows
- **documents.spec.ts** - Document management
- **editor.spec.ts** - Editor functionality

## Configuration

Tests run on Chromium, Firefox, and WebKit (see `playwright.config.ts`).

## Future Enhancements

- Mock OAuth provider for authenticated tests
- Test database setup
- Full editor interaction tests
- Collaboration sync tests
