import pokeapi from "./helpers/pokeapi.mjs";


/**
 * =========================
 * Pokémon Move Typedefs
 * =========================
 */
/**
 * @typedef {Object} UrlObject
 * @property {string} name
 * @property {string} url
 *
 * @typedef {Object} ContestCombo
 * @property {UrlObject[] | null} use_after
 * @property {UrlObject[] | null} use_before
 *
 * @typedef {Object} ContestCombos
 * @property {ContestCombo} normal
 * @property {ContestCombo} super
 *
 * @typedef {Object} EffectEntry
 * @property {string} effect
 * @property {UrlObject} language
 * @property {string} short_effect
 *
 * @typedef {Object} MetaData
 * @property {UrlObject} ailment
 * @property {number} ailment_chance
 * @property {UrlObject} category
 * @property {number} crit_rate
 * @property {number} drain
 * @property {number} flinch_chance
 * @property {number} healing
 * @property {number | null} max_hits
 * @property {number | null} max_turns
 * @property {number | null} min_hits
 * @property {number | null} min_turns
 * @property {number} stat_chance
 *
 * @typedef {Object} NameEntry
 * @property {UrlObject} language
 * @property {string} name
 *
 * @typedef {Object} PastValue
 * @property {number | null} accuracy
 * @property {number | null} effect_chance
 * @property {EffectEntry[]} effect_entries
 * @property {number | null} power
 * @property {number | null} pp
 * @property {null} type
 * @property {UrlObject} version_group
 *
 * @typedef {Object} Move
 * @property {number} accuracy
 * @property {ContestCombos} contest_combos
 * @property {UrlObject} contest_effect
 * @property {UrlObject} contest_type
 * @property {UrlObject} damage_class
 * @property {number | null} effect_chance
 * @property {EffectEntry[]} effect_changes
 * @property {EffectEntry[]} effect_entries
 * @property {UrlObject} generation
 * @property {number} id
 * @property {any[]} machines
 * @property {MetaData} meta
 * @property {string} name
 * @property {NameEntry[]} names
 * @property {PastValue[]} past_values
 * @property {number} power
 * @property {number} pp
 * @property {number} priority
 * @property {any[]} stat_changes
 * @property {UrlObject} super_contest_effect
 * @property {UrlObject} target
 * @property {UrlObject} type
 */
/**
 * =========================
 * Pokémon Data Typedefs
 * =========================
 */
/**
 * @typedef {Object} AbilitySlot
 * @property {UrlObject} ability
 * @property {boolean} is_hidden
 * @property {number} slot
 *
 * @typedef {Object} HeldItemVersion
 * @property {number} rarity
 * @property {UrlObject} version
 *
 * @typedef {Object} HeldItem
 * @property {UrlObject} item
 * @property {HeldItemVersion[]} version_details
 *
 * @typedef {Object} PastAbility
 * @property {AbilitySlot[]} abilities
 * @property {UrlObject} generation
 *
 * @typedef {Object} Stat
 * @property {number} base_stat
 * @property {number} effort
 * @property {UrlObject} stat
 *
 * @typedef {Object} TypeSlot
 * @property {number} slot
 * @property {UrlObject} type
 * 
 * @typedef {Object} MoveVersionSlot
 * @property {Number} level_learned_at
 * @property {UrlObject} move_learn_method
 * @property {UrlObject} version_group
 * 
 * @typedef {Object} MoveSlot
 * @property {UrlObject} move
 * @property {MoveVersionSlot[]} version_group_details
 *
 * @typedef {Object} Pokemon
 * @property {AbilitySlot[]} abilities
 * @property {MoveSlot[]} moves
 * @property {number} base_experience
 * @property {UrlObject[]} forms
 * @property {number} height
 * @property {HeldItem[]} held_items
 * @property {number} id
 * @property {boolean} is_default
 * @property {string} name
 * @property {UrlObject[]} names
 * @property {number} order
 * @property {PastAbility[]} past_abilities
 * @property {any[]} past_types
 * @property {UrlObject} species
 * @property {Stat[]} stats
 * @property {TypeSlot[]} types
 * @property {number} weight
 */

