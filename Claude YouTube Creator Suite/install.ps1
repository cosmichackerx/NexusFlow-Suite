#!/usr/bin/env pwsh
# Antigravity YouTube Creator Suite Installer for Windows

$ErrorActionPreference = "Stop"

Write-Host "=== Installing Antigravity YouTube Creator Suite ===" -ForegroundColor Cyan
Write-Host ""

# Set target directory
$AntigravitySkillDir = "$env:USERPROFILE\.gemini\config\skills\youtube"
$ClaudeSkillDir = "$env:USERPROFILE\.claude\skills\youtube"
$CredentialsDir = "$env:USERPROFILE\.gemini\antigravity"

# Create required directories
New-Item -ItemType Directory -Force -Path $AntigravitySkillDir | Out-Null
New-Item -ItemType Directory -Force -Path $CredentialsDir | Out-Null

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Determine source: local folder or remote git clone
$SourceSkillPath = Join-Path $ScriptDir "skills\youtube"
if (-not (Test-Path $SourceSkillPath)) {
    # Check if inside skills\claude-youtube
    $AltSource = Join-Path $ScriptDir "skills\claude-youtube"
    if (Test-Path $AltSource) {
        $SourceSkillPath = $AltSource
    }
}

if (Test-Path $SourceSkillPath) {
    Write-Host "Installing from local repository..." -ForegroundColor Yellow
    Copy-Item -Recurse -Force (Join-Path $SourceSkillPath "*") $AntigravitySkillDir
} else {
    try {
        git --version | Out-Null
        Write-Host "Git detected" -ForegroundColor Green
    } catch {
        Write-Host "Error: Git is required for remote install." -ForegroundColor Red
        exit 1
    }

    $RepoUrl = "https://github.com/AgriciDaniel/claude-youtube"
    $TempDir = Join-Path $env:TEMP "antigravity-youtube-install-$(Get-Random)"
    try {
        Write-Host "Downloading Antigravity YouTube Creator Suite..." -ForegroundColor Yellow
        git clone --depth 1 $RepoUrl $TempDir 2>&1 | Out-Null
        $ClonedSource = Join-Path $TempDir "skills\youtube"
        if (-not (Test-Path $ClonedSource)) {
            $ClonedSource = Join-Path $TempDir "skills\claude-youtube"
        }
        Copy-Item -Recurse -Force (Join-Path $ClonedSource "*") $AntigravitySkillDir
    } catch {
        Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    } finally {
        if (Test-Path $TempDir) {
            Remove-Item -Recurse -Force $TempDir
        }
    }
}

# Optional mirror to Claude if Claude directory exists
if (Test-Path "$env:USERPROFILE\.claude") {
    try {
        New-Item -ItemType Directory -Force -Path $ClaudeSkillDir | Out-Null
        Copy-Item -Recurse -Force (Join-Path $AntigravitySkillDir "*") $ClaudeSkillDir
        Write-Host "Also mirrored to Claude Code skills directory." -ForegroundColor Gray
    } catch {
        # Non-fatal
    }
}

# Check Python environment
Write-Host ""
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Notice: Python is recommended for execution scripts (fetch channel data, transcripts, etc.)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Antigravity YouTube Creator Suite installed successfully!" -ForegroundColor Green
Write-Host "Installed location: $AntigravitySkillDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Slash Commands & Prompts in Antigravity:" -ForegroundColor Cyan
Write-Host "  /youtube audit        - Full 4-dimension channel audit with parallel subagents"
Write-Host "  /youtube ideate       - 10 data-driven, ranked video concepts"
Write-Host "  /youtube script       - Retention-engineered video script with pattern interrupts"
Write-Host "  /youtube hook         - 5 hook variants with drop-off risk ratings"
Write-Host "  /youtube thumbnail    - 16:9 thumbnail briefs & image generation"
Write-Host "  /youtube seo          - Comprehensive SEO package (titles, description, schema)"
Write-Host "  /youtube metadata     - Copy-paste upload package or direct NexusFlow queue"
Write-Host "  /youtube shorts       - High-retention Shorts production package"
Write-Host "  /youtube competitor   - In-depth competitor intelligence"
Write-Host "  /youtube analyze      - Analytics diagnosis and retention graph fixes"
Write-Host "  /youtube monetize     - 7 revenue streams and sponsor rate cards"
