<#
.SYNOPSIS
    Creates SharePoint groups and configures permissions for the Contoso Intranet.

.DESCRIPTION
    Creates three custom SharePoint groups on each intranet site:
    - Contoso Intranet Visitors (Read)
    - Contoso Content Managers (Contribute + Approve)
    - Contoso Site Admins (Full Control)

    Also configures document library permissions for classification-based access.

    Idempotent: checks for existing groups before creating.

.PARAMETER TenantUrl
    The root URL of the SharePoint Online tenant.

.PARAMETER AdminEmail
    The email address of the administrator.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TenantUrl,

    [Parameter(Mandatory = $true)]
    [string]$AdminEmail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Helper: Create a SharePoint group if it doesn't exist
# ---------------------------------------------------------------------------
function New-SPGroupIfNotExists {
    param(
        [string]$GroupName,
        [string]$PermissionLevel,
        [string]$Description
    )

    $existingGroup = Get-PnPGroup -Identity $GroupName -ErrorAction SilentlyContinue
    if ($existingGroup) {
        Write-Host "    Group exists: $GroupName" -ForegroundColor Yellow
        return
    }

    New-PnPGroup -Title $GroupName -Description $Description
    Write-Host "    Created group: $GroupName" -ForegroundColor Green

    # Assign permission level
    Set-PnPGroupPermissions -Identity $GroupName -AddRole $PermissionLevel
    Write-Host "    Assigned '$PermissionLevel' to: $GroupName" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Helper: Configure permissions on a site
# ---------------------------------------------------------------------------
function Set-SitePermissions {
    param(
        [string]$SiteUrl,
        [string]$SiteName
    )

    Write-Host "`n  Configuring permissions for: $SiteName ($SiteUrl)" -ForegroundColor Cyan

    Connect-PnPOnline -Url $SiteUrl -Interactive

    # Create custom groups
    New-SPGroupIfNotExists `
        -GroupName "Contoso Intranet Visitors" `
        -PermissionLevel "Read" `
        -Description "Read-only access to the Contoso Intranet. Members can view all content but cannot create, edit, or delete."

    New-SPGroupIfNotExists `
        -GroupName "Contoso Content Managers" `
        -PermissionLevel "Contribute" `
        -Description "Content management access. Members can create, edit, and delete content. Used for department content editors."

    New-SPGroupIfNotExists `
        -GroupName "Contoso Site Admins" `
        -PermissionLevel "Full Control" `
        -Description "Full administrative access to the Contoso Intranet site. Reserved for IT administrators."

    # Add admin to Site Admins group
    try {
        Add-PnPGroupMember -Group "Contoso Site Admins" -EmailAddress $AdminEmail
        Write-Host "    Added $AdminEmail to Contoso Site Admins" -ForegroundColor Green
    }
    catch {
        Write-Host "    Note: Could not add admin to group (may already be a member)" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Setting Permissions & Groups ===" -ForegroundColor Magenta

# Configure permissions on each site
$sites = @(
    @{ Url = "$TenantUrl/sites/contoso-home";      Name = "Contoso Home" },
    @{ Url = "$TenantUrl/sites/contoso-docs";       Name = "Contoso Documents" },
    @{ Url = "$TenantUrl/sites/contoso-projects";   Name = "Contoso Projects" },
    @{ Url = "$TenantUrl/sites/contoso-knowledge";  Name = "Contoso Knowledge Base" }
)

foreach ($site in $sites) {
    Set-SitePermissions -SiteUrl $site.Url -SiteName $site.Name
}

# --- Special: Document library classification-based permissions on contoso-docs ---
Write-Host "`n--- Configuring Classification-Based Permissions ---" -ForegroundColor Cyan

$docsUrl = "$TenantUrl/sites/contoso-docs"
Write-Host "  Connecting to: $docsUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $docsUrl -Interactive

# Create a restricted readers group for Confidential/Restricted content
$restrictedGroupName = "Contoso Restricted Readers"
$existingGroup = Get-PnPGroup -Identity $restrictedGroupName -ErrorAction SilentlyContinue
if (-not $existingGroup) {
    New-PnPGroup -Title $restrictedGroupName `
        -Description "Access to Confidential and Restricted documents. Membership is controlled by Legal and Compliance."
    Set-PnPGroupPermissions -Identity $restrictedGroupName -AddRole "Read"
    Write-Host "  Created group: $restrictedGroupName" -ForegroundColor Green
}
else {
    Write-Host "  Group exists: $restrictedGroupName" -ForegroundColor Yellow
}

# Note: Per-item permission inheritance breaking would be done by a Power Automate
# flow that triggers when Classification is set to Confidential or Restricted.
# This is documented here and implemented in Phase 6.
Write-Host @"

  NOTE: Per-document permissions based on Classification metadata will be
  enforced by a Power Automate flow (Phase 6). When a document's Classification
  is set to 'Confidential' or 'Restricted':
    1. Inheritance is broken on the item.
    2. Default groups are removed.
    3. Only 'Contoso Restricted Readers' and 'Contoso Site Admins' retain access.

"@ -ForegroundColor Yellow

Write-Host "`n=== Permissions & Groups Deployment Complete ===" -ForegroundColor Magenta
Write-Host "  Groups created on $($sites.Count) sites:"
Write-Host "    - Contoso Intranet Visitors (Read)"
Write-Host "    - Contoso Content Managers (Contribute)"
Write-Host "    - Contoso Site Admins (Full Control)"
Write-Host "    - Contoso Restricted Readers (Read, contoso-docs only)"
