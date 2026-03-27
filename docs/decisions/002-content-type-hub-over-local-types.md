# ADR 002: Content Type Hub Over Local Content Types

## Status

**Accepted** — 2026-03-27

## Context

The Contoso intranet manages several categories of documents (policies, SOPs, contracts, templates) that share common metadata fields (Department, Classification, DocumentOwner, ReviewDate). These documents are primarily stored in `contoso-docs` but the base `Contoso Document` content type may be needed on other sites for consistent metadata tagging.

Two approaches exist for managing content types:

1. **Local content types**: Define content types directly on each site. Each site maintains its own copy. Changes must be applied site-by-site.

2. **Content Type Hub**: Define content types centrally in the tenant's Content Type Hub and publish them to sites. Changes are made once and propagated automatically.

## Decision

We will define all custom content types in the **Content Type Hub** and publish them to the sites that need them.

## Rationale

- **Single source of truth**: Content type definitions exist in one place. There is no risk of drift between sites where the same content type has different columns or settings.

- **Governance**: Only tenant administrators can modify published content types. Site owners cannot alter the schema, which prevents ad-hoc column additions that break reporting and search.

- **Change propagation**: When a column is added or modified on a content type in the hub, the change propagates to all subscribing sites automatically (on the next publishing cycle).

- **Search consistency**: Because all sites use the same content types with the same internal column names, managed property mappings in search are consistent. A search query for `ContosoClassification:"Confidential"` works identically across all sites.

- **Scalability**: If Contoso adds new department sites in the future, they subscribe to the same published content types rather than recreating them locally.

## Alternatives Considered

### Local content types per site
- Faster to set up initially (no hub publishing delay).
- However, requires manual synchronization when changes are needed.
- Risk of schema drift over time as different site owners make independent modifications.
- Search managed properties may not map consistently if internal names diverge.

### PnP Provisioning templates with content types
- Content types defined in XML/JSON templates and applied via PnP PowerShell.
- Provides version control of the schema.
- However, does not prevent local modification after deployment.
- Re-running provisioning to update content types is more complex than hub republishing.

We chose the Content Type Hub approach but still use PnP PowerShell scripts to create the initial content types in the hub (for repeatability and version control). This combines the benefits of both approaches.

## Consequences

### Positive
- Content types are consistent across all sites.
- Schema changes propagate automatically.
- Local site owners cannot break the shared schema.
- Search and reporting are reliable across the intranet.

### Negative
- Content type publishing has a propagation delay (typically minutes, occasionally up to 24 hours).
- Published content types cannot be modified on the subscribing site, which limits site-level customization. If a site needs additional columns, they must be added via site columns outside the content type or by requesting a hub-level change.
- Requires SharePoint Administrator access to the Content Type Hub.

### Risks
- If the Content Type Hub service experiences delays, newly created sites may not receive content types immediately. Mitigation: provisioning scripts include a wait-and-verify step.
