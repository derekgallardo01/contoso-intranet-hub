# Testing Guide

## Overview

The Contoso Intranet Hub SPFx solution uses **Jest** with **React Testing Library** for unit and component testing. All `@microsoft/sp-*` packages are mocked via a comprehensive mock infrastructure.

## Test Architecture

```
src/
├── __mocks__/
│   ├── spMock.js          # Mock factories for all @microsoft/sp-* packages
│   └── styleMock.js       # CSS module mock
├── services/__tests__/
│   ├── CacheService.test.ts         # 14 tests
│   ├── SearchService.test.ts        # 9 tests
│   ├── GraphService.test.ts         # 23 tests
│   └── SharePointService.test.ts    # 18 tests
├── hooks/__tests__/
│   ├── useGraphClient.test.ts       # 5 tests
│   ├── useSharePointList.test.ts    # 8 tests
│   └── useSearch.test.ts            # 9 tests
├── common/components/__tests__/
│   ├── LoadingSpinner.test.tsx       # 3 tests
│   ├── ErrorBoundary.test.tsx        # 6 tests
│   └── EmptyState.test.tsx           # 9 tests
├── webparts/orgAnnouncements/components/__tests__/
│   ├── OrgAnnouncements.test.tsx     # 7 tests
│   └── AnnouncementCard.test.tsx     # 11 tests
└── extensions/
    ├── globalNavigation/components/__tests__/
    │   └── MegaMenu.test.tsx         # 8 tests
    ├── classificationHeader/components/__tests__/
    │   └── ClassificationBanner.test.tsx  # 15 tests
    ├── documentMetadata/components/__tests__/
    │   └── ClassificationBadge.test.tsx   # 7 tests
    └── sendForApproval/components/__tests__/
        └── ApprovalDialog.test.tsx        # 9 tests
```

**Total: 16 test suites, 162 tests**

## Running Tests

```bash
cd spfx/contoso-intranet-spfx

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npx jest src/services/__tests__/GraphService.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="hooks"

# Run in watch mode (re-run on file changes)
npx jest --watch

# Run with verbose output
npx jest --verbose
```

## Coverage Thresholds

The Jest config enforces minimum coverage thresholds:

| Metric | Threshold |
|--------|-----------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

Tests will fail if coverage drops below these thresholds.

## Mocking Strategy

### SPFx Packages

All `@microsoft/sp-*` imports are mapped to `src/__mocks__/spMock.js` via the Jest `moduleNameMapper`. This mock provides:

- `SPHttpClient` / `HttpClient` with `.configurations.v1`
- `MSGraphClientV3` fluent API mock (`.api().select().top().get()`)
- `BaseClientSideWebPart`, `BaseApplicationCustomizer`, `BaseListViewCommandSet`
- `PlaceholderName`, `PropertyPaneTextField`, `PropertyPaneSlider`, etc.
- Helper functions: `createMockGraphClient()`, `createMockWebPartContext()`

### Fluent UI Components

React component tests mock `@fluentui/react-components` with simplified HTML elements. This is necessary because Fluent UI v9 components don't render properly in jsdom. Example:

```typescript
jest.mock('@fluentui/react-components', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Text: ({ children }) => <span>{children}</span>,
  makeStyles: () => () => ({}),
  // ...
}));
```

### Service/Hook Mocking

Service classes and hooks are mocked using `jest.mock()` with factory functions:

```typescript
let mockGetListItems: jest.Mock;
jest.mock('../../services/SharePointService', () => ({
  SharePointService: jest.fn().mockImplementation(() => ({
    getListItems: mockGetListItems,
  })),
}));
```

## Writing New Tests

### Service Tests

Follow the pattern in `GraphService.test.ts`:
1. Create an inline mock of the dependency (SPHttpClient or MSGraphClientV3)
2. Instantiate the service with the mock
3. Test each public method: success, failure, edge cases

### Hook Tests

Follow the pattern in `useSharePointList.test.ts`:
1. Mock the service module the hook depends on
2. Use `renderHook` from `@testing-library/react`
3. Use `waitFor` for async state updates
4. Use `act` for triggering state changes

### Component Tests

Follow the pattern in `OrgAnnouncements.test.tsx`:
1. Mock Fluent UI, child components, and hooks
2. Control hook return values via module-level variables
3. Test rendering states: loading, error, empty, data
4. Test user interactions with `fireEvent`

## Linting

```bash
# Run ESLint
npx eslint src/ --ext .ts,.tsx

# Auto-fix issues
npx eslint src/ --ext .ts,.tsx --fix
```

ESLint is configured with `@typescript-eslint` and `eslint-plugin-react` rules. The CI pipeline enforces zero warnings.
