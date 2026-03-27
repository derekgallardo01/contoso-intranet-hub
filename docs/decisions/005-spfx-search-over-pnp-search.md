# ADR 005: Custom SPFx Search Web Part Over PnP Modern Search

## Status

**Accepted** — 2026-03-27

## Context

The intranet requires a cross-site search experience with managed property filters, refiners, and custom result rendering. Two approaches are available:

1. **PnP Modern Search**: An open-source SPFx solution providing configurable search web parts with Handlebars/Adaptive Card templates. Widely used in the SharePoint community.

2. **Custom SPFx search web part**: A purpose-built web part using the SharePoint Search REST API directly, with React components for the UI.

## Decision

We will build a **custom SPFx search web part** rather than deploying PnP Modern Search.

## Rationale

- **Portfolio demonstration**: This project exists to demonstrate senior-level SPFx development skills. Using a pre-built third-party solution for the most complex web part would undermine that purpose.

- **Full control over UX**: A custom web part allows precise control over the search experience, including result layout, filter behavior, animation, and error handling. PnP Modern Search requires working within its template system.

- **Fluent UI v9 consistency**: The custom web part uses the same Fluent UI v9 component library as all other web parts in the project. PnP Modern Search uses its own styling approach that may not match.

- **Learning demonstration**: The search web part demonstrates knowledge of the SharePoint Search REST API, query text syntax, managed properties, result sources, and refinement. These are core competencies for a SharePoint consultant.

- **Reduced dependency**: No dependency on a third-party solution's release cycle, breaking changes, or discontinuation. The custom web part is fully owned and maintained within the project.

## Alternatives Considered

### PnP Modern Search v4
- Mature, feature-rich, community-maintained.
- Excellent for production use in client projects where speed of delivery matters.
- However, using it here would not demonstrate custom development ability.
- Template customization (Handlebars/Adaptive Cards) is powerful but learning and debugging template syntax is a different skill than React component development.

### Microsoft Search (out-of-the-box)
- SharePoint's built-in search page and search web parts.
- Limited customization of result rendering and filter behavior.
- Cannot embed inline in a page alongside other content the way a custom web part can.

### Microsoft Graph Search API
- Modern API for searching across Microsoft 365.
- However, it does not support all SharePoint managed properties, custom result sources, or refiners.
- Better suited for cross-workload search (files + messages + people) than SharePoint-specific document search.

## Consequences

### Positive
- Demonstrates deep knowledge of SharePoint Search REST API.
- Full control over the user experience.
- Consistent Fluent UI v9 styling across all web parts.
- No third-party dependencies.
- Serves as a reusable reference implementation for future projects.

### Negative
- More development effort than configuring PnP Modern Search.
- Must implement features that PnP Modern Search provides out-of-the-box (pagination, refiners, result templates).
- Must maintain the search web part when SharePoint APIs evolve.

### Risks
- The custom implementation may not cover edge cases that PnP Modern Search handles (e.g., complex query syntax, large result sets). Mitigation: scope the web part to the specific search scenarios needed by the intranet and document known limitations.
