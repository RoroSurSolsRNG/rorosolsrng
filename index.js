const ADMIN_LOG_CHANNEL_ID = '1448744993283113133';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ────────────────────────────────────────────────────────────
//  DB JSON locale
// ────────────────────────────────────────────────────────────
const DB_PATH      = path.join(__dirname, 'linked_users.json');
const HISTORY_PATH = path.join(__dirname, 'globals_history.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) fs.writeFileSync(HISTORY_PATH, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
}
function saveHistory(data) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2));
}

let totalGlobalsDetected = 0;
function initTotalGlobals() {
  const h = loadHistory();
  totalGlobalsDetected = Object.values(h).reduce((acc, arr) => acc + arr.length, 0);
}
function updateBotStatus() {
  client.user?.setActivity(`👀 ${totalGlobalsDetected} globals trackés`, { type: ActivityType.Watching });
}

// ────────────────────────────────────────────────────────────
//  API Roblox
// ────────────────────────────────────────────────────────────
async function getRobloxUserId(username) {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const data = await res.json();
    if (data.data && data.data.length > 0) return data.data[0];
    return null;
  } catch (err) {
    console.error('[Roblox API] Erreur:', err.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
//  BASE DE DONNÉES DES AURAS — 100M+ seulement (+ Challenged/Challenged+)
// ════════════════════════════════════════════════════════════
const AURA_DB = {

  // ══ CHALLENGED+ ══
  'MONARCH':                    { chance: '1 IN 3,000,000,000',   tier: 'CHALLENGED+', biome: 'CORRUPTION / GLITCHED', rarity: 3000000000 },
  'LEVIATHAN':                  { chance: '1 IN 1,730,400,000',   tier: 'CHALLENGED+', biome: 'RAINY',                 rarity: 1730400000 },
  'ASTRAIOS':                   { chance: '1 IN 1,750,000,000',   tier: 'CHALLENGED+', biome: 'SINGULARITY',           rarity: 1750000000 },
  'OBLIVION':                   { chance: '1 IN 2,000 [Oblivion Potion]', tier: 'CHALLENGED+',                         rarity: 999999999  },
  'OPPRESSION':                 { chance: '1 IN 220,000,000',     tier: 'CHALLENGED+', biome: 'HELL',                  rarity: 220000000  },
  'DREAMATRIC':                 { chance: '1 IN 320,000,000',     tier: 'CHALLENGED+', biome: 'DREAMSPACE',            rarity: 320000000  },
  'ILLUSIONARY':                { chance: '1 IN 10,000,000',      tier: 'CHALLENGED+', biome: 'DREAMSPACE',            rarity: 10000000   },

  // ══ CHALLENGED ══
  'GLITCH':                     { chance: '1 IN 12,210,110',      tier: 'CHALLENGED',  biome: 'GLITCHED',              rarity: 12210110   },
  'NEFERKHAF':                  { chance: '1 IN 1,000 [Potion of Dune]', tier: 'CHALLENGED',                           rarity: 888888888  },
  'RED MOON':                   { chance: '1 IN 1,000 [Red Moon Potion]', tier: 'CHALLENGED',                          rarity: 777777777  },
  'MEMORY':                     { chance: '1 IN 100 [Oblivion Potion]',   tier: 'CHALLENGED',                          rarity: 666666666  },
  'BOREALIS':                   { chance: '1 IN 13,333,333',      tier: 'CHALLENGED',  biome: 'STARFALL',              rarity: 13333333   },

  // ══ TRANSCENDENT ══
  'EQUINOX':                    { chance: '1 IN 2,500,000,000',   tier: 'TRANSCENDENT',                                rarity: 2500000000 },
  'BREAKTHROUGH':               { chance: '1 IN 1,999,999,999',   tier: 'TRANSCENDENT',                                rarity: 1999999999 },
  'LUMINOSITY':                 { chance: '1 IN 1,200,000,000',   tier: 'TRANSCENDENT', biome: 'HEAVEN',               rarity: 1200000000 },
  'PIXELATION':                 { chance: '1 IN 1,073,741,824',   tier: 'TRANSCENDENT', biome: 'CYBERSPACE',           rarity: 1073741824 },
  'NYCTOPHOBIA':                { chance: '1 IN 1,011,111,010',   tier: 'TRANSCENDENT', biome: 'NULL',                 rarity: 1011111010 },
  'MASTER-HAND':                { chance: 'Unknown',               tier: 'TRANSCENDENT',                                rarity: 9999999999 },
  'EGGIS':                      { chance: '1 IN 1,150,000,000',   tier: 'TRANSCENDENT',                                rarity: 1150000000 },
  'YOLKEGG':                    { chance: '1 IN 1,790,909,090',   tier: 'TRANSCENDENT',                                rarity: 1790909090 },

  // ══ GLORIOUS — 800M+ ══
  'AEGIS':                      { chance: '1 IN 825,000,000',     tier: 'GLORIOUS',                                    rarity: 825000000  },
  'RUINS : WITHERED':           { chance: '1 IN 800,000,000',     tier: 'GLORIOUS',                                    rarity: 800000000  },
  'APOSTOLOS : VEIL':           { chance: '1 IN 800,000,000',     tier: 'GLORIOUS',                                    rarity: 800000000  },

  // ══ GLORIOUS — 700M–799M ══
  'PAROL':                      { chance: '1 IN 760,000,000',     tier: 'GLORIOUS',                                    rarity: 760000000  },
  'SOVEREIGN':                  { chance: '1 IN 750,000,000',     tier: 'GLORIOUS',                                    rarity: 750000000  },
  'BANSHEE':                    { chance: '1 IN 730,000,000',     tier: 'GLORIOUS', biome: 'NULL',                     rarity: 730000000  },
  'MALEDICTION':                { chance: '1 IN 730,000,000',     tier: 'GLORIOUS',                                    rarity: 730000000  },
  'WRAITHLIGHT':                { chance: '1 IN 695,000,000',     tier: 'GLORIOUS',                                    rarity: 695000000  },

  // ══ GLORIOUS — 600M–699M ══
  'PROLOGUE':                   { chance: '1 IN 666,616,111',     tier: 'GLORIOUS',                                    rarity: 666616111  },
  'PYTHOS':                     { chance: '1 IN 666,666,666',     tier: 'GLORIOUS',                                    rarity: 666666666  },
  'HARVESTER':                  { chance: '1 IN 666,000,000',     tier: 'GLORIOUS', biome: 'HELL',                     rarity: 666000000  },
  'APOCALYPSE':                 { chance: '1 IN 624,000,000',     tier: 'GLORIOUS', biome: 'CORRUPTION',               rarity: 624000000  },
  'MATRIX : REALITY':           { chance: '1 IN 601,020,102',     tier: 'GLORIOUS', biome: 'CYBERSPACE',               rarity: 601020102  },

  // ══ GLORIOUS — 500M–599M ══
  'SOPHYRA':                    { chance: '1 IN 570,000,000',     tier: 'GLORIOUS',                                    rarity: 570000000  },
  'ELUDE':                      { chance: '1 IN 555,555,555',     tier: 'GLORIOUS',                                    rarity: 555555555  },
  'MATRIX : OVERDRIVE':         { chance: '1 IN 503,000,000',     tier: 'GLORIOUS', biome: 'CYBERSPACE',               rarity: 503000000  },
  'RUINS':                      { chance: '1 IN 500,000,000',     tier: 'GLORIOUS',                                    rarity: 500000000  },

  // ══ GLORIOUS — 400M–499M ══
  'PHANTASMA':                  { chance: '1 IN 462,000,000',     tier: 'GLORIOUS',                                    rarity: 462000000  },
  'KYAWTHUITE : REMEMBRANCE':   { chance: '1 IN 450,000,000',     tier: 'GLORIOUS',                                    rarity: 450000000  },
  'UNKNOWN':                    { chance: '1 IN 444,444,444',     tier: 'GLORIOUS',                                    rarity: 444444444  },
  'APOSTOLOS':                  { chance: '1 IN 444,000,000',     tier: 'GLORIOUS',                                    rarity: 444000000  },
  'AFTER PARTY':                { chance: '1 IN 440,000,000',     tier: 'GLORIOUS',                                    rarity: 440000000  },
  'GARGANTUA':                  { chance: '1 IN 430,000,000',     tier: 'GLORIOUS',                                    rarity: 430000000  },
  'NORTHERN':                   { chance: '1 IN 405,000,000',     tier: 'GLORIOUS', biome: 'WINDY',                    rarity: 405000000  },
  'ABYSSAL HUNTER':             { chance: '1 IN 400,000,000',     tier: 'GLORIOUS', biome: 'RAINY',                    rarity: 400000000  },
  "I'M PEACH":                  { chance: '1 IN 400,000,000',     tier: 'GLORIOUS',                                    rarity: 400000000  },

  // ══ GLORIOUS — 300M–399M ══
  'CRYOFANG':                   { chance: '1 IN 380,000,000',     tier: 'GLORIOUS', biome: 'SNOWY',                    rarity: 380000000  },
  'SYMPHONY : BLOOMED':         { chance: '1 IN 375,000,000',     tier: 'GLORIOUS',                                    rarity: 375000000  },
  'CHILLSEAR':                  { chance: '1 IN 375,000,000',     tier: 'GLORIOUS',                                    rarity: 375000000  },
  'FLORA : EVERGREEN':          { chance: '1 IN 370,073,730',     tier: 'GLORIOUS',                                    rarity: 370073730  },
  'ATLAS':                      { chance: '1 IN 360,000,000',     tier: 'GLORIOUS',                                    rarity: 360000000  },
  'ORCHESTRA':                  { chance: '1 IN 336,870,912',     tier: 'GLORIOUS',                                    rarity: 336870912  },
  'LOTUSFALL':                  { chance: '1 IN 320,000,000',     tier: 'GLORIOUS',                                    rarity: 320000000  },
  'PERPETUAL':                  { chance: '1 IN 315,000,000',     tier: 'GLORIOUS',                                    rarity: 315000000  },
  'MAELSTROM':                  { chance: '1 IN 309,999,999',     tier: 'GLORIOUS',                                    rarity: 309999999  },
  'OVERTURE : HISTORY':         { chance: '1 IN 300,000,000',     tier: 'GLORIOUS',                                    rarity: 300000000  },
  'BLOODLUST':                  { chance: '1 IN 300,000,000',     tier: 'GLORIOUS', biome: 'CORRUPTION',               rarity: 300000000  },
  'EXOTIC VOID':                { chance: '1 IN 299,999,999',     tier: 'GLORIOUS',                                    rarity: 299999999  },
  'GRAVEBORN':                  { chance: '1 IN 290,000,000',     tier: 'GLORIOUS',                                    rarity: 290000000  },
  'PROPHECY':                   { chance: '1 IN 275,649,430',     tier: 'GLORIOUS',                                    rarity: 275649430  },
  'ASTRAL : ZODIAC':            { chance: '1 IN 267,200,000',     tier: 'GLORIOUS',                                    rarity: 267200000  },
  'ARCHANGEL':                  { chance: '1 IN 250,000,000',     tier: 'GLORIOUS', biome: 'HEAVEN',                   rarity: 250000000  },
  'ENCASE':                     { chance: '1 IN 230,000,000',     tier: 'GLORIOUS',                                    rarity: 230000000  },
  'HYPER-VOLT : EVER-STORM':    { chance: '1 IN 225,000,000',     tier: 'GLORIOUS',                                    rarity: 225000000  },
  'SHARD SURFER':               { chance: '1 IN 225,000,000',     tier: 'GLORIOUS',                                    rarity: 225000000  },
  'LUMENPOOL':                  { chance: '1 IN 220,000,000',     tier: 'GLORIOUS',                                    rarity: 220000000  },
  'IMPEACHED':                  { chance: '1 IN 200,000,000',     tier: 'GLORIOUS',                                    rarity: 200000000  },

  // ══ GLORIOUS — 100M–199M ══
  'NIGHTMARE SKY':              { chance: '1 IN 190,000,000',     tier: 'GLORIOUS', biome: 'DREAMSPACE',               rarity: 190000000  },
  'TWILIGHT : WITHERING GRACE': { chance: '1 IN 180,000,000',     tier: 'GLORIOUS',                                    rarity: 180000000  },
  'FELLED':                     { chance: '1 IN 180,000,000',     tier: 'GLORIOUS',                                    rarity: 180000000  },
  'SYMPHONY':                   { chance: '1 IN 175,000,000',     tier: 'GLORIOUS',                                    rarity: 175000000  },
  'OVERTURE':                   { chance: '1 IN 150,000,000',     tier: 'GLORIOUS',                                    rarity: 150000000  },
  'CRIMSON':                    { chance: '1 IN 120,000,000',     tier: 'GLORIOUS',                                    rarity: 120000000  },
  'POINT: ZERO':                { chance: '1 IN 120,000,000',     tier: 'GLORIOUS', biome: 'SINGULARITY',              rarity: 120000000  },
  'STARSCOURGE : RADIANT':      { chance: '1 IN 100,000,000',     tier: 'GLORIOUS', biome: 'STARFALL',                 rarity: 100000000  },
  'SPECTRAFLOW':                { chance: '1 IN 100,000,000',     tier: 'GLORIOUS',                                    rarity: 100000000  },
  'CHROMATIC : GENESIS':        { chance: '1 IN 99,999,999',      tier: 'GLORIOUS',                                    rarity: 99999999   },

  // ══ MYTHIC (inclus car > Glorious en rareté de gameplay) ══
  'ASTRONAUT':                  { chance: '1 IN 6,117,156',       tier: 'MYTHIC',  biome: 'SINGULARITY',               rarity: 6117156    },
  'COMET: FALLEN':              { chance: '1 IN 15,000,000',      tier: 'MYTHIC',  biome: 'STARFALL',                   rarity: 15000000   },
  'TWILIGHT':                   { chance: '1 IN 20,000,000',      tier: 'MYTHIC',                                       rarity: 20000000   },
  'TWILIGHT: IRIDESCENT':       { chance: '1 IN 60,000,000',      tier: 'MYTHIC',                                       rarity: 60000000   },
  'SHARD SURFER (MYTHIC)':      { chance: '1 IN 75,000,000',      tier: 'MYTHIC',  biome: 'SNOWY',                      rarity: 75000000   },
  'SAILOR: FLYING DUTCHMAN':    { chance: '1 IN 80,000,000',      tier: 'MYTHIC',  biome: 'RAINY',                      rarity: 80000000   },
};

// ════════════════════════════════════════════════════════════
//  INVENTORY — DB étendue (inclut tout pour analyse screenshot)
// ════════════════════════════════════════════════════════════
const FULL_AURA_DB = { ...AURA_DB };

// ════════════════════════════════════════════════════════════
//  TIERS — Couleurs, Emojis, Rang
// ════════════════════════════════════════════════════════════
const TIER_COLORS = {
  'CHALLENGED+':  0x8B0000,
  'CHALLENGED':   0xFF4500,
  'TRANSCENDENT': 0x00FFFF,
  'GLORIOUS':     0xFFD700,
  'MYTHIC':       0xE74C3C,
  'EXALTED':      0xFF69B4,
};

const TIER_EMOJIS = {
  'CHALLENGED+':  '👑',
  'CHALLENGED':   '⚔️',
  'TRANSCENDENT': '🌌',
  'GLORIOUS':     '🌟',
  'MYTHIC':       '🔴',
  'EXALTED':      '💜',
};

const TIER_RANK = {
  'MYTHIC': 1, 'GLORIOUS': 2, 'EXALTED': 3,
  'TRANSCENDENT': 4, 'CHALLENGED': 5, 'CHALLENGED+': 6,
};

const AURA_COLORS = {
  'EQUINOX':      0x808080,
  'LUMINOSITY':   0xb2ddf7,
  'PIXELATION':   0xe55c53,
  'BREAKTHROUGH': 0x5c51ca,
  'NYCTOPHOBIA':  0x101010,
  'ILLUSIONARY':  0x4fc3f7,
  'OPPRESSION':   0x2a2a2a,
  'GLITCH':       0xb2f783,
  'MEMORY':       0x5746b4,
  'OBLIVION':     0x8152f2,
  'DREAMATRIC':   0xBE75E6,
  'BOREALIS':     0xbe75e6,
  'ASTRAIOS':     0xedfe8c,
  'MONARCH':      0x3d0e8e,
  'EGGIS':        0x9efb85,
  'YOLKEGG':      0xa49cf9,
  'LEVIATHAN':    0x5bb7bd,
  'NEFERKHAF':    0x97836c,
  'RED MOON':     0xe83720,
};

const DEFAULT_GLOBAL_COLOR = 0x565ff2;

// ────────────────────────────────────────────────────────────
//  Icônes des auras
// ────────────────────────────────────────────────────────────
const AURA_ICONS = {
  'EQUINOX':      'https://cdn.discordapp.com/attachments/1125441054313816145/1502306710080065576/EQUINOX_star.png?ex=69ff3ba7&is=69fdea27&hm=2bcff38367b53f03230215b5a9ffa3a3f1aba54fb8a21e6b004c3d9db3e657f3&',
  'BREAKTHROUGH': 'https://cdn.discordapp.com/attachments/1125441054313816145/1502306756871721121/BREAKTHROUGH_star.png?ex=69ff3bb2&is=69fdea32&hm=a3886a96f8307b19ffc84a055d724baab16d2166d7abf336d59aa0b46a6c43af&',
  'LEVIATHAN':    'https://cdn.discordapp.com/attachments/1125441054313816145/1502306798994981076/LEVIATHAN_star.png?ex=69ff3bbc&is=69fdea3c&hm=be4b1918023c56580a28b44e501b8b04eb27045e76f33a5472d8f849d1184776&',
  'EGGIS':        'https://cdn.discordapp.com/attachments/1125441054313816145/1502306830079099032/EGGIS_star.png?ex=69ff3bc3&is=69fdea43&hm=ec0ede547adbe2f2f2e4ab47d27f9ec6520ca79191241e070f8e074f786ab8e3&',
  'DREAMATRIC':   'https://cdn.discordapp.com/attachments/1125441054313816145/1502306855513358467/DREAMETRIC_star.png?ex=69ff3bc9&is=69fdea49&hm=0c285c88c37f10387efd34b00ff033017604d723c58298587d3b82e78b760747&',
  'BOREALIS':     'https://cdn.discordapp.com/attachments/1125441054313816145/1502306876149465220/BOREALIS_star.png?ex=69ff3bce&is=69fdea4e&hm=6c62f137bfa7f26653c34e271ecae71b5b8f4b2813bf0405da7f0b553fc9c699&',
  'LUMINOSITY':   'https://cdn.discordapp.com/attachments/1125441054313816145/1502306895799652492/LUMI_star.png?ex=69ff3bd3&is=69fdea53&hm=bcaa64d07112ddf8c06dde7e1f52a754e066e27a3256e719cdf5f5f90ffc52f1&',
  'OPPRESSION':   'https://cdn.discordapp.com/attachments/1125441054313816145/1502306918256083186/OPPRESSION_star.png?ex=69ff3bd8&is=69fdea58&hm=408043990ddce1e1338225093f253d487293501156351dd5ea4dd82dfb3e312c&',
  'GLITCH':       'https://cdn.discordapp.com/attachments/1125441054313816145/1502306934311882792/GLITCH_star.png?ex=69ff3bdc&is=69fdea5c&hm=dd2a3b87cf1ab9cfc78e3f7bfbecde754204ab04d72d2b0868a6f3c359ac759f&',
  'MONARCH':      'https://cdn.discordapp.com/attachments/1125441054313816145/1502306953689301002/MONARCH_star.png?ex=69ff3be1&is=69fdea61&hm=4bf4fd4478e1b3d49cfc78e3f7bfbecde754204ab04d72d2b0868a6f3c359ac759f&',
  'NYCTOPHOBIA':  'https://cdn.discordapp.com/attachments/1125441054313816145/1502306969451761704/NYCTO_star.png?ex=69ff3be5&is=69fdea65&hm=a86f289ce9d6a98f580544967f261198017efad80780ea77e81e3a23b33d95f6&',
  'YOLKEGG':      'https://cdn.discordapp.com/attachments/1125441054313816145/1502307034694156360/YOLKEGG_star.png?ex=69ff3bf4&is=69fdea74&hm=4b61bb98c16869eb1bb0d4457b02fd7289aa36b2342250a27de741567d6acba5&',
  'PIXELATION':   'https://cdn.discordapp.com/attachments/1125441054313816145/1502307053090373723/Pixelation_star.png?ex=69ff3bf8&is=69fdea78&hm=d09e162d4717da68778c8131600e8d031a47406b658998312c5e8eedf8e690b5&',
  'MEMORY':       'https://cdn.discordapp.com/attachments/1125441054313816145/1502308712310636645/MEMORY_star.png?ex=69ff3d84&is=69fdec04&hm=7bf7f6017042c5553f85aa2a8e8a67cdaec074058fa714b11eccb83860987620&',
  'ASTRAIOS':     'https://cdn.discordapp.com/attachments/1125441054313816145/1502309321214660869/ASTRAIOS_star.png?ex=69ff3e15&is=69fdec95&hm=16d20b1d7ed3f7a39305b51c3b22677b852c0d0fd1b2aa85c46788ffb7ce9201&',
  'NEFERKHAF':    'https://cdn.discordapp.com/attachments/1125441054313816145/1502308266502520872/NEFERKHAF_star.png?ex=69ff3d1a&is=69fdeb9a&hm=05ecb48cf6bb9f4d05b11044badb7da2fd3adbef2246d3856a3c2b1f84857584&',
  'RED MOON':     'https://cdn.discordapp.com/attachments/1125441054313816145/1502308308424458330/Fragment_of_the_crimson_moon_star.png?ex=69ff3d24&is=69fdeba4&hm=d2daca48464340f4c5ca66e25bb3f57aaf6a85f0674596ba6985583bdfaead0f&',
};
const DEFAULT_AURA_ICON = 'https://cdn.discordapp.com/attachments/1125441054313816145/1502307077522194482/Global_star.png?ex=69ff3bfe&is=69fdea7e&hm=d5e29a1fd843483a5325dc437dd16d91172f72d1b08b05d79711f90cb2c6bb4d&';

function getAuraIcon(auraName) {
  return AURA_ICONS[auraName.toUpperCase()] ?? DEFAULT_AURA_ICON;
}

function getAuraInfo(auraName) {
  const upper = auraName.toUpperCase().trim();
  if (AURA_DB[upper]) return { ...AURA_DB[upper] };
  return null;
}

// ════════════════════════════════════════════════════════════
//  DESCRIPTIONS DES AURAS (pour /myrare et /guess)
// ════════════════════════════════════════════════════════════
const AURA_DESCRIPTIONS = {
  'MONARCH':                    "L'aura absolue du jeu. Celui qui la porte règne sur tout. Obtenue dans les biomes Corruption ou Glitched.",
  'LEVIATHAN':                  "La bête des profondeurs domptée. Une entité colossale des abysses, liée au biome Rainy.",
  'ASTRAIOS':                   "L'aura de la singularité cosmique. Celui qui la trouve referme la Singularité elle-même.",
  'OBLIVION':                   "L'aura de l'oubli total. Obtenue via la potion Oblivion — il découvre La Vérité cachée.",
  'OPPRESSION':                 "Se tenir devant le Dieu oppresseur. Ressentir le poids de toute la création. Biome Hell.",
  'DREAMATRIC':                 "Celui qui l'obtient... ne s'est jamais réveillé. Aura du Dreamspace.",
  'ILLUSIONARY':                "Une force inconnue transforme son porteur en pantin parfait. Biome Dreamspace.",
  'GLITCH':                     "Une erreur dans la réalité. L'aura qui ne devrait pas exister. Biome Glitched.",
  'NEFERKHAF':                  "L'entité rampante des dunes. Créature ancienne obtenue via la Potion of Dune.",
  'RED MOON':                   "Le Fragment du Chaos lunaire. Obtenu via la Red Moon Potion.",
  'MEMORY':                     "Memory, The Fallen — une âme oubliée retrouvée via la potion Oblivion.",
  'BOREALIS':                   "Perdu dans ses rêves sous les aurores. Biome Starfall.",
  'EQUINOX':                    "L'aura entre le POSITIF et le NÉGATIF. L'une des plus rares du jeu — 1 in 2.5B.",
  'BREAKTHROUGH':               "Une percée dans l'inconnu. Le joueur a trouvé quelque chose qui ne devrait pas exister.",
  'LUMINOSITY':                 "La Lumière Aveuglante dévore son porteur. Biome Heaven.",
  'PIXELATION':                 "Le joueur devient PIXELISÉ — absorbé par le Cyberspace.",
  'NYCTOPHOBIA':                "La peur absolue du noir. Le cauchemar littéral vécu. Biome NULL.",
  'MASTER-HAND':                "L'aura de la Main Maîtresse. Chance inconnue — un mystère total.",
  'EGGIS':                      "L'Oeuf du Ciel — aura secrète de Pâques. L'une des plus rares Easter Eggs.",
  'YOLKEGG':                    "Un ami de Pâques retrouvé. Easter Egg ultra rare lié à YOLKEGG.",
  'AEGIS':                      "Le bouclier céleste. Protection absolue — 1 in 825M.",
  'RUINS : WITHERED':           "Les ruines dépérissantes d'une civilisation oubliée.",
  'APOSTOLOS : VEIL':           "Le voile de l'Apôtre — version cachée d'Apostolos.",
  'PAROL':                      "Une lanterne dans la nuit — aura de fête rare.",
  'SOVEREIGN':                  "La souveraineté incarnée. 1 in 750M.",
  'BANSHEE':                    "Le cri de la Banshee résonne dans le NULL. Biome NULL.",
  'MALEDICTION':                "La malédiction faite aura. 1 in 730M.",
  'WRAITHLIGHT':                "La lumière du spectre — entre vie et mort.",
  'PROLOGUE':                   "Le commencement de quelque chose de plus grand. 666M.",
  'PYTHOS':                     "Le serpent primordial. 1 in 666,666,666.",
  'HARVESTER':                  "Le faucheur des âmes. Biome Hell.",
  'APOCALYPSE':                 "La fin des temps incarnée. Biome Corruption.",
  'MATRIX : REALITY':           "La réalité de la Matrice révélée. Biome Cyberspace.",
  'SOPHYRA':                    "Une entité mystérieuse et élégante. 1 in 570M.",
  'ELUDE':                      "L'insaisissable — toujours hors de portée. 555M.",
  'MATRIX : OVERDRIVE':         "La Matrice en surchauffe. Biome Cyberspace.",
  'RUINS':                      "Les ruines d'un monde ancien. 1 in 500M.",
  'PHANTASMA':                  "Le fantôme d'une aura — entre deux mondes.",
  'KYAWTHUITE : REMEMBRANCE':   "Le souvenir du minéral le plus rare du monde réel.",
  'UNKNOWN':                    "L'inconnu absolu. Identité inconnue. 444M.",
  'APOSTOLOS':                  "L'Apôtre — messager d'une force supérieure.",
  'AFTER PARTY':                "La fête qui ne se termine jamais. 440M.",
  'GARGANTUA':                  "Une entité colossale au-delà de toute compréhension.",
  'NORTHERN':                   "Les vents du Nord incarnés. Biome Windy.",
  'ABYSSAL HUNTER':             "Le chasseur des abysses. Biome Rainy.",
  "I'M PEACH":                  "Une aura secrète et décalée. 1 in 400M.",
  'CRYOFANG':                   "Les crocs du gel — prédateur des neiges. Biome Snowy.",
  'SYMPHONY : BLOOMED':         "La symphonie en pleine floraison.",
  'CHILLSEAR':                  "Le froid brûlant — deux opposés fusionnés.",
  'FLORA : EVERGREEN':          "La nature éternelle et verdoyante.",
  'ATLAS':                      "Le titan qui porte le monde sur ses épaules.",
  'ORCHESTRA':                  "Une symphonie cosmique de 336M notes.",
  'LOTUSFALL':                  "La chute du lotus — beauté éphémère.",
  'PERPETUAL':                  "L'éternité en mouvement. 315M.",
  'MAELSTROM':                  "Le maelström — tourbillon de puissance brute.",
  'OVERTURE : HISTORY':         "L'ouverture de l'Histoire — le commencement.",
  'BLOODLUST':                  "La soif de sang. Biome Corruption.",
  'EXOTIC VOID':                "Le vide exotique — espace inexploré.",
  'GRAVEBORN':                  "Né du tombeau — revenu de la mort.",
  'PROPHECY':                   "La prophétie réalisée. 275M.",
  'ASTRAL : ZODIAC':            "Les étoiles du zodiaque alignées.",
  'ARCHANGEL':                  "L'Archange descendu du paradis. Biome Heaven.",
  'ENCASE':                     "Enfermé dans un cristal d'éternité.",
  'HYPER-VOLT : EVER-STORM':    "La tempête électrique éternelle.",
  'SHARD SURFER':               "Surfer sur les éclats de réalité.",
  'LUMENPOOL':                  "La mare de lumière — source de lueur.",
  'IMPEACHED':                  "Destitué — le pouvoir renversé.",
  'NIGHTMARE SKY':              "Le ciel du cauchemar. Biome Dreamspace.",
  'TWILIGHT : WITHERING GRACE': "La grâce du crépuscule fané.",
  'FELLED':                     "Abattu — tombé mais jamais oublié.",
  'SYMPHONY':                   "La grande symphonie des auras. 175M.",
  'OVERTURE':                   "L'ouverture — début d'une ère nouvelle.",
  'CRIMSON':                    "Le cramoisi — rouge sang intense. 120M.",
  'STARSCOURGE : RADIANT':      "Le fléau des étoiles rayonnant. Biome Starfall.",
  'SPECTRAFLOW':                "Le flux spectral de toutes les couleurs.",
  'CHROMATIC : GENESIS':        "La genèse chromatique — naissance de la couleur.",
};

// ════════════════════════════════════════════════════════════
//  INVENTORY — Helpers IA
// ════════════════════════════════════════════════════════════

async function analyzeInventoryWithAI(imageUrl, openrouterKey) {
  let imageContent;
  try {
    const imgRes  = await fetch(imageUrl);
    const buffer  = await imgRes.arrayBuffer();
    const b64     = Buffer.from(buffer).toString('base64');
    const mime    = imgRes.headers.get('content-type') ?? 'image/png';
    imageContent  = { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } };
  } catch (err) {
    console.error('[Inventory] Impossible de charger l\'image:', err.message);
    imageContent = { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } };
  }

  const auraList = Object.keys(FULL_AURA_DB).join('\n- ');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are an expert at the Roblox game Sol's RNG. Analyze this screenshot of a player's aura storage/inventory.

IMPORTANT: This is an "Aura Storage" UI from Sol's RNG. Each slot shows an aura name as text label. Read ALL the text labels visible in the grid slots carefully.

Here is the COMPLETE list of valid aura names to match against:
- ${auraList}

Instructions:
1. Read every aura name label visible in every grid slot (even locked ones show the name)
2. Match each name you see to the closest entry in the list above (case-insensitive)
3. Count duplicates — if "Memory" appears 4 times, include it 4 times in "found"
4. Common auras in this image context: OBLIVION, MEMORY, EQUINOX, LUMINOSITY, AEGIS, SOVEREIGN, RUINS : WITHERED

Respond ONLY with valid JSON, no text before or after:
{
  "found": ["EXACT_NAME_1", "EXACT_NAME_2", ...],
  "uncertain": ["UNSURE_NAME_1", ...],
  "confidence": 0.9
}

Use UPPERCASE names exactly as they appear in the list. If no inventory is visible:
{"found": [], "uncertain": [], "confidence": 0, "error": "No inventory visible"}`
          },
          imageContent,
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() ?? '';
  console.log('[Inventory] IA raw response:', text.slice(0, 300));
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { found: [], uncertain: [], confidence: 0, error: 'Erreur de parsing IA: ' + text.slice(0, 100) };
  }
}

async function analyzeInventoryTextWithAI(description, openrouterKey) {
  const auraList = Object.keys(FULL_AURA_DB).join(', ');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Tu es un expert Sol's RNG. L'utilisateur liste ses auras : "${description}"

Liste officielle des auras (100M+ et Challenged uniquement) : ${auraList}

Identifie les auras mentionnées et retourne UNIQUEMENT ce JSON :
{"found": ["NOM_EXACT_1", ...], "uncertain": [], "confidence": 0.8}`
      }]
    })
  });
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() ?? '';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { found: [], uncertain: [], confidence: 0 };
  }
}

