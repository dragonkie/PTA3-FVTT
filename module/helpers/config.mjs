import pokeapi from "./pokeapi.mjs";
import utils from "./utils.mjs";
export const PTA = {};

export function PtaLoadConfig() {
  const PTA = {};
  return config;
}

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
  Items: [],
  count: 0
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
    if (today - expiryDate > thirtyDays) {
      console.log('pokedex is expired, refreshing');
      expired = true;
    }
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

    for (const i of _apiNames.results) PTA.Pokedex.Pokemon.push(i.name);
    for (const i of _apiEggs.results) PTA.Pokedex.Eggs.push(i.name);
    for (const i of _apiMoves.results) PTA.Pokedex.Moves.push(i.name);
    for (const i of _apiTypes.results) PTA.Pokedex.Types.push(i.name);
    for (const i of _apiBerries.results) PTA.Pokedex.Berries.push(i.name);
    for (const i of _apiAilments.results) PTA.Pokedex.Ailments.push(i.name);
    for (const i of _apiSpecies.results) PTA.Pokedex.Species.push(i.name);
    for (const i of _apiItems.results) PTA.Pokedex.Items.push(i.name);
    PTA.Pokedex.count = _apiSpecies.count;

    localStorage.setItem('pta.pokedex', JSON.stringify(PTA.Pokedex));
    localStorage.setItem('pta.pokedexExpiry', today.toISOString());
  } else {
    PTA.Pokedex = JSON.parse(localStorage.getItem('pta.pokedex'));
  }
}

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
PTA.abilities = {
  atk: 'PTA.Ability.Atk.long',
  def: 'PTA.Ability.Def.long',
  satk: 'PTA.Ability.SAtk.long',
  sdef: 'PTA.Ability.SDef.long',
  spd: 'PTA.Ability.Spd.long',
};

