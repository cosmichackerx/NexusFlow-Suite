#!/usr/bin/env bash
# Antigravity YouTube Creator Suite Uninstaller
set -euo pipefail

main() {
    echo "Uninstalling Antigravity YouTube Creator Suite..."

    rm -rf "${HOME}/.gemini/config/skills/youtube"
    rm -rf "${HOME}/.claude/skills/youtube"

    echo "Antigravity YouTube Creator Suite uninstalled."
}

main "$@"
