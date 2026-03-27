<#
.SYNOPSIS
    Deploys site designs and site scripts for the Contoso Intranet.

.DESCRIPTION
    Creates a site script from the project-site-script.json template and
    registers it as a site design called "Contoso Project Site". The design
    targets Team Sites and creates standard project lists with custom columns.

    Idempotent: checks for existing designs and updates them.

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

$AdminUrl = $TenantUrl -replace '\.sharepoint\.com$', '-admin.sharepoint.com'
$SiteScriptPath = Join-Path $PSScriptRoot "..\templates\site-scripts\project-site-script.json"
$SiteDesignTitle = "Contoso Project Site"
$SiteDesignDescription = "Applies standard project structure: Tasks, Milestones, and Risks lists with Contoso content types."

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Deploying Site Designs & Scripts ===" -ForegroundColor Magenta

# Validate site script file
if (-not (Test-Path $SiteScriptPath)) {
    throw "Site script file not found: $SiteScriptPath"
}

# Load site script JSON
Write-Host "  Loading site script from: $SiteScriptPath" -ForegroundColor Cyan
$siteScriptContent = Get-Content -Path $SiteScriptPath -Raw

# Connect to admin site
Write-Host "  Connecting to SharePoint Admin: $AdminUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $AdminUrl -Interactive

# --- Site Script ---
$siteScriptTitle = "Contoso Project Site Script"
Write-Host "`n  Creating/updating site script: $siteScriptTitle" -ForegroundColor Cyan

# Check for existing site script
$existingScripts = Get-PnPSiteScript | Where-Object { $_.Title -eq $siteScriptTitle }
if ($existingScripts) {
    Write-Host "  Site script already exists. Updating..." -ForegroundColor Yellow
    $siteScript = $existingScripts[0]
    Set-PnPSiteScript -Identity $siteScript.Id -Title $siteScriptTitle -Content $siteScriptContent
    Write-Host "  Updated site script: $siteScriptTitle (ID: $($siteScript.Id))" -ForegroundColor Green
}
else {
    $siteScript = Add-PnPSiteScript -Title $siteScriptTitle `
        -Description "Creates Tasks, Milestones, and Risks lists for project sites" `
        -Content $siteScriptContent
    Write-Host "  Created site script: $siteScriptTitle (ID: $($siteScript.Id))" -ForegroundColor Green
}

# --- Site Design ---
Write-Host "`n  Creating/updating site design: $SiteDesignTitle" -ForegroundColor Cyan

$existingDesigns = Get-PnPSiteDesign | Where-Object { $_.Title -eq $SiteDesignTitle }
if ($existingDesigns) {
    Write-Host "  Site design already exists. Updating..." -ForegroundColor Yellow
    $siteDesign = $existingDesigns[0]
    Set-PnPSiteDesign -Identity $siteDesign.Id `
        -Title $SiteDesignTitle `
        -Description $SiteDesignDescription `
        -SiteScriptIds $siteScript.Id `
        -WebTemplate "64"  # 64 = Team Site
    Write-Host "  Updated site design: $SiteDesignTitle (ID: $($siteDesign.Id))" -ForegroundColor Green
}
else {
    $siteDesign = Add-PnPSiteDesign -Title $SiteDesignTitle `
        -Description $SiteDesignDescription `
        -SiteScriptIds $siteScript.Id `
        -WebTemplate "64"  # 64 = Team Site
    Write-Host "  Created site design: $SiteDesignTitle (ID: $($siteDesign.Id))" -ForegroundColor Green
}

# --- Apply to existing project site ---
$projectSiteUrl = "$TenantUrl/sites/contoso-projects"
Write-Host "`n  Applying site design to: $projectSiteUrl" -ForegroundColor Cyan

try {
    Invoke-PnPSiteDesign -Identity $siteDesign.Id -WebUrl $projectSiteUrl
    Write-Host "  Applied site design to contoso-projects." -ForegroundColor Green
}
catch {
    Write-Host "  Warning: Could not apply site design to $projectSiteUrl - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Site Designs & Scripts Deployment Complete ===" -ForegroundColor Magenta
Write-Host "  Site Script: $siteScriptTitle"
Write-Host "  Site Design: $SiteDesignTitle (targets Team Sites)"
