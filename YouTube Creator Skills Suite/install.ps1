#!/usr/bin/env pwsh
# Antigravity YouTube Creator Skills Suite Installer for Windows
# Installs and registers all 11 skills into Google Antigravity (AGY)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Installing Antigravity YouTube Creator Skills Suite   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$GlobalSkillDir = "$env:USERPROFILE\.gemini\config\skills"
$GlobalPluginDir = "$env:USERPROFILE\.gemini\config\plugins\youtube-creator-skills"
$WorkspaceAgentsDir = Join-Path $PSScriptRoot ".agents\skills"

# Create destination directories
New-Item -ItemType Directory -Force -Path $GlobalSkillDir | Out-Null
New-Item -ItemType Directory -Force -Path $GlobalPluginDir | Out-Null
New-Item -ItemType Directory -Force -Path $WorkspaceAgentsDir | Out-Null

$SourceSkillsDir = Join-Path $PSScriptRoot "skills"

if (-not (Test-Path $SourceSkillsDir)) {
    Write-Host "Error: skills directory not found at $SourceSkillsDir" -ForegroundColor Red
    exit 1
}

$Skills = Get-ChildItem -Path $SourceSkillsDir -Directory

Write-Host "Registering 11 Creator Skills into Antigravity Global Environment..." -ForegroundColor Yellow
foreach ($skill in $Skills) {
    # 1. Copy to global skills directory (~/.gemini/config/skills/<name>)
    $globalDest = Join-Path $GlobalSkillDir $skill.Name
    Copy-Item -Recurse -Force $skill.FullName $globalDest
    
    # 2. Copy to workspace .agents/skills directory
    $workspaceDest = Join-Path $WorkspaceAgentsDir $skill.Name
    Copy-Item -Recurse -Force $skill.FullName $workspaceDest

    Write-Host "  [OK] $($skill.Name)" -ForegroundColor Green
}

# Copy full plugin metadata to ~/.gemini/config/plugins/youtube-creator-skills
Write-Host ""
Write-Host "Configuring Antigravity Plugin..." -ForegroundColor Yellow
Copy-Item -Recurse -Force (Join-Path $PSScriptRoot "*") $GlobalPluginDir -Exclude ("node_modules", "dist", ".git")
Write-Host "  [OK] Plugin registered at $GlobalPluginDir" -ForegroundColor Green

# Check Python environment
Write-Host ""
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python environment detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Notice: Python is recommended for local transcription (Faster-Whisper)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installation Complete! 11 Antigravity Creator Skills are now active:" -ForegroundColor Cyan
Write-Host "  - youtube-manager    : Channel memory, strategy, and setup profile"
Write-Host "  - creator-voice      : Durable voice and tone profiling (CREATOR_VOICE.md)"
Write-Host "  - topic-scout        : Evidence-backed opportunity scouting and ranking"
Write-Host "  - review-grill       : 1-question-per-turn firsthand product review interviews"
Write-Host "  - video-kit          : Long-form outlines, retention scripts, and packaging"
Write-Host "  - youtube-thumbnail  : 16:9 thumbnail concepts, 3-5 word hook copy, and mockups"
Write-Host "  - youtube-shorts     : Short concepts, scene beats, and text overlays"
Write-Host "  - compose-video      : HyperFrames motion composition and local render"
Write-Host "  - fact-check         : Atomic claim auditing with parallel subagents"
Write-Host "  - social-repurpose   : Platform-native derivative content (Shorts, posts, threads)"
Write-Host "  - youtube-analytics  : Studio metrics diagnosis and retention drop-off fixes"
Write-Host ""
Write-Host "Ready to use in any Antigravity conversation!" -ForegroundColor Green
