#!/usr/bin/env pwsh
# Antigravity YouTube Creator Suite Uninstaller for Windows

$ErrorActionPreference = "Stop"

Write-Host "=== Uninstalling Antigravity YouTube Creator Suite ===" -ForegroundColor Cyan
Write-Host ""

$AntigravitySkillDir = Join-Path $env:USERPROFILE ".gemini" "config" "skills" "youtube"
if (Test-Path $AntigravitySkillDir) {
    Remove-Item -Recurse -Force $AntigravitySkillDir
    Write-Host "  Removed: $AntigravitySkillDir" -ForegroundColor Green
}

$ClaudeSkillDir = Join-Path $env:USERPROFILE ".claude" "skills" "youtube"
if (Test-Path $ClaudeSkillDir) {
    Remove-Item -Recurse -Force $ClaudeSkillDir
    Write-Host "  Removed: $ClaudeSkillDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Antigravity YouTube Creator Suite uninstalled ===" -ForegroundColor Cyan