function fuzzyFindAura(name) {
  const nameUp = name.toUpperCase().trim();
  if (FULL_AURA_DB[nameUp]) return { key: nameUp, info: FULL_AURA_DB[nameUp] };
  const exactCI = Object.entries(FULL_AURA_DB).find(([k]) => k.toUpperCase() === nameUp);
  if (exactCI) return { key: exactCI[0], info: exactCI[1] };
  const partial = Object.entries(FULL_AURA_DB).find(([k]) =>
    k.toUpperCase().includes(nameUp) || nameUp.includes(k.toUpperCase())
  );
  if (partial) return { key: partial[0], info: partial[1] };
  const nameWords = nameUp.split(/[\s:_\-]+/).filter(w => w.length >= 4);
  if (nameWords.length > 0) {
    const wordMatch = Object.entries(FULL_AURA_DB).find(([k]) =>
      nameWords.some(w => k.toUpperCase().includes(w))
    );
    if (wordMatch) return { key: wordMatch[0], info: wordMatch[1] };
  }
  return null;
}

function buildInventoryEmbed(robloxUsername, aiResult, historyGlobals) {
  const { found = [], uncertain = [], confidence = 0 } = aiResult;

  const historicNames = (historyGlobals ?? []).map(g => g.auraName.toUpperCase().trim());
  const aiNamesUpper  = found.map(n => n.toUpperCase().trim());
  const allAuraNames  = [...aiNamesUpper, ...historicNames.filter(h => !aiNamesUpper.includes(h))];

  const enriched = allAuraNames
    .map(name => {
      const match       = fuzzyFindAura(name);
      const displayName = match ? match.key : name;
      return {
        name:        displayName,
        info:        match ? match.info : { tier: 'UNKNOWN', chance: '?', rarity: 0 },
        fromHistory: historicNames.includes(name),
        fromAI:      aiNamesUpper.includes(name),
      };
    })
    .filter(e => e.info.tier !== 'UNKNOWN')
    .sort((a, b) => (TIER_RANK[b.info.tier] ?? 0) - (TIER_RANK[a.info.tier] ?? 0));

  if (enriched.length === 0) {
    return new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle(`📦 Inventaire de ${robloxUsername}`)
      .setDescription(
        "❌ Aucune aura reconnue dans l'inventaire.\n\n" +
        "Note : Seules les auras **100M+** et **Challenged/Challenged+** sont trackées.\n\n" +
        "Essaie de joindre une image plus nette, ou liste tes auras avec `/inventory auras: Glitch, Borealis, ...`"
      )
      .setTimestamp();
  }

  const byTier = {};
  for (const entry of enriched) {
    const t = entry.info.tier;
    if (!byTier[t]) byTier[t] = [];
    byTier[t].push(entry);
  }

  const tiersSorted = Object.keys(byTier).sort((a, b) => (TIER_RANK[b] ?? 0) - (TIER_RANK[a] ?? 0));
  const topTier     = tiersSorted[0];
  const embedColor  = TIER_COLORS[topTier] ?? DEFAULT_GLOBAL_COLOR;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`📦 Inventaire de ${robloxUsername}`)
    .setDescription(`**${enriched.length} aura(s) détectée(s)** | Confiance IA : ${Math.round(confidence * 100)}%`)
    .setTimestamp()
    .setFooter({ text: "Sol's Stat Tracker Bot • Analyse IA — Auras 100M+ et Challenged uniquement" });

  let fieldCount = 0;
  for (const tier of tiersSorted) {
    if (fieldCount >= 24) break;
    const auras = byTier[tier];
    const emoji = TIER_EMOJIS[tier] ?? '❓';
    const lines = auras.map(e => {
      const src   = e.fromAI && e.fromHistory ? '📸🏆' : e.fromAI ? '📸' : '🏆';
      const biome = e.info.biome ? ` *(${e.info.biome})*` : '';
      return `${src} **${e.name}** — ${e.info.chance}${biome}`;
    });

    const chunks = [];
    for (let i = 0; i < lines.length; i += 5) chunks.push(lines.slice(i, i + 5));
    for (let i = 0; i < chunks.length && fieldCount < 24; i++) {
      embed.addFields({
        name:   i === 0 ? `${emoji} ${tier} (${auras.length})` : `${emoji} ${tier} (suite)`,
        value:  chunks[i].join('\n'),
        inline: false,
      });
      fieldCount++;
    }
  }

  embed.addFields({
    name:   '📖 Légende',
    value:  '📸 = détecté via image | 🏆 = dans tes globals trackés | 📸🏆 = les deux',
    inline: false,
  });

  return embed;
}