const MoveGarbageList = [
    'contest_combos',
    'contest_effect',
    'contest_type',
    'flavor_text_entries',
    'generation',
    'machines',
    'super_contest_effect',
    'past_values',
    'learned_by_pokemon',
    'names',
    'target'
];

const SpeciesGarbageList = [
    'names',
    'generation',
    'habitat',
    'shape',
    'genera',
    'base_happiness',
    'capture_rate',
    'color',
    'egg_groups',
    'pal_park_encounters',
    'growth_rate',
    'flavor_text_entries',
    'hatch_counter',
];

const AbilityGarbageList = [
    'flavor_text_entries',
    'is_main_series',
    'names',
    'pokemon',
    'generation'
]

/*

STAT BOOST METHOD
when adding a bonus / detriment to a stat, the equation is Max(2, increase)/Max(2, increase) by default
decreases affects the second number, meaning your damage is modified in final by 2 / 2 + decrease level
the opposite is done for boosts, increaseing the first number, so 3/2 = 1.5 for 50% bonus damage

*/

function PurgeProperties(obj, list) {
    for (const key of list) if (Object.hasOwn(obj, key)) delete obj[key];
}

// converts a number from -6 to +6 into its relative boost
function BoostConversion(num) {
    num = Math.max(Math.min(6, num), -6); // clamps the boost value to what it should be
    if (num < 0) {
        return 2 / (num * -1);// convert number to positive, reduce damage by the reduciton value
    } else if (num > 0) {
        return num / 2; // nice and easy
    }
    return 1;
}

function CriticalChanceStage(stage) {
    if (stage >= 3) return 1;
    if (stage == 2) return 1 / 2;
    if (stage == 1) return 1 / 8;
    return 1 / 24;
}

export class simPokemon {
    _ready = false;
    _api = null;
    abilities = [];
    forms = [];
    height = 0;
    id = 0;
    moves = [];
    /**@type {Array<Move>} */
    moveset = []; // available moves given to this pokemon
    name = '';
    species = '';
    stats = {
        hp: { base: 0, current: 0, boosts: 0 },
        atk: { base: 0, current: 0, boosts: 0 },
        def: { base: 0, current: 0, boosts: 0 },
        satk: { base: 0, current: 0, boosts: 0 },
        sdef: { base: 0, current: 0, boosts: 0 },
        spd: { base: 0, current: 0, boosts: 0 },
    };
    types = [];
    weight = 0;
    statuses = [];

    get isFaitned() { return this.stats.hp.current <= 0 };
    get attack() { return this._finalStat(this.stats.atk) };
    get defence() { return this._finalStat(this.stats.def) };
    get sAttack() { return this._finalStat(this.stats.satk) };
    get sDefence() { return this._finalStat(this.stats.sdef) };
    get speed() { return this._finalStat(this.stats.spd) };

    _finalStat(stat) {
        return stat.base * BoostConversion(stat.boosts)
    }

    /**
     * @param {apiPokemon} data
     */
    constructor(api = undefined) {
        if (api) this._api = api;
    }

