# Permissions Matrix

## Overview

All Contoso Intranet sites use a consistent group-based permission model. Four custom SharePoint groups are created on each site. Individual users are never granted direct permissions; all access is managed through group membership.

## Permission Groups

| Group | Permission Level | Description |
|---|---|---|
| Contoso Intranet Visitors | Read | View all content. Cannot create, edit, or delete. Default for all employees. |
| Contoso Content Managers | Contribute | Create, edit, and delete content. Approve items. Assigned to department editors. |
| Contoso Site Admins | Full Control | Full administrative access. Manage permissions, site settings, and structure. IT only. |
| Contoso Restricted Readers | Read | Access to Confidential/Restricted documents. Managed by Legal and Compliance. |

## Site Permissions Matrix

### contoso-home (Hub Site)

| Group | Permission Level | Access Scope |
|---|---|---|
| Contoso Intranet Visitors | Read | All site content, hub navigation, announcements |
| Contoso Content Managers | Contribute | Announcements list, Navigation list, site pages |
| Contoso Site Admins | Full Control | All site content, site settings, hub configuration |
| Everyone except external users | Read | Implicit read access for all authenticated employees |

### contoso-docs (Document Center)

| Group | Permission Level | Access Scope |
|---|---|---|
| Contoso Intranet Visitors | Read | Public and Internal classified documents |
| Contoso Content Managers | Contribute | All document libraries (upload, edit, tag metadata) |
| Contoso Site Admins | Full Control | All content, library settings, content type management |
| Contoso Restricted Readers | Read | Confidential and Restricted classified documents |

**Special Permissions (contoso-docs)**

Documents classified as **Confidential** or **Restricted** have broken inheritance:

| Classification | Default Access | Restricted To |
|---|---|---|
| Public | All authenticated users (Read) | No restrictions |
| Internal | All authenticated users (Read) | No restrictions |
| Confidential | Inheritance broken | Contoso Restricted Readers + Contoso Site Admins only |
| Restricted | Inheritance broken | Contoso Restricted Readers + Contoso Site Admins only |

> Note: Inheritance breaking is automated by a Power Automate flow that triggers when the Classification field is changed. See Phase 6 implementation.

### contoso-projects (Project Workspace)

| Group | Permission Level | Access Scope |
|---|---|---|
| Contoso Intranet Visitors | Read | Project list, Tasks, Milestones, Risks (view only) |
| Contoso Content Managers | Contribute | All lists (create/edit tasks, milestones, risks) |
| Contoso Site Admins | Full Control | All content, list settings, site configuration |
| Project-specific M365 Group Members | Edit | Future: per-project Teams with scoped access |

### contoso-knowledge (Knowledge Base)

| Group | Permission Level | Access Scope |
|---|---|---|
| Contoso Intranet Visitors | Read | All knowledge articles and site pages |
| Contoso Content Managers | Contribute | Create and edit site pages, manage page layouts |
| Contoso Site Admins | Full Control | All content, page templates, site settings |

## Role Assignment Guidelines

| Role | Typical Users | Groups Assigned |
|---|---|---|
| Employee | All company staff | Contoso Intranet Visitors (all sites) |
| Department Editor | Communications, HR, IT content publishers | Contoso Content Managers (relevant sites) |
| IT Administrator | SharePoint admins, IT managers | Contoso Site Admins (all sites) |
| Legal/Compliance | Legal team, compliance officers | Contoso Restricted Readers (contoso-docs) |
| Project Manager | Department leads running projects | Contoso Content Managers (contoso-projects) |
| Knowledge Author | Subject matter experts, trainers | Contoso Content Managers (contoso-knowledge) |

## External Sharing

| Site | External Sharing Setting | Rationale |
|---|---|---|
| contoso-home | Disabled | Internal-only corporate landing page |
| contoso-docs | Disabled | Governed documents must not be shared externally |
| contoso-projects | Disabled | Project data is internal-only |
| contoso-knowledge | Disabled | Knowledge base is for employees only |

> External sharing is disabled at the site level for all intranet sites. If external collaboration is needed, a separate site collection should be created with appropriate sharing policies.

## Audit and Review

- **Quarterly**: Review group membership for Contoso Site Admins and Contoso Restricted Readers.
- **Semi-annually**: Review Contoso Content Managers membership across all sites.
- **On termination**: HR process includes removal from all SharePoint groups via Azure AD group sync.
- **Access requests**: Enabled on all sites; requests route to Contoso Site Admins for approval.
