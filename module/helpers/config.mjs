import pokeapi from "./pokeapi.mjs";
export const PTA = {};

/**
 * Load config lists from pokeapi if possible, or default if unable
 */
PTA.Pokedex = {
  Pokemon: [],
  Eggs: [],
  Moves: [],
  Types: [],
  Berries: [],
  Ailments: [],
  Species: [],
  Items: []
}

// Call in main init hook, needs ot be called after PTA is registered, or it slows down the init
// enough to prevent it from being loaded at all
PTA.loadPokedex = async (force = false) => {
  //if the pokedex was previously registered, check if its been expired
  const expiry = localStorage.getItem('pta.pokedexExpiry');
  const today = await new Date();
  let expired = false;
  if (expiry) {
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    const expiryDate = await new Date(expiry);
    if (today - expiryDate > thirtyDays) expired = true;
  }

  // retrieve the pokedex data
  if (!localStorage.getItem('pta.pokedex') || expired || force) {
    const _apiNames = await pokeapi.pokemon('?limit=100000', { cache: 'reload' });
    const _apiEggs = await pokeapi.egg('?limit=100000', { cache: 'reload' });
    const _apiMoves = await pokeapi.move('?limit=100000', { cache: 'reload' });
    const _apiTypes = await pokeapi.type('?limit=100000', { cache: 'reload' });
    const _apiBerries = await pokeapi.berry('?limit=100000', { cache: 'reload' });
    const _apiAilments = await pokeapi.ailment('?limit=100000', { cache: 'reload' });
    const _apiSpecies = await pokeapi.species('?limit=100000', { cache: 'reload' });
    const _apiItems = await pokeapi.item('?limit=100000', { cache: 'reload' });

    for (const i of _apiNames.results) PTA.Pokedex.Pokemon.push({ name: i.name, id: i.url.replace(/.$/g, '').match(/\d+$/)[0] });
    for (const i of _apiEggs.results) PTA.Pokedex.Eggs.push(i.name);
    for (const i of _apiMoves.results) PTA.Pokedex.Moves.push(i.name);
    for (const i of _apiTypes.results) PTA.Pokedex.Types.push(i.name);
    for (const i of _apiBerries.results) PTA.Pokedex.Berries.push(i.name);
    for (const i of _apiAilments.results) PTA.Pokedex.Ailments.push(i.name);
    for (const i of _apiSpecies.results) PTA.Pokedex.Species.push(i.name);
    for (const i of _apiItems.results) PTA.Pokedex.Items.push(i.name);

    //============================================================
    //> Save the data to the browser cache for safe keeping
    //============================================================

    localStorage.setItem('pta.pokedex', JSON.stringify(PTA.Pokedex));
    localStorage.setItem('pta.pokedexExpiry', today.toISOString());
  } else PTA.Pokedex = JSON.parse(localStorage.getItem('pta.pokedex'));

  //===================================================================================
  //> Add in pokedex functions MUST BE DONE AFTER LOADING TO AVOID OVERWRITE
  //===================================================================================
  PTA.Pokedex.getPokemon = (name) => {
    for (const p of PTA.Pokedex.Pokemon) {
      if (p.name == name || p.id == name) return p;
    }
    return undefined;
  }
}



//===================================================================================
//> Generic
//===================================================================================

