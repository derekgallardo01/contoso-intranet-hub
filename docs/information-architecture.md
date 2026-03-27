# Information Architecture

## Navigation Model

The intranet uses a three-tier navigation strategy: hub navigation for cross-site movement, site navigation for within-site movement, and a mega menu web part for rich structured navigation.

### Tier 1: Hub Navigation

Hub navigation appears at the top of every associated site. It is configured via the SharePoint hub site registration and provides consistent cross-site links.

```
┌──────────────────────────────────────────────────────────────────┐
│  Home  │  Documents  │  Projects  │  Knowledge Base  │  Help    │
└──────────────────────────────────────────────────────────────────┘
```

| Label | Target | Type |
|---|---|---|
| Home | /sites/contoso-home | Internal |
| Documents | /sites/contoso-docs | Internal |
| Projects | /sites/contoso-projects | Internal |
| Knowledge Base | /sites/contoso-knowledge | Internal |
| IT Help Desk | https://contoso.service-now.com | External (new tab) |

### Tier 2: Site Navigation (Left Nav / Top Nav)

Each site has its own local navigation tailored to its content.

**contoso-home**
- Home (page)
- Announcements (page)
- About Us (page)

**contoso-docs**
- All Documents (library view)
- Policies (library view, filtered)
- SOPs (library view, filtered)
- Contracts (library view, filtered)
- Templates (library view, filtered)

**contoso-projects**
- Projects (list)
- Tasks (list)
- Milestones (list)
- Risks (list)

**contoso-knowledge**
- All Articles (page)
- How-To Guides (page)
- FAQs (page)
- Best Practices (page)

### Tier 3: Mega Menu Web Part

The Mega Menu web part renders a rich multi-column dropdown navigation driven by a SharePoint list on contoso-home. This allows business users to update navigation without developer involvement.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Departments          │  Quick Links         │  Resources              │
│  ─────────────        │  ──────────          │  ─────────             │
│  Human Resources      │  Employee Handbook   │  IT Service Portal     │
│  Finance              │  Expense Report      │  Training Calendar     │
│  Information Tech     │  Time Off Request    │  Company Directory     │
│  Legal                │  Travel Booking      │  Brand Guidelines      │
│  Marketing            │                      │                        │
│  Operations           │                      │                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Navigation List Schema**

| Column | Type | Purpose |
|---|---|---|
| Title | Single Line Text | Display label |
| Url | Hyperlink | Navigation target |
| Parent | Lookup (self-referential) | Groups items under a header |
| SortOrder | Number | Controls display order within a group |
| OpenInNewTab | Yes/No | External link behavior |
| Icon | Single Line Text | Optional Fluent UI icon name |

See [ADR 004](decisions/004-list-backed-nav-over-hardcoded.md) for the rationale behind list-backed navigation.

---

## Metadata Strategy

### Why Managed Metadata Over Choice Columns

| Factor | Managed Metadata | Choice Column |
|---|---|---|
| Central governance | Term store is tenant-wide | Per-list, must sync manually |
| Hierarchy support | Multi-level term trees | Flat list only |
| Reuse across sites | Automatic via term set | Copy/paste per list |
| Refinable in search | Built-in managed property mapping | Requires manual mapping |
| User experience | Type-ahead with tree picker | Dropdown only |
| Synonyms / aliases | Supported | Not supported |

**Decision**: All classification metadata (Department, Classification, Process Area, Project Status) uses managed metadata. Only fields with a small fixed set of values and no cross-site reuse needs use Choice columns (e.g., ApprovalStatus on Policy Document).

### Tagging Conventions

- Every document uploaded to contoso-docs must have Department and Classification filled (enforced as required columns on the content type).
- Classification defaults to "Internal" to prevent accidental exposure of unclassified documents.
- DocumentOwner defaults to the uploading user but can be changed to a different person.

---

## Content Type Publishing Strategy

Content types are authored and maintained in the **Content Type Hub** (the tenant-level content type gallery in the SharePoint admin center). From there, they are published to all sites that need them.

### Publishing Flow

