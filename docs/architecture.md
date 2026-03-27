# Architecture

## Hub Site Topology

```
                    ┌──────────────────────────────────┐
                    │     SharePoint Online Tenant      │
                    │      contoso.sharepoint.com       │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │      CONTOSO-HOME (Hub Site)      │
                    │      Communication Site           │
                    │                                   │
                    │  - Corporate landing page         │
                    │  - Mega menu navigation           │
                    │  - Announcements web part         │
                    │  - Enterprise search              │
                    │  - Hub navigation (shared)        │
                    │  - Corporate theme (shared)       │
                    │  - Navigation list (data source)  │
                    └──┬──────────┬──────────────┬─────┘
                       │          │              │
          ┌────────────▼──┐  ┌───▼──────────┐  ┌▼──────────────────┐
          │ CONTOSO-DOCS  │  │CONTOSO-PROJ  │  │ CONTOSO-KNOWLEDGE │
          │ Communication │  │ Team Site    │  │ Communication     │
          │ Site          │  │ + M365 Group │  │ Site              │
          │               │  │              │  │                   │
          │ - Policy docs │  │ - Project    │  │ - Knowledge       │
          │ - SOPs        │  │   lists      │  │   articles        │
          │ - Contracts   │  │ - Tasks      │  │ - Site pages      │
          │ - Templates   │  │ - Milestones │  │ - FAQ sections    │
          │ - Doc library │  │ - Risks      │  │ - How-to guides   │
          │   per type    │  │ - M365 Group │  │ - Best practices  │
          └───────────────┘  │   features   │  └───────────────────┘
                             └──────────────┘
```

### Site Details

| Site | URL Path | Type | Purpose |
|---|---|---|---|
| Contoso Home | `/sites/contoso-home` | Communication Site (Hub) | Corporate landing page, shared navigation, announcements |
| Contoso Docs | `/sites/contoso-docs` | Communication Site | Centralized document management with governed content types |
| Contoso Projects | `/sites/contoso-projects` | Team Site (M365 Group) | Project tracking with tasks, milestones, and risk registers |
| Contoso Knowledge | `/sites/contoso-knowledge` | Communication Site | Knowledge base articles, FAQs, and how-to guides |

### Why This Topology

Hub sites provide the best balance of shared experience and site autonomy. Each associated site inherits hub navigation and search scope while maintaining independent permissions, storage quotas, and content. See [ADR 001](decisions/001-hub-site-over-flat-topology.md) for the full decision record.

---

## Content Type Hierarchy

All document content types are published from the **Content Type Hub** to ensure consistency across sites. See [ADR 002](decisions/002-content-type-hub-over-local-types.md).

```
Document (SharePoint built-in 0x0101)
└── Contoso Document (0x0101009A...)
    │
    │   Inherited Columns:
    │   ├── Department          (Managed Metadata → Contoso Taxonomy > Department)
    │   ├── Classification      (Managed Metadata → Contoso Taxonomy > Classification)
    │   ├── DocumentOwner       (Person or Group)
    │   └── ReviewDate          (Date)
    │
    ├── Policy Document
    │   ├── EffectiveDate       (Date)
    │   ├── ExpiryDate          (Date)
    │   ├── ApprovalStatus      (Choice: Draft | Pending Review | Approved | Retired)
    │   └── PolicyNumber        (Single Line Text)
    │
    ├── Standard Operating Procedure
    │   ├── SOPVersion          (Single Line Text, e.g., "2.1")
    │   ├── ProcessArea         (Managed Metadata → Contoso Taxonomy > Process Area)
    │   └── LastReviewedBy      (Person or Group)
    │
    ├── Contract
    │   ├── Vendor              (Single Line Text)
    │   ├── ContractValue       (Currency)
    │   ├── ContractStartDate   (Date)
    │   ├── ContractEndDate     (Date)
    │   └── AutoRenew           (Yes/No)
    │
    └── Template
        ├── TemplateCategory    (Managed Metadata → Contoso Taxonomy > Department)
        └── LastUpdated         (Date)
```

---

## Term Store Taxonomy

All terms are maintained in a single term group for central governance.

```
Contoso Taxonomy (Term Group)
│
├── Department (Term Set)
│   ├── Human Resources
│   ├── Finance
│   ├── Information Technology
│   ├── Legal
│   ├── Marketing
│   ├── Operations
│   └── Executive Leadership
│
├── Classification (Term Set)
│   ├── Public
│   ├── Internal
│   ├── Confidential
│   └── Restricted
│
├── Process Area (Term Set)
│   ├── Onboarding
│   ├── Procurement
│   ├── Incident Management
│   ├── Change Management
│   └── Quality Assurance
│
└── Project Status (Term Set)
    ├── Proposed
    ├── Active
    ├── On Hold
    ├── Completed
    └── Cancelled
```

### Term Set Usage

| Term Set | Used By | Column Name |
|---|---|---|
| Department | Contoso Document (all children) | Department |
| Classification | Contoso Document (all children) | Classification |
| Process Area | Standard Operating Procedure | ProcessArea |
| Project Status | Project list items | ProjectStatus |

