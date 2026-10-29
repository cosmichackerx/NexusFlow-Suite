const fs = require('fs');
const path = require('path');
const { paths } = require('./config');
const { getTrendIdea } = require('./trendHunter');

/**
 * Generate a complete 3-scene NexusFlow production prompt from a trend idea.
 */
function generateContinuityPrompt(trendIdOrRank = 1) {
  const trend = getTrendIdea(trendIdOrRank);

  // Default to Alexandria Library Vault if trend #1
  let promptText = '';

  if (trend.rank === 1 || trend.id.includes('library_of_alexandria')) {
    promptText = generateLibraryOfAlexandriaPrompt();
  } else if (trend.rank === 2 || trend.id.includes('sahara')) {
    promptText = generateEyeOfSaharaPrompt();
  } else if (trend.rank === 3 || trend.id.includes('antikythera')) {
    promptText = generateAntikytheraPrompt();
  } else {
    promptText = generateGenericTrendPrompt(trend);
  }

  return {
    trend,
    promptText,
    sceneCount: 3,
    totalDurationEstimated: '24 seconds (3 x 8s scenes)',
    aspectRatio: 'Vertical 9:16 (Shorts)',
    character: 'Marrow',
    backupPath: null
  };
}

function generateLibraryOfAlexandriaPrompt() {
  const scene1 = `Vertical 9:16, ultra-detailed cinematic stylised 3D CGI, Pixar-meets-documentary realism, high-contrast volumetric lighting with golden fiery embers and drifting grey smoke, shallow depth of field, rich teal-and-amber colour grade, crisp micro-texture detail on charred marble, 24 fps, aggressive but smooth cinematic camera work with snap zooms, dolly zoom, rack focus, and realistic physical weight. CHARACTER "MARROW": a stylised anatomical human skeleton made of polished ivory-white bones, surrounded by a faintly translucent pale-cyan glass-like body silhouette around the torso and limbs, with two warm amber glowing lights inside the eye sockets that flare brighter or dim with emotion, expressive stylised proportions with a large skull and slim ribcage, wearing a plain undyed wool Roman tunic with a brown leather belt and a small leather coin pouch on the left hip, no modern items. VOICE CHARACTER: Marrow speaks with a deep, resonant, slightly raspy male voice, calm but ominous, with clear English pronunciation, cinematic documentary delivery, subtle vocal grit, and natural pauses. Dialogue must synchronise with Marrow's gestures and skull movements. CONTINUITY LOCK: the secret subterranean archives beneath the Great Library of Alexandria, 48 BC; towering Corinthian marble pillars cracked from heat, falling sparks drifting from wooden ceiling joists, shelves lined with thousands of rolled papyrus scrolls beginning to smoke, stone floors etched with ancient Greek constellations, and thick haze catching beams of moonlight from cracked ceiling oculi. Marrow's tunic, ivory bones, cyan silhouette, and glowing amber eye-lights never change. AUDIO BED: distant roaring fire, creaking wooden timbers, gentle fluttering of burning parchment, echoing cavern reverb, and solemn subterranean wind. START FRAME: wide low-angle shot looking down a grand colonnade of the archive; Marrow emerges from a radiant doorway of golden light, stepping onto the ash-strewn marble floor as smoke billows around his feet. TIMING: 0 to 2 seconds, Marrow shakes golden portal embers from his ivory fingertips; his amber eye-lights flare with sorrow as he looks up at the burning ceiling and whispers, "Forty-eight BC... the night the memory of the world burned."; 2 to 5 seconds, camera dollies forward rapidly beside him; Marrow rushes past crumbling papyrus shelves, running a skeletal hand across burning scroll racks, scattering fiery embers into the air; he turns his skull sharply toward a locked iron vault door at the end of the hall and exclaims, "Not all of it!"; 5 to 8 seconds, Marrow stops abruptly before the colossal iron door sealed with three bronze gorgon locks; his eye-lights narrow in recognition while the camera executes an aggressive snap push-in onto his face as he mutters, "The forbidden archive... it was never consumed by fire." CAMERA AND LENS: begin with a 24mm wide establishing shot showing the immense burning archive, transition to a waist-level 35mm tracking dolly alongside Marrow, and snap into a 50mm portrait push isolating his skull against glowing embers. SFX: fiery crackles, collapsing stone debris, wool tunic rustle, bone footsteps on ash, heavy iron door reverberation, and low sub-bass rumble. Dialogue synchronized. FINAL FRAME: medium close-up of Marrow staring at the triple gorgon locks, amber eye-lights blazing with determination. END AUDIO: a deep, ominous brass chime reverberates through the vault and fades. END`;

  const scene2 = `Vertical 9:16, ultra-detailed cinematic stylised 3D CGI, Pixar-meets-documentary realism, intense high-contrast volumetric rim lighting from roaring fires above, shallow depth of field, rich teal-and-amber colour grade, crisp micro-texture detail, 24 fps, aggressive cinematic camera work with rapid tracking, orbital moves, rack focus, and realistic physical momentum. CHARACTER "MARROW": the identical polished ivory-white anatomical skeleton surrounded by the faintly translucent pale-cyan glass silhouette, with two warm amber glowing eye-lights, expressive proportions, undyed wool Roman tunic, brown leather belt, and small coin pouch on left hip. VOICE CHARACTER: maintain the exact deep, resonant, slightly raspy male voice, cinematic documentary delivery, natural pauses, and vocal grit. CONTINUITY LOCK: the vault threshold beneath the Library of Alexandria, identical Corinthian pillars glowing under fiery sparks, fallen scorched scrolls on stone flagstones, and the massive three-locked iron vault door. Amber and teal light reflections dance across Marrow's ribcage. AUDIO BED: intense thermal roar, heavy air currents rushing through the corridor, grinding metal mechanisms, and deep resonant subterranean vibration. START FRAME: match the exact final frame of Scene 1: medium close-up of Marrow facing the three gorgon bronze locks on the iron door. TIMING: 0 to 2 seconds, Marrow unhooks the Roman brass coin from his hip pouch; he inserts the coin into the central gorgon's mouth; the ancient bronze mechanism clicks loudly as heavy counterweights drop within the stone walls; Marrow smiles grimly, "Three turns to unlock three thousand years."; 2 to 5 seconds, camera executes a sweeping 180-degree semi-circular orbit around Marrow as the massive iron door splits down the center with a shower of rust and sparks, slowly swinging open into a freezing, untouched obsidian chamber; Marrow steps over the threshold, his cyan silhouette flaring against the sudden cold mist; he says, "Here lies the true history."; 5 to 8 seconds, inside the pristine chamber, illuminated by an eerie pale-blue bioluminescent pillar, stands a solitary crystalline plinth holding an unopened, untouched cylindrical scroll made of hammered platinum and gold; Marrow's amber eyes widen in shock as the camera performs a dramatic vertigo dolly zoom. CAMERA AND LENS: start tight on the coin insertion, pull back into an awe-inspiring wide shot revealing the colossal door opening, orbit smoothly on a 35mm lens, then execute a 50mm vertigo dolly zoom on Marrow's reaction. SFX: sharp mechanical click, heavy bronze tumblers turning, iron door grinding on stone, rushing cold wind, metal sparks, and a profound sub-bass drop. Dialogue accurately synced. FINAL FRAME: wide low-angle tracking shot of Marrow standing before the glowing platinum scroll plinth inside the pitch-black obsidian chamber. END AUDIO: a crystalline aquatic resonance rings out, echoing through the silence. END`;

  const scene3 = `Vertical 9:16, ultra-detailed cinematic stylised 3D CGI, Pixar-meets-documentary realism, intense high-contrast volumetric lighting, shallow depth of field, rich teal-and-amber colour grade, crisp micro-texture detail, 24 fps, aggressive cinematic camera work with rapid crane descent, snap zooms, rack focus, and realistic physical momentum. CHARACTER "MARROW": the identical polished ivory-white anatomical skeleton surrounded by the faintly translucent pale-cyan glass silhouette, two glowing amber eye-lights flaring with dramatic intensity, wearing the identical undyed wool Roman tunic, belt, and coin pouch. VOICE CHARACTER: maintain the exact deep, resonant, slightly raspy male voice, cinematic documentary delivery, and precise sync with skull movements. CONTINUITY LOCK: the inner obsidian chamber beneath Alexandria, freezing mist rising from black mirror floors, the radiant platinum scroll glowing with intricate etched Greek hieroglyphs, and the open vault door behind showing distant fire embers. AUDIO BED: ethereal crystalline resonance, distant muffled roar of the library fire, electrical ozone hum, and deep subterranean heartbeats. START FRAME: match the exact final frame of Scene 2: low-angle wide shot of Marrow standing before the glowing platinum scroll plinth. TIMING: 0 to 2 seconds, Marrow approaches the plinth; he raises his slender ivory hand over the platinum cylinder; the metal casing reacts to his cyan energy, unfurling like a mechanical flower to reveal a parchment of pure spun gold inscribed with living, moving star coordinates; Marrow breathes in disbelief, "It wasn't written by humans..."; 2 to 5 seconds, camera swoops down from overhead in a high-speed crane shot, framing Marrow at chest level; the golden star coordinates detach from the scroll, floating in the air around Marrow's skull like miniature burning suns; Marrow looks directly into the lens with urgent amber eyes and says, "They burned the library... to keep this secret."; 5 to 8 seconds, the coordinates realign into a single pulsing beam of blue starlight that shoots straight into Marrow's chest, illuminating his ivory bones from within; Marrow reaches out to grab the golden scroll, looks into the camera with a confident skeletal smirk, and whispers, "Time to rewrite the history books.", just as the ceiling above cracks and blinding light engulfs the frame before a sharp cut to black. CAMERA AND LENS: overhead 24mm crane descending into a 50mm portrait shot, rack focus onto the floating golden glyphs, and end with an aggressive snap whip zoom directly into Marrow's amber eye before the sudden black frame. SFX: metallic flower unfurling chime, celestial ozone hum, floating spark sizzles, heartbeat sub-bass thud, cracking stone rumble, and sudden total silence on cut. Dialogue synchronized. FINAL FRAME: extreme close-up of Marrow's skull smirking amidst blinding golden-blue radiance a fraction of a second before the cut to black. END AUDIO: a deep, shuddering subterranean boom followed by complete, crisp silence. END`;

  return [scene1, scene2, scene3].join('\n\n');
}

