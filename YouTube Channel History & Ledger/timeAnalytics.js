const { getVideoLedger } = require('./historyLedger');
const { getChannelMemory } = require('./channelMemory');

/**
 * Calculate comprehensive production, publishing, and cadence time metrics.
 */
function calculateTimeAnalytics() {
  const videos = getVideoLedger();
  const memory = getChannelMemory();
  const cadenceConfig = memory.publishingCadence || {};

  const totalVideos = videos.length;
  const publishedVideos = videos.filter(v => v.status === 'published' || v.youtube?.status === 'published');
  const queuedVideos = videos.filter(v => v.status === 'queued' || v.youtube?.status === 'pending');
  const renderedVideos = videos.filter(v => v.status === 'rendered' || v.status === 'merged');

  // Durations
  const durations = videos.map(v => v.durationSec || 0).filter(d => d > 0);
  const avgDurationSec = durations.length > 0 
    ? +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) 
    : 24.0;

  // Turnaround and Latencies
  const turnaroundsMs = [];
  videos.forEach(v => {
    const created = v.timestamps?.createdAt ? new Date(v.timestamps.createdAt).getTime() : null;
    const published = v.timestamps?.publishedAt ? new Date(v.timestamps.publishedAt).getTime() : null;
    if (created && published && published > created) {
      turnaroundsMs.push(published - created);
    }
  });

  const avgTurnaroundHours = turnaroundsMs.length > 0
    ? +(turnaroundsMs.reduce((a, b) => a + b, 0) / turnaroundsMs.length / (1000 * 60 * 60)).toFixed(1)
    : null;

  // Cadence & Recency
  let daysSinceLastPublish = null;
  let lastPublishDate = null;
  const now = Date.now();

  if (publishedVideos.length > 0) {
    const sortedPublished = [...publishedVideos].sort((a, b) => {
      const timeA = new Date(a.timestamps?.publishedAt || a.timestamps?.updatedAt).getTime();
      const timeB = new Date(b.timestamps?.publishedAt || b.timestamps?.updatedAt).getTime();
      return timeB - timeA;
    });
    const latest = sortedPublished[0];
    lastPublishDate = latest.timestamps?.publishedAt || latest.timestamps?.updatedAt;
    daysSinceLastPublish = +((now - new Date(lastPublishDate).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1);
  }

  // Next recommended publish slot
  const nextRecommendedPublish = getNextPublishSlot(cadenceConfig);

  // Cadence consistency score (0 - 100)
  let cadenceHealthScore = 100;
  const targetPerDay = cadenceConfig.targetPerDay || 2;
  const targetPerWeek = cadenceConfig.targetPerWeek || 14;
  if (daysSinceLastPublish !== null) {
    const targetIntervalDays = 1.0 / targetPerDay; // 0.5 days (12 hours) for 2 per day
    if (daysSinceLastPublish > targetIntervalDays * 2) {
      cadenceHealthScore = Math.max(30, Math.round(100 - (daysSinceLastPublish - targetIntervalDays) * 20));
    }
  }

  return {
    overview: {
      totalVideosTracked: totalVideos,
      publishedCount: publishedVideos.length,
      queuedCount: queuedVideos.length,
      renderedCount: renderedVideos.length,
      averageDurationSec: avgDurationSec,
      averageTurnaroundHours: avgTurnaroundHours
    },
    cadence: {
      targetPerDay: targetPerDay,
      targetPerWeek: targetPerWeek,
      daysSinceLastPublish,
      lastPublishDate,
      cadenceHealthScore,
      healthStatus: cadenceHealthScore >= 80 ? 'Optimal' : (cadenceHealthScore >= 50 ? 'Needs Attention' : 'Overdue'),
      nextRecommendedPublish
    },
    timingInsights: [
      `Publishing Velocity: 2 Shorts per day (14 Shorts/week) across all 7 days.`,
      `Target Short length: 24.0s (3 scenes x 8.0s) preserves highest YouTube Shorts completion rate.`,
      `Audience peak retention window: 0:00 to 0:02 hook is critical for swipe-away prevention.`,
      `Daily Prime Slots: Slot 1 @ 11:00 EST (20:00 PKT) | Slot 2 @ 17:00 EST (02:00 PKT).`
    ]
  };
}

/**
 * Compute the next calendar publishing slot based on configured days and hours.
 */
function getNextPublishSlot(config) {
  const slots = config.dailySlots || [
    { slotName: 'Slot 1 (Midday Peak)', timeEST: '11:00', timeUTC: '15:00', timePKT: '20:00' },
    { slotName: 'Slot 2 (Evening Prime)', timeEST: '17:00', timeUTC: '21:00', timePKT: '02:00' }
  ];

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[now.getDay()];

  return {
    date: now.toISOString().split('T')[0],
    targetDay: todayName,
    activeSlot: slots[1].slotName,
    targetTimeEST: slots[1].timeEST + ' EST',
    targetTimePKT: slots[1].timePKT + ' PKT',
    targetTimeUTC: slots[1].timeUTC + ' UTC',
    dailySlots: slots
  };
}

module.exports = {
  calculateTimeAnalytics,
  getNextPublishSlot
};