    // loads in a pokemon from the api using a name or id
    static async CreateFromApi(pokemonId) {
        const pokemon = new simPokemon();

        try {
            /**@type {Pokemon} */
            const _apiData = await pokeapi.pokemon(pokemonId);
            pokemon._api = _apiData;
            pokemon.id = _apiData.id;
            pokemon.name = _apiData.name;

            // prepare pokemons stats
            const _stats = _apiData.stats;
            pokemon.stats.hp.base = pokemon.stats.hp.current = Math.round(_stats[0].base_stat / 10 * 8);
            pokemon.stats.atk.base = pokemon.stats.atk.current = Math.round(_stats[1].base_stat / 10);
            pokemon.stats.def.base = pokemon.stats.def.current = Math.round(_stats[2].base_stat / 10);
            pokemon.stats.satk.base = pokemon.stats.satk.current = Math.round(_stats[3].base_stat / 10);
            pokemon.stats.sdef.base = pokemon.stats.sdef.current = Math.round(_stats[4].base_stat / 10);
            pokemon.stats.spd.base = pokemon.stats.spd.current = Math.round(_stats[5].base_stat / 10);

            // load moves into the pokemon
            for (let i = 0; i < _apiData.moves.length; i++) {
                /**@type {Move} */
                const move = await pokeapi.move(_apiData.moves[i].move.name);
                _apiData.moves[i] = move;

                // clean out useless api data
                PurgeProperties(move, MoveGarbageList);
                pokemon.moves.push({
                    name: move.name,
                    power: move.damage_class.name != 'status' ? `${Math.max(1, Math.round(move.power / 20))}d6` : null,
                    power_average: move.damage_class.name != 'status' ? Math.max(1, Math.round(move.power / 20)) * 3.5 : null,
                    pp: move.pp,
                    priority: move.priority,
                    accuracy: move.accuracy,
                    id: move.id,
                    class: move.damage_class.name,
                    type: move.type.name,
                    ailment: {
                        name: move.meta?.ailment.name,
                        chance: move.meta?.ailment_chance
                    },
                    flinch_chance: move.meta?.flinch_chance,
                    crit_stage: move.meta?.crit_rate,
                    crit_chance: CriticalChanceStage(move.meta?.crit_rate),
                    max_hits: move.meta?.max_hits,
                    min_hits: move.meta?.min_hits,
                    drain: move.meta ? move.meta.drain / 10 : null,
                })
            }

            // Loads the pokemons abilities data
            for (let index = 0; index < _apiData.abilities.length; index++) {
                const _api = _apiData.abilities[index];
                const _url = _api.ability.url;
                const _ability = await pokeapi.request(_url)
                PurgeProperties(_ability, AbilityGarbageList);

                _apiData.abilities[index] = {
                    is_hidden: _api.is_hidden,
                    ..._ability
                }

                pokemon.abilities.push(_ability.name);
            };

            // Loads in pokemons types
            for (const t of _apiData.types) {
                pokemon.types.push(t.type.name);
            }

            // get the pokemons species
            const _species = await pokeapi.species(_apiData.species.name);
            _apiData.species = _species;
            PurgeProperties(_species, SpeciesGarbageList);
            pokemon.species = {
                name: _species.name,
                isBaby: _species.is_baby,
                isLegendary: _species.is_legendary,
                isMythic: _species.is_mythical,
            }
        } catch (err) {
            console.error('Failed to load pokemon:', err);
            return null;
        }

        console.log(pokemon);
        pokemon._ready = true;
        return pokemon;
    }

    /**
     * 
     * @param {Array<String>|String} list 
     */
    async LoadMoveset(list) {
        if (!Array.isArray(list)) list = [list];

        for (const move of this.moves) {
            if (list.includes(move.name)) {
                this.moveset.push(move);
            }
        }
    }
}

/**
 * @typedef PokemonTeam
 * @prop {Array<Pokemon>} pokemon - List of available pokemon
 * @prop {Object} statistics - data from this teams simulations
 * @prop {String} name - the team name to use
 * @prop {Pokemon} active_pokemon - the currently in use pokemon
 */
export class PokemonTeam {
    pokemon = []; // pokemon list
    statistics = { // stored global statistics
        wins: 0,
        losses: 0,
        win_rate: 0,
        mvp: '',// pokemon that performed the best
        weakest: '',// pokemon that did the least
    };
    name = ''; // team name
    /**@type {null|Pokemon} */
    active_pokemon = null; // the pokemon currently in use
    constructor() {

    }

