# Power Automate Flows

This directory contains the flow definitions for the Contoso Intranet Hub's document lifecycle automation. Each flow is exported as an Azure Logic App–compatible JSON definition that can be imported into Power Automate.

## Flows Overview

| Flow | Trigger | Schedule | Purpose |
|------|---------|----------|---------|
| [Document Approval](document-approval-flow.json) | HTTP Request | On-demand | Handles approval workflow initiated from the SPFx Send for Approval command set |
| [Classification Permissions](classification-permission-flow.json) | Item Modified | Every 5 min | Breaks permission inheritance when a document is classified as Confidential or Restricted |
| [Review Date Reminder](review-date-reminder-flow.json) | Scheduled | Daily at 8 AM ET | Sends email reminders for documents approaching their review date (within 30 days) |
| [Contract Expiry Alert](contract-expiry-alert-flow.json) | Scheduled | Weekly (Monday 9 AM ET) | Sends digest email to Legal team for contracts expiring within 60 days |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SPFx Command Set                              │
│                    (Send for Approval button)                        │
│                             │                                        │
│                    HTTP POST to Flow URL                              │
│                             ▼                                        │
│  ┌─────────────────────────────────────────┐                        │
│  │     Document Approval Flow              │                        │
│  │                                         │                        │
│  │  1. Update status → "Pending Review"    │                        │
│  │  2. Start Microsoft Approval            │                        │
│  │  3. Wait for approver response          │                        │
│  │  4. Update status → Approved/Rejected   │                        │
│  │  5. Email notification to requester     │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ┌─────────────────────────────────────────┐                        │
│  │  Classification Permission Flow         │  Trigger: Item modified │
│  │                                         │                        │
│  │  If Classification = Confidential       │                        │
│  │     or Restricted:                      │                        │
│  │  1. Break permission inheritance        │                        │
│  │  2. Grant access to Site Admins         │                        │
│  │  3. Grant read to Restricted Readers    │                        │
│  │  4. Notify document owner               │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ┌─────────────────────────────────────────┐                        │
│  │  Review Date Reminder Flow              │  Trigger: Daily 8 AM   │
│  │                                         │                        │
│  │  1. Query docs with ReviewDate ≤ 30d    │                        │
│  │  2. Calculate days remaining            │                        │
│  │  3. Email owner (High priority if <7d)  │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ┌─────────────────────────────────────────┐                        │
│  │  Contract Expiry Alert Flow             │  Trigger: Weekly Mon   │
│  │                                         │                        │
│  │  1. Query contracts with EndDate ≤ 60d  │                        │
│  │  2. Build HTML summary table            │                        │
│  │  3. Send digest to legal@contoso.com    │                        │
│  └─────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Connection Requirements

Each flow requires the following Power Automate connectors:

| Connector | Used By | Permission Required |
|-----------|---------|-------------------|
| SharePoint Online | All flows | Site Collection Admin on contoso-docs |
| Microsoft Approvals | Document Approval | Approvals license (included in E3/E5) |
| Office 365 Outlook | All flows | Send mail as service account |

## Environment Variables

Before importing, update these values in each flow definition:

| Variable | Default | Description |
|----------|---------|-------------|
| `siteUrl` | `https://contoso.sharepoint.com/sites/contoso-docs` | Document center site URL |
| `listName` | `Documents` / `Contracts` | Target document library name |
| `legalEmail` | `legal@contoso.com` | Legal team distribution list |
| `SiteAdminsGroupId` | (tenant-specific) | SharePoint group ID for Contoso Site Admins |
| `RestrictedReadersGroupId` | (tenant-specific) | SharePoint group ID for Contoso Restricted Readers |

## Deployment Steps

1. Navigate to [Power Automate](https://make.powerautomate.com)
2. Select **My flows** → **Import** → **Import Package**
3. Upload each `.json` file
4. Configure the connections (SharePoint, Approvals, Outlook)
5. Update the environment-specific variables listed above
6. Enable each flow

## Integration with SPFx

The **Document Approval Flow** is triggered by the `SendForApprovalCommandSet` SPFx extension. After deploying the flow:

1. Copy the HTTP trigger URL from the flow details
2. Configure the SPFx extension's `approvalFlowUrl` property with the flow URL
3. The extension uses `HttpClient` (not `SPHttpClient`) to POST to this anonymous URL

### Payload Schema

The SPFx command set sends the following JSON payload:

```json
{
  "itemId": "42",
  "fileName": "Q4-Financial-Report.xlsx",
  "fileUrl": "https://contoso.sharepoint.com/sites/contoso-docs/Documents/Q4-Financial-Report.xlsx",
  "notes": "Please review before EOD Friday",
  "requestedBy": "Jane Doe",
  "requestedByEmail": "jane.doe@contoso.com",
  "siteUrl": "https://contoso.sharepoint.com/sites/contoso-docs",
  "listId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## Governance References

- Permission model: `governance/permissions-matrix.md`
- Retention policies: `governance/retention-schedule.md`
- DLP rules: `governance/dlp-policy-definitions.md`
- Compliance mapping: `governance/compliance-checklist.md`
