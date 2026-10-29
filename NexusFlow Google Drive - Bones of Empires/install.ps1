# Installation and registration script for NexusFlow Google Drive - Bones of Empires
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetSkillsDir = "$env:USERPROFILE\.gemini\config\plugins\nexusflow-gdrive-bones\skills"
$targetSkill = "$targetSkillsDir\google-drive-bones-of-empires"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Installing NexusFlow Google Drive - Bones of Empires Skill" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $targetSkillsDir)) {
    New-Item -ItemType Directory -Path $targetSkillsDir -Force | Out-Null
}

$sourceSkill = Join-Path $scriptDir "skills\google-drive-bones-of-empires"
if (Test-Path $sourceSkill) {
    Copy-Item -Path $sourceSkill -Destination $targetSkillsDir -Recurse -Force
    Write-Host "[OK] Skill successfully registered into: $targetSkill" -ForegroundColor Green
} else {
    Write-Host "[WARN] Source skill directory not found at $sourceSkill" -ForegroundColor Yellow
}

Write-Host "[OK] NexusFlow Google Drive - Bones of Empires module is ready." -ForegroundColor Green
