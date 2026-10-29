#!/usr/bin/env bash
# Antigravity YouTube Creator Skills Suite Installer for Unix/macOS
# Installs and registers all 11 skills into Google Antigravity (AGY)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_SKILLS_DIR="$HOME/.gemini/config/skills"
GLOBAL_PLUGIN_DIR="$HOME/.gemini/config/plugins/youtube-creator-skills"
WORKSPACE_AGENTS_DIR="$SCRIPT_DIR/.agents/skills"

echo "========================================================"
echo "  Installing Antigravity YouTube Creator Skills Suite   "
echo "========================================================"
echo ""

mkdir -p "$GLOBAL_SKILLS_DIR"
mkdir -p "$GLOBAL_PLUGIN_DIR"
mkdir -p "$WORKSPACE_AGENTS_DIR"

SOURCE_SKILLS_DIR="$SCRIPT_DIR/skills"

if [ ! -d "$SOURCE_SKILLS_DIR" ]; then
    echo "Error: skills directory not found at $SOURCE_SKILLS_DIR"
    exit 1
fi

echo "Registering 11 Creator Skills into Antigravity Global Environment..."
for skill_dir in "$SOURCE_SKILLS_DIR"/*; do
    if [ -d "$skill_dir" ]; then
        skill_name="$(basename "$skill_dir")"
        cp -R "$skill_dir" "$GLOBAL_SKILLS_DIR/"
        cp -R "$skill_dir" "$WORKSPACE_AGENTS_DIR/"
        echo "  [OK] $skill_name"
    fi
done

echo ""
echo "Configuring Antigravity Plugin..."
cp -R "$SCRIPT_DIR"/* "$GLOBAL_PLUGIN_DIR/" 2>/dev/null || true
echo "  [OK] Plugin registered at $GLOBAL_PLUGIN_DIR"

echo ""
echo "Installation Complete! 11 Antigravity Creator Skills are now active."
