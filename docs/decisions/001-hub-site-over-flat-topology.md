# ADR 001: Hub Site Architecture Over Flat Site Topology

## Status

**Accepted** — 2026-03-27

## Context

The Contoso intranet requires four distinct areas of content: a corporate landing page, a document management center, a project tracking workspace, and a knowledge base. These areas serve different audiences and have different permission models, but users expect a unified experience with consistent navigation and the ability to search across all intranet content from a single location.

Two primary topology options exist in SharePoint Online:

1. **Flat topology**: Four independent site collections with no structural relationship. Cross-site navigation and search require custom solutions or manual configuration on each site.

2. **Hub site topology**: One site registered as a hub with the other three sites associated to it. SharePoint provides shared navigation, cross-site search scoping, and consistent theming automatically.

## Decision

We will use a **hub site topology** with `contoso-home` registered as the hub site and `contoso-docs`, `contoso-projects`, and `contoso-knowledge` associated to it.

## Rationale

- **Shared navigation**: Hub sites provide a built-in navigation bar that appears on all associated sites. This eliminates the need to maintain separate navigation on each site and guarantees consistency.

- **Scoped search**: The hub site search scope automatically includes all associated sites. Users searching from any associated site see results from the entire intranet without additional configuration.

- **Consistent branding**: A theme applied to the hub propagates to all associated sites, ensuring visual consistency without per-site theme management.

- **Loose coupling**: Unlike subsites, associated sites remain independent site collections with their own permissions, storage quotas, and recycle bins. Sites can be disassociated from the hub without data loss.

- **Microsoft recommended pattern**: Hub sites are Microsoft's recommended approach for organizing related sites in SharePoint Online. Subsites are deprecated for new development.

## Alternatives Considered

### Flat site collections with custom navigation
- Would require a custom SPFx application customizer on every site to render shared navigation.
- Search aggregation would require a custom search solution or manual result source configuration.
- No built-in theme propagation.
- Higher maintenance overhead.

### Single site with subsites
- Subsites are deprecated in SharePoint Online.
- Shared permission inheritance creates security management complexity.
- Storage quota is shared, making capacity planning difficult.
- Cannot use modern site templates (Communication Site) for subsites.

## Consequences

### Positive
- Shared navigation is maintained in one place and appears on all four sites.
- Cross-site search works without custom code.
- Corporate theme applies consistently across all sites.
- Each site maintains independent permissions and storage.
- Adding future sites (e.g., contoso-hr, contoso-finance) requires only hub association.

### Negative
- Hub navigation is limited to a single level (no dropdowns) in the built-in implementation. The Mega Menu web part addresses this limitation.
- Hub site registration requires SharePoint Administrator privileges.
- Maximum of 2,000 sites can be associated to a single hub (not a concern at Contoso's scale).

### Risks
- If Microsoft changes hub site behavior in a future update, navigation or search could be affected. Mitigation: hub sites are a core platform feature with strong backward compatibility commitments.