    getPokemon(name) {
        for (const pokemon of this.pokemon) if (pokemon.name == name || pokemon.nickname == name || pokemon.id == name) return pokemon;
    }
}

/**
 * ===========================================
 * Pokémon combat helper functions
 * ===========================================
 */

/**
 * Returns data about the current matchup between two pokemon including the number of expected turns to KO
 * @param {Pokemon} attacker 
 * @param {Pokemon} defender 
 * @returns {Object}
 */
export function GetMatchupDetails(attacker, defender) {
    const data = {
        attacker: attacker,
        defender: defender,
        move_summary: [],
        best_move: null,
        highest_damage: 0,
        goes_first: false,
        ko_turns: 0,
        physical_scale: attacker.attack / defender.defence,
        special_scale: attacker.sAttack / defender.sDefence,
        ailments: []
    }

    if (attacker.speed > defender.speed) data.goes_first = true;

    for (const move of attacker.moveset) {
        if (move.class == 'status') {
            //if this is a status effect move, evaluate how helpful it would be
            if (move.ailment && move.ailment.name != 'none') data.ailments.push(move.ailment);
            const effectiveness = pta.utils.typeEffectiveness(move.type, defender.types); // checks the effectiveness of the move
            data.move_summary.push({
                name: move.name,
                class: move.class,
                damage: null,
                scaling: null,
                effectiveness: effectiveness,
                stab: null,
                ailment: (move.ailment && move.ailment.name != 'none') ? move.ailment : null
            })
        } else {
            const effectiveness = pta.utils.typeEffectiveness(move.type, defender.types); // checks the effectiveness of the move
            const stab = (attacker.types.includes(move.type)) ? 1.5 : 1; // gives 50% bonus damage if theres a stab matching type
            // checks the final damage to be dealt to the defender
            const expected_damage = (move.power_average * (move.class == 'physical' ? data.physical_scale : data.special_scale) * stab * effectiveness.percent) * (move.accuracy / 100);

            if (expected_damage > data.highest_damage) {
                data.highest_damage = expected_damage;
                data.best_move = move;
            }

            if (move.ailment && move.ailment.name != 'none') data.ailments.push(move.ailment);

            data.move_summary.push({
                name: move.name,
                class: move.class,
                damage: expected_damage,
                scaling: (move.class == 'physical' ? data.physical_scale : data.special_scale),
                effectiveness: effectiveness,
                stab: (stab > 1 ? true : false),
                ailment: (move.ailment && move.ailment.name != 'none') ? move.ailment : null
            })
        }
    }

    data.ko_turns = Math.ceil(defender.stats.hp.current / data.highest_damage);

    return data;
}

/**
 * 
 * @param {Pokemon} attacker - the pokemon fighting
 * @param {Pokemon} defender - the pokemon to be potentially swapped out
 * @returns {Boolean}
 */
export function SwapPokemon(attacker, defender) {
    let swap = false;
    if (defender.isFaitned) return true;
    // checks if the enemys a good attacker against us, assuming it has moves to match its types
    else {
        const attacker_details = GetMatchupDetails(attacker, defender);
        const defender_details = GetMatchupDetails(defender, attacker);

        // predictions with just base stats
        if (attacker_details.ko_turns <= 2 && attacker_details.goes_first) swap = true; // if the enemy goes first and kills us in two turns, run away
        if (attacker_details.ko_turns <= 1) swap = true; // if we can be one tapped at all, run away
        if (defender_details.ko_turns >= attacker_details.ko_turns) swap = true; // if the enemy kills us sooner than we kill them
        if (defender_details.ko_turns >= 5) swap = true; // five turns is to long even if we can win, try swapping to a more effective matchup

        // predictions with status effects / applying them

        // predictions with stat boosts / decreases, probs needs 3 turns to be proper benefidical

        // predictions with wheather effects



        // if we can one tap enemies, we shouldn't swap, overide previous options
        if (defender_details.ko_turns <= 1 && defender_details.goes_first) swap = false;
    }

    return swap;
}

