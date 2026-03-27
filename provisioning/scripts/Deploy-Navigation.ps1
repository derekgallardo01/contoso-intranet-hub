<#
.SYNOPSIS
    Configures hub navigation and creates the Navigation list for the mega menu.

.DESCRIPTION
    1. Sets hub navigation links on contoso-home (Home, Documents, Projects,
       Knowledge Base, IT Help Desk).
    2. Creates a "Navigation" list on contoso-home to serve as the data source
       for the Mega Menu SPFx web part.

    Idempotent: checks for existing navigation nodes and list before creating.

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

$HubUrl = "$TenantUrl/sites/contoso-home"

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Deploying Hub Navigation ===" -ForegroundColor Magenta

# Connect to hub site
Write-Host "  Connecting to hub site: $HubUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $HubUrl -Interactive

# --- Step 1: Configure hub navigation nodes ---
Write-Host "`n--- Configuring Hub Navigation ---" -ForegroundColor Cyan

$hubNavNodes = @(
    @{ Title = "Home";           Url = "$TenantUrl/sites/contoso-home";      External = $false },
    @{ Title = "Documents";      Url = "$TenantUrl/sites/contoso-docs";      External = $false },
    @{ Title = "Projects";       Url = "$TenantUrl/sites/contoso-projects";  External = $false },
    @{ Title = "Knowledge Base"; Url = "$TenantUrl/sites/contoso-knowledge"; External = $false },
    @{ Title = "IT Help Desk";   Url = "https://contoso.service-now.com";    External = $true  }
)

# Get existing hub navigation
$existingNav = Get-PnPNavigationNode -Location TopNavigationBar -ErrorAction SilentlyContinue

foreach ($node in $hubNavNodes) {
    $exists = $existingNav | Where-Object { $_.Title -eq $node.Title }
    if ($exists) {
        Write-Host "    Navigation node exists: $($node.Title)" -ForegroundColor Yellow
        continue
    }

    $navParams = @{
        Location = "TopNavigationBar"
        Title    = $node.Title
        Url      = $node.Url
    }

    if ($node.External) {
        $navParams["External"] = $true
    }

    Add-PnPNavigationNode @navParams
    Write-Host "    Added navigation node: $($node.Title)" -ForegroundColor Green
}

# --- Step 2: Create Navigation list for mega menu ---
Write-Host "`n--- Creating Navigation List (Mega Menu Data Source) ---" -ForegroundColor Cyan

$listName = "Navigation"
$existingList = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue

if ($existingList) {
    Write-Host "  Navigation list already exists." -ForegroundColor Yellow
}
else {
    # Create the list
    New-PnPList -Title $listName -Template GenericList -EnableVersioning -OnQuickLaunch:$false
    Write-Host "  Created list: $listName" -ForegroundColor Green

    # Add custom columns
    Add-PnPField -List $listName -DisplayName "URL" -InternalName "NavUrl" -Type URL
    Write-Host "    Added column: URL (NavUrl)" -ForegroundColor Green

    Add-PnPField -List $listName -DisplayName "Parent" -InternalName "NavParent" -Type Text
    Write-Host "    Added column: Parent (NavParent)" -ForegroundColor Green

    Add-PnPField -List $listName -DisplayName "Sort Order" -InternalName "NavSortOrder" -Type Number
    Write-Host "    Added column: Sort Order (NavSortOrder)" -ForegroundColor Green

    Add-PnPField -List $listName -DisplayName "Open in New Tab" -InternalName "NavOpenInNewTab" -Type Boolean
    Write-Host "    Added column: Open in New Tab (NavOpenInNewTab)" -ForegroundColor Green

    Add-PnPField -List $listName -DisplayName "Icon" -InternalName "NavIcon" -Type Text
    Write-Host "    Added column: Icon (NavIcon)" -ForegroundColor Green

    Write-Host "  Navigation list created with all columns." -ForegroundColor Green
}

Write-Host "`n=== Hub Navigation Deployment Complete ===" -ForegroundColor Magenta
Write-Host "  Hub nav nodes: $($hubNavNodes.Count)"
Write-Host "  Mega menu list: $listName on $HubUrl"