// ════════════════════════════════════════════════════════════
//  WebSocket — Sol's Stat Tracker Gateway
// ════════════════════════════════════════════════════════════
let ws = null;
let reconnectTimeout = null;
let reconnectInterval = 31000;
let lastDisconnectTime = null;
const MAX_RECONNECT_INTERVAL = config.maxReconnectInterval ?? 120000;

function connectGateway() {
  if (ws) { ws.removeAllListeners(); ws.terminate(); }
  console.log('[Gateway] Connexion à', config.gatewayURL);
  ws = new WebSocket(config.gatewayURL, { headers: { token: config.solsToken } });

  ws.on('open', () => {
    console.log('[Gateway] ✅ Connecté !');
    reconnectInterval  = 31000;
    lastDisconnectTime = null;
  });

  ws.on('message', async (rawData) => {
    let msg;
    try { msg = JSON.parse(rawData.toString('utf8')); } catch { return; }
    if (config.verboseLogging) console.log('[Gateway] Message reçu:', JSON.stringify(msg).slice(0, 500));
    switch (msg.action) {
      case 'enabled':        console.log('[Gateway] ✅ Activé !'); break;
      case 'disabled':       console.log('[Gateway] ⚠️ Désactivé.'); break;
      case 'executeWebhook': await handleGlobalEvent(msg.data); break;
      default: if (config.verboseLogging) console.log('[Gateway] Action non gérée:', msg.action);
    }
  });

  ws.on('close', async (code, reason) => {
    reason = reason.toString('utf8');
    console.warn(`[Gateway] Déconnecté (code ${code}${reason ? ` - ${reason}` : ''})`);
    lastDisconnectTime = Date.now();
    switch (code) {
      case 4001: console.error('[Gateway] ❌ Token manquant. Arrêt.'); return;
      case 4002: console.error('[Gateway] ❌ Token invalide. Arrêt.'); return;
      case 4004: console.error('[Gateway] ❌ Token supprimé. Arrêt.'); return;
      case 4003:
        console.error('[Gateway] ⚠️ Token déjà utilisé.');
        if (!config.reconnectOnDuplicateConnection) return;
        setTimeout(connectGateway, 35000); return;
      default: scheduleReconnect();
    }
  });

  ws.on('error', (err) => { console.error('[Gateway] Erreur:', err.message); ws.terminate(); });
}

