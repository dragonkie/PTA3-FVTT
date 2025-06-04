export default class pokeapi {
    static url = 'https://pokeapi.co/api/v2/';
    static async berry(name = '', options = {}) { return await this.request(this.url + 'berry/' + name) };
    static async egg(name = '', options = {}) { return await this.request(this.url + 'egg-group/' + name) };
    static async evolution(name = '', options = {}) { return await this.request(this.url + 'evolution-chain/' + name) };
    static async item(name = '', options = {}) { return await this.request(this.url + 'item/' + name) };
    static async move(name = '', options = {}) { return await this.request(this.url + 'move/' + name) };
    static async pokemon(name = '', options = {}) { return await this.request(this.url + 'pokemon/' + name) };
    static async species(name = '', options = {}) { return await this.request(this.url + 'pokemon-species/' + name) };
    static async type(name = '', options = {}) { return await this.request(this.url + 'type/' + name) };
    static async ailment(name = '', options = {}) { return await this.request(this.url + 'move-ailment/' + name) };

    static async request(url, options = {}) {
        try {
            let request = await fetch(url, options);
            if (!request.ok) throw new Error(`pokeAPI request failed: ${request.status}`);
            return await request.json();
        } catch (error) {
            console.error('Request failed, returning null');
            return null
        }
    }

    // gets data and immedieatly ocnverts it to vtt data
    static async pokemonVTT(name) {
        if (name == '') console.error('vtt conversion must have an ID or NAME')
        let p = await this.pokemon(name);
        return await this._pokemonToVtt(p);
    }

    // converts API data into VTT usable json data
    static async _pokemonToVtt(poke) {
        const { data, species, evolution } = poke
        const pokemon = {
            name: data.name,
            weight: data.weight,
            height: data.height,
            dexID: data.id,
            types: [],
            evolution: {},
            moves: [],
        };
        pokemon.stats = {
            hp: { base: Math.round(data.stats[0].base_stat / 10) * 6 },
            atk: { base: Math.round(data.stats[1].base_stat / 10) },
            def: { base: Math.round(data.stats[2].base_stat / 10) },
            spd: { base: Math.round(data.stats[5].base_stat / 10) },
            satk: { base: Math.round(data.stats[3].base_stat / 10) },
            sdef: { base: Math.round(data.stats[4].base_stat / 10) },
        };
        for (const [key, value] of Object.entries(pokemon.stats)) pokemon.stats[key].mod = Math.floor(value.base / 2);
        for (const a of data.types) pokemon.types.push(a.type.name);

        //adds list of pokemon evoloution options, in order
        pokemon.evolution.chain = [];
        pokemon.evolution.id = evolution.id;
        pokemon.evolution.next = species
        pokemon.evolution.previous = species.evolves_from_species;

        // evolution_details repersents how a previous pokemon evolved *into* this one
        // evolves_to repersents possible options this pokemon can becom

        const parseChain = (chain) => {
            // Each evolution entry in the chain should have details used to help order itself
            let data = {
                from: [],//list of ways this pokemon came into existance
                details: undefined,
            }

            if (chain.evolution_details.length > 0) data.details = chain.evolution_details[0];
            if (chain.evolution_details.length > 1) console.error('Multi method evoloution...');

            // get details for future evolutions
            for (var i = 0; i < chain.evolves_to.length; i++) {
                pokemon.evolution.chain.push({
                    name: chain.species.name,
                    evolves_to: {
                        name: chain.evolves_to[i].species,
                    },
                });
                // if there is a further evoloution, parses it in
                if (chain.evolves_to[i]) parseChain(chain.evolves_to[i]);
            }
        }
        parseChain(evolution.chain);

        // Add pokemons level up available moves
        console.groupCollapsed('Adding available moves...')
        for (const i of data.moves) {
            for (const d of i.version_group_details) {
                if (d.move_learn_method.name == 'machine') continue;
                let skip = false;
                for (const f of pokemon.moves) if (f.name == i.move.name) skip = true;
                if (skip) continue;
                let data = await pokeapi.request(i.move.url);
                let _d = {
                    name: i.move.name,
                    level: d.level_learned_at,
                    method: d.move_learn_method.name,
                    data: data
                }
                _d.type = data.type.name;

                if (data.meta) {
                    _d.id = data.id;
                    _d.accuracy = data.accuracy;
                    _d.category = data.meta.category.name;
                    _d.ailment = {
                        name: data.meta.ailment.name,
                        chance: data.meta.ailment_chance,
                        turns: {
                            max: data.meta.max_turns,
                            min: data.meta.min_turns
                        }
                    }
                }

                pokemon.moves.push(_d);
            }
        }
        console.groupEnd();

        pokemon.moves.sort((a, b) => {
            return a.level - b.level;
        })

        // converts list of moves into PTA3 stat passives where possible
        // Make sure to filter out unavailable options before calculation
        let m = [];
        for (const n of pokemon.moves) if (n.method == 'level-up') m.push(n.name);
        let statBonus = this.movePassive(m);

        return pokemon;
    }

    /**
     * converts a move based off of name into their respective stat changes
     * @param {string} move 
     * @returns {Object} an object with matching keys to default pokemon stats to be added
     */
    static movePassive(moves) {
        // santize the input to make sure it adheres to pokeapi formating
        if (!Array.isArray(moves)) moves = [moves];

        const stats = {
            atk: 0,
            def: 0,
            hp: 0,
            satk: 0,
            sdef: 0,
            spd: 0,
        }

        for (let move of moves) {
            move = move.toLowerCase().replaceAll(" ", "-");
            switch (move) {
                // Attack
                case 'gorilla-tactics':
                case 'howl':
                case 'leer':
                case 'meditate':
                case 'moxie':
                case 'sharpen':
                case 'tail-whip':
                    stats.atk += 1;
                    break;
                case 'hone-claws':
                case 'screech':
                case 'swords-dance':
                    stats.atk += 2;
                    break;
                case 'huge-power':
                case 'pure-power':
                    stats.atk += 6;
                    break;

                // Special Attack
                case 'metal-sound':
                case 'nasty-plot':
                    stats.satk += 1;
                    break;
                case 'fake-tears':
                    stats.satk += 2;
                    break;
                case 'tail-glow':
                    stats.satk += 3;
                    break;

                // Defence
                case 'baby-doll-eyes':
                case 'charm':
                case 'defense-curl':
                case 'growl':
                case 'harden':
                case 'intimidate':
                case 'play-nice':
                case 'withdraw':
                    stats.def += 1;
                    break;
                case 'acid-armor':
                case 'barrier':
                case 'feather-dance':
                case 'iron-defense':
                case 'stamina':
                    stats.def += 2;
                    break;
                case 'cotton-guard':
                case 'shelter':
                    stats.def += 3;
                    break;

                // Special Defence
                case 'confide':
                    stats.sdef += 1;
                    break;
                case 'amnesia':
                case 'captivate':
                case 'eerie-impulse':
                    stats.sdef += 2;
                    break;

                // Mixed stat gains
                case 'bulk-up':
                case 'tickle':
                    stats.atk += 1;
                    stats.def += 1;
                    break;
                case 'growth':
                case 'rototiller':
                case 'work-up':
                    stats.atk += 1;
                    stats.satk += 1;
                    break;
                case 'calm-mind':
                    stats.satk += 1;
                    stats.sdef += 1;
                    break;
                case 'coil':
                    stats.atk += 2;
                    stats.def += 1;
                    break;
                case 'cosmic-power':
                case 'tearful-look':
                    stats.def += 1;
                    stats.sdef += 1;
                    break;
                case 'dragon-dance':
                    stats.atk += 1;
                    stats.spd += 1;
                    break;
                case 'quiver-dance':
                    stats.spd += 1;
                    stats.satk += 1;
                    stats.sdef += 1;
                    break;
                case 'shift-gear':
                    stats.atk += 1;
                    stats.spd += 2;
                    break;
            }
        }

        return stats;
    }

    //================================================================================================================
    //> Helpers for retrieving sprites by index without calling api
    //================================================================================================================
    static Sprite = {
        Official(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${index}.png`
        },
        OfficialShiny(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${index}.png`
        },
        Default(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index}.png`
        },
        DefaultShiny(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${index}.png`
        },
        DefaultBack(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${index}.png`
        },
        DefaultBackShiny(index) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${index}.png`
        }
    }
}