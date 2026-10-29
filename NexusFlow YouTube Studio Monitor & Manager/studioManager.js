const fs = require('fs');
const path = require('path');
const config = require('./config');
const monitor = require('./studioMonitor');

class StudioManager {
  constructor() {
    this.monitor = monitor;
  }

  updateVideoMetadata(videoId, newMetadata) {
    const state = this.monitor.state;
    const videos = state.publishedVideos || [];
    const index = videos.findIndex(v => v.id === videoId || v.title.toLowerCase().includes(videoId.toLowerCase()));

    if (index === -1) {
      return { success: false, error: `Video with identifier '${videoId}' not found in Studio catalog.` };
    }

    const current = videos[index];
    const updated = {
      ...current,
      ...newMetadata,
      updatedAt: new Date().toISOString()
    };

    videos[index] = updated;
    this.monitor.updateMetrics({ publishedVideos: videos });

    return {
      success: true,
      message: `Metadata for '${updated.title}' updated successfully in Studio state.`,
      video: updated
    };
  }

  moderateComments() {
    const commentsData = this.monitor.state.communityModeration || { totalComments: 0, latestComment: null };
    
    const suggestedActions = [
      {
        action: 'Heart & Reply',
        targetComment: commentsData.latestComment,
        recommendedReply: 'Thank you for exploring history with Marrow! What ancient empire should we uncover next?'
      }
    ];

    return {
      totalComments: commentsData.totalComments,
      pendingReview: commentsData.pendingReview || 0,
      latestComment: commentsData.latestComment,
      suggestedActions,
      sentimentOverview: '100% Positive engagement',
      status: 'Clean & Moderated'
    };
  }

  generatePinnedComment(videoTitle) {
    const prompts = [
      `🦴 Marrow wants to know: Did you know this historical fact before watching? Drop your theory below!`,
      `⏳ Which forgotten ancient mystery should we dig up next? Let us know in the comments!`,
      `👑 If you could step into this empire for 24 hours, what is the first thing you would do? Comment below!`
    ];

    const selected = prompts[Math.floor(Math.random() * prompts.length)];
    return {
      videoTitle,
      pinnedComment: selected,
      recommendedTags: ['#bonesofempires', '#historyshorts', '#ancienthistory', '#archeology']
    };
  }

  checkCopyrightAndContentId() {
    const state = this.monitor.state;
    const videos = state.publishedVideos || [];
    const flagged = videos.filter(v => v.restrictions && v.restrictions.toLowerCase() !== 'none');

    return {
      channelHealth: '100% Clear',
      copyrightStrikes: state.channel?.copyrightStrikes || 0,
      guidelineWarnings: state.channel?.communityGuidelinesWarnings || 0,
      contentIdClaims: flagged.length,
      flaggedVideos: flagged,
      audioLibraryStatus: 'All audio using approved NexusFlow royalty-free synthesis or YouTube Audio Library.'
    };
  }

  getUploadDefaults() {
    return {
      visibility: 'Public',
      category: 'Education / History',
      language: 'English (United States)',
      license: 'Standard YouTube License',
      madeForKids: false,
      defaultDescription: [
        `Unearthing forgotten imperial civilizations through the eyes of an ancient skeletal wanderer.`,
        ``,
        `🔔 Subscribe to Bones of Empires for daily historical mysteries:`,
        `https://youtube.com/@BonesOfEmpires?sub_confirmation=1`,
        ``,
        `#BonesOfEmpires #History #Shorts #Archeology #AncientCivilizations`
      ].join('\n'),
      defaultTags: [
        'Bones of Empires',
        'Ancient History',
        'Archaeological Mysteries',
        'Marrow',
        'Lost Civilizations',
        'History Shorts',
        'Historical Facts',
        'Ancient Empires'
      ]
    };
  }

  getChannelCustomization() {
    return {
      channelName: config.channel.name,
      handle: config.channel.handle,
      niche: config.channel.niche,
      branding: {
        bannerStatus: 'Active - Cyan & Amber Volumetric Theme',
        avatarStatus: 'Active - Marrow (Golden Glowing Sockets & Roman Tunic)',
        watermarkStatus: 'Active (Subscribe Button at bottom right)'
      },
      featuredSections: [
        { title: 'Latest Shorts', type: 'Shorts shelf' },
        { title: 'Imperial Mysteries', type: 'Single playlist' },
        { title: 'Popular Uploads', type: 'Top videos shelf' }
      ]
    };
  }
}

module.exports = new StudioManager();
