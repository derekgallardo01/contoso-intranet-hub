# Contoso Intranet Hub — Architecture Diagrams

## Hub Site Topology

```mermaid
graph TB
    subgraph Tenant["SharePoint Online Tenant"]
        Hub["Contoso Home<br/><b>Hub Site</b><br/>Communication Site<br/><i>Landing page, mega menu, announcements</i>"]
    end

    subgraph Associated["Associated Sites"]
        Docs["Contoso Docs<br/>Communication Site<br/><i>Policies, SOPs, contracts,<br/>content types, retention labels</i>"]
        Projects["Contoso Projects<br/>Team Site + M365 Group<br/><i>Project tracking, Kanban,<br/>task lists, milestones</i>"]
        KB["Contoso Knowledge<br/>Communication Site<br/><i>Wiki articles, search,<br/>ratings, categories</i>"]
    end

    Hub -->|"Hub association<br/>Shared navigation"| Docs
    Hub -->|"Hub association<br/>Shared search"| Projects
    Hub -->|"Hub association<br/>Shared branding"| KB

    classDef hub fill:#0078D4,stroke:#005A9E,color:#fff
    classDef site fill:#28A745,stroke:#1E7E34,color:#fff

    class Hub hub
    class Docs,Projects,KB site
```

## SPFx Component Map

```mermaid
graph LR
    subgraph WebParts["Web Parts (4)"]
        WP1["OrgAnnouncements<br/><i>Graph API, dynamic data</i>"]
        WP2["PeopleDirectory<br/><i>Graph People API,<br/>connected web parts</i>"]
        WP3["DocumentDashboard<br/><i>Search REST API,<br/>refiners, preview</i>"]
        WP4["ProjectStatus<br/><i>Kanban board,<br/>list subscriptions</i>"]
    end

    subgraph Extensions["Extensions (4)"]
        EX1["GlobalNavigation<br/><b>App Customizer</b><br/><i>Mega menu from list</i>"]
        EX2["ClassificationHeader<br/><b>App Customizer</b><br/><i>Color-coded banner</i>"]
        EX3["DocumentMetadata<br/><b>Field Customizer</b><br/><i>Classification badges</i>"]
        EX4["SendForApproval<br/><b>Command Set</b><br/><i>Toolbar button,<br/>triggers Power Automate</i>"]
    end

    subgraph ACEs["Adaptive Card Extensions (2)"]
        ACE1["MyDocumentsPending<br/><i>Approval workflow</i>"]
        ACE2["ProjectSummary<br/><i>Metrics dashboard</i>"]
    end

    subgraph Services["Shared Services"]
        GS["GraphService"]
        SPS["SharePointService"]
        SS["SearchService"]
        CS["CacheService"]
    end

    WP1 --> GS
    WP2 --> GS
    WP3 --> SS
    WP4 --> SPS
    EX1 --> SPS
    EX1 --> CS
    EX4 --> SPS
    ACE1 --> SPS
    ACE2 --> SPS

    classDef wp fill:#0078D4,stroke:#005A9E,color:#fff
    classDef ext fill:#E74C3C,stroke:#C0392B,color:#fff
    classDef ace fill:#8E44AD,stroke:#6C3483,color:#fff
    classDef svc fill:#27AE60,stroke:#1E8449,color:#fff

    class WP1,WP2,WP3,WP4 wp
    class EX1,EX2,EX3,EX4 ext
    class ACE1,ACE2 ace
    class GS,SPS,SS,CS svc
```

## Content Type Hierarchy

