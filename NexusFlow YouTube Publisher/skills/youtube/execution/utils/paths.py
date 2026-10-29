"""
Paths and environment resolver for Antigravity YouTube Creator Suite.

Provides cross-platform paths for credentials, tokens, temporary files, and quota tracking.
Native to Google Antigravity (~/.gemini/antigravity or ~/.gemini/config) while maintaining
full backward compatibility with Claude Code (~/.claude) and system temp fallbacks.
"""

import os
import tempfile
from pathlib import Path


def get_tmp_dir() -> Path:
    """Return path to temporary workspace directory, creating if needed."""
    if "ANTIGRAVITY_TMP_DIR" in os.environ:
        p = Path(os.environ["ANTIGRAVITY_TMP_DIR"])
        p.mkdir(parents=True, exist_ok=True)
        return p

    # Priority 1: ~/.gemini/antigravity/.tmp
    primary = Path.home() / ".gemini" / "antigravity" / ".tmp"
    try:
        primary.mkdir(parents=True, exist_ok=True)
        return primary
    except Exception:
        pass

    # Priority 2: ~/.claude/.tmp (if it already exists)
    claude_tmp = Path.home() / ".claude" / ".tmp"
    if claude_tmp.exists():
        return claude_tmp

    # Priority 3: System temp directory
    fallback = Path(tempfile.gettempdir()) / "antigravity_youtube"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback


def get_credentials_path() -> Path:
    """Return path to YouTube Data API credentials JSON file."""
    if "YOUTUBE_CREDENTIALS_PATH" in os.environ:
        return Path(os.environ["YOUTUBE_CREDENTIALS_PATH"])

    candidates = [
        Path.home() / ".gemini" / "antigravity" / "youtube-credentials.json",
        Path.home() / ".gemini" / "config" / "youtube-credentials.json",
        Path.home() / ".claude" / "youtube-credentials.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def get_client_secrets_path() -> Path:
    """Return path to YouTube Analytics OAuth 2.0 client secrets JSON file."""
    if "YOUTUBE_CLIENT_SECRETS_PATH" in os.environ:
        return Path(os.environ["YOUTUBE_CLIENT_SECRETS_PATH"])

    candidates = [
        Path.home() / ".gemini" / "antigravity" / "youtube_client_secrets.json",
        Path.home() / ".gemini" / "config" / "youtube_client_secrets.json",
        Path.home() / ".claude" / "youtube_client_secrets.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def get_token_path() -> Path:
    """Return path to cached OAuth token file."""
    tmp = get_tmp_dir()
    primary = tmp / "youtube_oauth_token.json"
    if primary.exists():
        return primary

    claude_token = Path.home() / ".claude" / ".tmp" / "youtube_oauth_token.json"
    if claude_token.exists():
        return claude_token

    return primary
