# ADR 003: PnP Provisioning-as-Code Over Manual Configuration

## Status

**Accepted** — 2026-03-27

## Context

The Contoso intranet requires provisioning of four SharePoint sites, a hub registration, managed metadata term sets, content types with site columns, a corporate theme, site designs, navigation, permissions, and sample data. This configuration can be performed manually through the SharePoint admin center and site settings UI, or automated through scripts.

## Decision

We will use **PnP PowerShell scripts** to provision all SharePoint infrastructure as code. Every configuration change is expressed in a versioned script that can be run against any tenant.

## Rationale

- **Repeatability**: The same scripts can deploy the intranet to a development tenant, staging tenant, or production tenant with identical results. Manual configuration is error-prone and cannot guarantee consistency across environments.

- **Version control**: Scripts are stored in Git alongside the rest of the project. Changes to infrastructure are tracked with the same commit history as code changes, providing a complete audit trail.

- **Disaster recovery**: If a site is accidentally deleted or corrupted, the provisioning scripts can rebuild it from scratch. Manual configuration relies on documentation that may be incomplete or outdated.

- **Onboarding**: New team members can understand the entire infrastructure by reading the scripts. Manual configuration requires tribal knowledge or extensive documentation.

- **Idempotency**: All scripts check for existing resources before creating them. Running a script twice produces the same result as running it once. This makes scripts safe to re-execute after partial failures.

- **Speed**: Automated provisioning completes in minutes. Manual configuration of the same scope takes hours and requires constant attention.

## Alternatives Considered

### Manual configuration via SharePoint Admin Center
- No scripting skills required.
- However, not repeatable, not version-controlled, and not recoverable without backup.
- Human error risk increases with the number of configuration steps.

### SharePoint Framework (SPFx) provisioning
- SPFx solutions can include site provisioning logic.
- However, SPFx runs in the browser context with limited permissions. Tenant-level operations (hub registration, content type hub, taxonomy) require admin-level access that SPFx cannot provide.

### ARM/Bicep templates
- Standard for Azure resource provisioning but not applicable to SharePoint Online configuration.
- SharePoint is a SaaS platform without ARM resource provider support.

### PnP Provisioning Engine (XML templates)
- PnP supports XML-based provisioning templates that declaratively define site structure.
- Powerful but complex for this project's scope. The imperative PowerShell approach is more readable and easier to debug.
- XML templates are better suited for large-scale site stamping (hundreds of identical sites) rather than the four unique sites in this project.

## Consequences

### Positive
- Complete infrastructure is defined in code and version-controlled.
- Any team member can deploy the full intranet to a clean tenant in minutes.
- Scripts serve as living documentation of the infrastructure.
- Safe to re-run after failures (idempotent).

### Negative
- Requires PnP PowerShell module installation and SharePoint admin credentials.
- Script authors need PowerShell and PnP cmdlet knowledge.
- Some SharePoint features (e.g., page layouts, web part configurations) are difficult to provision programmatically and may require manual steps documented in the scripts.

### Risks
- PnP PowerShell module updates may introduce breaking changes. Mitigation: pin to a known-good version in documentation and test scripts after module updates.
