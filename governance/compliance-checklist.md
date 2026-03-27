# Compliance Checklist

## Overview

This document maps the Contoso Intranet Hub's security and governance controls to ISO 27001 and SOC 2 Trust Services Criteria. Each control area references the specific implementation within the SharePoint Online environment.

## ISO 27001 Control Mapping

### A.5 — Information Security Policies

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Information security policy | A.5.1.1 | Policy Documents stored in contoso-docs with approval workflow and version control | Implemented |
| Review of policies | A.5.1.2 | ReviewDate field on Contoso Document content type triggers review reminders via Power Automate | Planned (Phase 6) |

### A.6 — Organization of Information Security

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Information security roles | A.6.1.1 | SharePoint groups define access roles: Visitors, Content Managers, Site Admins, Restricted Readers | Implemented |
| Segregation of duties | A.6.1.2 | Content Managers can edit content but cannot change permissions; only Site Admins manage access | Implemented |
| Contact with authorities | A.6.1.3 | Emergency Procedures knowledge article on contoso-knowledge with contact information | Implemented |

### A.8 — Asset Management

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Inventory of assets | A.8.1.1 | All documents tracked in SharePoint with content types, managed metadata, and search indexing | Implemented |
| Ownership of assets | A.8.1.2 | DocumentOwner field on every Contoso Document content type; required at upload | Implemented |
| Classification of information | A.8.2.1 | Classification managed metadata field (Public, Internal, Confidential, Restricted) on all documents | Implemented |
| Labeling of information | A.8.2.2 | Microsoft Purview sensitivity labels applied based on Classification metadata | Planned (Phase 6) |
| Handling of assets | A.8.2.3 | DLP policies enforce handling rules per classification level | Documented |

### A.9 — Access Control

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Access control policy | A.9.1.1 | Permissions matrix defines access by role across all sites | Implemented |
| Access to networks and services | A.9.1.2 | Conditional Access policies in Azure AD (tenant-level) | Tenant config |
| User registration/deregistration | A.9.2.1 | Azure AD lifecycle; group membership synced to SharePoint groups | Tenant config |
| User access provisioning | A.9.2.2 | Group-based access; no direct user permissions | Implemented |
| Privilege management | A.9.2.3 | Site Admins group limited to IT staff; quarterly review | Implemented |
| Review of user access rights | A.9.2.5 | Quarterly access review documented in permissions-matrix.md | Planned |
| Removal of access rights | A.9.2.6 | HR termination process triggers Azure AD disable, removing all SharePoint access | Tenant config |

### A.10 — Cryptography

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Encryption controls | A.10.1.1 | SharePoint Online encrypts data at rest (BitLocker + per-file encryption) and in transit (TLS 1.2+) | Platform default |
| Key management | A.10.1.2 | Microsoft-managed keys; Customer Key available with E5 | Platform default |

### A.12 — Operations Security

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Change management | A.12.1.2 | Provisioning-as-code with Git version control; all infrastructure changes tracked | Implemented |
| Capacity management | A.12.1.3 | SharePoint Online storage quotas per site collection; monitored via admin center | Tenant config |
| Logging and monitoring | A.12.4.1 | Unified Audit Log captures all SharePoint activities (file access, sharing, permission changes) | Platform default |
| Protection of log information | A.12.4.2 | Audit logs stored in Microsoft 365 compliance center; immutable for retention period | Platform default |
| Administrator activity logs | A.12.4.3 | Admin activities logged in Unified Audit Log and Azure AD sign-in logs | Platform default |

### A.13 — Communications Security

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Network controls | A.13.1.1 | SharePoint Online accessed via HTTPS only; no on-premises network path | Platform default |
| Information transfer policies | A.13.2.1 | DLP policies prevent external sharing of Confidential/Restricted documents | Documented |
| Non-disclosure agreements | A.13.2.4 | NDA templates available in contoso-docs Templates library | Planned |

### A.18 — Compliance

| Control | ISO 27001 Reference | Implementation | Status |
|---|---|---|---|
| Identification of applicable legislation | A.18.1.1 | Legal compliance update webinars; regulatory tracking in contoso-knowledge | Implemented |
| Protection of records | A.18.1.3 | Retention policies per document type; legal hold capability via eDiscovery | Implemented |
| Privacy and PII protection | A.18.1.4 | DLP policies detect and protect PII (SSN, credit cards); Classification metadata enforces handling | Documented |

---

## SOC 2 Trust Services Criteria Mapping

### CC1 — Control Environment

