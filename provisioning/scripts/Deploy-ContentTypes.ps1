<#
.SYNOPSIS
    Deploys Contoso Intranet content types and site columns.

.DESCRIPTION
    Creates site columns and content types in the Content Type Hub, then
    publishes them to all intranet sites.

    Content Type Hierarchy:
    - Contoso Document (base, inherits from Document)
      - Policy Document
      - Standard Operating Procedure
      - Contract
      - Template

    Idempotent: checks for existing columns and content types before creating.

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
$DocsUrl = "$TenantUrl/sites/contoso-docs"
$ColumnGroup = "Contoso Columns"
$ContentTypeGroup = "Contoso Content Types"
$TermGroupName = "Contoso Taxonomy"

# ---------------------------------------------------------------------------
# Helper: Add a site column if it doesn't exist
# ---------------------------------------------------------------------------
function Add-SiteColumnIfNotExists {
    param(
        [string]$DisplayName,
        [string]$InternalName,
        [string]$Type,
        [string]$Group = $ColumnGroup,
        [hashtable]$AdditionalProperties = @{}
    )

    $existingField = Get-PnPField -Identity $InternalName -ErrorAction SilentlyContinue
    if ($existingField) {
        Write-Host "    Column exists: $DisplayName ($InternalName)" -ForegroundColor Yellow
        return
    }

    $params = @{
        DisplayName  = $DisplayName
        InternalName = $InternalName
        Type         = $Type
        Group        = $Group
    }

    # Merge additional properties
    foreach ($key in $AdditionalProperties.Keys) {
        $params[$key] = $AdditionalProperties[$key]
    }

    Add-PnPField @params
    Write-Host "    Created column: $DisplayName ($InternalName)" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Helper: Add a taxonomy field if it doesn't exist
# ---------------------------------------------------------------------------
function Add-TaxonomyFieldIfNotExists {
    param(
        [string]$DisplayName,
        [string]$InternalName,
        [string]$TermSetName,
        [string]$Group = $ColumnGroup,
        [bool]$Required = $false
    )

    $existingField = Get-PnPField -Identity $InternalName -ErrorAction SilentlyContinue
    if ($existingField) {
        Write-Host "    Taxonomy column exists: $DisplayName ($InternalName)" -ForegroundColor Yellow
        return
    }

    $termSet = Get-PnPTermSet -Identity $TermSetName -TermGroup $TermGroupName
    if (-not $termSet) {
        throw "Term set not found: $TermSetName. Run Deploy-Taxonomy.ps1 first."
    }

    Add-PnPTaxonomyField `
        -DisplayName $DisplayName `
        -InternalName $InternalName `
        -TermSetPath "$TermGroupName|$TermSetName" `
        -Group $Group `
        -Required:$Required

    Write-Host "    Created taxonomy column: $DisplayName ($InternalName)" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Helper: Add a content type if it doesn't exist
# ---------------------------------------------------------------------------
function Add-ContentTypeIfNotExists {
    param(
        [string]$Name,
        [string]$ParentContentType,
        [string]$Group = $ContentTypeGroup,
        [string]$Description = ""
    )

    $existing = Get-PnPContentType -Identity $Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "    Content type exists: $Name" -ForegroundColor Yellow
        return $existing
    }

    $ct = Add-PnPContentType `
        -Name $Name `
        -ParentContentType $ParentContentType `
        -Group $Group `
        -Description $Description

    Write-Host "    Created content type: $Name" -ForegroundColor Green
    return $ct
}

# ---------------------------------------------------------------------------
# Helper: Add field to content type (if not already linked)
# ---------------------------------------------------------------------------
function Add-FieldToContentTypeIfNotExists {
    param(
        [string]$FieldInternalName,
        [string]$ContentTypeName,
        [bool]$Required = $false
    )

    $ct = Get-PnPContentType -Identity $ContentTypeName
    $fields = Get-PnPProperty -ClientObject $ct -Property "Fields"

    $alreadyLinked = $fields | Where-Object { $_.InternalName -eq $FieldInternalName }
    if ($alreadyLinked) {
        Write-Host "      Field already in content type: $FieldInternalName -> $ContentTypeName" -ForegroundColor Yellow
        return
    }

    Add-PnPFieldToContentType -Field $FieldInternalName -ContentType $ContentTypeName -Required:$Required
    Write-Host "      Added field: $FieldInternalName -> $ContentTypeName" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Deploying Content Types & Site Columns ===" -ForegroundColor Magenta

# Connect to hub site
Write-Host "Connecting to hub site: $HubUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $HubUrl -Interactive

# ===== STEP 1: Create Site Columns =====
Write-Host "`n--- Creating Site Columns ---" -ForegroundColor Cyan

# Shared columns (Contoso Document base)
Add-TaxonomyFieldIfNotExists -DisplayName "Department" -InternalName "ContosoDepartment" `
    -TermSetName "Department" -Required $true

Add-TaxonomyFieldIfNotExists -DisplayName "Classification" -InternalName "ContosoClassification" `
    -TermSetName "Classification" -Required $true

Add-SiteColumnIfNotExists -DisplayName "Document Owner" -InternalName "ContosoDocumentOwner" `
    -Type "User"

Add-SiteColumnIfNotExists -DisplayName "Review Date" -InternalName "ContosoReviewDate" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

# Policy Document columns
Add-SiteColumnIfNotExists -DisplayName "Effective Date" -InternalName "ContosoEffectiveDate" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

Add-SiteColumnIfNotExists -DisplayName "Expiry Date" -InternalName "ContosoExpiryDate" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

Add-SiteColumnIfNotExists -DisplayName "Approval Status" -InternalName "ContosoApprovalStatus" `
    -Type "Choice" -AdditionalProperties @{
        Choices = @("Draft", "Pending Review", "Approved", "Retired")
    }

Add-SiteColumnIfNotExists -DisplayName "Policy Number" -InternalName "ContosoPolicyNumber" `
    -Type "Text"

# SOP columns
Add-SiteColumnIfNotExists -DisplayName "SOP Version" -InternalName "ContosoSOPVersion" `
    -Type "Text"

Add-TaxonomyFieldIfNotExists -DisplayName "Process Area" -InternalName "ContosoProcessArea" `
    -TermSetName "Process Area"

Add-SiteColumnIfNotExists -DisplayName "Last Reviewed By" -InternalName "ContosoLastReviewedBy" `
    -Type "User"

# Contract columns
Add-SiteColumnIfNotExists -DisplayName "Vendor" -InternalName "ContosoVendor" `
    -Type "Text"

Add-SiteColumnIfNotExists -DisplayName "Contract Value" -InternalName "ContosoContractValue" `
    -Type "Currency"

Add-SiteColumnIfNotExists -DisplayName "Contract Start Date" -InternalName "ContosoContractStartDate" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

Add-SiteColumnIfNotExists -DisplayName "Contract End Date" -InternalName "ContosoContractEndDate" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

Add-SiteColumnIfNotExists -DisplayName "Auto Renew" -InternalName "ContosoAutoRenew" `
    -Type "Boolean"

# Template columns
Add-TaxonomyFieldIfNotExists -DisplayName "Template Category" -InternalName "ContosoTemplateCategory" `
    -TermSetName "Department"

Add-SiteColumnIfNotExists -DisplayName "Last Updated" -InternalName "ContosoLastUpdated" `
    -Type "DateTime" -AdditionalProperties @{ DisplayFormat = "DateOnly" }

# ===== STEP 2: Create Content Types =====
Write-Host "`n--- Creating Content Types ---" -ForegroundColor Cyan

# Base: Contoso Document
Add-ContentTypeIfNotExists -Name "Contoso Document" `
    -ParentContentType "Document" `
    -Description "Base content type for all Contoso corporate documents"

Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoDepartment" -ContentTypeName "Contoso Document" -Required $true
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoClassification" -ContentTypeName "Contoso Document" -Required $true
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoDocumentOwner" -ContentTypeName "Contoso Document"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoReviewDate" -ContentTypeName "Contoso Document"

# Policy Document
Add-ContentTypeIfNotExists -Name "Policy Document" `
    -ParentContentType "Contoso Document" `
    -Description "Corporate policies with approval workflow and expiry tracking"

Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoEffectiveDate" -ContentTypeName "Policy Document"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoExpiryDate" -ContentTypeName "Policy Document"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoApprovalStatus" -ContentTypeName "Policy Document"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoPolicyNumber" -ContentTypeName "Policy Document" -Required $true

# Standard Operating Procedure
Add-ContentTypeIfNotExists -Name "Standard Operating Procedure" `
    -ParentContentType "Contoso Document" `
    -Description "Step-by-step process documentation with version tracking"

Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoSOPVersion" -ContentTypeName "Standard Operating Procedure"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoProcessArea" -ContentTypeName "Standard Operating Procedure"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoLastReviewedBy" -ContentTypeName "Standard Operating Procedure"

# Contract
Add-ContentTypeIfNotExists -Name "Contract" `
    -ParentContentType "Contoso Document" `
    -Description "Vendor and client contracts with financial and date tracking"

Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoVendor" -ContentTypeName "Contract"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoContractValue" -ContentTypeName "Contract"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoContractStartDate" -ContentTypeName "Contract"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoContractEndDate" -ContentTypeName "Contract"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoAutoRenew" -ContentTypeName "Contract"

# Template
Add-ContentTypeIfNotExists -Name "Template" `
    -ParentContentType "Contoso Document" `
    -Description "Reusable document templates managed centrally"

Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoTemplateCategory" -ContentTypeName "Template"
Add-FieldToContentTypeIfNotExists -FieldInternalName "ContosoLastUpdated" -ContentTypeName "Template"

# ===== STEP 3: Add content types to document libraries on contoso-docs =====
Write-Host "`n--- Adding Content Types to Document Libraries ---" -ForegroundColor Cyan

Write-Host "  Connecting to docs site: $DocsUrl" -ForegroundColor Cyan
Connect-PnPOnline -Url $DocsUrl -Interactive

# Enable content type management on the default Documents library
$docLib = Get-PnPList -Identity "Documents" -ErrorAction SilentlyContinue
if ($docLib) {
    Set-PnPList -Identity "Documents" -EnableContentTypes $true
    Write-Host "  Enabled content types on Documents library." -ForegroundColor Green

    # Add each content type to the library
    $contentTypesToAdd = @("Contoso Document", "Policy Document", "Standard Operating Procedure", "Contract", "Template")
    foreach ($ctName in $contentTypesToAdd) {
        try {
            Add-PnPContentTypeToList -List "Documents" -ContentType $ctName
            Write-Host "    Added to Documents library: $ctName" -ForegroundColor Green
        }
        catch {
            if ($_.Exception.Message -like "*already exists*") {
                Write-Host "    Already in Documents library: $ctName" -ForegroundColor Yellow
            }
            else {
                Write-Host "    Warning: Could not add $ctName - $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}
else {
    Write-Host "  Documents library not found on $DocsUrl. Content types will need to be added manually." -ForegroundColor Yellow
}

Write-Host "`n=== Content Types & Site Columns Deployment Complete ===" -ForegroundColor Magenta