PTA.generic = {
  accuracy: 'PTA.Generic.Accuracy',
  age: 'PTA.Generic.Age',
  ailment: 'PTA.Generic.Ailment',
  attack: 'PTA.Generic.Attack',
  chance: 'PTA.Generic.Chance',
  damage: 'PTA.Generic.Damage',
  data: 'PTA.Generic.Data',
  description: 'PTA.Generic.Description',
  eyes: 'PTA.Generic.Eyes',
  gender: 'PTA.Generic.Gender',
  hair: 'PTA.Generic.Hair',
  height: 'PTA.Generic.Height',
  honour: 'PTA.Generic.Honour',
  honours: 'PTA.Generic.Honours',
  import: 'PTA.Generic.Import',
  method: 'PTA.Generic.Method',
  nature: 'PTA.Generic.Nature',
  none: 'PTA.Generic.None',
  origin: 'PTA.Generic.Origin',
  pokemon: 'PTA.Generic.Pokemon',
  primary: 'PTA.Generic.Primary',
  rank: 'PTA.Generic.Rank',
  secondary: 'PTA.Generic.Secondary',
  shiny: 'PTA.Generic.Shiny',
  size: 'PTA.Generic.Size',
  species: 'PTA.Generic.Species',
  sync: 'PTA.Generic.Sync.long',
  type: 'PTA.Generic.Type.long',
  types: 'PTA.Generic.Type.plural',
  weight: 'PTA.Generic.Weight',
  category: 'PTA.Generic.Category',
}

PTA.dice = {
  d2: 'd2',
  d4: 'd4',
  d6: 'd6',
  d8: 'd8',
  d10: 'd10',
  d12: 'd12',
  d20: 'd20',
  d100: 'd100',
}

PTA.aoeTypes = {
  beam: 'PTA.Generic.Beam', // straight line attack
  cone: 'PTA.Generic.Cone', // aoe cone attack
  burst: 'PTA.Generic.Burst', // aoe centered on self
  blast: 'PTA.Generic.Blast', // aoe centered on target
  wave: 'PTA.Generic.Wave',// same as beam
  none: 'PTA.Generic.None'
}

//======================================================================
//> Pokemon moves
//======================================================================
PTA.moveClass = {
  special: 'PTA.Generic.Special',
  physical: 'PTA.Generic.Physical',
  status: 'PTA.Generic.Status'
}

//======================================================================
//> Stat methods
//======================================================================
PTA.modifierMethods = {
  add: 'PTA.Method.Add',
  subtract: 'PTA.Method.Subtract',
  grow: 'PTA.Method.Grow',
  shrink: 'PTA.Method.Shrink',
  multiply: 'PTA.Method.Multiply',
}

//======================================================================
//> Chat messages
//======================================================================

PTA.chat = {
  attack: {
    crit: 'PTA.Chat.Attack.Crit',
    dodge: 'PTA.Chat.Attack.Dodge',
    hit: 'PTA.Chat.Attack.Hit',
    miss: 'PTA.Chat.Attack.Miss',
  },
  damage: {
    immune: 'PTA.Chat.Damage.Immune',
    quarter: 'PTA.Chat.Damage.Quarter',
    half: 'PTA.Chat.Damage.Half',
    normal: 'PTA.Chat.Damage.Normal',
    double: 'PTA.Chat.Damage.Double',
    quadruple: 'PTA.Chat.Damage.Quadruple',
  },
  ailment: {
    success: 'PTA.Chat.Ailment.Success',
    failed: 'PTA.Chat.Ailment.Failed',
  },
  lifesteal: 'PTA.Chat.Lifesteal',
}

//===================================================================================
//> Actor Abilities
//===================================================================================

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
PTA.stats = {
  atk: 'PTA.Ability.Atk.long',
  def: 'PTA.Ability.Def.long',
  satk: 'PTA.Ability.SAtk.long',
  sdef: 'PTA.Ability.SDef.long',
  spd: 'PTA.Ability.Spd.long',
};

PTA.statKeyLong = {
  atk: 'attack',
  def: 'defence',
  satk: 'sattack',
  sdef: 'sdefence',
  spd: 'speed',
};

PTA.statKeyAbbr = {
  attack: 'atk',
  defence: 'def',
  sattack: 'satk',
  sdefence: 'sdef',
  speed: 'spd',
};

PTA.statsAbbr = {};
for (const [key, value] of Object.entries(PTA.stats)) {
  PTA.statsAbbr[key] = value.replace("long", "abbr");
}