/**
 * checks the red teams pokemons state, and swaps out based on it's oponent
 * @param {PokemonTeam} _TeamRed 
 * @param {PokemonTeam} _TeamBlue 
 */
export function TeamSwapPokemon(_TeamRed, _TeamBlue) {
    // determin if we need to swap pokemon
    let swap = false;

    const defender = _TeamRed.active_pokemon;
    const attacker = _TeamBlue.active_pokemon;

    // check if the pokemon is fainted, forcing us to swap
    if (defender.isFaitned) swap = true;
    // checks if the enemys a good attacker against us, assuming it has moves to match its types
    else {
        for (const move of attacker.moveset) {
            if (move.class == 'status') continue;
            const effectiveness = pta.utils.typeEffectiveness(move.type, defender.types); // checks the effectiveness of the move
            const stab = (attacker.types.includes(move.type)) ? 1.5 : 1; // gives 50% bonus damage if theres a stab matching type
            // checks the attacker vs defenders relevant stat
            const stat_ratio = 1;
            if (move.class == 'physical') stat_ratio = (attacker.attack / defender.defence);
            if (move.class == 'special') stat_ratio = (attacker.sAttack / defender.sDefence);
            // checks the final damage to be dealt to the defender
            const expected_damage = move.power_average * stat_ratio * stab * effectiveness.percent;

            // check if we need to swap
            if (effectiveness.value >= 2) swap = true; // if the enemy has a 4x move, just swap
            if (expected_damage >= defender.stats.hp.current && defender.speed < attacker.speed) swap = true
        }

        // checks if defenders moves allow us to take them on
        for (const move of defender.moveset) {
            if (move.class == 'status') continue;
            const effectiveness = pta.utils.typeEffectiveness(move.type, attacker.types); // checks the effectiveness of the move
            const stab = (defender.types.includes(move.type)) ? 1.5 : 1; // gives 50% bonus damage if theres a stab matching type
            // checks the attacker vs defenders relevant stat
            const stat_ratio = 1;
            if (move.class == 'physical') stat_ratio = (defender.attack / attacker.defence);
            if (move.class == 'special') stat_ratio = (defender.sAttack / attacker.sDefence);
            // checks the final damage to be dealt to the defender
            const expected_damage = move.power_average * stat_ratio * stab * effectiveness.percent;

            if (defender.speed > attacker.speed && expected_damage >= attacker.stats.hp.current) swap = false;
        }
    }

    // swap the pokemon if we met a previous criteria
    if (swap) {

    }
}

/**
 * ===========================================
 * Simulation data definitions
 * ===========================================
 */

/**
 * @typedef {Object} SimulationConfig
 * @prop {Number} iterations - The number of battles to simulate over
 * @prop {Array<String>} rules - Array of optional rules 
 */

/**
 * @typedef SimulationResults
 * @prop {String} winner - team name of the winners
 * @prop {Array<String>} log - array of text detailing the events that occured
 * @prop {Number} rounds - number of rounds it took to fight
 */

/**
 * ===========================================
 * Combat simulator functions
 * ===========================================
 */

/**
 * Runs the actual battle 
 * @param {PokemonTeam} TeamRed 
 * @param {PokemonTeam} TeamBlue 
 * @returns {SimulationResults}
 */