function generateEyeOfSaharaPrompt() {
  const scene1 = `Vertical 9:16, ultra-detailed cinematic stylised 3D CGI, Pixar-meets-documentary realism, blazing desert sunlight with high-contrast amber rim light, howling sand mist, shallow depth of field, rich teal-and-amber colour grade, 24 fps. CHARACTER "MARROW": identical ivory skeleton, cyan glass silhouette, amber eye-lights, Roman wool tunic and belt. VOICE CHARACTER: deep, resonant, slightly raspy male voice. CONTINUITY LOCK: the central sandstone ring of the Richat Structure in Mauritania; vast concentric ridges of weathered limestone, howling winds whipping fine red dust, and patches of ancient melted blue fulgurite glass emerging from beneath the dunes. Marrow stands on a towering sandstone ridge looking down into the bulls-eye crater. TIMING: 0 to 2s, Marrow shields his glowing eyes from the gale; he whispers, "Four hundred kilometers into the desert... where oceans used to rule."; 2 to 5s, camera dollies alongside Marrow descending a steep dune into the trench; ancient carved canal walls appear through the shifting sand; he says, "Three concentric rings of water... exactly as Plato wrote."; 5 to 8s, Marrow reaches down and brushes sand from a massive polished slab of orichalcum metal glowing warm amber; camera snap zooms onto his face as his eye-lights widen. FINAL FRAME: medium shot of Marrow touching the glowing metal slab. END`;
  return [scene1, scene1, scene1].join('\n\n');
}