PTA.abilitiesAbbr = {};
for (const [key, value] of Object.entries(PTA.abilities)) {
  PTA.abilitiesAbbr[key] = value.replace("long", "abbr");
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

/* ------------------------------------------------------------------ */
/*                                                                    */
/*                           PLAYER SKILLS                            */
/*                                                                    */
/* ------------------------------------------------------------------ */
PTA.skillAbilities = {
  acrobatics: PTA.abilities.spd,
  athletics: PTA.abilities.atk,
  bluff: PTA.abilities.sdef,
  concentration: PTA.abilities.def,
  constitution: PTA.abilities.def,
  diplomacy: PTA.abilities.sdef,
  engineering: PTA.abilities.satk,
  handling: PTA.abilities.sdef,
  history: PTA.abilities.satk,
  insight: PTA.abilities.sdef,
  investigation: PTA.abilities.satk,
  medicine: PTA.abilities.satk,
  nature: PTA.abilities.satk,
  perception: PTA.abilities.sdef,
  perform: PTA.abilities.sdef,
  stealth: PTA.abilities.spd,
  subterfuge: PTA.abilities.spd,
}

PTA.skills = {};
PTA.skillsAbbr = {};
for (const [key, value] of Object.entries(PTA.skillAbilities)) {
  PTA.skills[key] = `PTA.Skill.${utils.toTitleCase(key)}.long`;
  PTA.skillsAbbr[key] = `PTA.Skill.${utils.toTitleCase(key)}.abbr`
}

PTA.skillAttack = { athletics: PTA.abilities.atk, };
PTA.skillDefence = {
  concentration: PTA.abilities.def,
  constitution: PTA.abilities.def,
};

PTA.skillSpecialAttack = {
  engineering: PTA.abilities.satk,
  history: PTA.abilities.satk,
  investigation: PTA.abilities.satk,
  medicine: PTA.abilities.satk,
  nature: PTA.abilities.satk,
};

PTA.skillSpecialDefence = {
  bluff: PTA.abilities.sdef,
  diplomacy: PTA.abilities.sdef,
  handling: PTA.abilities.sdef,
  insight: PTA.abilities.sdef,
  perception: PTA.abilities.sdef,
  perform: PTA.abilities.sdef,
};

PTA.skillSpeed = {
  acrobatics: PTA.abilities.spd,
  stealth: PTA.abilities.spd,
  subterfuge: PTA.abilities.spd,
};

PTA.genders = {
  male: 'PTA.Gender.Male',
  female: 'PTA.Gender.Female',
  none: 'PTA.Gender.None'
}

/* ------------------------------------------------------------------ */
/*                                                                    */
/*                          POKEMON TYPING                            */
/*                                                                    */
/* ------------------------------------------------------------------ */

PTA.pokemonTypes = {
  normal: 'PTA.Type.Normal',
  fire: 'PTA.Type.Fire',
  water: 'PTA.Type.Water',
  electric: 'PTA.Type.Electric',
  grass: 'PTA.Type.Grass',
  ice: 'PTA.Type.Ice',
  fighting: 'PTA.Type.Fighting',
  poison: 'PTA.Type.Poison',
  ground: 'PTA.Type.Ground',
  flying: 'PTA.Type.Flying',
  psychic: 'PTA.Type.Psychic',
  bug: 'PTA.Type.Bug',
  rock: 'PTA.Type.Rock',
  ghost: 'PTA.Type.Ghost',
  dragon: 'PTA.Type.Dragon',
  dark: 'PTA.Type.Dark',
  steel: 'PTA.Type.Steel',
  fairy: 'PTA.Type.Fairy'
};

PTA.typeEffectiveness = {
  normal: {
    double: ['fighting'],
    half: [],
    immune: ['ghost']
  },
  fire: {
    double: ['water', 'rock', 'ground'],
    half: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    immune: []
  },
  water: {
    double: ['electric', 'grass'],
    half: ['fire', 'water', 'ice', 'steel'],
    immune: []
  },
  electric: {
    double: ['ground'],
    half: ['electric', 'flying', 'steel'],
    immune: []
  },
  grass: {
    double: ['fire', 'ice', 'poison', 'flying', 'bug'],
    half: ['water', 'electric', 'grass', 'ground'],
    immune: []
  },
  ice: {
    double: ['fire', 'fighting', 'rock', 'steel'],
    half: ['ice'],
    immune: []
  },
  fighting: {
    double: ['flying', 'psychic', 'fairy'],
    half: ['bug', 'rock', 'dark'],
    immune: []
  },
  poison: {
    double: ['ground', 'psychic'],
    half: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
    immune: []
  },
  ground: {
    double: ['water', 'grass', 'ice'],
    half: ['poison', 'rock'],
    immune: ['electric']
  },
  flying: {
    double: ['electric', 'ice', 'rock'],
    half: ['grass', 'fighting', 'bug'],
    immune: ['ground']
  },
  psychic: {
    double: ['bug', 'ghost', 'dark'],
    half: ['fighting', 'psychic'],
    immune: []
  },
  bug: {
    double: ['fire', 'flying', 'rock'],
    half: ['grass', 'fighting', 'ground'],
    immune: []
  },
  rock: {
    double: ['water', 'grass', 'fighting', 'ground', 'steel'],
    half: ['normal', 'fire', 'poison', 'flying'],
    immune: []
  },
  ghost: {
    double: ['ghost', 'dark'],
    half: ['poison', 'bug'],
    immune: ['normal', 'fighting']
  },
  dragon: {
    double: ['ice', 'dragon', 'fairy'],
    half: ['fire', 'water', 'electric', 'grass'],
    immune: []
  },
  dark: {
    double: ['fighting', 'bug', 'fairy'],
    half: ['ghost', 'dark'],
    immune: ['psychic']
  },
  steel: {
    double: ['fire', 'fighting', 'ground'],
    half: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
    immune: ['poison']
  },
  fairy: {
    double: ['poison', 'steel'],
    half: ['fighting', 'bug', 'dark'],
    immune: ['dragon']
  }
};
/* ------------------------------------------------------------------ */
/*                                                                    */
/*                        STATUS AILMENTS                             */
/*                                                                    */
/* ------------------------------------------------------------------ */
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
  toxic: 'PTA.Ailment.Toxic.long',
};

PTA.ailmentsAbbr = {};
for (const a in PTA.ailments) {
  PTA.ailmentsAbbr[a] = PTA.ailments[a].replace('long', 'abbr');
}

PTA.statuses = {
  dead: 'PTA.Ailment.Dead.long',
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

/* ------------------------------------------------------------------ */
/*                                                                    */
/*                      POKEMON NATURES                               */
/*                                                                    */
/* ------------------------------------------------------------------ */
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
for (const a in PTA.natureIncreaseAttack) PTA.natureIncreases[a] = PTA.abilities.atk;
for (const a in PTA.natureIncreaseDefence) PTA.natureIncreases[a] = PTA.abilities.def;
for (const a in PTA.natureIncreaseSpAttack) PTA.natureIncreases[a] = PTA.abilities.satk;
for (const a in PTA.natureIncreaseSpDefence) PTA.natureIncreases[a] = PTA.abilities.sdef;
for (const a in PTA.natureIncreaseSpeed) PTA.natureIncreases[a] = PTA.abilities.spd;

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
for (const a in PTA.natureDecreaseAttack) PTA.natureDecreases[a] = PTA.abilities.atk;
for (const a in PTA.natureDecreaseDefence) PTA.natureDecreases[a] = PTA.abilities.def;
for (const a in PTA.natureDecreaseSpAttack) PTA.natureDecreases[a] = PTA.abilities.satk;
for (const a in PTA.natureDecreaseSpDefence) PTA.natureDecreases[a] = PTA.abilities.sdef;
for (const a in PTA.natureDecreaseSpeed) PTA.natureDecreases[a] = PTA.abilities.spd;

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