<#
.SYNOPSIS
    Deploys managed metadata taxonomy for the Contoso Intranet.

.DESCRIPTION
    Creates the Contoso Taxonomy term group and four term sets:
    - Department (7 terms)
    - Classification (4 terms)
    - Process Area (5 terms)
    - Project Status (5 terms)

    Idempotent: checks for existing groups, sets, and terms before creating.

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
# Helper: Ensure a term exists in a term set
# ---------------------------------------------------------------------------
function Add-TermIfNotExists {
    param(
        [string]$TermSetName,
        [string]$TermGroupName,
        [string]$TermName
    )

    try {
        $existingTerm = Get-PnPTerm -Identity $TermName -TermSet $TermSetName -TermGroup $TermGroupName -ErrorAction SilentlyContinue
        if ($existingTerm) {
            Write-Host "    Term exists: $TermName" -ForegroundColor Yellow
            return
        }
    }
    catch {
        # Term does not exist — proceed to create
    }

    New-PnPTerm -Name $TermName -TermSet $TermSetName -TermGroup $TermGroupName
    Write-Host "    Created term: $TermName" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Deploying Managed Metadata Taxonomy ===" -ForegroundColor Magenta

# Connect to the hub site for term store access
Write-Host "Connecting to hub site: $HubUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $HubUrl -Interactive

# --- Term Group ---
$termGroupName = "Contoso Taxonomy"
Write-Host "`n  Term Group: $termGroupName" -ForegroundColor Cyan

try {
    $existingGroup = Get-PnPTermGroup -Identity $termGroupName -ErrorAction SilentlyContinue
    if ($existingGroup) {
        Write-Host "  Term group already exists." -ForegroundColor Yellow
    }
    else {
        New-PnPTermGroup -Name $termGroupName
        Write-Host "  Created term group: $termGroupName" -ForegroundColor Green
    }
}
catch {
    New-PnPTermGroup -Name $termGroupName
    Write-Host "  Created term group: $termGroupName" -ForegroundColor Green
}

# --- Department Term Set ---
$termSetName = "Department"
Write-Host "`n  Term Set: $termSetName" -ForegroundColor Cyan

try {
    $existingSet = Get-PnPTermSet -Identity $termSetName -TermGroup $termGroupName -ErrorAction SilentlyContinue
    if ($existingSet) {
        Write-Host "  Term set already exists: $termSetName" -ForegroundColor Yellow
    }
    else {
        New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
        Write-Host "  Created term set: $termSetName" -ForegroundColor Green
    }
}
catch {
    New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
    Write-Host "  Created term set: $termSetName" -ForegroundColor Green
}

$departments = @(
    "Human Resources",
    "Finance",
    "Information Technology",
    "Legal",
    "Marketing",
    "Operations",
    "Executive Leadership"
)
foreach ($dept in $departments) {
    Add-TermIfNotExists -TermSetName $termSetName -TermGroupName $termGroupName -TermName $dept
}

# --- Classification Term Set ---
$termSetName = "Classification"
Write-Host "`n  Term Set: $termSetName" -ForegroundColor Cyan

try {
    $existingSet = Get-PnPTermSet -Identity $termSetName -TermGroup $termGroupName -ErrorAction SilentlyContinue
    if (-not $existingSet) {
        New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
        Write-Host "  Created term set: $termSetName" -ForegroundColor Green
    }
    else {
        Write-Host "  Term set already exists: $termSetName" -ForegroundColor Yellow
    }
}
catch {
    New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
    Write-Host "  Created term set: $termSetName" -ForegroundColor Green
}

$classifications = @("Public", "Internal", "Confidential", "Restricted")
foreach ($cls in $classifications) {
    Add-TermIfNotExists -TermSetName $termSetName -TermGroupName $termGroupName -TermName $cls
}

# --- Process Area Term Set ---
$termSetName = "Process Area"
Write-Host "`n  Term Set: $termSetName" -ForegroundColor Cyan

try {
    $existingSet = Get-PnPTermSet -Identity $termSetName -TermGroup $termGroupName -ErrorAction SilentlyContinue
    if (-not $existingSet) {
        New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
        Write-Host "  Created term set: $termSetName" -ForegroundColor Green
    }
    else {
        Write-Host "  Term set already exists: $termSetName" -ForegroundColor Yellow
    }
}
catch {
    New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
    Write-Host "  Created term set: $termSetName" -ForegroundColor Green
}

$processAreas = @(
    "Onboarding",
    "Procurement",
    "Incident Management",
    "Change Management",
    "Quality Assurance"
)
foreach ($area in $processAreas) {
    Add-TermIfNotExists -TermSetName $termSetName -TermGroupName $termGroupName -TermName $area
}

# --- Project Status Term Set ---
$termSetName = "Project Status"
Write-Host "`n  Term Set: $termSetName" -ForegroundColor Cyan

try {
    $existingSet = Get-PnPTermSet -Identity $termSetName -TermGroup $termGroupName -ErrorAction SilentlyContinue
    if (-not $existingSet) {
        New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
        Write-Host "  Created term set: $termSetName" -ForegroundColor Green
    }
    else {
        Write-Host "  Term set already exists: $termSetName" -ForegroundColor Yellow
    }
}
catch {
    New-PnPTermSet -Name $termSetName -TermGroup $termGroupName
    Write-Host "  Created term set: $termSetName" -ForegroundColor Green
}

$statuses = @("Proposed", "Active", "On Hold", "Completed", "Cancelled")
foreach ($status in $statuses) {
    Add-TermIfNotExists -TermSetName $termSetName -TermGroupName $termGroupName -TermName $status
}

Write-Host "`n=== Taxonomy Deployment Complete ===" -ForegroundColor Magenta
Write-Host "  Term Group: $termGroupName"
Write-Host "  Term Sets:  Department (7), Classification (4), Process Area (5), Project Status (5)"