function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    reconnectInterval = Math.min(reconnectInterval * 2, MAX_RECONNECT_INTERVAL);
    connectGateway();
  }, reconnectInterval);
}

function startGatewayWatchdog() {
  setInterval(() => {
    if (lastDisconnectTime && Date.now() - lastDisconnectTime > 10 * 60 * 1000) {
      lastDisconnectTime = Date.now();
    }
  }, 5 * 60 * 1000);
}

// ════════════════════════════════════════════════════════════
//  Parsers Global Events
// ════════════════════════════════════════════════════════════
const TRANSCENDENT_PATTERNS = [
  {
    regex: /\[?\*{0,2}\[?\*{0,2}@?([A-Za-z0-9_]+)\*{0,2}\]?\*{0,2}\]?\s+Has Found The \[?\*{0,2}\[?[\?]+\]?\*{0,2}\]?\s+between/i,
    auraName: 'EQUINOX',
    getMessage: (display, u) => `**@${u} has Found The **[**???????**]** between POSITIVE and **NEGATIVE.**`,
  },
  {
    regex: /The Blinding Light has devoured \*{0,2}\[?\*{0,2}@?([A-Za-z0-9_]+)/i,
    auraName: 'LUMINOSITY',
    getMessage: (display, u) => `The Blinding Light has devoured **[@${u}]**.`,
  },
  {
    regex: /\*{0,2}@?([A-Za-z0-9_]+)\*{0,2}\s+Has Become P\s*I\s*X\s*E\s*L\s*A\s*T\s*E\s*D/i,
    auraName: 'PIXELATION',
    getMessage: (display, u) => `**@${u}** has Become **P I X E L A T E D!**`,
  },
  {
    regex: /\[GLOBAL\][^\[]*\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+has found \?+,?\s*chance of 1 in 1,999,999,999/i,
    auraName: 'BREAKTHROUGH',
    getMessage: (display, u) => `**${u}** has found **???**, chance of **1 in 1,999,999,999** **[BREAKTHROUGH!]**`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+experienced the literal nightmare/i,
    auraName: 'NYCTOPHOBIA',
    getMessage: (display, u) => `**${display}(@${u})** experienced the literal nightmare.`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+has become [^\n]*PERFECT PUPPET/i,
    auraName: 'ILLUSIONARY',
    getMessage: (display, u) => `**[${u}]** has become **\u2588\u2588\u2588'\u2588 PERFECT PUPPET**.`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+HAS FOUND\s+\*{0,2}Memory[,.]?\*{0,2}/i,
    auraName: 'MEMORY',
    getMessage: (display, u) => `**${display}(@${u})** HAS FOUND **Memory, The Fallen!**`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+didn.t wake up/i,
    auraName: 'DREAMATRIC',
    getMessage: (display, u) => `**${display}(@${u})** didn't wake up.`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+has discovered\s+\*{0,2}\[?The Truth\]?\*{0,2}/i,
    auraName: 'OBLIVION',
    getMessage: (display, u) => `**${display}(@${u})** has discovered **[The Truth]**`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+was lost in\s+\*{0,2}their dreams\*{0,2}/i,
    auraName: 'BOREALIS',
    getMessage: (display, u) => `**${display}(@${u})** was lost in **their dreams**.`,
  },
  {
    regex: /\[?\*{0,2}([A-Za-z0-9_]+)\*{0,2}\]?\s+Has Stood Before\s+\*{0,2}the God\*{0,2}/i,
    auraName: 'OPPRESSION',
    getMessage: (display, u) => `**${display}(@${u})** Has Stood Before **the God**.`,
  },
];

function parseTranscendentMessage(content) {
  for (const pattern of TRANSCENDENT_PATTERNS) {
    const m = pattern.regex.exec(content);
    if (m) {
      return {
        robloxUsername: m[1].trim().replace(/^@/, ''),
        auraName: pattern.auraName,
        getMessageFn: pattern.getMessage,
        action: 'HAS FOUND',
        chanceStr: null,
        biome: null,
        isTranscendent: true,
      };
    }
  }
  return null;
}

function parseLines(content) {
  const results = [];
  const p1 = /\*\*[^*]+\(@([^)]+)\)\*\*\s+(HAS FOUND|HAS CRAFTED)\s+\*\*(.+?)\*\*(?:,\s+CHANCE OF\s+\*\*(1\s+IN\s+[\d,]+)\*\*)?(?:\s+\*\*\[From (.+?)!\]\*\*)?/g;
  const p2 = /\*\*@([^*]+)\*\*\s+(HAS FOUND|HAS CRAFTED)\s+\*\*(.+?)\*\*(?:,\s+CHANCE OF\s+\*\*(1\s+IN\s+[\d,]+)\*\*)?(?:\s+\*\*\[From (.+?)!\]\*\*)?/g;
  let m;
  while ((m = p1.exec(content)) !== null) results.push({ robloxUsername: m[1].trim(), action: m[2].trim(), auraName: m[3].trim(), chanceStr: m[4]?.trim() ?? null, biome: m[5]?.trim() ?? null });
  while ((m = p2.exec(content)) !== null) results.push({ robloxUsername: m[1].trim(), action: m[2].trim(), auraName: m[3].trim(), chanceStr: m[4]?.trim() ?? null, biome: m[5]?.trim() ?? null });
  return results;
}

// ════════════════════════════════════════════════════════════
//  Handle Global Event
// ════════════════════════════════════════════════════════════
async function handleGlobalEvent(data) {
  if (config.verboseLogging) console.log('[Global] Payload:', JSON.stringify(data));
  const channelId    = data.overrideChannelId ?? config.notificationChannelId;
  const notifChannel = client.channels.cache.get(channelId);
  if (!notifChannel) { console.warn('[Global] Canal introuvable:', channelId); return; }

  const rawContent = data.content || '';
  console.log('[DEBUG] rawContent EXACT:', JSON.stringify(rawContent));

  const db              = loadDB();
  const linkedUsernames = new Set(Object.values(db).map(u => u.robloxUsername.toLowerCase()));

  const transcendent = parseTranscendentMessage(rawContent);
  let finds = transcendent ? [transcendent] : parseLines(rawContent);

  finds = finds.filter(f => linkedUsernames.has(f.robloxUsername.toLowerCase()));
  if (finds.length === 0) {
    if (config.verboseLogging) console.log('[Global] Aucun joueur lié dans ce batch — ignoré.');
    return;
  }

  const nowUnix = Math.floor(Date.now() / 1000);

  for (const { robloxUsername, action, auraName, chanceStr, biome, isTranscendent, getMessageFn } of finds) {
    console.log(`[Global] ${robloxUsername} — ${auraName}`);
    const entry = Object.entries(db).find(([, u]) => u.robloxUsername.toLowerCase() === robloxUsername.toLowerCase());
    if (!entry) { if (config.verboseLogging) console.log(`[Global] ${robloxUsername} non lié — ignoré.`); continue; }

    const [discordId, userData] = entry;
    const auraInfo    = getAuraInfo(auraName);
    const tier        = auraInfo?.tier ?? 'TRANSCENDENT';
    const embedColor  = AURA_COLORS[auraName.toUpperCase()] ?? DEFAULT_GLOBAL_COLOR;
    const tierEmoji   = TIER_EMOJIS[tier] ?? '🌌';
    const finalChance = chanceStr ?? auraInfo?.chance ?? 'Inconnue';
    const auraBiome   = auraInfo?.biome ?? null;
    const auraIconURL = getAuraIcon(auraName);

    const SPECIAL_MESSAGES = {
      'EQUINOX':      (display, u) => `**@${u}** Has Found The **[**????????**]** between POSITIVE and **NEGATIVE**.`,
      'LUMINOSITY':   (display, u) => `The Blinding Light has devoured **[@${u}]**.`,
      'PIXELATION':   (display, u) => `**@${u}** Has Become **PIXELATED!**`,
      'BREAKTHROUGH': (display, u) => `**${u}** has found **???**, chance of **1 in 1,999,999,999** **[BREAKTHROUGH!]**`,
      'NYCTOPHOBIA':  (display, u) => `**${display}(@${u})** experienced the **literal nightmare**.`,
      'ILLUSIONARY':  (display, u) => `**${u}** has become **\u2588\u2588\u2588'\u2588 PERFECT PUPPET**.`,
      'GLITCH':       (display, u) => `error occured from **${display}(@${u})**.`,
      'MEMORY':       (display, u) => `**${display}(@${u})** HAS FOUND **Memory, The Fallen!**`,
      'DREAMATRIC':   (display, u) => `**${display}(@${u})** didn't wake up.`,
      'OPPRESSION':   (display, u) => `**${display}(@${u})** Has Stood Before **the God**.`,
      'OBLIVION':     (display, u) => `**${display}(@${u})** has discovered **[The Truth]**`,
      'BOREALIS':     (display, u) => `**${display}(@${u})** was lost in **their dreams**.`,
      'EGGIS':        (display, u) => `**${display}(@${u})** **The EGG of the Sky!!!**`,
      'YOLKEGG':      (display, u) => `**${display}(@${u})** has found an **easter friend**.`,
      'ASTRAIOS':     (display, u) => `**${display}(@${u})** has closed **the Singularity**.`,
      'MONARCH':      (display, u) => `All hail, The **${display}(@${u})**.`,
      'LEVIATHAN':    (display, u) => `**${display}(@${u})** has tamed the **Ruler of Beneath**.`,
      'NEFERKHAF':    (display, u) => `**${display}(@${u})** HAS FOUND **Neferkhaf, The Crawler!**`,
      'RED MOON':     (display, u) => `**${display}(@${u})** has gotten the **Fragment of Chaos.**`,
    };

    const displayName = userData.displayName ?? robloxUsername;
    const authorLine  = `${displayName}(@${robloxUsername})`;
    let descriptionLine;
    const specialFn = SPECIAL_MESSAGES[auraName.toUpperCase().trim()];

    if (getMessageFn)  descriptionLine = getMessageFn(displayName, robloxUsername);
    else if (specialFn) descriptionLine = specialFn(displayName, robloxUsername);
    else {
      descriptionLine = `**${displayName}(@${robloxUsername})** ${action} **${auraName}**`;
      if (finalChance !== 'Inconnue') descriptionLine += `, CHANCE OF **${finalChance}**`;
      if (biome) descriptionLine += ` **[From ${biome}!]**`;
    }

    const fields = [{ name: 'Rarity', value: finalChance !== 'Inconnue' ? finalChance : '—', inline: true }];
    if (auraBiome) fields.push({ name: '🌍 Biome', value: auraBiome, inline: true });
    fields.push({ name: 'Time Discovered', value: `<t:${nowUnix}:R>`, inline: false });

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({ name: authorLine, iconURL: auraIconURL })
      .setDescription(descriptionLine)
      .addFields(...fields)
      .setTimestamp();

    const userPing  = userData.notifyDisabled ? '' : `<@${discordId}>`;
    const extraPing = userPing;

    await notifChannel.send({
      content: extraPing ? `<@&${config.notificationRoleId}> ${extraPing}` : `<@&${config.notificationRoleId}>`,
      embeds: [embed],
    });

    const history = loadHistory();
    if (!history[discordId]) history[discordId] = [];
    history[discordId].push({
      auraName,
      tier,
      chance:    finalChance,
      biome:     auraBiome ?? biome ?? null,
      timestamp: nowUnix,
    });
    saveHistory(history);

    totalGlobalsDetected++;
    updateBotStatus();

    if (isTranscendent) console.log(`[Global] 🌌 TRANSCENDANT : "${auraName}" — ${robloxUsername}`);
    console.log(`[Global] ✅ Notif envoyée — ${userData.robloxUsername} | "${auraName}"`);
  }
}

// ════════════════════════════════════════════════════════════
//  Slash Commands
// ════════════════════════════════════════════════════════════
const commands = [
  new SlashCommandBuilder().setName('link').setDescription('Lier ton username Roblox à ton compte Discord')
    .addStringOption(opt => opt.setName('username').setDescription('Ton username Roblox exact').setRequired(true)),
  new SlashCommandBuilder().setName('unlink').setDescription('Supprimer le lien entre ton Discord et Roblox'),
  new SlashCommandBuilder().setName('links').setDescription('Lister tous les comptes liés (admin)').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('stats').setDescription("Voir tes infos de compte Sol's RNG"),
  new SlashCommandBuilder().setName('myglobals').setDescription("Voir l'historique de tes globals détectés")
    .addIntegerOption(opt => opt.setName('page').setDescription('Numéro de page').setRequired(false).setMinValue(1)),
  new SlashCommandBuilder().setName('globalsof').setDescription("Voir les globals d'un autre joueur")
    .addUserOption(opt => opt.setName('user').setDescription('Membre Discord').setRequired(true)),
  new SlashCommandBuilder().setName('topaura').setDescription('Quelle aura a été obtenue le plus de fois sur le serveur'),
  new SlashCommandBuilder().setName('recent').setDescription('Les derniers globals détectés sur le serveur')
    .addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre de globals à afficher (défaut: 10)').setRequired(false).setMinValue(1).setMaxValue(25)),
  new SlashCommandBuilder().setName('notify').setDescription('Activer ou désactiver tes pings de globals')
    .addStringOption(opt => opt.setName('statut').setDescription('on ou off').setRequired(true)
      .addChoices({ name: '🔔 Activer', value: 'on' }, { name: '🔕 Désactiver', value: 'off' })),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Classement des membres par nombre de globals'),
  new SlashCommandBuilder().setName('gateway').setDescription("(Admin) Statut de la connexion WebSocket").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('forcesync').setDescription("(Admin) Force la reconnexion au gateway").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('clearhistory').setDescription("(Admin) Réinitialiser l'historique d'un joueur").setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Membre Discord').setRequired(true)),
  new SlashCommandBuilder().setName('myrare').setDescription('Affiche ton global le plus rare obtenu'),
  new SlashCommandBuilder().setName('compare').setDescription("Compare tes stats avec un autre membre")
    .addUserOption(opt => opt.setName('user').setDescription('Membre Discord à comparer').setRequired(true)),
  new SlashCommandBuilder()
    .setName('testglobal')
    .setDescription("(Admin) Simule un Global pour tester les notifications")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('aura').setDescription("Tape le nom — la liste s'affiche automatiquement").setRequired(true).setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('channel').setDescription('Channel de destination').setRequired(false)
        .addChoices(
          { name: '📡 Aura Tracker', value: '1448744993283113133' },
          { name: '🔧 Admin',        value: '1448744993283113133' },
        )
    )
    .addStringOption(opt =>
      opt.setName('pseudo').setDescription('Username Roblox à utiliser (vide = toi)').setRequired(false)
    ),
  new SlashCommandBuilder().setName('guess').setDescription("Mini-jeu : devine l'aura à partir de sa description !"),

  // ── /inventory ───────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription("Analyse ton inventaire d'auras Sol's RNG avec l'IA (auras 100M+ uniquement)")
    .addAttachmentOption(opt =>
      opt.setName('screenshot').setDescription("Screenshot de ton inventaire Sol's RNG").setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('auras').setDescription('Ou liste tes auras manuellement (ex: Glitch, Borealis, Crimson)').setRequired(false)
    )
    .addUserOption(opt =>
      opt.setName('joueur').setDescription("Voir l'inventaire d'un autre membre (basé sur ses globals trackés)").setRequired(false)
    ),

  // ── /say ─────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire dire quelque chose au bot dans le salon dédié')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('message').setDescription('Le message à envoyer').setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('mention').setDescription('Mentionner un utilisateur avant le message').setRequired(false)
    ),

].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    console.log('[Commands] Nettoyage des commandes globales...');
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    console.log('[Commands] Enregistrement des slash commands...');
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log('[Commands] ✅ Commandes enregistrées !');
  } catch (err) { console.error('[Commands] Erreur:', err); }
}

