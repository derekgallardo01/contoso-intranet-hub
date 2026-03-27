# DLP Policy Definitions

## Overview

This document defines the Data Loss Prevention (DLP) policies designed for the Contoso Intranet. These policies are implemented in the Microsoft Purview Compliance Center and applied to SharePoint Online sites.

> **Licensing Requirement**: DLP policies with advanced conditions (content type detection, managed metadata matching, and custom sensitive information types) require **Microsoft 365 E5** or **E5 Compliance** add-on licensing. Basic DLP policies (built-in sensitive info types) are available with E3.

## Policy 1: Confidential Document Sharing Restriction

**Name**: `Contoso - Confidential Document Sharing Block`

**Purpose**: Prevent documents classified as "Confidential" from being shared with external users or copied to unmanaged devices.

**Scope**: All SharePoint sites matching `https://contoso.sharepoint.com/sites/contoso-*`

**Conditions**:
- Content contains managed metadata property `ContosoClassification` = "Confidential"
- OR document is labeled with sensitivity label "Confidential"

**Actions**:
| Trigger | Action |
|---|---|
| User attempts to share externally | Block sharing, display policy tip |
| User attempts to download on unmanaged device | Block download |
| Document is accessed by external user | Block access, log alert |

**Policy Tip Text**: "This document is classified as Confidential and cannot be shared outside the organization. Contact your manager or the Legal team if you need to share this content externally."

**Notifications**:
- User: Policy tip displayed in SharePoint
- Admin: Alert sent to DLP alert dashboard
- Manager: No notification (to reduce alert fatigue)

**Override**: Users can provide a business justification to override the sharing block. Overrides are logged and reviewed weekly by the Compliance team.

---

## Policy 2: Restricted Document External Sharing Block

**Name**: `Contoso - Restricted Document Hard Block`

**Purpose**: Strictly prevent any external access to documents classified as "Restricted". No user override is permitted.

**Scope**: All SharePoint sites matching `https://contoso.sharepoint.com/sites/contoso-*`

**Conditions**:
- Content contains managed metadata property `ContosoClassification` = "Restricted"
- OR document is labeled with sensitivity label "Restricted"

**Actions**:
| Trigger | Action |
|---|---|
| User attempts to share externally | Hard block (no override), display policy tip |
| User attempts to share with guest users | Hard block |
| User attempts to download on unmanaged device | Hard block |
| User attempts to copy to USB | Hard block (requires Endpoint DLP) |
| Document is forwarded via email | Block attachment, suggest secure link instead |

**Policy Tip Text**: "This document is classified as Restricted. External sharing, downloading on unmanaged devices, and external email attachments are strictly prohibited. No override is available. Contact the Legal team for questions."

**Notifications**:
- User: Policy tip displayed in SharePoint and Outlook
- Admin: High-priority alert sent to DLP alert dashboard and Security Operations email
- Document Owner: Email notification that a DLP action was triggered
- Compliance Officer: Weekly digest of all Restricted document DLP events

**Override**: Not permitted. All block actions are enforced without exception.

---

## Policy 3: Credit Card Number Detection

**Name**: `Contoso - PCI Data Detection`

**Purpose**: Detect documents containing credit card numbers and prevent external sharing. Aligns with PCI DSS requirements.

**Scope**: All SharePoint sites in the tenant

**Conditions**:
- Content contains sensitive information type: Credit Card Number
- Instance count: 1 or more
- Confidence level: High (85%+)

**Actions**:
| Trigger | Action |
|---|---|
| Document uploaded with credit card number | Apply sensitivity label "Confidential" automatically |
| User attempts to share externally | Block sharing, display policy tip |
| Detection during scheduled scan | Alert to Compliance Officer |

**Policy Tip Text**: "This document appears to contain credit card information. It has been automatically classified as Confidential. External sharing is blocked. If this is a false positive, contact IT Security."

**Sensitive Information Type Details**:
- Type: Credit Card Number (built-in)
- Patterns: Visa, Mastercard, American Express, Discover, Diners Club, JCB
- Validation: Luhn algorithm check
- Proximity: Credit card keywords within 300 characters of the number pattern

---

## Policy 4: Social Security Number Detection

**Name**: `Contoso - PII SSN Detection`

**Purpose**: Detect documents containing US Social Security Numbers and restrict access. Aligns with data privacy regulations.

**Scope**: All SharePoint sites in the tenant

**Conditions**:
- Content contains sensitive information type: U.S. Social Security Number (SSN)
- Instance count: 1 or more
- Confidence level: High (85%+)

**Actions**:
| Trigger | Action |
|---|---|
| Document uploaded with SSN | Apply sensitivity label "Restricted" automatically |
| User attempts to share externally | Hard block (no override) |
| User attempts to share internally (non-HR) | Display warning policy tip |
| Detection during scheduled scan | High-priority alert to Privacy Officer |

**Policy Tip Text**: "This document contains Social Security Number data and has been automatically classified as Restricted. External sharing is blocked. Internal sharing is limited to authorized HR and Payroll personnel."

---

## Policy 5: Bulk Sensitive Data Exfiltration

**Name**: `Contoso - Bulk Download Alert`

**Purpose**: Detect and alert on unusual bulk downloading or sharing activity that may indicate data exfiltration.

**Scope**: contoso-docs site only

**Conditions**:
- User downloads more than 50 files within a 10-minute window
- OR user shares more than 10 documents externally within a 1-hour window
- OR user accesses more than 100 Confidential/Restricted documents in a single session

**Actions**:
| Trigger | Action |
|---|---|
| Threshold exceeded | Alert to Security Operations team (high severity) |
| Repeated threshold breach (3+ in 30 days) | Automatic block of user's SharePoint access pending review |

**Notifications**:
- Security Operations: Immediate alert via email and Microsoft Defender portal
- User's manager: Notification of unusual activity
- User: No notification (to avoid tipping off potential bad actor)

---

## Implementation Roadmap

| Phase | Policies | Mode | Timeline |
|---|---|---|---|
| 1 | Policies 1-2 (Classification-based) | Test mode (audit only) | Week 1-2 |
| 2 | Policies 1-2 | Enforcement mode | Week 3 |
| 3 | Policies 3-4 (Sensitive info detection) | Test mode | Week 4-5 |
| 4 | Policies 3-4 | Enforcement mode | Week 6 |
| 5 | Policy 5 (Bulk exfiltration) | Test mode | Week 7-8 |
| 6 | Policy 5 | Enforcement mode | Week 9 |

> All policies are deployed in test mode (audit only) first to measure false positive rates and tune conditions before enforcement.

## Testing and Validation

For each policy:
1. Upload a test document matching the conditions.
2. Verify the policy tip appears in SharePoint.
3. Attempt the blocked action (share, download) and verify it is blocked.
4. Check the DLP alert dashboard for the corresponding alert.
5. Verify notifications are sent to the configured recipients.
6. Test override flow (where applicable) and confirm override is logged.
