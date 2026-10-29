# One-click MCP and Skill installer for NexusFlow YouTube Studio Monitor & Manager
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mcpServerPath = Join-Path $scriptDir "mcp\server.js"

Write-Host "=== NexusFlow YouTube Studio Monitor & Manager Installer ===" -ForegroundColor Cyan
Write-Host "Target server script: $mcpServerPath" -ForegroundColor Gray

# Locate Antigravity MCP directory
$antigravityMcpDir = "$env:USERPROFILE\.gemini\antigravity\mcp\youtube-studio-monitor"
if (-not (Test-Path $antigravityMcpDir)) {
    New-Item -ItemType Directory -Path $antigravityMcpDir -Force | Out-Null
}

$schemaJson = @{
    name = "youtube-studio-monitor"
    command = "node"
    args = @($mcpServerPath)
} | ConvertTo-Json -Depth 5

$schemaPath = Join-Path $antigravityMcpDir "mcp.json"
Set-Content -Path $schemaPath -Value $schemaJson -Encoding UTF8

Write-Host "[OK] MCP Configuration registered at: $schemaPath" -ForegroundColor Green
Write-Host "[OK] Installation completed successfully!" -ForegroundColor Green
