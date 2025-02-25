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
  Ailments: []
}

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
if (!localStorage.getItem('pta.pokedex') || expired) {
  const _apiNames = await pokeapi.pokemon('?limit=100000&offset=0');
  const _apiEggs = await pokeapi.egg('?limit=100000&offset=0');
  const _apiMoves = await pokeapi.move('?limit=100000&offset=0');
  const _apiTypes = await pokeapi.type('?limit=100000&offset=0');
  const _apiBerries = await pokeapi.berry('?limit=100000&offset=0');

  for (const i of _apiNames.results) PTA.Pokedex.Pokemon.push(i.name);
  for (const i of _apiEggs.results) PTA.Pokedex.Eggs.push(i.name);
  for (const i of _apiMoves.results) PTA.Pokedex.Moves.push(i.name);
  for (const i of _apiTypes.results) PTA.Pokedex.Types.push(i.name);
  for (const i of _apiBerries.results) PTA.Pokedex.Berries.push(i.name);
  for (const i of await pokeapi.ailment('?limit=100000&offset=0').results) PTA.Pokedex.Ailments.push(i.name)

  localStorage.setItem('pta.pokedex', JSON.stringify(PTA.Pokedex));
  localStorage.setItem('pta.pokedexExpiry', today.toISOString());
} else {
  PTA.Pokedex = JSON.parse(localStorage.getItem('pta.pokedex'));
}

console.log('Pokedex data loaded:', PTA);

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

PTA.abilityAbbreviations = {
  atk: 'PTA.Ability.Atk.abbr',
  def: 'PTA.Ability.Def.abbr',
  satk: 'PTA.Ability.SAtk.abbr',
  sdef: 'PTA.Ability.SDef.abbr',
  spd: 'PTA.Ability.Spd.abbr',
};


PTA.skillAbility = {
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

PTA.skills = {
  acrobatics: 'Pta.Skill.Acrobatics.long',
  athletics: 'Pta.Skill.Athletics.long',
  bluff: 'Pta.Skill.Bluff.long',
  concentration: 'Pta.Skill.Concentration.long',
  constitution: 'Pta.Skill.Constitution.long',
  diplomacy: 'Pta.Skill.Diplomacy.long',
  engineering: 'Pta.Skill.Engineering.long',
  handling: 'Pta.Skill.Handling.long',
  history: 'Pta.Skill.History.long',
  insight: 'Pta.Skill.Insight.long',
  investigation: 'Pta.Skill.Investigation.long',
  medicine: 'Pta.Skill.Medicine.long',
  nature: 'Pta.Skill.Nature.long',
  perception: 'Pta.Skill.Perception.long',
  perform: 'Pta.Skill.Perform.long',
  programming: 'Pta.Skill.Programming.long',
  stealth: 'Pta.Skill.Stealth.long',
  subterfuge: 'PTA.Skill.Subterfuge.long',
}

PTA.skillAbbreviations = {
  acrobatics: 'Pta.Skill.Acrobatics.abbr',
  athletics: 'Pta.Skill.Athletics.abbr',
  bluff: 'Pta.Skill.Bluff.abbr',
  concentration: 'Pta.Skill.Concentration.abbr',
  constitution: 'Pta.Skill.Constitution.abbr',
  diplomacy: 'Pta.Skill.Diplomacy.abbr',
  engineering: 'Pta.Skill.Engineering.abbr',
  handling: 'Pta.Skill.Handling.abbr',
  history: 'Pta.Skill.History.abbr',
  insight: 'Pta.Skill.Insight.abbr',
  investigation: 'Pta.Skill.Investigation.abbr',
  medicine: 'Pta.Skill.Medicine.abbr',
  nature: 'Pta.Skill.Nature.abbr',
  perception: 'Pta.Skill.Perception.abbr',
  perform: 'Pta.Skill.Perform.abbr',
  programming: 'Pta.Skill.Programming.abbr',
  stealth: 'Pta.Skill.Stealth.abbr',
  subterfuge: 'PTA.Skill.Subterfuge.abbr',
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

PTA.skillGroups = {
  ...PTA.skillAttack,
  ...PTA.skillSpecialAttack,
  ...PTA.skillDefence,
  ...PTA.skillSpecialDefence,
  ...PTA.skillSpeed,
}

PTA.pokemonTypes = {};
for (const t of PTA.Pokedex.Types) {
  PTA.pokemonTypes[t] = `PTA.Type.${t}`;
}

PTA.statusEffects = {

}