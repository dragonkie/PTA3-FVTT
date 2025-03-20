import PtaActorSheet from "../actor.mjs";

export default class PtaCharacterSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ["character"],
        actions: {
            trainTalent: this._onTrainTalent,
            pokemonSheet: this._onPokemonSheet,
            pokemonActivate: this._onActivatePokemon
        }
    }

    static PARTS = {
        body: { template: "systems/pta3/templates/actor/character/body.hbs" },
        // Tab bodies
        features: { template: "systems/pta3/templates/actor/character/features.hbs" },
        inventory: { template: "systems/pta3/templates/actor/character/inventory.hbs" },
        pokebox: { template: "systems/pta3/templates/actor/parts/pokemon-box.hbs" },
        // components
        abilities: { template: "systems/pta3/templates/actor/parts/abilities.hbs" }
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features" },
        inventory: { id: "inventory", group: "primary", label: "PTA.Tab.Inventory" },
        pokebox: { id: "pokebox", group: "primary", label: "PTA.Tab.Pokemon" },
    }

    tabGroups = {
        primary: "features"
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   DATA PREPERATION                                     */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        context.skills = {};
        for (const [key, value] of Object.entries(this.document.system.skills)) {
            context.skills[key] = value;
            context.skills[key].label = {
                long: pta.utils.localize(CONFIG.PTA.skills[key]),
                abbr: pta.utils.localize(CONFIG.PTA.skillsAbbr[key])
            }
        }

        context.pokemon = [];
        for (const pkmn of this.document.system.pokemon) {
            const poke = await fromUuid(pkmn.uuid);
            let _p = { ...pkmn };
            _p.img = poke.img;
            context.pokemon.push(_p);
        }

        console.log(context)
        return context;
    }

    async _onDropActor(event, actor) {
        console.log(actor);

        console.log(this.document.system);

        let mons = this.document.system.pokemon;
        mons.push({
            uuid: actor.uuid,
            name: actor.name
        })

        this.document.update({
            system: {
                pokemon: mons
            }
        })
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   SHEET ACTIONS                                        */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */
    static async _onTrainTalent(event, target) {
        const key = target.closest('[data-skill]')?.dataset.skill;
        if (!key) return;
        const skill = this.document.system.skills[key];

        if (event.shiftKey) skill.talent -= 1;
        else skill.talent += 1;

        if (skill.talent > 2) skill.talent = 0;
        if (skill.talent < 0) skill.talent = 2;

        this.document.update({ [`system.skills.${key}`]: skill });
    }

    static async _onActivatePokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        let list = [];
        for (const p of this.document.system.pokemon) {
            if (p.uuid == uuid) p.active = !p.active;
            list.push(p);
        }

        this.document.update({ system: { pokemon: list } });
    }

    static async _onRemovePokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');
    }

    static async _onPokemonSheet(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        const pokemon = await fromUuid(uuid);
        if (!pokemon) return void console.error("Couldn't find pokemon");

        pokemon.sheet.render(true);
    }
}