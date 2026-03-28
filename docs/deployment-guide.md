# Deployment Guide

Step-by-step instructions for deploying the Contoso Intranet Hub to a clean SharePoint Online tenant.

## Prerequisites

- **SharePoint Online** tenant with E3 or E5 licensing
- **Global Admin** or **SharePoint Admin** permissions
- **PowerShell 7.x** installed
- **PnP PowerShell 2.x** module installed (`Install-Module PnP.PowerShell`)
- **Node.js 18.x+** for building SPFx

## Step 1: Provision Infrastructure

Run the master provisioning script to create the hub site topology, taxonomy, content types, and governance structures.

```powershell
cd provisioning/scripts

# Connect to your tenant
Connect-PnPOnline -Url "https://yourtenant-admin.sharepoint.com" -Interactive

# Run the master orchestrator
.\Deploy-IntranetHub.ps1 -TenantUrl "https://yourtenant.sharepoint.com"
```

This script executes in order:
1. `New-HubSiteTopology.ps1` — Creates 4 site collections, registers the hub
2. `Deploy-Taxonomy.ps1` — Creates the managed metadata term store
3. `Deploy-ContentTypes.ps1` — Publishes 5 content types from the Content Type Hub
4. `Deploy-Theme.ps1` — Applies the corporate Contoso theme
5. `Deploy-SiteDesigns.ps1` — Registers site designs and site scripts
6. `Deploy-Navigation.ps1` — Creates the navigation list and hub navigation
7. `Set-Permissions.ps1` — Creates SharePoint groups and assigns roles
8. `Import-SampleData.ps1` — Populates demo content from CSV files

## Step 2: Build and Deploy SPFx

```bash
cd spfx/contoso-intranet-spfx

# Install dependencies
npm install --legacy-peer-deps

# Run tests
npm test

# Build for production
npx gulp bundle --ship
npx gulp package-solution --ship
```

The `.sppkg` file will be at `sharepoint/solution/contoso-intranet-spfx.sppkg`.

## Step 3: Upload to App Catalog

1. Navigate to your **SharePoint Admin Center** → **More features** → **Apps** → **App Catalog**
2. Upload `contoso-intranet-spfx.sppkg`
3. When prompted, check **"Make this solution available to all sites in the organization"**
4. Click **Deploy**

## Step 4: Approve Graph API Permissions

The solution requests these Microsoft Graph permissions:

| Permission | Reason |
|-----------|--------|
| `User.Read.All` | People Directory: search users, read profiles |
| `Presence.Read.All` | People Directory: show presence status |

To approve:
1. Go to **SharePoint Admin Center** → **Advanced** → **API access**
2. Approve the pending `User.Read.All` and `Presence.Read.All` requests

## Step 5: Deploy Power Automate Flows

See [power-automate/README.md](../power-automate/README.md) for detailed instructions on importing and configuring the 4 automation flows.

## Step 6: Configure Web Parts

### Hub Home Page (contoso-home)

1. Navigate to `https://yourtenant.sharepoint.com/sites/contoso-home`
2. Edit the page
3. Add the following web parts:
   - **Org Announcements** — Configure `listName: "Announcements"`
   - **People Directory** — Enable presence
   - **Project Status** — Configure `listName: "Projects"`, `siteUrl: ".../contoso-projects"`

### Document Center (contoso-docs)

1. Navigate to `https://yourtenant.sharepoint.com/sites/contoso-docs`
2. Add **Document Dashboard** web part
3. Configure `searchScope` to the document library URL

### Connected Web Parts

To enable department filtering between People Directory and Announcements:
1. Place both web parts on the same page
2. Edit the Announcements web part → **Connect to source** → select People Directory → `department`
3. Selecting a department or clicking a person in the People Directory will now filter announcements

## Step 7: Enable Extensions

Extensions are deployed tenant-wide via the `.sppkg`. Verify:
- **Global Navigation** — Mega menu appears at the top of all hub-associated sites
- **Classification Header** — Banner appears at the bottom of pages with Classification metadata
- **Document Metadata** — Classification badges appear in document library views
- **Send for Approval** — Button appears in document library toolbar when 1 item is selected

## Verification Checklist

- [ ] Hub site topology: 4 sites created, hub registered
- [ ] Navigation list populated with menu items
- [ ] Mega menu renders on all hub-associated sites
- [ ] People Directory shows users with presence
- [ ] Announcements display and filter by department
- [ ] Document Dashboard searches across sites
- [ ] Project Status shows Kanban and table views
- [ ] Classification banner renders on classified pages
- [ ] Send for Approval triggers Power Automate flow
- [ ] Graph API permissions approved and working
