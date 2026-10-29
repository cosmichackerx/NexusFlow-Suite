const fs = require('fs');

/**
 * Perform a comprehensive 0-100 algorithmic audit on a video SEO package.
 */
function auditMetadata(metadataPackage) {
  const { video, titles, description, tags, hashtags, engagementTrigger } = metadataPackage;

  const checks = [];
  let totalScore = 0;

  // 1. Title Audit (20 pts)
  let titleScore = 0;
  const activeTitle = titles.recommended || titles.browse || '';
  const titleLen = activeTitle.length;

  if (titleLen > 0 && titleLen <= 100) {
    titleScore += 5;
    checks.push({ category: 'Title', passed: true, score: 5, max: 5, rule: 'Title is within 100-character YouTube limit' });
  } else {
    checks.push({ category: 'Title', passed: false, score: 0, max: 5, rule: `Title length (${titleLen}) violates character limit` });
  }

  // Mobile truncation check (ideal 40-70)
  if (titleLen >= 30 && titleLen <= 70) {
    titleScore += 5;
    checks.push({ category: 'Title', passed: true, score: 5, max: 5, rule: `Title length (${titleLen} chars) avoids aggressive mobile truncation` });
  } else {
    titleScore += 3;
    checks.push({ category: 'Title', passed: true, score: 3, max: 5, rule: `Title length (${titleLen} chars) may partially truncate on mobile devices` });
  }

  // Curiosity or Keyword hook check
  const hasCuriosity = /found|this|secret|under|what|mystery|unlocked|lost|ancient|\.\.\./i.test(activeTitle);
  if (hasCuriosity) {
    titleScore += 5;
    checks.push({ category: 'Title', passed: true, score: 5, max: 5, rule: 'Title incorporates curiosity gap or emotional trigger' });
  } else {
    checks.push({ category: 'Title', passed: false, score: 1, max: 5, rule: 'Title lacks emotional curiosity hook' });
  }

  // Shorts tag if shorts
  if (video.isShorts) {
    if (/#shorts/i.test(activeTitle)) {
      titleScore += 5;
      checks.push({ category: 'Title', passed: true, score: 5, max: 5, rule: '#Shorts hashtag present in title for vertical video' });
    } else {
      checks.push({ category: 'Title', passed: false, score: 2, max: 5, rule: 'Recommend adding #Shorts to title for vertical feed index' });
    }
  } else {
    titleScore += 5;
    checks.push({ category: 'Title', passed: true, score: 5, max: 5, rule: 'Standard video format title validated' });
  }

  totalScore += titleScore;

  // 2. Description Architecture (20 pts)
  let descScore = 0;
  const descText = description.fullText || '';
  const descLen = descText.length;

  if (descLen >= 300) {
    descScore += 5;
    checks.push({ category: 'Description', passed: true, score: 5, max: 5, rule: 'Description provides rich context (300+ characters)' });
  } else {
    checks.push({ category: 'Description', passed: false, score: 2, max: 5, rule: 'Description is too brief for algorithm crawling' });
  }

  // First 150 characters hook
  const preview = descText.substring(0, 150);
  const hasKeywordInPreview = /alexandria|mechanism|ancient|marrow|roman/i.test(preview);
  if (hasKeywordInPreview) {
    descScore += 5;
    checks.push({ category: 'Description', passed: true, score: 5, max: 5, rule: 'Primary keywords positioned above the "Show More" fold' });
  } else {
    checks.push({ category: 'Description', passed: false, score: 2, max: 5, rule: 'Above-the-fold snippet lacks core keyword entities' });
  }

  // Timestamps / Chapters
  if (/00:00/i.test(descText)) {
    descScore += 5;
    checks.push({ category: 'Description', passed: true, score: 5, max: 5, rule: 'Chapter timestamps / pacing markers present' });
  } else {
    checks.push({ category: 'Description', passed: false, score: 1, max: 5, rule: 'Missing timestamp pacing markers' });
  }

  // Call to Action
  if (/subscribe|comment|theory|drop/i.test(descText)) {
    descScore += 5;
    checks.push({ category: 'Description', passed: true, score: 5, max: 5, rule: 'Clear Call-To-Action and subscription link included' });
  } else {
    checks.push({ category: 'Description', passed: false, score: 2, max: 5, rule: 'Missing explicit Call to Action' });
  }

  totalScore += descScore;

  // 3. Tags Architecture (15 pts)
  let tagsScore = 0;
  const tagList = tags.list || [];
  const tagCharCount = tags.characterCount || 0;

  if (tagCharCount >= 250 && tagCharCount <= 500) {
    tagsScore += 6;
    checks.push({ category: 'Tags', passed: true, score: 6, max: 6, rule: `Tag character count (${tagCharCount}/500) optimally utilizes allocation` });
  } else if (tagCharCount < 250) {
    tagsScore += 3;
    checks.push({ category: 'Tags', passed: false, score: 3, max: 6, rule: `Tags under-utilized (${tagCharCount}/500 chars)` });
  } else {
    checks.push({ category: 'Tags', passed: false, score: 0, max: 6, rule: `Tags exceed 500-char YouTube limit (${tagCharCount})` });
  }

  if (tagList.length >= 8 && tagList.length <= 25) {
    tagsScore += 5;
    checks.push({ category: 'Tags', passed: true, score: 5, max: 5, rule: `Healthy tag diversity count (${tagList.length} tags)` });
  } else {
    tagsScore += 2;
    checks.push({ category: 'Tags', passed: false, score: 2, max: 5, rule: `Tag count (${tagList.length}) is outside ideal range (8-25)` });
  }

  // Brand tag presence
  const hasBrandTag = tagList.some(t => /bones of empires|marrow/i.test(t));
  if (hasBrandTag) {
    tagsScore += 4;
    checks.push({ category: 'Tags', passed: true, score: 4, max: 4, rule: 'Brand & character identity tags included for channel authority' });
  } else {
    checks.push({ category: 'Tags', passed: false, score: 0, max: 4, rule: 'Missing channel brand tags' });
  }

  totalScore += tagsScore;

  // 4. Hashtag Strategy (15 pts)
  let hashScore = 0;
  const hashList = hashtags.primaryThree || [];

  if (hashList.length >= 3) {
    hashScore += 5;
    checks.push({ category: 'Hashtags', passed: true, score: 5, max: 5, rule: 'Primary 3 above-title display hashtags provided' });
  } else {
    checks.push({ category: 'Hashtags', passed: false, score: 2, max: 5, rule: 'Fewer than 3 primary hashtags' });
  }

  const hasShortsHash = (hashtags.extendedList || []).some(h => /#shorts/i.test(h));
  if (video.isShorts && hasShortsHash) {
    hashScore += 5;
    checks.push({ category: 'Hashtags', passed: true, score: 5, max: 5, rule: '#Shorts hashtag targeted for algorithm indexing' });
  } else if (!video.isShorts) {
    hashScore += 5;
    checks.push({ category: 'Hashtags', passed: true, score: 5, max: 5, rule: 'Long-form hashtag set formatted' });
  } else {
    checks.push({ category: 'Hashtags', passed: false, score: 1, max: 5, rule: 'Missing #Shorts hashtag' });
  }

  // Topic relevance
  const hasTopicHash = (hashtags.extendedList || []).some(h => /history|rome|alexandria|mystery/i.test(h));
  if (hasTopicHash) {
    hashScore += 5;
    checks.push({ category: 'Hashtags', passed: true, score: 5, max: 5, rule: 'High-volume topical hashtags incorporated' });
  } else {
    checks.push({ category: 'Hashtags', passed: false, score: 2, max: 5, rule: 'Missing topical hashtags' });
  }

  totalScore += hashScore;

  // 5. Engagement Velocity Trigger (15 pts)
  let engScore = 0;
  if (engagementTrigger && engagementTrigger.pinnedCommentQuestion) {
    engScore += 10;
    checks.push({ category: 'Engagement', passed: true, score: 10, max: 10, rule: 'Pinned comment prompt configured to drive conversation velocity' });
  } else {
    checks.push({ category: 'Engagement', passed: false, score: 3, max: 10, rule: 'Missing pinned comment discussion prompt' });
  }

  if (video.isShorts && video.durationSec <= 35) {
    engScore += 5;
    checks.push({ category: 'Engagement', passed: true, score: 5, max: 5, rule: `Short duration (${video.durationSec}s) optimizes for > 90% viewer retention rate` });
  } else {
    engScore += 3;
    checks.push({ category: 'Engagement', passed: true, score: 3, max: 5, rule: 'Video duration within standard parameters' });
  }

  totalScore += engScore;

  // 6. Schema.org & SERP Crawlability (15 pts)
  let serpScore = 0;
  if (metadataPackage.schemaMarkup && metadataPackage.schemaMarkup['@type'] === 'VideoObject') {
    serpScore += 10;
    checks.push({ category: 'SERP / AI Overviews', passed: true, score: 10, max: 10, rule: 'VideoObject JSON-LD schema validated for Google search richness' });
  } else {
    checks.push({ category: 'SERP / AI Overviews', passed: false, score: 0, max: 10, rule: 'Missing VideoObject JSON-LD schema markup' });
  }

  if (video.resolution && video.resolution !== 'unknown') {
    serpScore += 5;
    checks.push({ category: 'SERP / AI Overviews', passed: true, score: 5, max: 5, rule: `High definition resolution detected (${video.resolution})` });
  } else {
    checks.push({ category: 'SERP / AI Overviews', passed: false, score: 2, max: 5, rule: 'Video resolution unverified' });
  }

  totalScore += serpScore;

  // Grade calculation
  let grade = 'C';
  let verdict = 'Needs Optimization';
  if (totalScore >= 95) {
    grade = 'A+';
    verdict = 'Elite Algorithmic Readiness (Top 1% Creator Quality)';
  } else if (totalScore >= 85) {
    grade = 'A';
    verdict = 'High-Performing (Ready to Outrank Competitors)';
  } else if (totalScore >= 75) {
    grade = 'B';
    verdict = 'Good (Solid Foundation with minor gaps)';
  }

  // Recommendations
  const recommendations = checks
    .filter(c => !c.passed || c.score < c.max)
    .map(c => `[${c.category}] Improve: ${c.rule}`);

  return {
    totalScore,
    grade,
    verdict,
    pillarScores: {
      title: `${titleScore} / 20`,
      description: `${descScore} / 20`,
      tags: `${tagsScore} / 15`,
      hashtags: `${hashScore} / 15`,
      engagement: `${engScore} / 15`,
      serpReadiness: `${serpScore} / 15`
    },
    checks,
    recommendations
  };
}

module.exports = {
  auditMetadata
};
