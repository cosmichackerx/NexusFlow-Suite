#!/usr/bin/env bash
# Antigravity YouTube Creator Suite Installer for Linux/macOS
set -euo pipefail

main() {
    echo "=== Installing Antigravity YouTube Creator Suite ==="

    ANTIGRAVITY_SKILL_DIR="${HOME}/.gemini/config/skills/youtube"
    CREDENTIALS_DIR="${HOME}/.gemini/antigravity"
    CLAUDE_SKILL_DIR="${HOME}/.claude/skills/youtube"

    mkdir -p "${ANTIGRAVITY_SKILL_DIR}"
    mkdir -p "${CREDENTIALS_DIR}"

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    LOCAL_SKILL="${SCRIPT_DIR}/skills/youtube"

    if [ ! -d "${LOCAL_SKILL}" ]; then
        LOCAL_SKILL="${SCRIPT_DIR}/skills/claude-youtube"
    fi

    if [ -d "${LOCAL_SKILL}" ]; then
        echo "Installing from local repository..."
        cp -r "${LOCAL_SKILL}/"* "${ANTIGRAVITY_SKILL_DIR}/"
    else
        REPO_URL="https://github.com/AgriciDaniel/claude-youtube"
        TEMP_DIR=$(mktemp -d)
        trap 'rm -rf "${TEMP_DIR}"' EXIT

        echo "Downloading Antigravity YouTube Creator Suite..."
        git clone --depth 1 "${REPO_URL}" "${TEMP_DIR}"

        CLONED_SOURCE="${TEMP_DIR}/skills/youtube"
        if [ ! -d "${CLONED_SOURCE}" ]; then
            CLONED_SOURCE="${TEMP_DIR}/skills/claude-youtube"
        fi
        cp -r "${CLONED_SOURCE}/"* "${ANTIGRAVITY_SKILL_DIR}/"
    fi

    if [ -d "${HOME}/.claude" ]; then
        mkdir -p "${CLAUDE_SKILL_DIR}"
        cp -r "${ANTIGRAVITY_SKILL_DIR}/"* "${CLAUDE_SKILL_DIR}/" || true
        echo "Also mirrored to Claude Code skills directory."
    fi

    echo ""
    echo "Antigravity YouTube Creator Suite installed successfully!"
    echo "Installed to: ${ANTIGRAVITY_SKILL_DIR}"
    echo ""
    echo "Usage in Antigravity:"
    echo "  /youtube audit"
    echo "  /youtube ideate"
    echo "  /youtube script"
    echo "  /youtube seo"
}

main "$@"
