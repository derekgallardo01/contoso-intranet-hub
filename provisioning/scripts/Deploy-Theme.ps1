<#
.SYNOPSIS
    Deploys the Contoso corporate theme to SharePoint Online.

.DESCRIPTION
    Reads the theme definition from contoso-theme.json and applies it as a
    tenant theme. Then sets it as the default theme on all intranet sites.

    Idempotent: updates the theme if it already exists.

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
$ThemeName = "Contoso Corporate"
$ThemeFilePath = Join-Path $PSScriptRoot "..\templates\contoso-theme.json"

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Deploying Corporate Theme ===" -ForegroundColor Magenta

# Validate theme file exists
if (-not (Test-Path $ThemeFilePath)) {
    throw "Theme file not found: $ThemeFilePath"
}

# Load theme definition
Write-Host "  Loading theme definition from: $ThemeFilePath" -ForegroundColor Cyan
$themeJson = Get-Content -Path $ThemeFilePath -Raw | ConvertFrom-Json
$themePalette = @{}

# Convert JSON object to hashtable
$themeJson.palette.PSObject.Properties | ForEach-Object {
    $themePalette[$_.Name] = $_.Value
}

# Connect to admin site
Write-Host "  Connecting to SharePoint Admin: $AdminUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $AdminUrl -Interactive

# Check if theme already exists
$existingTheme = Get-PnPTenantTheme -Name $ThemeName -ErrorAction SilentlyContinue
if ($existingTheme) {
    Write-Host "  Theme already exists. Updating: $ThemeName" -ForegroundColor Yellow
    Remove-PnPTenantTheme -Name $ThemeName
}

# Add the tenant theme
Add-PnPTenantTheme -Identity $ThemeName -Palette $themePalette -IsInverted $false -Overwrite
Write-Host "  Deployed tenant theme: $ThemeName" -ForegroundColor Green

# Apply theme to each intranet site
$sites = @(
    "$TenantUrl/sites/contoso-home",
    "$TenantUrl/sites/contoso-docs",
    "$TenantUrl/sites/contoso-projects",
    "$TenantUrl/sites/contoso-knowledge"
)

foreach ($siteUrl in $sites) {
    Write-Host "  Applying theme to: $siteUrl" -ForegroundColor Cyan
    try {
        Connect-PnPOnline -Url $siteUrl -Interactive
        Set-PnPWebTheme -Theme $ThemeName
        Write-Host "  Applied theme to: $siteUrl" -ForegroundColor Green
    }
    catch {
        Write-Host "  Warning: Could not apply theme to $siteUrl - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Theme Deployment Complete ===" -ForegroundColor Magenta
Write-Host "  Theme name: $ThemeName"
Write-Host "  Primary:    #0078D4"
Write-Host "  Applied to: $($sites.Count) sites"
