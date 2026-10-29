# YouTube SEO With Antigravity - One-Click Installer
$ErrorActionPreference = "Stop"
$CurrentDir = $PSScriptRoot
if (-not $CurrentDir) { $CurrentDir = Get-Location }

node "$CurrentDir\install.js"
