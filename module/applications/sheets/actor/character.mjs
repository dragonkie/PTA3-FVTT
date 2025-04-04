import PtaDialog from "../../dialog.mjs";
import PtaActorSheet, { PtaTrainerMixin } from "../actor.mjs";

export default class PtaCharacterSheet extends PtaTrainerMixin(PtaActorSheet) {
    static DEFAULT_OPTIONS = {
        classes: ["character"],
        actions: {
            trainTalent: this._onTrainTalent,
            pokemonSheet: this._onPokemonSheet,
            pokemonActivate: this._onActivatePokemon,
            pokemonRemove: this._onRemovePokemon
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
            _p.data = poke.getRollData();
            context.pokemon.push(_p);
        }

        return context;
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                               DRAG AND DROP ACTIONS                                    */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */

    async _onDropActor(event, actor) {
        try {
            if (this.document.type != 'pokemon') throw new Error("Only pokemon can be added to an actor sheet!");
            let mons = this.document.system.pokemon;

            for (const p of mons) if (p.uuid == actor.uuid) throw new Error('Actor already owns this pokémon!')

            mons.push({
                uuid: actor.uuid,
                name: actor.name
            });

            await this.document.update({ system: { pokemon: mons } });
            await this.render(false);
        } catch (err) {

        }
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   SHEET ACTIONS                                        */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */
    static async _onTrainTalent(event, target) {
        const key = target.closest('[data-pta-skill]')?.dataset.ptaSkill;
        if (!key) return;
        const skill = this.document.system.skills[key];

        if (event.shiftKey) skill.talent -= 1;
        else skill.talent += 1;

        if (skill.talent > 2) skill.talent = 0;
        if (skill.talent < 0) skill.talent = 2;

        await this.document.update({ [`system.skills.${key}`]: skill });
        await this.render(false);
    }

    static async _onActivatePokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        let list = [];
        for (const p of this.document.system.pokemon) {
            if (p.uuid == uuid) p.active = !p.active;
            list.push(p);
        }

        await this.document.update({ system: { pokemon: list } });
        await this.render(false);
    }

    static async _onRemovePokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        let list = [];
        let pokemon = null;
        for (const p of this.document.system.pokemon) {
            if (p.uuid != uuid) list.push(p);
            else pokemon = p;
        }

        try {
            if (!event.shiftKey) {
                let confirm = await PtaDialog.confirm({
                    title: 'PTA.Dialog.ReleasePokemon.title',
                    content: `
                    <p>PTA.Dialog.ReleasePokemon.content</p>
                    <p>Are you sure you would like to release <b>${pokemon.name}</b>?</p>`
                })

                if (!confirm) return;
            }

            await this.document.update({ system: { pokemon: list } });
            await this.render(false);
        } catch (err) { }
    }

    static async _onPokemonSheet(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        const pokemon = await fromUuid(uuid);
        if (!pokemon) return void console.error("Couldn't find pokemon");

        pokemon.sheet.render(true);
    }
}