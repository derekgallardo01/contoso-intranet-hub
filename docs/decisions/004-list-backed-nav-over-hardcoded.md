# ADR 004: List-Backed Navigation Over Hardcoded JSON

## Status

**Accepted** — 2026-03-27

## Context

The Mega Menu web part needs a data source for navigation items. The navigation structure includes multiple levels (headers, items, sub-items) with URLs, sort order, and optional icons. Two primary options exist:

1. **Hardcoded JSON**: Navigation structure defined in the web part property pane or a JSON file deployed with the solution.

2. **SharePoint list**: Navigation items stored in a list on the hub site, read by the web part at runtime.

## Decision

We will use a **SharePoint list** on `contoso-home` as the navigation data source for the Mega Menu web part.

## Rationale

- **Business user editability**: Content managers can add, remove, or reorder navigation items by editing list items in the browser. No code deployment or developer involvement is required.

- **No deployment for changes**: Adding a new link to the mega menu is an edit to a list item, not a code change that requires building, packaging, and deploying an SPFx solution.

- **Permission-controlled**: The navigation list can have its own permissions. Only users in the "Contoso Content Managers" group can edit navigation, while the web part reads it with the current user's permissions.

- **Auditable**: SharePoint list versioning tracks who changed navigation items and when. Hardcoded JSON changes are only tracked if someone remembers to commit them.

- **Familiar interface**: Business users already know how to edit SharePoint lists. There is no learning curve for navigation management.

## Alternatives Considered

### Hardcoded JSON in web part properties
- Simplest to implement in the web part code.
- However, every navigation change requires a developer to edit the JSON, rebuild the SPFx package, and redeploy to the app catalog.
- Not practical for an organization that expects content managers to own navigation.

### SharePoint term store for navigation
- Term sets can represent hierarchical navigation.
- However, term store editing requires specific permissions and the UI is less intuitive than a list.
- Term store is better suited for metadata classification than navigation management.

### JSON file in a document library
- A JSON file in a library could be edited by power users.
- However, JSON syntax errors would break navigation with no user-friendly error message.
- No field-level validation like a SharePoint list provides.

## Consequences

### Positive
- Navigation is editable by business users without developer involvement.
- Changes take effect immediately (no cache beyond the web part's configurable cache duration).
- Full version history on every navigation change.
- Standard SharePoint list permissions control who can edit.

### Negative
- Additional API call at page load to read the navigation list. Mitigation: web part caches the navigation data in session storage with a configurable TTL (default 5 minutes).
- Navigation list must be provisioned and seeded as part of the deployment. This is handled by `Deploy-Navigation.ps1` and `Import-SampleData.ps1`.
- If the navigation list is accidentally deleted, the mega menu renders empty. Mitigation: the web part displays a friendly message ("Navigation not configured") rather than an error.

### Risks
- A content manager could accidentally delete all navigation items. Mitigation: list versioning allows restoration, and the recycle bin provides a safety net.