```mermaid
graph TB
    Base["Document<br/><i>SharePoint built-in</i>"]

    Contoso["Contoso Document<br/><i>+ Department<br/>+ Classification<br/>+ DocumentOwner<br/>+ ReviewDate</i>"]

    Policy["Policy Document<br/><i>+ EffectiveDate<br/>+ ExpiryDate<br/>+ ApprovalStatus<br/>+ PolicyNumber</i><br/>Retention: 7 years"]
    SOP["Standard Operating<br/>Procedure<br/><i>+ Version<br/>+ ProcessArea<br/>+ LastReviewedBy</i><br/>Retention: 3 years"]
    Contract["Contract<br/><i>+ Vendor<br/>+ ContractValue<br/>+ StartDate / EndDate<br/>+ AutoRenew</i><br/>Retention: 10 years"]
    Template["Template<br/><i>+ TemplateCategory<br/>+ LastUpdated</i><br/>No retention"]

    Base --> Contoso
    Contoso --> Policy
    Contoso --> SOP
    Contoso --> Contract
    Contoso --> Template

    classDef base fill:#95A5A6,stroke:#7F8C8D,color:#fff
    classDef parent fill:#0078D4,stroke:#005A9E,color:#fff
    classDef child fill:#27AE60,stroke:#1E8449,color:#fff

    class Base base
    class Contoso parent
    class Policy,SOP,Contract,Template child
```

## Provisioning Pipeline

```mermaid
flowchart LR
    Script["Deploy-IntranetHub.ps1<br/><b>Master Orchestrator</b>"]

    Script --> S1["New-HubSiteTopology<br/><i>4 sites, hub registration</i>"]
    Script --> S2["Deploy-Taxonomy<br/><i>4 term sets, 21 terms</i>"]
    Script --> S3["Deploy-ContentTypes<br/><i>18 columns, 5 types</i>"]
    Script --> S4["Deploy-Theme<br/><i>Corporate branding</i>"]
    Script --> S5["Deploy-SiteDesigns<br/><i>Project site template</i>"]
    Script --> S6["Deploy-Navigation<br/><i>Hub nav + mega menu list</i>"]
    Script --> S7["Set-Permissions<br/><i>4 groups, role-based</i>"]
    Script --> S8["Import-SampleData<br/><i>Announcements, projects,<br/>documents, articles</i>"]

    S1 --> Result["Complete Intranet<br/><b>Ready in minutes</b><br/><i>vs hours of manual clicks</i>"]
    S2 --> Result
    S3 --> Result
    S4 --> Result
    S5 --> Result
    S6 --> Result
    S7 --> Result
    S8 --> Result

    classDef master fill:#E74C3C,stroke:#C0392B,color:#fff
    classDef step fill:#0078D4,stroke:#005A9E,color:#fff
    classDef result fill:#27AE60,stroke:#1E8449,color:#fff

    class Script master
    class S1,S2,S3,S4,S5,S6,S7,S8 step
    class Result result
```

## Document Lifecycle

```mermaid
flowchart TB
    Upload["Document Uploaded<br/><i>Required metadata enforced</i>"]

    Upload --> Classify["Classification Assigned<br/><i>Public / Internal /<br/>Confidential / Restricted</i>"]

    Classify --> Review{"Needs Approval?"}

    Review -->|"Yes"| Approval["Send for Approval<br/><i>Command Set triggers<br/>Power Automate flow</i>"]
    Review -->|"No"| Published["Published<br/><i>Available in search,<br/>classification banner shows</i>"]

    Approval --> Approved{"Decision"}
    Approved -->|"Approved"| Published
    Approved -->|"Rejected"| Draft["Back to Draft<br/><i>Author notified</i>"]
    Draft --> Upload

    Published --> ReviewCycle["Review Cycle<br/><i>Weekly flow checks<br/>ReviewDate field</i>"]
    ReviewCycle -->|"Past due"| TaskCreated["Review Task Created<br/><i>Assigned to DocumentOwner</i>"]
    TaskCreated --> Upload

    Published --> Retention["Retention Policy<br/><i>Auto-applied by<br/>content type</i>"]
    Retention -->|"Expired"| Archive["Archived / Deleted<br/><i>Per retention schedule</i>"]

    classDef action fill:#0078D4,stroke:#005A9E,color:#fff
    classDef decision fill:#F39C12,stroke:#D68910,color:#fff
    classDef end fill:#27AE60,stroke:#1E8449,color:#fff

    class Upload,Classify,Approval,Draft,ReviewCycle,TaskCreated action
    class Review,Approved decision
    class Published,Retention,Archive end
```
