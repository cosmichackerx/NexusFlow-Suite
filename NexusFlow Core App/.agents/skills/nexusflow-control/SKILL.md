---
name: nexusflow-control
description: Complete 0 to 100 control over NexusFlow Google Flow automation via MCP tools. Start and stop automation, manage Google accounts, inspect live credits, edit prompts, trigger lossless video merges, and configure system settings.
---

# NexusFlow Control Skill

Use this skill to control NexusFlow (Google Flow video generation system) from 0 level (system status, accounts, configuration) to 100 level (prompt management, video generation, live credit syncing, and lossless video merging).

## Available MCP Tools

All tools are accessible via the `nexusflow` MCP server using `call_mcp_tool`:

| Tool | Purpose | Key Parameters |
| :--- | :--- | :--- |
| `nexusflow_get_status` | Get live state (running/idle, current prompt, active account, credits, cooldown, progress). | none |
| `nexusflow_get_logs` | Retrieve recent execution, error, and info logs. | `limit`, `level` |
| `nexusflow_list_accounts` | List all registered Google accounts, their plans, and credit balances. | none |
| `nexusflow_switch_account` | Switch the active account and trigger an automated credit sync. | `email` |
| `nexusflow_sync_credits` | Scrape live Google One / Google Flow credits for an account. | `email` (optional) |
| `nexusflow_set_auto_switch` | Toggle automatic switching when credits drop below 10. | `enabled` (boolean) |
| `nexusflow_get_prompts` | Read all prompts, character counts, hashes, and render status. | none |
| `nexusflow_update_prompt` | Edit a specific prompt by index. | `index`, `promptText` |
| `nexusflow_set_all_prompts` | Replace the entire prompt batch in `Prompt.txt`. | `prompts` |
| `nexusflow_append_prompt` | Append a new prompt to `Prompt.txt`. | `promptText` |
| `nexusflow_start_automation` | Launch video generation batch. | `credits`, `cooldown`, `aspectRatio`, `model`, etc. |
| `nexusflow_stop_automation` | Safely cancel active automation and close browser. | none |
| `nexusflow_list_output_videos` | Inspect generated clips in `Output/`. | none |
| `nexusflow_list_result_videos` | Inspect merged and archived videos in `Result/`. | none |
| `nexusflow_merge_videos` | Losslessly concatenate output clips into `Combined_Video_Full.mp4`. | `outputPath` (optional) |
| `nexusflow_get_config` | View paths, default cooldown (10s), and settings. | none |
| `nexusflow_update_config` | Modify paths, cooldown, or auto-switch flags. | `promptFile`, `cooldown`, etc. |
| `nexusflow_list_tracked_projects` | View Credit Rescue saved project URLs. | none |
| `nexusflow_clear_tracked_projects` | Clear saved project URLs to force new project creation. | none |
| `nexusflow_launch_app` | Launch the NexusFlow GUI application if closed. | none |

## Standard Workflows

### 1. Pre-flight Check
Before starting automation, check status, active account, and credits:
1. Call `nexusflow_get_status` to see if automation is already running.
2. Call `nexusflow_list_accounts` to verify accounts and credits.
3. Call `nexusflow_get_prompts` to inspect the prompt queue and verify how many videos are already rendered.

### 2. Updating Prompts & Generating
1. Update or append prompts using `nexusflow_update_prompt` or `nexusflow_set_all_prompts`.
2. Start automation with `nexusflow_start_automation` (defaults to 10s cooldown).
3. Monitor progress by polling `nexusflow_get_status` or viewing logs with `nexusflow_get_logs`.

### 3. Merging Videos
Once all prompt videos are rendered in `Output/`:
1. Call `nexusflow_merge_videos`.
2. Verify output in `Result/Combined_Video_Full.mp4` using `nexusflow_list_result_videos`.