PTA.contestAbilities = {
  beauty: 'PTA.Context.Beauty.long',
  clever: 'PTA.Context.Clever.long',
  cool: 'PTA.Context.Cool.long',
  cute: 'PTA.Context.Cute.long',
  tough: 'PTA.Context.Tough.long',
}

PTA.contestAbilitiesAbbr = {};
for (const [key, value] of Object.entries(PTA.contestAbilities)) {
  PTA.contestAbilitiesAbbr[key] = value.replace("long", "abbr");
}

//===================================================================================
//> Player Skills
//===================================================================================
PTA.skillAbilities = {
  acrobatics: PTA.stats.spd,
  athletics: PTA.stats.atk,
  bluff: PTA.stats.sdef,
  concentration: PTA.stats.def,
  constitution: PTA.stats.def,
  diplomacy: PTA.stats.sdef,
  engineering: PTA.stats.satk,
  handling: PTA.stats.sdef,
  history: PTA.stats.satk,
  insight: PTA.stats.sdef,
  investigation: PTA.stats.satk,
  medicine: PTA.stats.satk,
  nature: PTA.stats.satk,
  perception: PTA.stats.sdef,
  perform: PTA.stats.sdef,
  programming: PTA.stats.satk,
  stealth: PTA.stats.spd,
  subterfuge: PTA.stats.spd,
}

PTA.skills = {};
PTA.skillsAbbr = {};
for (const [key, value] of Object.entries(PTA.skillAbilities)) {
  PTA.skills[key] = `PTA.Skill.${key.charAt(0).toUpperCase() + key.slice(1)}.long`;
  PTA.skillsAbbr[key] = `PTA.Skill.${key.charAt(0).toUpperCase() + key.slice(1)}.abbr`
}

PTA.skillAttack = { athletics: PTA.stats.atk, };
PTA.skillDefence = {
  concentration: PTA.stats.def,
  constitution: PTA.stats.def,
};

PTA.skillSpecialAttack = {
  engineering: PTA.stats.satk,
  history: PTA.stats.satk,
  investigation: PTA.stats.satk,
  medicine: PTA.stats.satk,
  programming: PTA.stats.satk,
  nature: PTA.stats.satk,
};

PTA.skillSpecialDefence = {
  bluff: PTA.stats.sdef,
  diplomacy: PTA.stats.sdef,
  handling: PTA.stats.sdef,
  insight: PTA.stats.sdef,
  perception: PTA.stats.sdef,
  perform: PTA.stats.sdef,
};

PTA.skillSpeed = {
  acrobatics: PTA.stats.spd,
  stealth: PTA.stats.spd,
  subterfuge: PTA.stats.spd,
};

PTA.genders = {
  male: 'PTA.Gender.Male',
  female: 'PTA.Gender.Female',
  none: PTA.generic.none
}

//===================================================================================
//> Pokemon Types
//===================================================================================

PTA.pokemonTypes = {
  bug: 'PTA.Type.Bug',
  dark: 'PTA.Type.Dark',
  dragon: 'PTA.Type.Dragon',
  electric: 'PTA.Type.Electric',
  fairy: 'PTA.Type.Fairy',
  fighting: 'PTA.Type.Fighting',
  fire: 'PTA.Type.Fire',
  flying: 'PTA.Type.Flying',
  ghost: 'PTA.Type.Ghost',
  grass: 'PTA.Type.Grass',
  ground: 'PTA.Type.Ground',
  ice: 'PTA.Type.Ice',
  normal: 'PTA.Type.Normal',
  poison: 'PTA.Type.Poison',
  psychic: 'PTA.Type.Psychic',
  rock: 'PTA.Type.Rock',
  steel: 'PTA.Type.Steel',
  water: 'PTA.Type.Water',
};

PTA.typeEffectivenessLabels = {
  immune: 'PTA.Generic.Immune',
  quarter: 'PTA.Generic.Quarter',
  half: 'PTA.Generic.Half',
  normal: 'PTA.Generic.Normal',
  double: 'PTA.Generic.Double',
  quadruple: 'PTA.Generic.Quadruple',
}