```
Content Type Hub (Tenant Admin)
        │
        │  Publish
        ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   contoso-docs    │    │ contoso-projects  │    │contoso-knowledge  │
│                   │    │                   │    │                   │
│ Contoso Document  │    │ Contoso Document  │    │ Contoso Document  │
│ Policy Document   │    │                   │    │                   │
│ SOP               │    │                   │    │                   │
│ Contract          │    │                   │    │                   │
│ Template          │    │                   │    │                   │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

### Publishing Rules

1. **Contoso Document** (base type) is published to all three associated sites. It carries the shared columns (Department, Classification, DocumentOwner, ReviewDate).

2. **Specialized types** (Policy, SOP, Contract, Template) are published only to contoso-docs, since that is the only site hosting governed document libraries.

3. Content type changes are made in the hub first, then republished. Local site modifications to published content types are not permitted (SharePoint enforces this).

4. The provisioning script `Deploy-ContentTypes.ps1` creates content types via PnP PowerShell using the `Add-PnPContentType` and `Add-PnPFieldToContentType` cmdlets, targeting the Content Type Hub URL.

---

## Site Column Design Principles

### Naming Convention

All custom site columns use a `Contoso` prefix in the internal name to avoid collisions with built-in SharePoint columns and third-party solutions:

| Display Name | Internal Name | Type |
|---|---|---|
| Department | ContosoDepartment | Managed Metadata |
| Classification | ContosoClassification | Managed Metadata |
| Document Owner | ContosoDocumentOwner | Person or Group |
| Review Date | ContosoReviewDate | Date Only |
| Effective Date | ContosoEffectiveDate | Date Only |
| Expiry Date | ContosoExpiryDate | Date Only |
| Approval Status | ContosoApprovalStatus | Choice |
| Policy Number | ContosoPolicyNumber | Single Line Text |
| SOP Version | ContosoSOPVersion | Single Line Text |
| Process Area | ContosoProcessArea | Managed Metadata |
| Last Reviewed By | ContosoLastReviewedBy | Person or Group |
| Vendor | ContosoVendor | Single Line Text |
| Contract Value | ContosoContractValue | Currency |
| Contract Start Date | ContosoContractStartDate | Date Only |
| Contract End Date | ContosoContractEndDate | Date Only |
| Auto Renew | ContosoAutoRenew | Yes/No |
| Template Category | ContosoTemplateCategory | Managed Metadata |
| Last Updated | ContosoLastUpdated | Date Only |

### Column Group

All custom columns are placed in the `Contoso Columns` site column group for easy identification in the SharePoint UI.

### Design Rules

1. **Required vs Optional**: Department and Classification are required on Contoso Document (and therefore all children). All other columns are optional unless business rules demand otherwise (e.g., PolicyNumber is required on Policy Document).

2. **Default Values**: Classification defaults to "Internal". ReviewDate defaults to today + 365 days. AutoRenew defaults to No.

3. **Validation**: PolicyNumber uses a column validation formula `=LEFT([ContosoPolicyNumber],4)="POL-"` to enforce the format `POL-XXXX`.

4. **Indexed Columns**: Department, Classification, and ApprovalStatus are indexed on contoso-docs to support filtered views and list view threshold avoidance.

---

## URL Structure Conventions

### Site URLs

All intranet sites use the `/sites/contoso-` prefix for clear identification:

```
https://contoso.sharepoint.com/sites/contoso-home
https://contoso.sharepoint.com/sites/contoso-docs
https://contoso.sharepoint.com/sites/contoso-projects
https://contoso.sharepoint.com/sites/contoso-knowledge
```

### Library and List URLs

Libraries and lists use descriptive slugs without spaces:

```
/sites/contoso-docs/PolicyDocuments
/sites/contoso-docs/SOPs
/sites/contoso-docs/Contracts
/sites/contoso-docs/Templates
/sites/contoso-projects/Projects
/sites/contoso-projects/Tasks
/sites/contoso-projects/Milestones
/sites/contoso-projects/Risks
```

### Page URLs

Site pages use kebab-case:

```
/sites/contoso-home/SitePages/company-announcements.aspx
/sites/contoso-knowledge/SitePages/how-to-submit-expense-report.aspx
/sites/contoso-knowledge/SitePages/onboarding-checklist.aspx
```

### Rationale

- The `contoso-` prefix makes intranet sites immediately identifiable in search results, audit logs, and admin reports.
- No spaces in URLs prevents encoding issues (`%20`) and improves readability in emails and documentation.
- Kebab-case for pages matches industry conventions and keeps URLs human-readable.
