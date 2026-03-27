<#
.SYNOPSIS
    Master orchestrator for Contoso Intranet Hub deployment.

.DESCRIPTION
    Executes all provisioning scripts in the correct order to deploy the
    complete Contoso Intranet Hub to a SharePoint Online tenant. Each step
    is timed, logged, and wrapped in error handling. Individual scripts are
    idempotent and safe to re-run.

.PARAMETER TenantUrl
    The root URL of the SharePoint Online tenant (e.g., https://contoso.sharepoint.com).

.PARAMETER AdminEmail
    The email address of the SharePoint/Global administrator running the deployment.

.PARAMETER SkipSampleData
    If specified, skips the sample data import step.

.EXAMPLE
    .\Deploy-IntranetHub.ps1 -TenantUrl "https://contoso.sharepoint.com" -AdminEmail "admin@contoso.onmicrosoft.com"

.EXAMPLE
    .\Deploy-IntranetHub.ps1 -TenantUrl "https://contoso.sharepoint.com" -AdminEmail "admin@contoso.onmicrosoft.com" -SkipSampleData
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://[\w-]+\.sharepoint\.com$')]
    [string]$TenantUrl,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[\w.+-]+@[\w-]+\.[\w.]+$')]
    [string]$AdminEmail,

    [Parameter(Mandatory = $false)]
    [switch]$SkipSampleData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$ScriptRoot = $PSScriptRoot
$AdminUrl = $TenantUrl -replace '\.sharepoint\.com$', '-admin.sharepoint.com'
$LogFile = Join-Path $ScriptRoot "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$TotalStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "SUCCESS")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"

    switch ($Level) {
        "INFO"    { Write-Host $logEntry -ForegroundColor Cyan }
        "WARN"    { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
    }

    $logEntry | Out-File -FilePath $LogFile -Append -Encoding utf8
}

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."

    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-Log "PowerShell 7.x or later is required. Current version: $($PSVersionTable.PSVersion)" -Level "ERROR"
        throw "PowerShell version requirement not met."
    }
    Write-Log "PowerShell version: $($PSVersionTable.PSVersion)" -Level "SUCCESS"

    # Check PnP.PowerShell module
    $pnpModule = Get-Module -ListAvailable -Name "PnP.PowerShell" | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        Write-Log "PnP.PowerShell module not found. Install it with: Install-Module -Name PnP.PowerShell -Scope CurrentUser" -Level "ERROR"
        throw "PnP.PowerShell module is not installed."
    }
    Write-Log "PnP.PowerShell version: $($pnpModule.Version)" -Level "SUCCESS"

    # Verify all sub-scripts exist
    $requiredScripts = @(
        "New-HubSiteTopology.ps1",
        "Deploy-Taxonomy.ps1",
        "Deploy-ContentTypes.ps1",
        "Deploy-Theme.ps1",
        "Deploy-SiteDesigns.ps1",
        "Deploy-Navigation.ps1",
        "Set-Permissions.ps1",
        "Import-SampleData.ps1"
    )

    foreach ($script in $requiredScripts) {
        $scriptPath = Join-Path $ScriptRoot $script
        if (-not (Test-Path $scriptPath)) {
            Write-Log "Required script not found: $scriptPath" -Level "ERROR"
            throw "Missing required script: $script"
        }
    }
    Write-Log "All required scripts found." -Level "SUCCESS"
}

