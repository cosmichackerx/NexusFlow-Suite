# Utility script to clean up legacy 'Youtube Studio' folder once the IDE releases the file handle.
$legacyDir = "C:\Users\Arsalan\Desktop\Virutal Server\NexusFlow\Youtube Studio"

if (Test-Path $legacyDir) {
    try {
        Remove-Item -Path $legacyDir -Recurse -Force -ErrorAction Stop
        Write-Host "[OK] Successfully removed legacy folder '$legacyDir'." -ForegroundColor Green
        Write-Host "Active studio folder is now: 'NexusFlow YouTube Studio Monitor & Manager'" -ForegroundColor Cyan
    } catch {
        Write-Host "[NOTE] The folder is still held open by the active IDE or terminal." -ForegroundColor Yellow
        Write-Host "Please close or switch workspace in Antigravity, then re-run this script." -ForegroundColor Gray
    }
} else {
    Write-Host "[INFO] Legacy folder has already been removed." -ForegroundColor Green
}
