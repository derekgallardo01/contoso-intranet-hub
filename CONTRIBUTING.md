# Contributing to Contoso Intranet Hub

## Development Setup

### Prerequisites

- **Node.js** 18.x LTS or 22.x
- **npm** 9.x+
- **PowerShell** 7.x (for provisioning scripts)
- **PnP PowerShell** 2.x module (`Install-Module PnP.PowerShell`)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/contoso/contoso-intranet-hub.git
cd contoso-intranet-hub

# Install SPFx dependencies
cd spfx/contoso-intranet-spfx
npm install --legacy-peer-deps

# Run tests
npm test

# Start the local workbench
npm run serve
```

### Project Structure

```
contoso-intranet-hub/
├── docs/                    # Architecture docs and ADRs
├── governance/              # Permissions, retention, DLP, compliance
├── power-automate/          # Flow definitions (JSON)
├── provisioning/            # PnP PowerShell IaC scripts
│   ├── scripts/             # Deployment scripts
│   ├── sample-data/         # CSV data for demo content
│   └── templates/           # Themes and site scripts
└── spfx/contoso-intranet-spfx/
    └── src/
        ├── common/          # Shared components and utilities
        ├── hooks/           # Custom React hooks
        ├── models/          # TypeScript interfaces
        ├── services/        # API client services
        ├── webparts/        # SPFx web parts (4)
        ├── extensions/      # SPFx extensions (4)
        └── adaptiveCardExtensions/  # Viva ACEs (2)
```

## Coding Standards

### TypeScript

- Strict mode is enabled
- Use interfaces over types for object shapes
- Prefix private class members with `_`
- Use `Record<string, T>` over index signatures

### React Components

- Functional components with hooks
- Fluent UI v9 (`@fluentui/react-components`) for all UI
- `FluentProvider` wraps each root component
- Use `makeStyles` for styling, not inline styles

### Testing

- Jest + React Testing Library
- Test files in `__tests__/` directories adjacent to source
- Mock Fluent UI components in tests (they don't render in jsdom)
- Mock `@microsoft/sp-*` packages via `src/__mocks__/spMock.js`
- Target 70%+ coverage (enforced by Jest config)

### Services

- All SharePoint REST calls go through `SharePointService`
- All Microsoft Graph calls go through `GraphService`
- All search queries go through `SearchService`
- Cache responses via `CacheService`

## Pull Request Process

1. Create a feature branch from `master`
2. Write tests for new functionality
3. Ensure `npm test` passes
4. Ensure `npx eslint src/ --ext .ts,.tsx` passes clean
5. Submit PR with a clear description of changes
6. Reference any related issues or ADRs

## Running Tests

```bash
cd spfx/contoso-intranet-spfx

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npx jest src/services/__tests__/GraphService.test.ts

# Run in watch mode
npx jest --watch
```

## Linting

```bash
cd spfx/contoso-intranet-spfx

# Run ESLint
npx eslint src/ --ext .ts,.tsx

# Auto-fix issues
npx eslint src/ --ext .ts,.tsx --fix
```