# ---------------------------------------------------------------------------
# Step runner
# ---------------------------------------------------------------------------
function Invoke-DeploymentStep {
    param(
        [string]$StepName,
        [string]$ScriptName,
        [hashtable]$Parameters
    )

    $stepStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Log "========================================" -Level "INFO"
    Write-Log "STARTING: $StepName" -Level "INFO"
    Write-Log "========================================" -Level "INFO"

    try {
        $scriptPath = Join-Path $ScriptRoot $ScriptName
        & $scriptPath @Parameters
        $stepStopwatch.Stop()
        Write-Log "COMPLETED: $StepName ($('{0:mm\:ss}' -f $stepStopwatch.Elapsed))" -Level "SUCCESS"
    }
    catch {
        $stepStopwatch.Stop()
        Write-Log "FAILED: $StepName after $('{0:mm\:ss}' -f $stepStopwatch.Elapsed)" -Level "ERROR"
        Write-Log "Error: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

# ---------------------------------------------------------------------------
# Main deployment
# ---------------------------------------------------------------------------
try {
    Write-Log "================================================================"
    Write-Log "  Contoso Intranet Hub - Deployment Started"
    Write-Log "  Tenant:     $TenantUrl"
    Write-Log "  Admin:      $AdminEmail"
    Write-Log "  Admin URL:  $AdminUrl"
    Write-Log "  Log file:   $LogFile"
    Write-Log "================================================================"

    # Check prerequisites
    Test-Prerequisites

    # Connect to SharePoint Admin Center
    Write-Log "Connecting to SharePoint Admin Center: $AdminUrl"
    Connect-PnPOnline -Url $AdminUrl -Interactive
    Write-Log "Connected successfully." -Level "SUCCESS"

    $commonParams = @{
        TenantUrl  = $TenantUrl
        AdminEmail = $AdminEmail
    }

    # Step 1: Create hub site topology
    Invoke-DeploymentStep -StepName "Hub Site Topology" `
        -ScriptName "New-HubSiteTopology.ps1" `
        -Parameters $commonParams

    # Step 2: Deploy managed metadata taxonomy
    Invoke-DeploymentStep -StepName "Managed Metadata Taxonomy" `
        -ScriptName "Deploy-Taxonomy.ps1" `
        -Parameters $commonParams

    # Step 3: Deploy content types and site columns
    Invoke-DeploymentStep -StepName "Content Types & Site Columns" `
        -ScriptName "Deploy-ContentTypes.ps1" `
        -Parameters $commonParams

    # Step 4: Apply corporate theme
    Invoke-DeploymentStep -StepName "Corporate Theme" `
        -ScriptName "Deploy-Theme.ps1" `
        -Parameters $commonParams

    # Step 5: Register site designs and site scripts
    Invoke-DeploymentStep -StepName "Site Designs & Scripts" `
        -ScriptName "Deploy-SiteDesigns.ps1" `
        -Parameters $commonParams

    # Step 6: Configure hub navigation
    Invoke-DeploymentStep -StepName "Hub Navigation" `
        -ScriptName "Deploy-Navigation.ps1" `
        -Parameters $commonParams

    # Step 7: Set permissions and groups
    Invoke-DeploymentStep -StepName "Permissions & Groups" `
        -ScriptName "Set-Permissions.ps1" `
        -Parameters $commonParams

    # Step 8: Import sample data (optional)
    if (-not $SkipSampleData) {
        Invoke-DeploymentStep -StepName "Sample Data Import" `
            -ScriptName "Import-SampleData.ps1" `
            -Parameters $commonParams
    }
    else {
        Write-Log "SKIPPED: Sample Data Import (SkipSampleData flag set)" -Level "WARN"
    }

    # Done
    $TotalStopwatch.Stop()
    Write-Log "================================================================"
    Write-Log "  Deployment completed successfully!" -Level "SUCCESS"
    Write-Log "  Total time: $('{0:mm\:ss}' -f $TotalStopwatch.Elapsed)"
    Write-Log "  Hub site:   $TenantUrl/sites/contoso-home"
    Write-Log "  Log file:   $LogFile"
    Write-Log "================================================================"
}
catch {
    $TotalStopwatch.Stop()
    Write-Log "================================================================" -Level "ERROR"
    Write-Log "  Deployment FAILED after $('{0:mm\:ss}' -f $TotalStopwatch.Elapsed)" -Level "ERROR"
    Write-Log "  Error: $($_.Exception.Message)" -Level "ERROR"
    Write-Log "  See log file: $LogFile" -Level "ERROR"
    Write-Log "================================================================" -Level "ERROR"
    exit 1
}