// ════════════════════════════════════════════════════════════
//  Interaction Handler
// ════════════════════════════════════════════════════════════
client.on('interactionCreate', async interaction => {

  // ── Autocomplete /testglobal ──────────────────────────────
  if (interaction.isAutocomplete() && interaction.commandName === 'testglobal') {
    const focused = interaction.options.getFocused().toUpperCase();
    const gloriousRandom = { name: '🎲 GLORIOUS RANDOM — Une Glorious au hasard', value: 'GLORIOUS RANDOM' };
    const choices = Object.entries(AURA_DB)
      .filter(([name]) => focused === '' || name.includes(focused))
      .slice(0, 24)
      .map(([name, info]) => ({
        name:  `${name} — ${info.chance} (${info.tier})`,
        value: name,
      }));
    if (focused === '' || 'GLORIOUS RANDOM'.includes(focused)) choices.unshift(gloriousRandom);
    return interaction.respond(choices.slice(0, 25));
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  // ── /link ─────────────────────────────────────────────────
  if (commandName === 'link') {
    const username = interaction.options.getString('username');
    await interaction.deferReply({ ephemeral: true });
    const robloxUser = await getRobloxUserId(username);
    if (!robloxUser) return interaction.editReply({ content: `❌ Impossible de trouver **${username}** sur Roblox.` });
    const db = loadDB();
    db[interaction.user.id] = { robloxId: robloxUser.id, robloxUsername: robloxUser.name, displayName: robloxUser.displayName };
    saveDB(db);
    return interaction.editReply({
      embeds: [new EmbedBuilder().setTitle('✅ Compte lié !').setColor(0x00FF88)
        .setDescription(`Ton Discord est maintenant lié à **${robloxUser.name}** sur Roblox.`)
        .addFields(
          { name: '🆔 Roblox ID',    value: String(robloxUser.id),       inline: true },
          { name: '👤 Username',      value: robloxUser.name,             inline: true },
          { name: '🔔 Notifications', value: `Tu seras pingué dans <#${config.notificationChannelId}> à chaque Global !` }
        ).setFooter({ text: "Sol's Stat Tracker Bot" }).setTimestamp()],
    });
  }

  // ── /unlink ───────────────────────────────────────────────
  if (commandName === 'unlink') {
    const db = loadDB();
    if (!db[interaction.user.id]) return interaction.reply({ content: "❌ Tu n'as aucun compte Roblox lié.", ephemeral: true });
    const old = db[interaction.user.id].robloxUsername;
    delete db[interaction.user.id]; saveDB(db);
    return interaction.reply({ content: `✅ Le lien avec **${old}** a été supprimé.`, ephemeral: true });
  }

  // ── /links ────────────────────────────────────────────────
  if (commandName === 'links') {
    const db = loadDB();
    const entries = Object.entries(db);
    if (entries.length === 0) return interaction.reply({ content: "Aucun compte lié pour l'instant.", ephemeral: true });
    const lines = entries.map(([id, u]) => `<@${id}> → **${u.robloxUsername}** (\`${u.robloxId}\`)`).join('\n');
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🔗 Comptes liés').setColor(0x5865F2).setDescription(lines).setFooter({ text: `${entries.length} compte(s) lié(s)` })], ephemeral: true });
  }

  // ── /stats ────────────────────────────────────────────────
  if (commandName === 'stats') {
    const db = loadDB();
    const userData = db[interaction.user.id];
    if (!userData) return interaction.reply({ content: "❌ Tu n'as pas encore lié ton compte. Utilise `/link`", ephemeral: true });
    const history   = loadHistory();
    const myGlobals = history[interaction.user.id] ?? [];
    const wsState   = ws ? (['🔵 Connecting', '🟢 Connecté', '🟡 Closing', '🔴 Fermé'][ws.readyState] ?? '❓') : '🔴 Non initialisé';
    return interaction.reply({
      embeds: [new EmbedBuilder().setTitle(`📊 ${userData.robloxUsername}`).setColor(0xFFD700)
        .addFields(
          { name: '🆔 Roblox ID',      value: String(userData.robloxId), inline: true },
          { name: '👤 Username',        value: userData.robloxUsername,   inline: true },
          { name: '🏆 Globals trackés', value: String(myGlobals.length),  inline: true },
          { name: '🔌 Gateway',         value: wsState,                   inline: true },
        ).setFooter({ text: "Sol's Stat Tracker Bot" }).setTimestamp()],
      ephemeral: true,
    });
  }

  // ── /myglobals ────────────────────────────────────────────
  if (commandName === 'myglobals') {
    const db = loadDB();
    const userData = db[interaction.user.id];
    if (!userData) return interaction.reply({ content: "❌ Tu n'as pas encore lié ton compte. Utilise `/link`", ephemeral: true });
    const history   = loadHistory();
    const myGlobals = (history[interaction.user.id] ?? []).slice().reverse();
    if (myGlobals.length === 0) return interaction.reply({ content: "Tu n'as encore aucun global détecté par le bot !", ephemeral: true });

    const PAGE_SIZE  = 15;
    const page       = Math.max(1, interaction.options.getInteger('page') ?? 1);
    const totalPages = Math.ceil(myGlobals.length / PAGE_SIZE);
    const pageIndex  = Math.min(page, totalPages);
    const slice      = myGlobals.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE);

    const lines = slice.map(g => {
      const emoji = TIER_EMOJIS[g.tier] ?? '🌟';
      return `${emoji} **${g.auraName}** — ${g.chance} — <t:${g.timestamp}:R>`;
    });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🏆 Tes globals — ${userData.robloxUsername}`)
        .setColor(0x565FF2)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `${myGlobals.length} global(s) au total — Page ${pageIndex}/${totalPages}` })
        .setTimestamp()],
      ephemeral: true,
    });
  }

  // ── /leaderboard ──────────────────────────────────────────
  if (commandName === 'leaderboard') {
    const history = loadHistory();
    const db      = loadDB();
    const entries = Object.entries(history)
      .map(([id, globals]) => ({ id, count: globals.length, username: db[id]?.robloxUsername ?? '?' }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    if (entries.length === 0) return interaction.reply({ content: 'Aucun global enregistré pour le moment.', ephemeral: true });

    const medals = ['🥇', '🥈', '🥉'];
    const lines  = entries.map((e, i) => `${medals[i] ?? `**${i + 1}.**`} <@${e.id}> — **${e.username}** — ${e.count} global(s)`);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🏆 Leaderboard — Globals détectés')
        .setColor(0xFFD700)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `Total serveur : ${totalGlobalsDetected} globals trackés` })
        .setTimestamp()],
    });
  }

  // ── /globalsof ────────────────────────────────────────────
  if (commandName === 'globalsof') {
    const target   = interaction.options.getUser('user');
    const db       = loadDB();
    const userData = db[target.id];
    if (!userData) return interaction.reply({ content: `❌ **${target.username}** n'a pas lié son compte Roblox.`, ephemeral: true });
    const history      = loadHistory();
    const theirGlobals = (history[target.id] ?? []).slice().reverse();
    if (theirGlobals.length === 0) return interaction.reply({ content: `**${userData.robloxUsername}** n'a encore aucun global détecté par le bot.`, ephemeral: true });

    const lines = theirGlobals.slice(0, 15).map(g => {
      const emoji = TIER_EMOJIS[g.tier] ?? '🌟';
      return `${emoji} **${g.auraName}** — ${g.chance} — <t:${g.timestamp}:R>`;
    });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🏆 Globals de ${userData.robloxUsername}`)
        .setColor(0x565FF2)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `${theirGlobals.length} global(s) au total — 15 derniers affichés` })
        .setTimestamp()],
      ephemeral: true,
    });
  }

  // ── /myrare ───────────────────────────────────────────────
  if (commandName === 'myrare') {
    const db = loadDB();
    const userData = db[interaction.user.id];
    if (!userData) return interaction.reply({ content: "❌ Tu n'as pas encore lié ton compte. Utilise `/link`", ephemeral: true });
    const history   = loadHistory();
    const myGlobals = history[interaction.user.id] ?? [];
    if (myGlobals.length === 0) return interaction.reply({ content: "Tu n'as encore aucun global détecté par le bot !", ephemeral: true });

    function parseChance(chanceStr) {
      const match = (chanceStr ?? '').replace(/,/g, '').match(/1 IN (\d+)/i);
      return match ? parseInt(match[1]) : 0;
    }

    const rarest   = myGlobals.reduce((best, g) => parseChance(g.chance) > parseChance(best.chance) ? g : best);
    const emoji    = TIER_EMOJIS[rarest.tier] ?? '🌟';
    const color    = TIER_COLORS[rarest.tier] ?? DEFAULT_GLOBAL_COLOR;
    const auraIcon = getAuraIcon(rarest.auraName);
    const desc     = AURA_DESCRIPTIONS[rarest.auraName.toUpperCase()] ?? null;

    const embed = new EmbedBuilder()
      .setTitle(`💎 Ton global le plus rare — ${userData.robloxUsername}`)
      .setColor(color)
      .setThumbnail(auraIcon)
      .addFields(
        { name: `${emoji} Aura`,    value: rarest.auraName,              inline: true },
        { name: '🏷️ Tier',         value: rarest.tier,                   inline: true },
        { name: '🎲 Chance',        value: rarest.chance,                 inline: true },
        { name: '⏰ Obtenu',        value: `<t:${rarest.timestamp}:R>`,   inline: true },
        { name: '🌍 Biome',         value: rarest.biome ?? 'Aucun',       inline: true },
        { name: '📊 Total globals', value: String(myGlobals.length),      inline: true },
      );
    if (desc) embed.setDescription(`*${desc}*`);
    embed.setFooter({ text: "Sol's Stat Tracker Bot" }).setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ── /compare ──────────────────────────────────────────────
  if (commandName === 'compare') {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ Tu ne peux pas te comparer à toi-même !", ephemeral: true });
    const db        = loadDB();
    const myData    = db[interaction.user.id];
    const theirData = db[target.id];
    if (!myData)    return interaction.reply({ content: "❌ Tu n'as pas encore lié ton compte. Utilise `/link`", ephemeral: true });
    if (!theirData) return interaction.reply({ content: `❌ **${target.username}** n'a pas lié son compte Roblox.`, ephemeral: true });

    const history      = loadHistory();
    const myGlobals    = history[interaction.user.id] ?? [];
    const theirGlobals = history[target.id] ?? [];

    function parseChance(chanceStr) {
      const match = (chanceStr ?? '').replace(/,/g, '').match(/1 IN (\d+)/i);
      return match ? parseInt(match[1]) : 0;
    }
    function dominantTier(globals) {
      if (globals.length === 0) return '—';
      const counts = {};
      for (const g of globals) counts[g.tier] = (counts[g.tier] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    function rarestAura(globals) {
      if (globals.length === 0) return null;
      return globals.reduce((best, g) => parseChance(g.chance) > parseChance(best.chance) ? g : best);
    }

    const myRarest    = rarestAura(myGlobals);
    const theirRarest = rarestAura(theirGlobals);
    const myRC        = myRarest    ? parseChance(myRarest.chance)    : 0;
    const theirRC     = theirRarest ? parseChance(theirRarest.chance) : 0;
    const rarestWinner = myRC > theirRC ? '🏆 Toi' : theirRC > myRC ? `🏆 ${theirData.robloxUsername}` : '🤝 Égalité';
    const countWinner  = myGlobals.length > theirGlobals.length ? '🏆 Toi' : theirGlobals.length > myGlobals.length ? `🏆 ${theirData.robloxUsername}` : '🤝 Égalité';
    const myTier       = dominantTier(myGlobals);
    const theirTier    = dominantTier(theirGlobals);
    const TO           = { 'CHALLENGED+': 5, 'CHALLENGED': 4, 'TRANSCENDENT': 3, 'GLORIOUS': 2, 'MYTHIC': 1 };
    const tierWinner   = (TO[myTier] ?? 0) > (TO[theirTier] ?? 0) ? '🏆 Toi' : (TO[theirTier] ?? 0) > (TO[myTier] ?? 0) ? `🏆 ${theirData.robloxUsername}` : '🤝 Égalité';

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`⚔️ Comparaison — ${myData.robloxUsername} vs ${theirData.robloxUsername}`)
        .setColor(0x565FF2)
        .addFields(
          { name: '📊 Nombre de globals', value: `**${myData.robloxUsername}** : ${myGlobals.length}\n**${theirData.robloxUsername}** : ${theirGlobals.length}\n${countWinner}`, inline: false },
          { name: '🏷️ Tier dominant', value: `**${myData.robloxUsername}** : ${myTier !== '—' ? (TIER_EMOJIS[myTier] ?? '') + ' ' + myTier : '—'}\n**${theirData.robloxUsername}** : ${theirTier !== '—' ? (TIER_EMOJIS[theirTier] ?? '') + ' ' + theirTier : '—'}\n${tierWinner}`, inline: false },
          { name: '💎 Aura la plus rare', value: `**${myData.robloxUsername}** : ${myRarest ? `${myRarest.auraName} (${myRarest.chance})` : '—'}\n**${theirData.robloxUsername}** : ${theirRarest ? `${theirRarest.auraName} (${theirRarest.chance})` : '—'}\n${rarestWinner}`, inline: false },
        )
        .setFooter({ text: "Sol's Stat Tracker Bot" })
        .setTimestamp()],
    });
  }

  // ── /topaura ──────────────────────────────────────────────
  if (commandName === 'topaura') {
    const history = loadHistory();
    const counts  = {};
    for (const globals of Object.values(history)) {
      for (const g of globals) counts[g.auraName] = (counts[g.auraName] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (sorted.length === 0) return interaction.reply({ content: 'Aucun global enregistré pour le moment.', ephemeral: true });

    const medals = ['🥇', '🥈', '🥉'];
    const lines  = sorted.map(([name, count], i) => {
      const info  = getAuraInfo(name);
      const emoji = TIER_EMOJIS[info?.tier] ?? '🌟';
      return `${medals[i] ?? `**${i + 1}.**`} ${emoji} **${name}** — ${count} fois`;
    });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🎖️ Top Auras — Les plus obtenues sur le serveur')
        .setColor(0xFF8C00)
        .setDescription(lines.join('\n'))
        .setTimestamp()],
    });
  }

  // ── /recent ───────────────────────────────────────────────
  if (commandName === 'recent') {
    const history   = loadHistory();
    const db        = loadDB();
    const nombre    = interaction.options.getInteger('nombre') ?? 10;
    const allGlobals = [];
    for (const [discordId, globals] of Object.entries(history)) {
      for (const g of globals) allGlobals.push({ ...g, discordId, robloxUsername: db[discordId]?.robloxUsername ?? '?' });
    }
    allGlobals.sort((a, b) => b.timestamp - a.timestamp);
    const recent = allGlobals.slice(0, nombre);
    if (recent.length === 0) return interaction.reply({ content: 'Aucun global enregistré pour le moment.', ephemeral: true });

    const lines = recent.map(g => {
      const emoji = TIER_EMOJIS[g.tier] ?? '🌟';
      return `${emoji} **${g.robloxUsername}** — **${g.auraName}** — <t:${g.timestamp}:R>`;
    });

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`⏱️ ${nombre} derniers globals du serveur`)
        .setColor(0x00BFFF)
        .setDescription(lines.join('\n'))
        .setTimestamp()],
    });
  }

  // ── /notify ───────────────────────────────────────────────
  if (commandName === 'notify') {
    const statut = interaction.options.getString('statut');
    const db     = loadDB();
    if (!db[interaction.user.id]) return interaction.reply({ content: "❌ Tu n'as pas encore lié ton compte. Utilise `/link`", ephemeral: true });
    db[interaction.user.id].notifyDisabled = (statut === 'off');
    saveDB(db);
    const msg = statut === 'on' ? '🔔 Tu seras désormais pingué pour chaque global !' : '🔕 Tu ne seras plus pingué pour tes globals.';
    return interaction.reply({ content: msg, ephemeral: true });
  }

  // ── /guess ────────────────────────────────────────────────
  if (commandName === 'guess') {
    const auraNames = Object.keys(AURA_DB);
    const answer    = auraNames[Math.floor(Math.random() * auraNames.length)];
    const info      = AURA_DB[answer];

    await interaction.deferReply();
    let hint = AURA_DESCRIPTIONS[answer] ?? `Une aura de tier ${info.tier} avec une chance de ${info.chance}.`;
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.openrouterKey}` },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Tu es un assistant pour un jeu Discord basé sur Sol's RNG (Roblox). Génère un indice cryptique EN FRANÇAIS pour l'aura "${answer}" (tier: ${info.tier}, chance: ${info.chance}${info.biome ? ', biome: ' + info.biome : ''}). SANS jamais mentionner son nom. Max 2 phrases, style mystérieux.`,
          }],
          max_tokens: 120,
        }),
      });
      const orData  = await orRes.json();
      const generated = orData?.choices?.[0]?.message?.content?.trim();
      if (generated) hint = generated;
    } catch (err) { console.error('[Guess] OpenRouter erreur:', err.message); }

    if (!client.guessGames) client.guessGames = {};
    client.guessGames[interaction.channelId] = { answer: answer.toUpperCase(), hint, tier: info.tier, chance: info.chance, startedBy: interaction.user.id, attempts: 0 };

    const tierEmoji  = TIER_EMOJIS[info.tier] ?? '🌟';
    const guessEmbed = new EmbedBuilder()
      .setTitle("🎮 Devine l'aura !")
      .setColor(0x7289DA)
      .setDescription(`**Indice :**\n*${hint}*`)
      .addFields(
        { name: '🏷️ Tier',   value: `${tierEmoji} ${info.tier}`, inline: true },
        { name: '🎲 Chance', value: info.chance,                  inline: true },
        info.biome ? { name: '🌍 Biome', value: info.biome, inline: true } : { name: '\u200b', value: '\u200b', inline: true },
      )
      .setFooter({ text: "Réponds dans ce salon avec le nom de l'aura ! Tu as 60 secondes." })
      .setTimestamp();

    await interaction.editReply({ embeds: [guessEmbed] });

    const collector = interaction.channel.createMessageCollector({ filter: m => !m.author.bot, time: 60000 });
    collector.on('collect', async msg => {
      const game = client.guessGames?.[interaction.channelId];
      if (!game) return collector.stop('noGame');
      game.attempts++;
      const guess = msg.content.toUpperCase().trim();
      if (guess === game.answer) {
        collector.stop('win');
        delete client.guessGames[interaction.channelId];
        const winEmbed = new EmbedBuilder()
          .setTitle('🎉 Bonne réponse !')
          .setColor(0x57F287)
          .setDescription(`<@${msg.author.id}> a trouvé **${game.answer}** en ${game.attempts} tentative(s) !`)
          .addFields({ name: '🎲 Chance', value: game.chance, inline: true })
          .setThumbnail(getAuraIcon(game.answer))
          .setTimestamp();
        await msg.reply({ embeds: [winEmbed] }).catch(console.error);
      } else {
        const closeEnough = game.answer.includes(guess) || guess.includes(game.answer.split(' ')[0]);
        await msg.react(closeEnough ? '🔥' : '❌').catch(() => {});
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'win' || reason === 'noGame') return;
      const game = client.guessGames?.[interaction.channelId];
      if (game) delete client.guessGames[interaction.channelId];
      const loseEmbed = new EmbedBuilder()
        .setTitle('⏰ Temps écoulé !')
        .setColor(0xED4245)
        .setDescription(`Personne n'a trouvé ! La réponse était **${answer}**.`)
        .setThumbnail(getAuraIcon(answer))
        .setTimestamp();
      await interaction.channel.send({ embeds: [loseEmbed] }).catch(console.error);
    });
    return;
  }

  // ── /forcesync ────────────────────────────────────────────
  if (commandName === 'forcesync') {
    connectGateway();
    return interaction.reply({ content: '🔄 Reconnexion au gateway lancée !', ephemeral: true });
  }

  // ── /clearhistory ─────────────────────────────────────────
  if (commandName === 'clearhistory') {
    const target  = interaction.options.getUser('user');
    const history = loadHistory();
    const count   = (history[target.id] ?? []).length;
    delete history[target.id];
    saveHistory(history);
    totalGlobalsDetected = Object.values(history).reduce((acc, arr) => acc + arr.length, 0);
    updateBotStatus();
    return interaction.reply({ content: `🗑️ Historique de <@${target.id}> effacé (${count} global(s) supprimé(s)).`, ephemeral: true });
  }

  // ── /gateway ──────────────────────────────────────────────
  if (commandName === 'gateway') {
    const states = ['🔵 Connecting', '🟢 Open', '🟡 Closing', '🔴 Closed'];
    const state  = ws ? (states[ws.readyState] ?? '❓') : '🔴 Non initialisé';
    const uptime = lastDisconnectTime ? `Déconnecté depuis <t:${Math.floor(lastDisconnectTime / 1000)}:R>` : '✅ Connecté';
    return interaction.reply({ content: `**Gateway Sol's Stat Tracker**\nStatut : ${state}\n${uptime}\nURL : \`${config.gatewayURL}\``, ephemeral: true });
  }

  // ── /testglobal ───────────────────────────────────────────
  if (commandName === 'testglobal') {
    if (interaction.guildId !== config.guildId) return interaction.reply({ content: '❌ Cette commande est réservée au serveur officiel.', ephemeral: true });
    const db       = loadDB();
    const userData = db[interaction.user.id];
    if (!userData) return interaction.reply({ content: "❌ Tu dois d'abord lier ton compte avec `/link`.", ephemeral: true });

    let auraName      = interaction.options.getString('aura');
    const pseudoOverride = interaction.options.getString('pseudo');
    const targetUsername = pseudoOverride ?? userData.robloxUsername;

    if (auraName === 'GLORIOUS RANDOM') {
      const gloriousAuras = Object.keys(AURA_DB).filter(k => AURA_DB[k].tier === 'GLORIOUS');
      auraName = gloriousAuras[Math.floor(Math.random() * gloriousAuras.length)];
    }

    const auraInfo = getAuraInfo(auraName);
    const chance   = auraInfo?.chance ?? '1 IN 540,000,000';
    const tier     = auraInfo?.tier   ?? 'GLORIOUS';

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(TIER_COLORS[tier] ?? 0xFFD700).setTitle('✅ Simulation envoyée !')
        .addFields(
          { name: 'Aura',   value: auraName,      inline: true },
          { name: 'Chance', value: chance,         inline: true },
          { name: 'Tier',   value: tier,           inline: true },
          { name: 'Pseudo', value: targetUsername, inline: true },
        )],
      ephemeral: true,
    });

    const targetChannel = interaction.options.getString('channel') ?? '1448744993283113133';
    await handleGlobalEvent({
      content: `<:Global:1396815239793606666> **${targetUsername}(@${targetUsername})** HAS FOUND **${auraName}**, CHANCE OF **${chance}**`,
      avatarURL: 'https://cdn.mongoosee.com/assets/solsstattracker/webhook/icon_2.png',
      username: "Sol's Stat Tracker",
      overrideChannelId: targetChannel,
    });
  }

  // ── /inventory ────────────────────────────────────────────
  if (commandName === 'inventory') {
    await interaction.deferReply({ ephemeral: false });

    const screenshot = interaction.options.getAttachment('screenshot');
    const manualList = interaction.options.getString('auras');
    const targetUser = interaction.options.getUser('joueur') ?? interaction.user;

    const db       = loadDB();
    const userData = db[targetUser.id];

    if (!userData) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle('❌ Compte non lié')
          .setDescription(`**${targetUser.username}** n'a pas encore lié son compte Roblox.\n\nUtilise \`/link\` pour commencer !`)],
      });
    }

    const robloxUsername = userData.robloxUsername;
    const history        = loadHistory();
    const historyGlobals = history[targetUser.id] ?? [];

    let aiResult = { found: [], uncertain: [], confidence: 0 };

    if (screenshot) {
      const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(screenshot.contentType)) {
        return interaction.editReply({ content: '❌ Fichier invalide. Envoie une image PNG, JPG ou WEBP.' });
      }
      try {
        aiResult = await analyzeInventoryWithAI(screenshot.url, config.openrouterKey);
      } catch (err) {
        console.error('[Inventory] Erreur IA image:', err.message);
        aiResult = { found: [], uncertain: [], confidence: 0, error: err.message };
      }
    } else if (manualList) {
      try {
        aiResult = await analyzeInventoryTextWithAI(manualList, config.openrouterKey);
      } catch (err) {
        console.error('[Inventory] Erreur IA texte:', err.message);
      }
    } else {
      if (historyGlobals.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle(`📦 Inventaire de ${robloxUsername}`)
            .setDescription(
              "Aucun screenshot fourni et aucun global tracké.\n\n" +
              "**Pour analyser ton inventaire :**\n" +
              "• Joint un screenshot avec `/inventory screenshot: [image]`\n" +
              "• Ou liste tes auras : `/inventory auras: Glitch, Borealis, Crimson`\n\n" +
              "ℹ️ Seules les auras **100M+** et **Challenged/Challenged+** sont reconnues."
            )],
        });
      }
      aiResult = { found: [], uncertain: [], confidence: 1.0 };
    }

    const embed = buildInventoryEmbed(robloxUsername, aiResult, historyGlobals);

    if (aiResult.uncertain && aiResult.uncertain.length > 0) {
      embed.addFields({
        name:  '⚠️ Auras incertaines (non reconnues avec précision)',
        value: aiResult.uncertain.join(', '),
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
    console.log(`[Inventory] ✅ Inventaire analysé pour ${robloxUsername} — ${aiResult.found?.length ?? 0} auras IA + ${historyGlobals.length} historique`);
  }

  // ── /say ──────────────────────────────────────────────────
  if (commandName === 'say') {
    const SAY_CHANNEL_ID = '1457073617476124716';
    const message        = interaction.options.getString('message');
    const mention        = interaction.options.getUser('mention');

    const targetChannel = client.channels.cache.get(SAY_CHANNEL_ID);
    if (!targetChannel) {
      return interaction.reply({ content: '❌ Salon introuvable (ID : `1457073617476124716`).', ephemeral: true });
    }

    const content = mention ? `<@${mention.id}> ${message}` : message;

    try {
      await targetChannel.send({ content, allowedMentions: { users: mention ? [mention.id] : [] } });
      return interaction.reply({ content: `✅ Message envoyé dans <#${SAY_CHANNEL_ID}>.`, ephemeral: true });
    } catch (err) {
      console.error('[Say] Erreur envoi:', err.message);
      return interaction.reply({ content: `❌ Impossible d'envoyer le message : ${err.message}`, ephemeral: true });
    }
  }
});

// ════════════════════════════════════════════════════════════
//  Démarrage
// ════════════════════════════════════════════════════════════
client.once('clientReady', async () => {
  console.log(`[Bot] ✅ Connecté en tant que ${client.user.tag}`);
  initTotalGlobals();
  updateBotStatus();
  await registerCommands();
  connectGateway();
  startGatewayWatchdog();

  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const sendLinkReminder = async () => {
    const channel = client.channels.cache.get(config.notificationChannelId);
    if (channel) {
      await channel.send('** Veuillez vous /link pour apparaitre !**');
      console.log('[Bot] 🔔 Reminder /link envoyé.');
    }
  };
  setInterval(sendLinkReminder, FOUR_HOURS);
});

// Serveur HTTP keep-alive pour Render/Railway
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot en ligne!')).listen(PORT, () => {
  console.log('[HTTP] Serveur keep-alive sur port', PORT);
});

client.login(config.token);