| Criteria | Implementation | Status |
|---|---|---|
| CC1.1 — Integrity and ethical values | Code of conduct policy document in contoso-docs | Planned |
| CC1.2 — Board oversight | Executive Leadership department classification for governance documents | Implemented |
| CC1.3 — Authority and responsibility | SharePoint groups define clear roles; permissions matrix documents responsibilities | Implemented |
| CC1.4 — Competence commitment | Training materials in contoso-knowledge; security awareness training tracked | Implemented |

### CC2 — Communication and Information

| Criteria | Implementation | Status |
|---|---|---|
| CC2.1 — Internal information quality | Content types enforce consistent metadata; approval workflows validate content | Implemented |
| CC2.2 — Internal communication | Announcements web part on contoso-home; hub navigation links to all sites | Implemented |
| CC2.3 — External communication | External sharing disabled on all intranet sites; DLP prevents data leakage | Implemented |

### CC3 — Risk Assessment

| Criteria | Implementation | Status |
|---|---|---|
| CC3.1 — Risk identification | Risks list on contoso-projects with probability/impact/mitigation fields | Implemented |
| CC3.2 — Fraud risk assessment | DLP Policy 5 (bulk exfiltration detection) monitors for data theft patterns | Documented |
| CC3.3 — Change risk assessment | Site designs and provisioning scripts ensure consistent site creation | Implemented |

### CC5 — Control Activities

| Criteria | Implementation | Status |
|---|---|---|
| CC5.1 — Control selection and development | Permissions model, DLP policies, retention policies designed as layered controls | Implemented |
| CC5.2 — Technology general controls | SharePoint Online platform managed by Microsoft (SOC 2 Type II certified) | Platform default |
| CC5.3 — Security policies deployment | PnP PowerShell scripts deploy security configuration consistently across sites | Implemented |

### CC6 — Logical and Physical Access Controls

| Criteria | Implementation | Status |
|---|---|---|
| CC6.1 — Logical access security | Azure AD authentication; MFA enforced via Conditional Access | Tenant config |
| CC6.2 — Access provisioning | Group-based access model; no direct permissions | Implemented |
| CC6.3 — Access removal | Azure AD lifecycle management; group sync | Tenant config |
| CC6.6 — External threats | DLP policies, external sharing disabled, Conditional Access policies | Implemented |
| CC6.7 — Access restriction to data | Classification-based permissions break inheritance for Confidential/Restricted | Implemented |
| CC6.8 — Prevent unauthorized access | Session management via Azure AD; device compliance via Intune | Tenant config |

### CC7 — System Operations

| Criteria | Implementation | Status |
|---|---|---|
| CC7.1 — Detection of changes | Unified Audit Log; SharePoint version history on all content | Platform default |
| CC7.2 — Anomaly monitoring | DLP Policy 5 (bulk exfiltration) for unusual activity patterns | Documented |
| CC7.3 — Security incident evaluation | Incident Management SOP in contoso-docs; Risks list for tracking | Implemented |
| CC7.4 — Incident response | Incident Response SOP; emergency procedures knowledge article | Implemented |

### CC8 — Change Management

| Criteria | Implementation | Status |
|---|---|---|
| CC8.1 — Infrastructure and software changes | All provisioning via PnP scripts in Git; changes require PR review | Implemented |

### CC9 — Risk Mitigation

| Criteria | Implementation | Status |
|---|---|---|
| CC9.1 — Risk identification and analysis | Risk registers in contoso-projects; governance documentation in /governance | Implemented |
| CC9.2 — Vendor risk management | Contract content type tracks vendor agreements with financial and date data | Implemented |

---

## Audit Evidence Collection

When preparing for an ISO 27001 or SOC 2 audit, the following evidence can be collected from the Contoso Intranet:

| Evidence Type | Source | How to Collect |
|---|---|---|
| Access control records | SharePoint group membership | `Get-PnPGroup` / SharePoint admin center |
| Document classification reports | Managed metadata on documents | SharePoint Search query or PnP PowerShell |
| Change history | Git commit log for provisioning scripts | `git log` on the repository |
| Audit logs | Unified Audit Log | Microsoft Purview Compliance Center or `Search-UnifiedAuditLog` |
| DLP incident reports | DLP alerts dashboard | Microsoft Purview Compliance Center |
| Retention policy compliance | Retention label analytics | Microsoft Purview Compliance Center |
| Permission changes | Unified Audit Log (sharing events) | Filter audit log for "SharingSet" and "PermissionLevelModified" |
| Document lifecycle | Version history on document libraries | SharePoint UI or PnP PowerShell |
