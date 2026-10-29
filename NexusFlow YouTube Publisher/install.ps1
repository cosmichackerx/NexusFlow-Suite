#!/usr/bin/env pwsh
# YouTube With Antigravity Installer for Windows

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Installing YouTube With Antigravity Suite           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AntigravitySkillDir = "$env:USERPROFILE\.gemini\config\skills\youtube"
$CredentialsDir = "$env:USERPROFILE\.gemini\antigravity"
$McpConfigFile = "$env:USERPROFILE\.gemini\config\mcp_config.json"

# 1. Create target directories
New-Item -ItemType Directory -Force -Path $AntigravitySkillDir | Out-Null
New-Item -ItemType Directory -Force -Path $CredentialsDir | Out-Null

# 2. Copy skills to Antigravity global skill directory
$SourceSkillPath = Join-Path $ScriptDir "skills\youtube"
if (Test-Path $SourceSkillPath) {
    Write-Host "Installing skills to Antigravity ($AntigravitySkillDir)..." -ForegroundColor Yellow
    Copy-Item -Recurse -Force (Join-Path $SourceSkillPath "*") $AntigravitySkillDir
    Write-Host "Skills installed successfully." -ForegroundColor Green
} else {
    Write-Host "Error: Could not find skills/youtube in $ScriptDir" -ForegroundColor Red
    exit 1
}

# 3. Verify MCP Configuration
Write-Host "Checking MCP server configuration in $McpConfigFile..." -ForegroundColor Yellow
if (Test-Path $McpConfigFile) {
    try {
        $mcpConfig = Get-Content $McpConfigFile -Raw | ConvertFrom-Json
        if (-not $mcpConfig.mcpServers) {
            $mcpConfig | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value ([PSCustomObject]@{})
        }

        # Ensure youtube-with-antigravity is registered
        $agMcpPath = Join-Path $ScriptDir "mcp\server.js"
        $mcpConfig.mcpServers | Add-Member -MemberType NoteProperty -Name "youtube-with-antigravity" -Value ([PSCustomObject]@{
            command = "node"
            args = @($agMcpPath)
        }) -Force

        $mcpConfig | ConvertTo-Json -Depth 5 | Set-Content $McpConfigFile
        Write-Host "MCP server 'youtube-with-antigravity' registered successfully in mcp_config.json." -ForegroundColor Green
    } catch {
        Write-Host "Notice: MCP configuration update failed ($($_.Exception.Message))" -ForegroundColor Gray
    }
}

# 4. Check Environment
Write-Host ""
Write-Host "Verifying Runtime Prerequisites..." -ForegroundColor Yellow
try {
    $nodeVer = node -v 2>&1
    Write-Host "Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "Warning: Node.js is required to run cli.js and the pipeline." -ForegroundColor Yellow
}

try {
    $pyVer = python --version 2>&1
    Write-Host "Python detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "Notice: Python is recommended for YouTube API execution scripts." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "Suite Location   : $ScriptDir" -ForegroundColor Cyan
Write-Host "Skill Location   : $AntigravitySkillDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Slash Commands in Antigravity:" -ForegroundColor Cyan
Write-Host "  /youtube audit        - 4-subagent channel health audit"
Write-Host "  /youtube ideate       - 10 data-driven video concepts"
Write-Host "  /youtube script       - Retention-engineered video script"
Write-Host "  /youtube hook         - 5 hook variants with drop-off risk"
Write-Host "  /youtube thumbnail    - 16:9 thumbnail brief & AI generation"
Write-Host "  /youtube seo          - Comprehensive SEO package (Search/Browse/Hybrid)"
Write-Host "  /youtube metadata     - Copy-paste upload package & automated queueing"
Write-Host "  /youtube shorts       - High-retention Shorts production package"
Write-Host "  /youtube competitor   - Outlier video and keyword gap intelligence"
Write-Host "  /youtube analyze      - Analytics diagnosis and retention curve fixes"
Write-Host "  /youtube monetize     - 7 revenue streams and sponsor rate cards"
Write-Host ""
Write-Host "CLI Commands:" -ForegroundColor Cyan
Write-Host "  node cli.js status    - View system, videos, and YouTube session state"
Write-Host "  node cli.js pipeline  - Run full automated NexusFlow -> YouTube pipeline"
Write-Host "==========================================================" -ForegroundColor Cyan