export function SimulateBattle(_TeamRed, _TeamBlue) {
    if (!TeamRed || !TeamBlue) return void console.log('Requires two teams to simulate');
    // Make safe copies of the teams to modify
    const TeamRed = structuredClone(TeamRed);
    const TeamBlue = structuredClone(TeamBlue);

    // Prep data tracking for the fight
    /**@type {SimulationResults} */
    const results = {
        winner: '',
        log: [],
        rounds: 0,
    }

    // Begin combat!
    let finished = false;
    while (!finished) {
        // initial pokemon summong, done at random if not pre chosen by the teams
        if (results.rounds == 0) {
            // if this is the start of the battler, open with a random pokemon if one isnt pre chosen
            if (!TeamRed.active_pokemon) TeamRed.active_pokemon = TeamRed.pokemon[Math.floor(Math.random() * TeamRed.pokemon.length)];
            if (!TeamBlue.active_pokemon) TeamBlue.active_pokemon = TeamBlue.pokemon[Math.floor(Math.random() * TeamBlue.pokemon.length)];
        }

        // tick over the round counter
        results.rounds += 1;
        results.log.push(`------------------- ROUND ${results.rounds} -------------------`)

        // switch out fainted pokemon, or poor type matchups potentially

        // pokemon attack

        // trigger status effects

        // trigger wheather effects

    }
}

export function SimulateDoubleBattle(TeamRed, TeamBlue, options) {

}

/**
 * 
 * @param {*} pokemonOne 
 * @param {*} pokemonTwo 
 * @param {*} moveOne 
 * @param {*} moveTwo 
 * @param {*} method 
 * @param {*} iterations 
 */

