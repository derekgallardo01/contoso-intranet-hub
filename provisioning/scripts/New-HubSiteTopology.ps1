<#
.SYNOPSIS
    Creates the Contoso Intranet hub site topology.

.DESCRIPTION
    Creates four SharePoint sites and configures the hub site relationship:
    - contoso-home (Communication Site, registered as Hub)
    - contoso-docs (Communication Site, associated to hub)
    - contoso-projects (Team Site with M365 Group, associated to hub)
    - contoso-knowledge (Communication Site, associated to hub)

    This script is idempotent: it checks for existing sites before creating.

.PARAMETER TenantUrl
    The root URL of the SharePoint Online tenant.

.PARAMETER AdminEmail
    The email address of the administrator (used as site owner).
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

$AdminUrl = $TenantUrl -replace '\.sharepoint\.com$', '-admin.sharepoint.com'

# ---------------------------------------------------------------------------
# Helper: Create a Communication Site if it doesn't exist
# ---------------------------------------------------------------------------
function New-CommunicationSiteIfNotExists {
    param(
        [string]$Url,
        [string]$Title,
        [string]$Description,
        [string]$Owner
    )

    Write-Host "  Checking site: $Url" -ForegroundColor Cyan

    try {
        $existingSite = Get-PnPTenantSite -Url $Url -ErrorAction SilentlyContinue
        if ($existingSite) {
            Write-Host "  Site already exists: $Url" -ForegroundColor Yellow
            return
        }
    }
    catch {
        # Site does not exist — proceed to create
    }

    Write-Host "  Creating Communication Site: $Title" -ForegroundColor Cyan
    New-PnPSite -Type CommunicationSite `
        -Title $Title `
        -Url $Url `
        -Description $Description `
        -Owner $Owner `
        -Lcid 1033

    Write-Host "  Created: $Url" -ForegroundColor Green

    # Wait for site provisioning to complete
    Start-Sleep -Seconds 10

    # Verify site is accessible
    $retries = 0
    $maxRetries = 12
    while ($retries -lt $maxRetries) {
        try {
            $site = Get-PnPTenantSite -Url $Url -ErrorAction Stop
            if ($site.Status -eq "Active") {
                Write-Host "  Site is active: $Url" -ForegroundColor Green
                return
            }
        }
        catch {
            # Site not ready yet
        }
        $retries++
        Write-Host "  Waiting for site provisioning... ($retries/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }

    throw "Site did not become active within the expected time: $Url"
}

# ---------------------------------------------------------------------------
# Helper: Create a Team Site (M365 Group) if it doesn't exist
# ---------------------------------------------------------------------------
function New-TeamSiteIfNotExists {
    param(
        [string]$Alias,
        [string]$Title,
        [string]$Description,
        [string[]]$Owners
    )

    $expectedUrl = "$TenantUrl/sites/$Alias"
    Write-Host "  Checking site: $expectedUrl" -ForegroundColor Cyan

    try {
        $existingSite = Get-PnPTenantSite -Url $expectedUrl -ErrorAction SilentlyContinue
        if ($existingSite) {
            Write-Host "  Site already exists: $expectedUrl" -ForegroundColor Yellow
            return
        }
    }
    catch {
        # Site does not exist — proceed to create
    }

    Write-Host "  Creating Team Site (M365 Group): $Title" -ForegroundColor Cyan
    New-PnPSite -Type TeamSiteWithoutMicrosoft365Group `
        -Title $Title `
        -Url $expectedUrl `
        -Description $Description `
        -Owner $Owners[0] `
        -Lcid 1033

    Write-Host "  Created: $expectedUrl" -ForegroundColor Green

    # Wait for site provisioning
    Start-Sleep -Seconds 15

    # Verify
    $retries = 0
    $maxRetries = 12
    while ($retries -lt $maxRetries) {
        try {
            $site = Get-PnPTenantSite -Url $expectedUrl -ErrorAction Stop
            if ($site.Status -eq "Active") {
                Write-Host "  Site is active: $expectedUrl" -ForegroundColor Green
                return
            }
        }
        catch { }
        $retries++
        Write-Host "  Waiting for site provisioning... ($retries/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }

    throw "Site did not become active within the expected time: $expectedUrl"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Creating Hub Site Topology ===" -ForegroundColor Magenta

# Ensure we're connected to the admin site
$currentConnection = Get-PnPConnection
if (-not $currentConnection) {
    Write-Host "Connecting to SharePoint Admin: $AdminUrl" -ForegroundColor Cyan
    Connect-PnPOnline -Url $AdminUrl -Interactive
}

# 1. Create contoso-home (Hub Site)
$hubUrl = "$TenantUrl/sites/contoso-home"
New-CommunicationSiteIfNotExists `
    -Url $hubUrl `
    -Title "Contoso Home" `
    -Description "Contoso corporate intranet hub site" `
    -Owner $AdminEmail

# 2. Register as Hub Site (if not already)
Write-Host "  Registering hub site: $hubUrl" -ForegroundColor Cyan
try {
    $hubSite = Get-PnPHubSite -Identity $hubUrl -ErrorAction SilentlyContinue
    if ($hubSite) {
        Write-Host "  Already registered as hub site." -ForegroundColor Yellow
    }
    else {
        Register-PnPHubSite -Site $hubUrl
        Write-Host "  Registered as hub site." -ForegroundColor Green
    }
}
catch {
    if ($_.Exception.Message -like "*is already a HubSite*") {
        Write-Host "  Already registered as hub site." -ForegroundColor Yellow
    }
    else {
        throw
    }
}

# 3. Create contoso-docs
New-CommunicationSiteIfNotExists `
    -Url "$TenantUrl/sites/contoso-docs" `
    -Title "Contoso Documents" `
    -Description "Centralized document management for policies, SOPs, contracts, and templates" `
    -Owner $AdminEmail

# 4. Create contoso-projects
New-TeamSiteIfNotExists `
    -Alias "contoso-projects" `
    -Title "Contoso Projects" `
    -Description "Project tracking with tasks, milestones, and risk registers" `
    -Owners @($AdminEmail)

# 5. Create contoso-knowledge
New-CommunicationSiteIfNotExists `
    -Url "$TenantUrl/sites/contoso-knowledge" `
    -Title "Contoso Knowledge Base" `
    -Description "Knowledge articles, how-to guides, and best practices" `
    -Owner $AdminEmail

# 6. Associate sites to hub
$sitesToAssociate = @(
    "$TenantUrl/sites/contoso-docs",
    "$TenantUrl/sites/contoso-projects",
    "$TenantUrl/sites/contoso-knowledge"
)

foreach ($siteUrl in $sitesToAssociate) {
    Write-Host "  Associating to hub: $siteUrl" -ForegroundColor Cyan
    try {
        Add-PnPHubSiteAssociation -Site $siteUrl -HubSite $hubUrl
        Write-Host "  Associated: $siteUrl" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Message -like "*is already associated*") {
            Write-Host "  Already associated: $siteUrl" -ForegroundColor Yellow
        }
        else {
            throw
        }
    }
}

Write-Host "`n=== Hub Site Topology Complete ===" -ForegroundColor Magenta
Write-Host "  Hub:       $hubUrl"
Write-Host "  Docs:      $TenantUrl/sites/contoso-docs"
Write-Host "  Projects:  $TenantUrl/sites/contoso-projects"
Write-Host "  Knowledge: $TenantUrl/sites/contoso-knowledge"