---

## Data Flow Between Sites

```
┌─────────────────┐     Hub Search Scope      ┌─────────────────────┐
│  contoso-home   │◄──────────────────────────►│  SharePoint Search  │
│  (Hub Site)     │                            │  Index              │
└────────┬────────┘                            └─────────┬───────────┘
         │                                               │
         │  Navigation List                              │ Crawls all
         │  (data source for                             │ associated
         │   mega menu web part)                         │ sites
         │                                               │
         ▼                                               ▼
┌─────────────────┐     Content Types          ┌─────────────────────┐
│  Content Type   │───────────────────────────►│  contoso-docs       │
│  Hub            │                            │  contoso-projects   │
│                 │                            │  contoso-knowledge  │
└─────────────────┘                            └─────────┬───────────┘
                                                         │
                                                         │ Document
                                                         │ metadata changes
                                                         ▼
                                               ┌─────────────────────┐
                                               │  Power Automate     │
                                               │                     │
                                               │  - Approval flows   │
                                               │  - Notification     │
                                               │  - Retention review │
                                               └─────────────────────┘
```

### Key Data Flows

1. **Content Type Publishing**: Content types are authored in the Content Type Hub and published to all three associated sites. Changes propagate automatically.

2. **Search Aggregation**: The hub search scope aggregates results from all associated sites. The Enterprise Search web part queries this scope with managed property filters.

3. **Navigation Data**: The Mega Menu web part on contoso-home reads from a SharePoint list ("Navigation") on the hub site. Business users can edit navigation without code changes.

4. **Document Lifecycle**: Power Automate flows trigger on document metadata changes in contoso-docs (e.g., ApprovalStatus changed to "Pending Review" starts an approval flow).

5. **Project Aggregation**: The Project Dashboard web part on contoso-home uses Microsoft Graph API to query the Projects list on contoso-projects.

---

## Search Architecture

### Managed Properties

| Managed Property | Crawled Property | Type | Queryable | Refinable | Sortable |
|---|---|---|---|---|---|
| ContosoClassification | ows_Classification | Text | Yes | Yes | No |
| ContosoDepartment | ows_Department | Text | Yes | Yes | No |
| ContosoDocumentOwner | ows_DocumentOwner | Text | Yes | No | No |
| ContosoReviewDate | ows_ReviewDate | DateTime | Yes | No | Yes |
| ContosoApprovalStatus | ows_ApprovalStatus | Text | Yes | Yes | No |
| ContosoProcessArea | ows_ProcessArea | Text | Yes | Yes | No |
| ContosoVendor | ows_Vendor | Text | Yes | Yes | No |
| ContosoProjectStatus | ows_ProjectStatus | Text | Yes | Yes | No |

### Result Sources

| Name | Scope | Query Transform |
|---|---|---|
| Contoso Hub Results | Hub site + all associated sites | `{searchTerms} path:"https://contoso.sharepoint.com/sites/contoso-*"` |
| Contoso Policy Documents | contoso-docs | `{searchTerms} ContentType:"Policy Document"` |
| Contoso Knowledge Articles | contoso-knowledge | `{searchTerms} ContentType:"Site Page" path:"https://contoso.sharepoint.com/sites/contoso-knowledge"` |

### Search Query Examples

```text
// All confidential documents across the hub
ContosoClassification:"Confidential" path:"https://contoso.sharepoint.com/sites/contoso-*"

// Active projects in IT
ContosoProjectStatus:"Active" ContosoDepartment:"Information Technology"

// Policy documents expiring within 90 days
ContentType:"Policy Document" ContosoReviewDate<{Today}+90
```

---

## Integration Points

### Microsoft Graph API

| Endpoint | Purpose | Used By |
|---|---|---|
| `/me/profile` | Display current user info in header | Hub Header extension |
| `/me/presence` | Show online status | Hub Header extension |
| `/sites/{id}/lists/{id}/items` | Query project data cross-site | Project Dashboard web part |
| `/groups/{id}/members` | Resolve M365 Group membership | Permissions scripts |
| `/users/{id}/photo/$value` | User profile photos | Announcements, Dashboard |

### Power Automate Flows

| Flow | Trigger | Actions |
|---|---|---|
| Document Approval | Item modified (ApprovalStatus = "Pending Review") | Start approval, update status, notify owner |
| Review Date Reminder | Scheduled (daily) | Query documents with ReviewDate in next 30 days, email owners |
| New Project Notification | Item created in Projects list | Post to Teams channel, send email to stakeholders |
| Contract Expiry Alert | Scheduled (weekly) | Query contracts with EndDate in next 60 days, email Legal team |

### SharePoint REST / Search API

The Enterprise Search web part uses the SharePoint Search REST API directly rather than Microsoft Graph Search (which does not support all SharePoint managed properties):

```
POST https://contoso.sharepoint.com/sites/contoso-home/_api/search/postquery
```

This provides access to result sources, managed properties, refiners, and hit highlighting that the Graph Search API does not fully expose.
