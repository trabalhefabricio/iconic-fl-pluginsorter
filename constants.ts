import { Plugin, PluginAsset, CategoryProfile } from './types';

// Helper to generate assets
const assets = (name: string): PluginAsset[] => [
    { filename: `${name}.nfo`, type: 'nfo' },
    { filename: `${name}.png`, type: 'png' }
];

export const MOCK_PLUGINS: Plugin[] = [
  // Generics / Roots
  { id: '1', name: 'Serum', normalizedName: 'serum', filename: 'Serum.fst', path: 'Generators/Serum.fst', category: null, tags: [], assets: assets('Serum'), status: 'pending', fileSize: 1024, contentHash: 'abc1', dateModified: 1678880000000 },
  { id: '2', name: 'Pro-Q 3', normalizedName: 'proq3', filename: 'Pro-Q 3.fst', path: 'Effects/FabFilter/Pro-Q 3.fst', category: null, tags: [], assets: assets('Pro-Q 3'), status: 'pending', fileSize: 2048, contentHash: 'abc2', dateModified: 1688880000000 },
  
  // Nested Mess
  { id: '3', name: 'ValhallaRoom', normalizedName: 'valhallaroom', filename: 'ValhallaRoom.fst', path: 'Effects/Reverb/Valhalla/ValhallaRoom.fst', category: null, tags: [], assets: [], status: 'pending', fileSize: 1500, contentHash: 'abc3', dateModified: 1668880000000 },
  
  // Duplicates (Content Hash Match)
  { id: '4', name: 'Ott', normalizedName: 'ott', filename: 'Ott.fst', path: 'Effects/Dynamics/Ott.fst', category: null, tags: [], assets: assets('Ott'), status: 'pending', fileSize: 500, contentHash: 'ott_hash', dateModified: 1698880000000 },
  { id: '5', name: 'Ott', normalizedName: 'ott', filename: 'Ott.fst', path: 'Unsorted/Ott.fst', category: null, tags: [], assets: assets('Ott'), status: 'pending', fileSize: 500, contentHash: 'ott_hash', dateModified: 1658880000000 }, // Older duplicate

  // Uncategorized / Obscure
  { id: '6', name: 'Sausage Fattener', normalizedName: 'sausagefattener', filename: 'Sausage Fattener.fst', path: 'Effects/Sausage Fattener.fst', category: null, tags: [], assets: [], status: 'pending', fileSize: 800, contentHash: 'sausage', dateModified: 1658880000000 },
  { id: '7', name: 'Massive X', normalizedName: 'massivex', filename: 'Massive X.fst', path: 'Generators/Native Instruments/Massive X.fst', category: null, tags: [], assets: assets('Massive X'), status: 'pending', fileSize: 3000, contentHash: 'massive', dateModified: 1698880000000 },
  
  // More Plugins
  { id: '8', name: 'Sylenth1', normalizedName: 'sylenth1', filename: 'Sylenth1.fst', path: 'Generators/Sylenth1.fst', category: null, tags: [], assets: [], status: 'pending', fileSize: 1200, contentHash: 'sylenth', dateModified: 1648880000000 },
  { id: '9', name: 'Kickstart 2', normalizedName: 'kickstart2', filename: 'Kickstart 2.fst', path: 'Effects/Kickstart 2.fst', category: null, tags: [], assets: assets('Kickstart 2'), status: 'pending', fileSize: 900, contentHash: 'kickstart', dateModified: 1699990000000 },
  { id: '10', name: 'Decapitator', normalizedName: 'decapitator', filename: 'Decapitator.fst', path: 'Effects/Soundtoys/Decapitator.fst', category: null, tags: [], assets: assets('Decapitator'), status: 'pending', fileSize: 1100, contentHash: 'decap', dateModified: 1670000000000 },
  { id: '11', name: 'Omnisphere', normalizedName: 'omnisphere', filename: 'Omnisphere.fst', path: 'Generators/Spectrasonics/Omnisphere.fst', category: null, tags: [], assets: assets('Omnisphere'), status: 'pending', fileSize: 5000, contentHash: 'omni', dateModified: 1680000000000 },
  { id: '12', name: 'Portal', normalizedName: 'portal', filename: 'Portal.fst', path: 'Effects/Portal.fst', category: null, tags: [], assets: assets('Portal'), status: 'pending', fileSize: 1600, contentHash: 'portal', dateModified: 1691230000000 },
  { id: '13', name: 'Thermal', normalizedName: 'thermal', filename: 'Thermal.fst', path: 'Effects/Output/Thermal.fst', category: null, tags: [], assets: assets('Thermal'), status: 'pending', fileSize: 1700, contentHash: 'thermal', dateModified: 1694560000000 },
  { id: '14', name: 'Diva', normalizedName: 'diva', filename: 'Diva.fst', path: 'Generators/u-he/Diva.fst', category: null, tags: [], assets: assets('Diva'), status: 'pending', fileSize: 2200, contentHash: 'diva', dateModified: 1667890000000 },
  { id: '15', name: 'Kontakt 7', normalizedName: 'kontakt7', filename: 'Kontakt 7.fst', path: 'Generators/Native Instruments/Kontakt 7.fst', category: null, tags: [], assets: assets('Kontakt 7'), status: 'pending', fileSize: 4000, contentHash: 'kontakt', dateModified: 1699999999999 },
];

export const DEFAULT_CATEGORIES = [
  "Synth",
  "Bass",
  "Drums",
  "Orchestral",
  "Piano & Keys",
  "FX - Reverb",
  "FX - Delay",
  "FX - Distortion",
  "FX - Dynamics",
  "FX - Modulation",
  "Mastering",
  "Utilities"
];

export const PRESET_PROFILES: CategoryProfile[] = [
    { id: 'default', name: 'Standard (FL)', categories: DEFAULT_CATEGORIES },
    { id: 'electronic', name: 'Electronic / EDM', categories: ['Leads', 'Pads', 'Plucks', 'Bass - Growl', 'Bass - Sub', 'FX - Risers', 'Drums - Kick', 'Drums - Snare'] },
    { id: 'orchestral', name: 'Cinematic / Orch', categories: ['Strings', 'Brass', 'Woodwinds', 'Percussion', 'Choir', 'Piano', 'Hybrid'] }
];