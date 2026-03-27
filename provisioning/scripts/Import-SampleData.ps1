<#
.SYNOPSIS
    Imports sample data into the Contoso Intranet for demonstration purposes.

.DESCRIPTION
    Seeds sample data from CSV files into the intranet sites:
    - Announcements (10 items) on contoso-home
    - Projects (8 items) on contoso-projects
    - Navigation nodes (12 items) on contoso-home Navigation list
    - Documents with metadata (15 items) on contoso-docs
    - Knowledge articles (10 site pages) on contoso-knowledge

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

$SampleDataPath = Join-Path $PSScriptRoot "..\sample-data"
$HubUrl = "$TenantUrl/sites/contoso-home"
$DocsUrl = "$TenantUrl/sites/contoso-docs"
$ProjectsUrl = "$TenantUrl/sites/contoso-projects"
$KnowledgeUrl = "$TenantUrl/sites/contoso-knowledge"

# ---------------------------------------------------------------------------
# Step 1: Import Announcements
# ---------------------------------------------------------------------------
function Import-Announcements {
    Write-Host "`n--- Importing Announcements ---" -ForegroundColor Cyan

    Connect-PnPOnline -Url $HubUrl -Interactive

    # Ensure Announcements list exists
    $listName = "Announcements"
    $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    if (-not $list) {
        New-PnPList -Title $listName -Template Announcements -EnableVersioning
        Write-Host "  Created list: $listName" -ForegroundColor Green

        # Add custom columns
        Add-PnPField -List $listName -DisplayName "Department" -InternalName "AnnDepartment" -Type Text
        Add-PnPField -List $listName -DisplayName "Priority" -InternalName "AnnPriority" -Type Choice `
            -Choices @("Low", "Normal", "High", "Critical")
    }

    $csvPath = Join-Path $SampleDataPath "announcements.csv"
    if (-not (Test-Path $csvPath)) {
        Write-Host "  CSV not found: $csvPath" -ForegroundColor Yellow
        return
    }

    $items = Import-Csv -Path $csvPath
    $count = 0

    foreach ($item in $items) {
        $values = @{
            "Title"         = $item.Title
            "Body"          = $item.Body
            "AnnDepartment" = $item.Department
            "AnnPriority"   = $item.Priority
            "Expires"       = [DateTime]::Parse($item.ExpiryDate)
        }

        Add-PnPListItem -List $listName -Values $values | Out-Null
        $count++
        Write-Host "    [$count] $($item.Title)" -ForegroundColor Gray
    }

    Write-Host "  Imported $count announcements." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Step 2: Import Projects
# ---------------------------------------------------------------------------
function Import-Projects {
    Write-Host "`n--- Importing Projects ---" -ForegroundColor Cyan

    Connect-PnPOnline -Url $ProjectsUrl -Interactive

    # Ensure Projects list exists
    $listName = "Projects"
    $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    if (-not $list) {
        New-PnPList -Title $listName -Template GenericList -EnableVersioning
        Write-Host "  Created list: $listName" -ForegroundColor Green

        Add-PnPField -List $listName -DisplayName "Status" -InternalName "ProjectStatus" -Type Choice `
            -Choices @("Proposed", "Active", "On Hold", "Completed", "Cancelled")
        Add-PnPField -List $listName -DisplayName "Department" -InternalName "ProjectDepartment" -Type Text
        Add-PnPField -List $listName -DisplayName "Start Date" -InternalName "ProjectStartDate" -Type DateTime
        Add-PnPField -List $listName -DisplayName "End Date" -InternalName "ProjectEndDate" -Type DateTime
        Add-PnPField -List $listName -DisplayName "Owner" -InternalName "ProjectOwner" -Type Text
        Add-PnPField -List $listName -DisplayName "Description" -InternalName "ProjectDescription" -Type Note
    }

    $csvPath = Join-Path $SampleDataPath "projects.csv"
    if (-not (Test-Path $csvPath)) {
        Write-Host "  CSV not found: $csvPath" -ForegroundColor Yellow
        return
    }

    $items = Import-Csv -Path $csvPath
    $count = 0

    foreach ($item in $items) {
        $values = @{
            "Title"              = $item.Title
            "ProjectStatus"      = $item.Status
            "ProjectDepartment"  = $item.Department
            "ProjectStartDate"   = [DateTime]::Parse($item.StartDate)
            "ProjectEndDate"     = [DateTime]::Parse($item.EndDate)
            "ProjectOwner"       = $item.Owner
            "ProjectDescription" = $item.Description
        }

        Add-PnPListItem -List $listName -Values $values | Out-Null
        $count++
        Write-Host "    [$count] $($item.Title)" -ForegroundColor Gray
    }

    Write-Host "  Imported $count projects." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Step 3: Import Navigation Nodes (Mega Menu)
# ---------------------------------------------------------------------------
function Import-NavigationNodes {
    Write-Host "`n--- Importing Navigation Nodes ---" -ForegroundColor Cyan

    Connect-PnPOnline -Url $HubUrl -Interactive

    $listName = "Navigation"
    $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    if (-not $list) {
        Write-Host "  Navigation list not found. Run Deploy-Navigation.ps1 first." -ForegroundColor Yellow
        return
    }

    $csvPath = Join-Path $SampleDataPath "navigation-nodes.csv"
    if (-not (Test-Path $csvPath)) {
        Write-Host "  CSV not found: $csvPath" -ForegroundColor Yellow
        return
    }

    $items = Import-Csv -Path $csvPath
    $count = 0

    foreach ($item in $items) {
        $values = @{
            "Title"          = $item.Title
            "NavUrl"         = "$($item.Url), $($item.Title)"
            "NavParent"      = $item.Parent
            "NavSortOrder"   = [int]$item.Order
            "NavOpenInNewTab" = [bool]([int]$item.OpenInNewTab)
        }

        Add-PnPListItem -List $listName -Values $values | Out-Null
        $count++
        Write-Host "    [$count] $($item.Title)" -ForegroundColor Gray
    }

    Write-Host "  Imported $count navigation nodes." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Step 4: Create sample documents with metadata
# ---------------------------------------------------------------------------
function Import-SampleDocuments {
    Write-Host "`n--- Creating Sample Documents ---" -ForegroundColor Cyan

    Connect-PnPOnline -Url $DocsUrl -Interactive

    $docLib = "Documents"

    # Create sample text files with metadata
    $documents = @(
        @{ Name = "POL-0001-Information-Security-Policy.docx";          CT = "Policy Document";               Dept = "Information Technology"; Class = "Internal";     Status = "Approved";   PolicyNum = "POL-0001" },
        @{ Name = "POL-0002-Data-Protection-Policy.docx";               CT = "Policy Document";               Dept = "Legal";                  Class = "Confidential"; Status = "Approved";   PolicyNum = "POL-0002" },
        @{ Name = "POL-0003-Acceptable-Use-Policy.docx";                CT = "Policy Document";               Dept = "Information Technology"; Class = "Internal";     Status = "Approved";   PolicyNum = "POL-0003" },
        @{ Name = "POL-0004-Remote-Work-Policy.docx";                   CT = "Policy Document";               Dept = "Human Resources";        Class = "Internal";     Status = "Draft";      PolicyNum = "POL-0004" },
        @{ Name = "SOP-Onboarding-New-Employees.docx";                  CT = "Standard Operating Procedure";  Dept = "Human Resources";        Class = "Internal";     SOPVer = "2.1" },
        @{ Name = "SOP-Incident-Response-Procedure.docx";               CT = "Standard Operating Procedure";  Dept = "Information Technology"; Class = "Confidential"; SOPVer = "3.0" },
        @{ Name = "SOP-Procurement-Request-Process.docx";               CT = "Standard Operating Procedure";  Dept = "Finance";                Class = "Internal";     SOPVer = "1.5" },
        @{ Name = "SOP-Change-Management-Process.docx";                 CT = "Standard Operating Procedure";  Dept = "Operations";             Class = "Internal";     SOPVer = "1.0" },
        @{ Name = "CONTRACT-CloudServices-Vendor-Agreement.docx";       CT = "Contract";                      Dept = "Information Technology"; Class = "Confidential"; Vendor = "Azure Cloud Services Inc." },
        @{ Name = "CONTRACT-Office-Lease-Agreement.docx";               CT = "Contract";                      Dept = "Operations";             Class = "Restricted";   Vendor = "Metro Commercial Properties" },
        @{ Name = "CONTRACT-Benefits-Provider-Agreement.docx";          CT = "Contract";                      Dept = "Human Resources";        Class = "Confidential"; Vendor = "National Benefits Group" },
        @{ Name = "TEMPLATE-Project-Charter.docx";                      CT = "Template";                      Dept = "Operations";             Class = "Internal" },
        @{ Name = "TEMPLATE-Meeting-Minutes.docx";                      CT = "Template";                      Dept = "Executive Leadership";   Class = "Internal" },
        @{ Name = "TEMPLATE-Business-Case.docx";                        CT = "Template";                      Dept = "Finance";                Class = "Internal" },
        @{ Name = "TEMPLATE-Risk-Assessment.docx";                      CT = "Template";                      Dept = "Operations";             Class = "Internal" }
    )

    $count = 0
    foreach ($doc in $documents) {
        # Create a minimal placeholder file
        $tempFile = [System.IO.Path]::GetTempFileName()
        "This is a sample document for the Contoso Intranet Hub demonstration. Document: $($doc.Name)" | Set-Content -Path $tempFile

        $targetPath = "$docLib/$($doc.Name)"

        try {
            # Upload file
            Add-PnPFile -Path $tempFile -Folder $docLib -FileName $doc.Name -ErrorAction Stop | Out-Null

            # Set metadata (content type and columns)
            $listItem = Get-PnPFile -Url "/sites/contoso-docs/$targetPath" -AsListItem -ErrorAction SilentlyContinue

            if ($listItem) {
                $metadataValues = @{
                    "ContentType" = $doc.CT
                }

                if ($doc.ContainsKey("PolicyNum")) {
                    $metadataValues["ContosoPolicyNumber"] = $doc.PolicyNum
                }
                if ($doc.ContainsKey("Status")) {
                    $metadataValues["ContosoApprovalStatus"] = $doc.Status
                }
                if ($doc.ContainsKey("SOPVer")) {
                    $metadataValues["ContosoSOPVersion"] = $doc.SOPVer
                }
                if ($doc.ContainsKey("Vendor")) {
                    $metadataValues["ContosoVendor"] = $doc.Vendor
                }

                Set-PnPListItem -List $docLib -Identity $listItem.Id -Values $metadataValues | Out-Null
            }

            $count++
            Write-Host "    [$count] $($doc.Name)" -ForegroundColor Gray
        }
        catch {
            Write-Host "    Warning: Could not upload $($doc.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
        finally {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "  Uploaded $count sample documents." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Step 5: Create knowledge articles (site pages)
# ---------------------------------------------------------------------------
function Import-KnowledgeArticles {
    Write-Host "`n--- Creating Knowledge Articles ---" -ForegroundColor Cyan

    Connect-PnPOnline -Url $KnowledgeUrl -Interactive

    $articles = @(
        @{ Name = "how-to-submit-expense-report";     Title = "How to Submit an Expense Report" },
        @{ Name = "onboarding-checklist";              Title = "New Employee Onboarding Checklist" },
        @{ Name = "vpn-setup-guide";                   Title = "VPN Setup Guide for Remote Workers" },
        @{ Name = "sharepoint-tips-and-tricks";        Title = "SharePoint Tips and Tricks" },
        @{ Name = "password-reset-instructions";       Title = "Password Reset Instructions" },
        @{ Name = "booking-conference-rooms";          Title = "How to Book Conference Rooms" },
        @{ Name = "travel-request-process";            Title = "Travel Request Process" },
        @{ Name = "it-service-catalog";                Title = "IT Service Catalog Overview" },
        @{ Name = "brand-guidelines-quick-reference";  Title = "Brand Guidelines Quick Reference" },
        @{ Name = "emergency-procedures";              Title = "Emergency Procedures and Contacts" }
    )

    $count = 0
    foreach ($article in $articles) {
        try {
            $existingPage = Get-PnPPage -Identity $article.Name -ErrorAction SilentlyContinue
            if ($existingPage) {
                Write-Host "    Page exists: $($article.Title)" -ForegroundColor Yellow
                $count++
                continue
            }

            Add-PnPPage -Name $article.Name -Title $article.Title -LayoutType Article
            $count++
            Write-Host "    [$count] $($article.Title)" -ForegroundColor Gray
        }
        catch {
            Write-Host "    Warning: Could not create page $($article.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    Write-Host "  Created $count knowledge articles." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host "`n=== Importing Sample Data ===" -ForegroundColor Magenta

Import-Announcements
Import-Projects
Import-NavigationNodes
Import-SampleDocuments
Import-KnowledgeArticles

Write-Host "`n=== Sample Data Import Complete ===" -ForegroundColor Magenta
Write-Host "  Announcements: 10 items on contoso-home"
Write-Host "  Projects:      8 items on contoso-projects"
Write-Host "  Navigation:    12 items on contoso-home"
Write-Host "  Documents:     15 files on contoso-docs"
Write-Host "  Articles:      10 pages on contoso-knowledge"