export async function BattleSimulation(pokemonOne, pokemonTwo, moveOne, moveTwo, method = 0, iterations = 10) {
    const _apiRed = await pokeapi.pokemon(pokemonOne);
    const _apiBlue = await pokeapi.pokemon(pokemonTwo);

    const _apiMoveRed = await pokeapi.move(moveOne);
    const _apiMoveBlue = await pokeapi.move(moveTwo);

    const _red = {
        name: _apiRed.name,
        base_stats: {},
        stats: {},
        types: [],
        move: {}
    };
    const _blue = {
        name: _apiBlue.name,
        base_stats: {},
        stats: {},
        types: [],
        move: {}
    };

    // get game stats
    for (let a = 0; a < _apiRed.stats.length; a++) {
        let key = _apiRed.stats[a].stat.name;
        _red.base_stats[key] = _apiRed.stats[a].base_stat;
        _red.stats[key] = Math.round(_red.base_stats[key] / 10);

        _blue.base_stats[key] = _apiBlue.stats[a].base_stat;
        _blue.stats[key] = Math.round(_blue.base_stats[key] / 10);
    }

    // get typing
    for (const t of _apiRed.types) _red.types.push(t.type.name);
    for (const t of _apiBlue.types) _blue.types.push(t.type.name);

    // adjust their hp
    _red.stats.hp = _red.stats.hp * 6;
    _blue.stats.hp = _blue.stats.hp * 6;

    // create useable move data
    const prepareMove = (move) => {

        let p = move.power / 10;
        let d = [];

        while (p > 0) {
            if (p / 12 >= 1) {
                d.push('2d12');
                p = p % 12;
            } else if (p / 10 >= 1) {
                d.push('2d10');
                p = p % 10;
            } else if (p / 8 >= 1) {
                d.push('2d8');
                p = p % 8;
            } else if (p / 6 >= 1) {
                d.push('2d6');
                p = p % 6;
            } else if (p / 4 >= 1) {
                d.push('2d4');
                p = p % 4;
            } else {
                d.push('1d4');
                p = 0;
            }
        }

        let f = '';
        let _first = true;
        for (let a = 0; a < d.length; a++) {
            if (!_first) f += '+';
            f += d[a];
        }

        return {
            name: move.name,
            power: f,
            type: move.type.name,
            class: move.damage_class.name,
            api: move
        }
    }

    _red.move = prepareMove(_apiMoveRed);
    _blue.move = prepareMove(_apiMoveBlue);

    // Simulate the combats
    const LogTemplate = () => {
        return {
            accuracy: 100,
            damage_dealt: 0,
            damage_taken: 0,
            dpr: 0,
            attacks: 0,
            hits: 0,
            misses: 0,
            crits: 0
        }
    }

    const logs = [];

    for (let loop = 0; loop < iterations; loop += 1) {
        const logData = {
            turns: 0,
            winner: undefined,
            [_red.name]: LogTemplate(),
            [_blue.name]: LogTemplate(),
            timeline: []
        }

        const _cRed = JSON.parse(JSON.stringify(_red));
        const _cBlue = JSON.parse(JSON.stringify(_blue));

        // pokemon combat function to call
        const PokemonAttack = async (attacker, defender) => {
            logData.timeline.push(`${attacker.name} attacked ${defender.name} using ${attacker.move.name}`)
            // generate attack data we need
            const formula = {
                damage: `${attacker.move.power} + ${Math.floor(attacker.stats.attack / 2)}`,
                attack: `1d20 + ${Math.floor(attacker.stats.attack / 2)}`
            }

            const key = {
                attack: (attacker.move.class == 'physical' ? 'attack' : 'special-attack'),
                defense: (attacker.move.class == 'physical' ? 'defense' : 'special-defense'),
            }

            const effectiveness = pta.utils.typeEffectiveness(attacker.move.type, defender.types)

            switch (method) {
                case 0:
                    // dice added version
                    //if (effectiveness.value > 0) formula.damage += ` + ${effectiveness.value}${dice_size}`;
                    //if (effectiveness.value < 0) formula.damage += ` - ${effectiveness.value}${dice_size}`;
                    // dice multipliers
                    if (effectiveness.value > 0) formula.damage = `(${formula.damage}) * ${effectiveness.value * 2}`;
                    if (effectiveness.value < 0) formula.damage = `(${formula.damage}) * ${1 / (effectiveness.value * -2)}`;
                    for (const t of attacker.types) if (t == attacker.move.type) formula.damage += ' + 4';
                    break;
            }

            // get the roll values before hand for ease of use
            const _roll = {
                damage: undefined,
                accuracy: undefined,
                attack: undefined
            }

            const dmg = new Roll(formula.damage);
            await dmg.evaluate();

            const acc = new Roll('1d100');
            await acc.evaluate();

            const rAtk = new Roll(formula.attack);
            await rAtk.evaluate();

            // change the combat method were testing
            if (method == 0) { // default system
                // roll the attack
                _roll.attack = new Roll('1d20');
                _roll.attack.evaluate();

                // check for natural crit
                let critical = false;
                if (_roll.attack.total == 20) {
                    critical = true;
                    formula.damage = `${Math.floor(attacker.move.api.power / 20 * 12)} + ${attacker.stats[key.attack]}`;
                }

                // Attack data log
                logData.timeline.push(`Attack roll: ${formula.attack} = ${rAtk.total}`);
                logData[attacker.name].attacks += 1;
                if (critical) {
                    logData.timeline.push(`It's a critical hit!`);
                    logData[attacker.name].crits += 1;
                }

                if (rAtk.total >= defender.stats[key.defense]) {
                    // Logs that the attack hit
                    logData.timeline.push(`${attacker.name} hit ${defender.name} with ${attacker.move.name} for ${dmg.total} damage`);
                    logData.timeline.push(`Damage roll: ${formula.damage} = ${dmg.total}`);
                    logData[attacker.name].hits += 1;
                    logData[attacker.name].damage_dealt += dmg.total;
                    logData[defender.name].damage_taken += dmg.total;

                    // calculates damage dealt
                    const finalDamage = dmg.total
                    defender.stats.hp -= finalDamage;

                } else {
                    logData.timeline.push(`${attacker.name} missed with ${key.attack} ${rAtk.total} against ${key.defense} ${defender.stats[key.defense]}`)
                    logData[attacker.name].misses += 1;
                }
            } else if (method == 1) { // DND5e method

            } else if (method == 2) { // Rolled defence

            } else if (method == 3) { // callums nonsense
                // Uses game accuracy

            }
        }

        let _cTimer = 0;
        let _cDuration = 30;
        while (_cRed.stats.hp > 0 && _cBlue.stats.hp > 0) {
            if (_cTimer > _cDuration) {
                logData.timeline.push('SIMULATION LENGTH EXCEEDED MAX');
                break; // ends the combat if it takes more than this many turns
            }
            _cTimer += 1;
            logData.timeline.push(`---------------------------------- TURN ${_cTimer} ----------------------------------`);

            if (_cRed.stats.speed >= _cBlue.stats.speed) {
                await PokemonAttack(_cRed, _cBlue);// red goes first
                if (_cBlue.stats.hp <= 0) continue;

                await PokemonAttack(_cBlue, _cRed);
            } else {
                await PokemonAttack(_cBlue, _cRed);// blue goes first
                if (_cRed.stats.hp <= 0) continue;
                await PokemonAttack(_cRed, _cBlue);
            }
        }

        if (_cTimer > _cDuration) {

        } else {
            logData.winner = (_cRed.stats.hp > 0 ? _cRed.name : _cBlue.name);
            logData.turns = _cTimer;
            // pokemons accuracy
            logData[_red.name].accuracy = Math.max(logData[_red.name].hits / logData[_red.name].attacks * 100, 0);
            logData[_blue.name].accuracy = Math.max(logData[_blue.name].hits / logData[_blue.name].attacks * 100, 0);
            // pokemons damage per round
            logData[_red.name].dpr = Math.max(logData[_red.name].damage_dealt / logData[_red.name].attacks, 0);
            logData[_blue.name].dpr = Math.max(logData[_blue.name].damage_dealt / logData[_blue.name].attacks, 0);

            // fix NaN results from dividing by 0
            for (const key of Object.keys(logData[_red.name])) {
                if (Number.isNaN(logData[_red.name][key])) logData[_red.name][key] = 0;
                if (Number.isNaN(logData[_blue.name][key])) logData[_blue.name][key] = 0;
            }
        }

        logs.push(logData);
    }

    const summary = {
        teamRed: {
            wins: 0,
            lost: 0,
            pokemon: _red,
            move: _red.move,
            accuracy: 0,
            dpr: 0,
        },
        teamBlue: {
            wins: 0,
            lost: 0,
            pokemon: _blue,
            move: _blue.move,
            accuracy: 0,
            dpr: 0,
        },
        winner: 'noone',
        longest: logs[0],
        duration: 0,
        median: {}
    };

    let samples = logs.length;
    for (const l of logs) {
        summary.duration += l.turns;
        if (l.winner == _red.name) {
            summary.teamRed.wins += 1;
            summary.teamBlue.lost += 1;
        }
        if (l.winner == _blue.name) {
            summary.teamBlue.wins += 1;
            summary.teamRed.lost += 1;
        }

        if (l.turns > summary.longest.turns) summary.longest = l;

        summary.teamRed.accuracy += l[_red.name].accuracy;
        summary.teamRed.dpr += l[_red.name].dpr;

        summary.teamBlue.accuracy += l[_blue.name].accuracy;
        summary.teamBlue.dpr += l[_blue.name].dpr;

        if (Object.hasOwn(summary.median, l.turns)) summary.median[l.turns] += 1;
        else summary.median[l.turns] = 1;
    }

    summary.duration /= samples;

    summary.teamRed.dpr /= samples;
    summary.teamRed.accuracy /= samples;

    summary.teamBlue.dpr /= samples;
    summary.teamBlue.accuracy /= samples;

    summary.logs = logs;
    if (summary.teamRed.wins > summary.teamBlue.wins) summary.winner = _red.name;
    if (summary.teamRed.wins < summary.teamBlue.wins) summary.winner = _blue.name;
    if (summary.teamRed.wins == summary.teamBlue.wins) summary.winner = 'DRAW!';
}