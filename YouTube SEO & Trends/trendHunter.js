const fs = require('fs');
const { paths } = require('./config');

const VIRAL_TREND_IDEAS = [
  {
    id: 'trend_01_library_of_alexandria',
    rank: 1,
    topic: 'The Library of Alexandria: The Scroll That Never Burned',
    category: 'Lost Civilizations & Ancient Knowledge',
    urgency: 'Trending Viral',
    viralityScore: 9.8,
    searchVolumeTier: '100K - 500K / mo',
    competition: 'Medium',
    rpmTier: 'High ($12 - $25)',
    continuityBridge: 'Following Episode 1, the golden vortex portal ejects Marrow into the forbidden lower vault of Alexandria during the great fire of 48 BC.',
    titles: {
      browse: 'He Entered Alexandria as it Was Burning... 📜🔥 #Shorts',
      search: 'What Was Inside The Lost Vault of The Library of Alexandria?',
      hybrid: 'The Secret Vault That Survived The Library of Alexandria Fire'
    },
    hookAngle: 'History says the Library of Alexandria burned to the ground... but they never opened the vault beneath the floor.',
    thumbnailBrief: 'Marrow reaching toward an ancient glowing crystalline scroll cylinder while fiery embers fall around him in a smoke-filled marble corridor.',
    plotSummary: 'Marrow emerges from the portal into a smoke-filled subterranean chamber beneath the burning library. Scorched scrolls dissolve to ash, but in the center, a locked obsidian cylinder with glowing Greek runes remains untouched by fire. Marrow deciphers the inscription: "For the eyes of the last emperor."'
  },
  {
    id: 'trend_02_eye_of_sahara_richat',
    rank: 2,
    topic: 'The Eye of the Sahara: The City of Glass Rings',
    category: 'Forbidden Archaeology & Ancient Geology',
    urgency: 'Evergreen High-Demand',
    viralityScore: 9.6,
    searchVolumeTier: '150K - 400K / mo',
    competition: 'Medium-High',
    rpmTier: 'High ($10 - $22)',
    continuityBridge: 'Marrow uses the golden astrolabe coordinates to travel across the Mediterranean to the center of the Mauritanian desert.',
    titles: {
      browse: 'He Walked into the Eye of the Sahara... 👁️⏳ #Shorts',
      search: 'The Secret Architecture Inside the Eye of the Sahara (Richat Structure)',
      hybrid: 'What Archaeologists Found Inside The Eye of The Sahara (Richat Structure)'
    },
    hookAngle: 'From space, it looks like a colossal bulls-eye. On the ground, the sand is melted into ancient blue glass.',
    thumbnailBrief: 'Marrow standing atop a concentric sandstone ring looking down into a vast crater of sapphire-blue fulgurite glass.',
    plotSummary: 'Marrow treks across howling desert dunes to the central ring of the Richat Structure. As subterranean wind sweeps the sand aside, geometric foundation stones laid in perfect concentric circles are revealed, matching Plato’s exact measurements of Atlantis.'
  },
  {
    id: 'trend_03_antikythera_sea_trench',
    rank: 3,
    topic: 'The Antikythera Trench: The Clockwork Beneath the Abyss',
    category: 'Lost Technology & Mechanical Enigmas',
    urgency: 'Trending',
    viralityScore: 9.4,
    searchVolumeTier: '80K - 200K / mo',
    competition: 'Low-Medium',
    rpmTier: 'Premium ($15 - $30)',
    continuityBridge: 'The astrolabe from Alexandria resonates with a twin frequency located 50 meters under the Aegean sea.',
    titles: {
      browse: 'The 2,000-Year-Old Computer Still Ticking Underwater... ⚙️🌊 #Shorts',
      search: 'How The Ancient Antikythera Mechanism Actually Worked',
      hybrid: 'Archaeologists Found A Second Antikythera Mechanism Underwater...'
    },
    hookAngle: 'In 1901, sponge divers found a corroded lump of bronze. In 2026, researchers realized it was calculating orbits they had no right knowing.',
    thumbnailBrief: 'Underwater camera view of Marrow diving past Roman amphoras as bioluminescent gears mesh together on the seabed.',
    plotSummary: 'Marrow sinks through teal Aegean depths to a shattered 1st-century BC Roman shipwreck. Among scattered marble statues, an interlocking bronze differential gear system whirs to life, casting bioluminescent planetary orbits onto the seabed.'
  },
  {
    id: 'trend_04_alexander_tomb_siwa',
    rank: 4,
    topic: 'The Lost Tomb of Alexander: The Crystal Sarcophagus in Siwa',
    category: 'Lost Tombs & Royal Secrets',
    urgency: 'Viral Mystery',
    viralityScore: 9.5,
    searchVolumeTier: '120K - 350K / mo',
    competition: 'Medium',
    rpmTier: 'High ($12 - $24)',
    continuityBridge: 'The celestial star map projected in Episode 1 pointed to an exact intersection in the Siwa Oasis.',
    titles: {
      browse: 'He Found Alexander The Great’s Real Tomb... 👑⚰️ #Shorts',
      search: 'Where Was Alexander The Great Actually Buried? The Siwa Oasis Clues',
      hybrid: 'What Really Happened To Alexander The Great’s Golden Sarcophagus?'
    },
    hookAngle: 'Caesar visited it. Augustus accidentally broke its nose. Then, in the 4th century, it vanished from human memory.',
    thumbnailBrief: 'Marrow shining an amber lantern onto a massive crystalline sarcophagus carved with the horned emblem of Ammon.',
    plotSummary: 'Marrow descends a flight of salt-encrusted stairs in the Libyan desert. Behind a collapsed wall of Greek limestone, he uncovers an intact chamber adorned with Macedonian shields and a sarcophagus sealed in pure molten amber.'
  },
  {
    id: 'trend_05_derinkuyu_underground',
    rank: 5,
    topic: 'Derinkuyu: The 18-Story Subterranean Fortress',
    category: 'Underground Cities & Catacombs',
    urgency: 'Evergreen Viral',
    viralityScore: 9.3,
    searchVolumeTier: '90K - 280K / mo',
    competition: 'Low',
    rpmTier: 'High ($10 - $20)',
    continuityBridge: 'Escaping subterranean water traps, Marrow accesses the global tunnel network engineered thousands of years ago.',
    titles: {
      browse: 'They Dug 18 Floors Underground to Hide From Something... 🕳️😨 #Shorts',
      search: 'Why Was The Underground City of Derinkuyu Built? Full Deep Dive',
      hybrid: 'The Terrifying Mystery of The Derinkuyu Underground City (18 Floors)'
    },
    hookAngle: 'It could house 20,000 people, livestock, and wine presses... but why did they roll 1,000-pound stone doors from the inside?',
    thumbnailBrief: 'Marrow peering down an endless vertical ventilation shaft lit by distant torchlight carving through volcanic rock.',
    plotSummary: 'Marrow explores the 8th subterranean level of Derinkuyu in Cappadocia. Giant monolithic millstone doors seal each corridor from the INSIDE. Marrow examines ancient claw marks on the outer facing stone, whispering: "They weren\'t hiding from armies."'
  }
];

/**
 * Get all viral trend ideas ranked by algorithm performance.
 */
function getTrendIdeas(categoryFilter = null) {
  if (!categoryFilter) return VIRAL_TREND_IDEAS;
  return VIRAL_TREND_IDEAS.filter(idea =>
    idea.category.toLowerCase().includes(categoryFilter.toLowerCase())
  );
}

/**
 * Get a specific trend idea by ID or Rank.
 */
function getTrendIdea(idOrRank) {
  if (typeof idOrRank === 'number') {
    return VIRAL_TREND_IDEAS.find(i => i.rank === idOrRank) || VIRAL_TREND_IDEAS[0];
  }
  return VIRAL_TREND_IDEAS.find(i => i.id === idOrRank || i.rank.toString() === idOrRank) || VIRAL_TREND_IDEAS[0];
}

module.exports = {
  VIRAL_TREND_IDEAS,
  getTrendIdeas,
  getTrendIdea
};
