# Retention Schedule

## Overview

This document defines the retention policies for all document types managed within the Contoso Intranet. Policies are implemented using Microsoft Purview retention labels and policies. The retention schedule is aligned with legal, regulatory, and business requirements.

## Retention Policy Summary

| Document Type | Content Type | Retention Period | Trigger Event | Disposition Action |
|---|---|---|---|---|
| Policy Document | Policy Document | 7 years | After ExpiryDate | Delete automatically |
| Standard Operating Procedure | Standard Operating Procedure | 3 years | After last modified date | Delete (with review) |
| Contract | Contract | 10 years | After ContractEndDate | Delete (with review) |
| Template | Template | No retention | N/A (evergreen) | None |
| General Documents | Contoso Document | 5 years | After created date | Delete automatically |
| Knowledge Articles | Site Page | 2 years | After last modified date | Delete (with review) |
| Announcements | List Item | 1 year | After ExpiryDate | Delete automatically |
| Project Records | List Item | 3 years | After project Completed/Cancelled | Archive, then delete |

## Detailed Policies

### Policy Documents — 7 Years After Expiry

**Rationale**: Corporate policies may be referenced in legal proceedings, audits, or regulatory inquiries. A 7-year retention after expiry provides coverage for most statute-of-limitations periods.

- **Retention Label**: `Contoso-Policy-7yr`
- **Trigger**: ExpiryDate field value
- **Period**: 7 years after ExpiryDate
- **Action**: Automatic deletion
- **Scope**: All items with content type "Policy Document" in contoso-docs
- **Notes**: Policies in "Draft" or "Pending Review" status are excluded from retention processing until they reach "Approved" or "Retired" status.

### Standard Operating Procedures — 3 Years After Last Modified

**Rationale**: SOPs are living documents that are regularly updated. Once an SOP has not been modified for 3 years, it is likely obsolete and should be reviewed for deletion.

- **Retention Label**: `Contoso-SOP-3yr`
- **Trigger**: Last modified date
- **Period**: 3 years after last modified
- **Action**: Disposition review (assigned to Contoso Content Managers)
- **Scope**: All items with content type "Standard Operating Procedure" in contoso-docs
- **Notes**: A disposition review workflow notifies the DocumentOwner before deletion. If the SOP is still valid, the owner updates it (resetting the retention clock).

### Contracts — 10 Years After End Date

**Rationale**: Contracts may be subject to post-termination claims, warranties, or indemnification periods. A 10-year retention after the contract end date satisfies most jurisdictional requirements.

- **Retention Label**: `Contoso-Contract-10yr`
- **Trigger**: ContractEndDate field value
- **Period**: 10 years after ContractEndDate
- **Action**: Disposition review (assigned to Legal team)
- **Scope**: All items with content type "Contract" in contoso-docs
- **Notes**: Contracts with AutoRenew = Yes are excluded from retention processing while the contract remains active. The retention clock starts only after the contract has a definitive end date.

### Templates — No Retention (Evergreen)

**Rationale**: Templates are reusable assets that do not expire. They should remain available indefinitely and are updated in place rather than versioned over time.

- **Retention Label**: None
- **Scope**: All items with content type "Template" in contoso-docs
- **Notes**: Templates should be reviewed annually to ensure they reflect current branding and standards. This is a manual process managed by Contoso Content Managers.

### General Documents — 5 Years After Created

**Rationale**: Documents using the base "Contoso Document" content type that do not fall into a specialized category are retained for a standard 5-year period.

- **Retention Label**: `Contoso-General-5yr`
- **Trigger**: Created date
- **Period**: 5 years after created
- **Action**: Automatic deletion
- **Scope**: Items with content type "Contoso Document" (not inherited types) in contoso-docs

### Knowledge Articles — 2 Years After Last Modified

**Rationale**: Knowledge articles that have not been updated in 2 years are likely outdated. A disposition review ensures still-relevant articles are refreshed.

- **Retention Label**: `Contoso-KB-2yr`
- **Trigger**: Last modified date
- **Period**: 2 years after last modified
- **Action**: Disposition review (assigned to Contoso Content Managers)
- **Scope**: Site pages in contoso-knowledge

## Implementation Notes

### Label Publishing

Retention labels are created in the Microsoft Purview Compliance Center and published to the relevant sites:

| Label | Published To |
|---|---|
| Contoso-Policy-7yr | contoso-docs |
| Contoso-SOP-3yr | contoso-docs |
| Contoso-Contract-10yr | contoso-docs |
| Contoso-General-5yr | contoso-docs |
| Contoso-KB-2yr | contoso-knowledge |

### Auto-Apply Rules

Where possible, retention labels are auto-applied based on content type:

- Content type = "Policy Document" automatically applies `Contoso-Policy-7yr`
- Content type = "Standard Operating Procedure" automatically applies `Contoso-SOP-3yr`
- Content type = "Contract" automatically applies `Contoso-Contract-10yr`

### Legal Hold

Retention policies do not override legal holds. If a document is placed on legal hold (via eDiscovery case or retention policy with preservation lock), it is retained regardless of the retention label disposition.

### Licensing Requirement

Auto-apply retention labels based on content type require **Microsoft 365 E5** or **E5 Compliance** add-on licensing. If only E3 licensing is available, labels must be applied manually or via a Power Automate flow.
