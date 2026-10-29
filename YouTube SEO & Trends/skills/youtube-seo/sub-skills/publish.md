# Automated YouTube Studio Publishing Sub-Skill

This sub-skill manages the handoff between SEO generation and automated uploading into YouTube Studio.

## Architecture & Bridge Resilience

The publishing bridge supports dual-mode operation:
1. **Live Bridge Mode**:
   - If the YouTube Uploader app is running on port `48292`, the suite dispatches HTTP POST requests to `/api/queue/add`.
   - Live queue status and instant feedback are retrieved immediately.
2. **Resilient Disk Mode**:
   - If the YouTube Uploader app is offline, the suite writes atomic JSON payloads directly into:
     `%APPDATA%\nexusflow-youtube-uploader\upload-queue.json`.
   - When the user or agent launches YouTube Uploader, all queued videos with full titles, descriptions, tags, and Shorts flags are instantly loaded and ready for one-click publishing!

## Upload Safety & Guidelines

- **Shorts Detection**: Videos with duration <= 60s and 9:16 vertical ratio automatically have `#Shorts` appended to title and tags.
- **Audience Setting**: Automatically tagged as `Not made for kids` to preserve comments and notifications.
- **Visibility**: Defaults to `public` (or configurable to `unlisted` for staging review).