PTA.typeEffectivenessValues = {
  immune: 'PTA.Chat.Damage.Immune',
  quarter: 'PTA.Chat.Damage.Quarter',
  half: 'PTA.Chat.Damage.Half',
  normal: 'PTA.Chat.Damage.Normal',
  double: 'PTA.Chat.Damage.Double',
  quadruple: 'PTA.Chat.Damage.Quadruple',
}

PTA.resistanceLabels = {
  none: 'PTA.Generic.None',
  immune: 'PTA.Generic.Immune',
  half: 'PTA.Generic.Half',
  normal: 'PTA.Generic.Normal',
  double: 'PTA.Generic.Double',
  quadruple: 'PTA.Generic.Quadruple',
}

PTA.resistanceKeys = {
  none: 'none',
  immune: 'immune',
  half: 'half',
  normal: 'normal',
  double: 'double',
  quadruple: 'quadruple',
}

PTA.typeEffectiveness = {
  bug: {
    double: ['fire', 'flying', 'rock'],
    half: ['grass', 'fighting', 'ground'],
    immune: []
  },
  dark: {
    double: ['fighting', 'bug', 'fairy'],
    half: ['ghost', 'dark'],
    immune: ['psychic']
  },
  dragon: {
    double: ['ice', 'dragon', 'fairy'],
    half: ['fire', 'water', 'electric', 'grass'],
    immune: []
  },
  electric: {
    double: ['ground'],
    half: ['electric', 'flying', 'steel'],
    immune: []
  },
  fairy: {
    double: ['poison', 'steel'],
    half: ['fighting', 'bug', 'dark'],
    immune: ['dragon']
  },
  fighting: {
    double: ['flying', 'psychic', 'fairy'],
    half: ['bug', 'rock', 'dark'],
    immune: []
  },
  fire: {
    double: ['water', 'rock', 'ground'],
    half: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    immune: []
  },
  flying: {
    double: ['electric', 'ice', 'rock'],
    half: ['grass', 'fighting', 'bug'],
    immune: ['ground']
  },
  ghost: {
    double: ['ghost', 'dark'],
    half: ['poison', 'bug'],
    immune: ['normal', 'fighting']
  },
  grass: {
    double: ['fire', 'ice', 'poison', 'flying', 'bug'],
    half: ['water', 'electric', 'grass', 'ground'],
    immune: []
  },
  ground: {
    double: ['water', 'grass', 'ice'],
    half: ['poison', 'rock'],
    immune: ['electric']
  },
  ice: {
    double: ['fire', 'fighting', 'rock', 'steel'],
    half: ['ice'],
    immune: []
  },
  normal: {
    double: ['fighting'],
    half: [],
    immune: ['ghost']
  },
  poison: {
    double: ['ground', 'psychic'],
    half: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
    immune: []
  },
  psychic: {
    double: ['bug', 'ghost', 'dark'],
    half: ['fighting', 'psychic'],
    immune: []
  },
  rock: {
    double: ['water', 'grass', 'fighting', 'ground', 'steel'],
    half: ['normal', 'fire', 'poison', 'flying'],
    immune: []
  },
  steel: {
    double: ['fire', 'fighting', 'ground'],
    half: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
    immune: ['poison']
  },
  water: {
    double: ['electric', 'grass'],
    half: ['fire', 'water', 'ice', 'steel'],
    immune: []
  }
};

//===================================================================================
//> Status Ailments
//===================================================================================
PTA.ailments = {
  burn: 'PTA.Ailment.Burn.long',
  confuse: 'PTA.Ailment.Confuse.long',
  curse: 'PTA.Ailment.Curse.long',
  frozen: 'PTA.Ailment.Frozen.long',
  charm: 'PTA.Ailment.Charm.long',
  paralyzed: 'PTA.Ailment.Paralyzed.long',
  poison: 'PTA.Ailment.Poison.long',
  sleep: 'PTA.Ailment.Sleep.long',
  stun: 'PTA.Ailment.Stun.long',
  toxic: 'PTA.Ailment.Toxic.long'
};

