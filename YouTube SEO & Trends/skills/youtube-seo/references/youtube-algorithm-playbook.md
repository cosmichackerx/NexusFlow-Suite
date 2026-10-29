# YouTube Algorithm Playbook (2026 Edition)

Understanding the neural network ranking signals that govern YouTube Shorts, Browse Feed, and Search.

## Primary Ranking Mechanics

### 1. The Two-Stage Recommendation Engine
YouTube's recommendation system consists of two primary deep neural networks:
- **Candidate Generation**: Filters billions of videos down to hundreds based on viewer history, co-watch graphs, and topic affinities.
- **Ranking Network**: Assigns a precise score to each candidate based on predicted Click-Through Rate (pCTR) and predicted Watch Time (pWT).

### 2. The Shorts Feed Algorithm
Unlike long-form video where impressions precede clicks, Shorts are served automatically in the vertical feed. The critical metric is **Viewed vs Swiped Away (VVSA)**:
- **Benchmark for Virality**: > 80% Viewed / < 20% Swiped Away in the first 1,000 impressions.
- **Average Percentage Viewed (APV)**: Videos under 30 seconds must achieve **> 100% APV** (meaning viewers watch the full loop at least once).
- **Engagement Velocity**: Comments, shares, and saves within the first 60 minutes determine whether the video gets pushed to wider algorithmic cohorts.

### 3. Google AI Overviews & Search SERP
- Over 29% of Google AI Overviews now directly cite YouTube video chapters and transcripts.
- Accurate timestamps, semantic keyword entities, and Schema.org VideoObject metadata allow your videos to dominate both YouTube Search and Google Search results pages.
