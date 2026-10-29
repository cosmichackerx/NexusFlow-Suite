# Sub-Skill: Video Ledger Management

## Overview
The Video Ledger maintains an immutable, chronological register of every video produced by NexusFlow, packaged by YouTube SEO, and managed by YouTube Uploader.

## Video Record Schema
```json
{
  "id": "vid_1792927618885_alexandria_mechanism",
  "episodeNumber": 1,
  "arcId": "arc_01_alexandria",
  "title": "He Found Something Under Alexandria... 💀 #Shorts",
  "titleVariants": {
    "recommended": "He Found Something Under Alexandria... 💀 #Shorts",
    "browseCtr": "The 2,000-Year-Old Machine Turning Beneath Egypt 💀 #Shorts",
    "searchIntent": "Subterranean Roman Cistern Mechanism of Alexandria Explained #Shorts",
    "mobileShort": "Under Alexandria... 💀 #Shorts"
  },
  "videoPath": "C:\\Google Flow Customized\\Result\\Combined_Video_Full.mp4",
  "filename": "Combined_Video_Full.mp4",
  "isShort": true,
  "durationSec": 24.02,
  "formattedDuration": "00:24",
  "status": "queued",
  "timestamps": {
    "createdAt": "2026-10-25T11:26:58.885Z",
    "renderedAt": "2026-10-25T11:20:00.000Z",
    "mergedAt": "2026-10-25T11:25:00.000Z",
    "seoGeneratedAt": "2026-10-25T11:26:00.000Z",
    "queuedAt": "2026-10-25T11:26:58.885Z",
    "publishedAt": null
  },
  "prompts": { ... },
  "seo": { ... },
  "youtube": {
    "channelName": "Bones of Empires",
    "channelHandle": "@BonesOfEmpires",
    "queueId": "queue_1792927618885_lalq20",
    "videoUrl": null,
    "visibility": "public",
    "status": "pending"
  }
}
```

## Lifecycle States
1. `draft`: Prompt designed, not yet submitted to NexusFlow.
2. `rendered`: Clips generated in `Output/` folder.
3. `merged`: Losslessly combined into `Result/Combined_Video_Full.mp4`.
4. `seo_generated`: Title variants, description, tags, and audit score generated.
5. `queued`: Injected into YouTube Uploader queue.
6. `published`: Verified live on YouTube Studio with active video URL.