PTA.ailmentsAbbr = {};
for (const a in PTA.ailments) {
  PTA.ailmentsAbbr[a] = PTA.ailments[a].replace('long', 'abbr');
}

PTA.statuses = {
  fainted: 'PTA.Ailment.Fainted.long',
  ...PTA.ailments
}

PTA.statusEffects = [];
for (const [key, value] of Object.entries(PTA.statuses)) {
  PTA.statusEffects.push({
    id: key,
    img: `systems/pta3/assets/icons/status-${key}.svg`,
    name: value
  })
}

//===================================================================================
//> Pokemon Natures
//===================================================================================
PTA.natureNeutral = {
  bashful: 'PTA.Nature.Bashful',
  docile: 'PTA.Nature.Docile',
  hardy: 'PTA.Nature.Hardy',
  quirky: 'PTA.Nature.Quirky',
  serious: 'PTA.Nature.Serious',
}

PTA.natureIncreaseAttack = {
  adamant: 'PTA.Nature.Adamant',
  brave: 'PTA.Nature.Brave',
  lonely: 'PTA.Nature.Lonely',
  naughty: 'PTA.Nature.Naughty',
}

PTA.natureIncreaseDefence = {
  bold: 'PTA.Nature.Bold',
  impish: 'PTA.Nature.Impish',
  lax: 'PTA.Nature.Lax',
  relaxed: 'PTA.Nature.Relaxed',
}

PTA.natureIncreaseSpAttack = {
  mild: 'PTA.Nature.Mild',
  modest: 'PTA.Nature.Modest',
  quiet: 'PTA.Nature.Quiet',
  rash: 'PTA.Nature.Rash',
}

PTA.natureIncreaseSpDefence = {
  calm: 'PTA.Nature.Calm',
  careful: 'PTA.Nature.Careful',
  gentle: 'PTA.Nature.Gentle',
  sassy: 'PTA.Nature.Sassy',
}

PTA.natureIncreaseSpeed = {
  hasty: 'PTA.Nature.Hasty',
  jolly: 'PTA.Nature.Jolly',
  naive: 'PTA.Nature.Naive',
  timid: 'PTA.Nature.Timid',
}

PTA.natureIncreases = {};
for (const a in PTA.natureIncreaseAttack) PTA.natureIncreases[a] = PTA.stats.atk;
for (const a in PTA.natureIncreaseDefence) PTA.natureIncreases[a] = PTA.stats.def;
for (const a in PTA.natureIncreaseSpAttack) PTA.natureIncreases[a] = PTA.stats.satk;
for (const a in PTA.natureIncreaseSpDefence) PTA.natureIncreases[a] = PTA.stats.sdef;
for (const a in PTA.natureIncreaseSpeed) PTA.natureIncreases[a] = PTA.stats.spd;

PTA.natureDecreaseAttack = {
  bold: 'PTA.Nature.Bold',
  calm: 'PTA.Nature.Calm',
  modest: 'PTA.Nature.Modest',
  timid: 'PTA.Nature.Timid',
};

PTA.natureDecreaseDefence = {
  gentle: 'PTA.Nature.Gentle',
  hasty: 'PTA.Nature.Hasty',
  lonely: 'PTA.Nature.Lonely',
  mild: 'PTA.Nature.Mild',
};

PTA.natureDecreaseSpAttack = {
  adamant: 'PTA.Nature.Adamant',
  careful: 'PTA.Nature.Careful',
  impish: 'PTA.Nature.Impish',
  jolly: 'PTA.Nature.Jolly',
};

PTA.natureDecreaseSpDefence = {
  lax: 'PTA.Nature.Lax',
  naive: 'PTA.Nature.Naive',
  naughty: 'PTA.Nature.Naughty',
  rash: 'PTA.Nature.Rash',
};