function generateAntikytheraPrompt() {
  const scene1 = `Vertical 9:16, ultra-detailed cinematic stylised 3D CGI, Pixar-meets-documentary realism, deep aquatic teal abyss with shafts of filtered sunlight, floating bioluminescent plankton, shallow depth of field, 24 fps. CHARACTER "MARROW": identical ivory skeleton with cyan silhouette and glowing amber eyes, wearing undyed wool Roman tunic, walking weightlessly on the Aegean seabed at 50 meters depth. VOICE CHARACTER: deep resonant raspy male voice. CONTINUITY LOCK: 1st century BC Roman shipwreck off Antikythera island; shattered wooden hull timbers encrusted with coral, marble statues half-buried in silt, and scattered bronze amphoras. TIMING: 0 to 2s, Marrow glides past a stone bust of Hermes; he whispers, "Two thousand years under the Aegean... and the gears are still turning."; 2 to 5s, camera orbits around a corroded bronze chest resting on the seabed; interlocking astronomical gears slowly begin to rotate, emitting bioluminescent cyan sparks; Marrow reaches out, "It wasn't just a clock... it was a navigation key."; 5 to 8s, the bronze mechanism projects a 3D hologram of the solar system through the dark water; Marrow looks back at the camera with illuminated amber eyes. FINAL FRAME: close-up of Marrow silhouetted by the underwater astronomical hologram. END`;
  return [scene1, scene1, scene1].join('\n\n');
}

function generateGenericTrendPrompt(trend) {
  return generateLibraryOfAlexandriaPrompt();
}

/**
 * Apply the generated prompt directly into C:\Google Flow Customized\Prompt.txt with a backup.
 */
function applyPromptToNexusFlow(trendIdOrRank = 1) {
  const generated = generateContinuityPrompt(trendIdOrRank);
  const targetFile = paths.NEXUSFLOW_PROMPT_FILE;

  let backupPath = null;
  if (fs.existsSync(targetFile)) {
    try {
      const backupDir = path.join(path.dirname(targetFile), 'Prompt_Backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      backupPath = path.join(backupDir, `Prompt_Backup_${Date.now()}.txt`);
      fs.copyFileSync(targetFile, backupPath);
    } catch (e) {}
  }

  // Write new prompt
  fs.writeFileSync(targetFile, generated.promptText, 'utf8');

  return {
    success: true,
    appliedTo: targetFile,
    backupPath,
    trend: generated.trend,
    sceneCount: generated.sceneCount,
    message: `Prompt for "${generated.trend.topic}" successfully deployed to NexusFlow Prompt.txt! Ready to generate next viral video.`
  };
}

module.exports = {
  generateContinuityPrompt,
  applyPromptToNexusFlow
};