PTA.natureDecreaseSpeed = {
  brave: 'PTA.Nature.Brave',
  quiet: 'PTA.Nature.Quiet',
  relaxed: 'PTA.Nature.Relaxed',
  sassy: 'PTA.Nature.Sassy',
};

PTA.natureDecreases = {};
for (const a in PTA.natureDecreaseAttack) PTA.natureDecreases[a] = PTA.stats.atk;
for (const a in PTA.natureDecreaseDefence) PTA.natureDecreases[a] = PTA.stats.def;
for (const a in PTA.natureDecreaseSpAttack) PTA.natureDecreases[a] = PTA.stats.satk;
for (const a in PTA.natureDecreaseSpDefence) PTA.natureDecreases[a] = PTA.stats.sdef;
for (const a in PTA.natureDecreaseSpeed) PTA.natureDecreases[a] = PTA.stats.spd;

PTA.naturesNoNeutral = {
  ...PTA.natureIncreaseAttack,
  ...PTA.natureIncreaseDefence,
  ...PTA.natureIncreaseSpAttack,
  ...PTA.natureIncreaseSpDefence,
  ...PTA.natureIncreaseSpeed,
}

PTA.natures = {
  ...PTA.naturesNoNeutral,
  ...PTA.natureNeutral,
}


PTA.flavours = {
  bitter: 'PTA.Flavour.Bitter',
  dry: 'PTA.Flavour.Dry',
  repulsive: 'PTA.Flavour.Repulsive',
  sour: 'PTA.Flavour.Sour',
  spicy: 'PTA.Flavour.Spicy',
  sweet: 'PTA.Flavour.Sweet',
}

PTA.pokemonSizes = {
  tiny: "PTA.Size.Tiny",
  small: "PTA.Size.Small",
  medium: "PTA.Size.Medium",
  large: "PTA.Size.Large",
  huge: "PTA.Size.Huge",
  gigantic: "PTA.Size.Gigantic",
}

PTA.pokemonWeights = {
  feather: "PTA.Weight.Feather",
  light: "PTA.Weight.Light",
  medium: "PTA.Weight.Medium",
  heavy: "PTA.Weight.Heavy",
  super: "PTA.Weight.Super",
}

PTA.tabs = {
  feature: "PTA.Tab.Features",
  inventory: "PTA.Tab.Inventory"
}

PTA.flavourPreferance = {
  spicy: {
    liked: ["Lonely", "Adamant", "Naughty", "Brave"],
    disliked: ["Bold", "Modest", "Calm", "Timid"]
  },
  dry: {
    liked: ["Rash", "Modest", "Mild", "Quiet"],
    disliked: ["Jolly", "Adamant", "Careful", "Impish"]
  },
  sweet: {
    liked: ["Timid", "Hasty", "Jolly", "Naive"],
    disliked: ["Relaxed", "Sassy", "Quiet", "Brave"]
  },
  bitter: {
    liked: ["Calm", "Gentle", "Careful", "Sassy"],
    disliked: ["Naughty", "Rash", "Naive", "Lax"]
  },
  sour: {
    liked: ["Relaxed", "Lax", "Impish", "Bold"],
    disliked: ["Lonely", "Mild", "Hasty", "Gentle"]
  }
};

//====================================================================================================
//> System template paths
//  A list of paths as well as the context they should be rendered in
//  Most are used as individuals to render out singular applications
//====================================================================================================

function templatePath(path) { return `systems/pta3/templates/${path}` }
PTA.templates = {
  path: templatePath(''),
  dialog: {
    fileServerSelect: templatePath('dialog/file-server-selector.hbs'),
    rollCaptureSphere: templatePath('dialog/roll-capture-sphere.hbs'),
    configResistanceOverride: templatePath('dialog/config-resistance-override.hbs'),
  },
  app: {
    importMoves: templatePath('apps/move-importer.hbs'),
    importPokemon: templatePath('apps/pokemon-importer.hbs'),
    remoteAssetBrowser: templatePath('apps/server-browser.hbs')
  },
  sheet: {

  }
}