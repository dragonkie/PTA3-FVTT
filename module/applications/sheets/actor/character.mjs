import PtaDialog from "../../dialog.mjs";
import PtaActorSheet, { PtaTrainerMixin } from "../actor.mjs";

export default class PtaCharacterSheet extends PtaTrainerMixin(PtaActorSheet) {
    static DEFAULT_OPTIONS = {
        classes: ["character"],
        window: {
            controls: [{
                icon: 'fas fa-user-circle',
                label: 'TOKEN.TitlePrototype',
                action: 'configurePrototypeToken',
                ownership: 3
            }, {
                icon: 'fas fa-image',
                label: 'SIDEBAR.CharArt',
                action: 'showPortraitArtwork',
                ownership: 3
            }, {
                icon: 'fas fa-image',
                label: 'SIDEBAR.TokenArt',
                action: 'showTokenArtwork',
                ownership: 3
            }, {
                icon: 'fas fa-link',
                label: '*Link Pokemon*',
                action: 'pokemonLink',
                ownership: 3
            }]
        },
        actions: {
            trainTalent: this._onTrainTalent,
            pokemonUnbox: this._onUnboxPokemon,
            pokemonRemove: this._onRemovePokemon,
            pokemonBox: this._onBoxPokemon,
            pokemonLink: this._onLinkPokemon,
            selectElement: this._onSelectElement,
            pcLayout: this._onChangePcLayout,
        }
    }

    static PARTS = {
        body: { template: "systems/pta3/templates/actor/character/body.hbs" },
        // Tab bodies
        features: { template: "systems/pta3/templates/actor/character/features.hbs" },
        inventory: { template: "systems/pta3/templates/actor/character/inventory.hbs" },
        pokebox: { template: "systems/pta3/templates/actor/character/pokemon.hbs" },
        effects: { template: "systems/pta3/templates/actor/parts/actor-effects.hbs" },
        details: { template: "systems/pta3/templates/actor/character/details.hbs" },
        // components
        abilities: { template: "systems/pta3/templates/actor/parts/abilities.hbs" }
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features" },
        inventory: { id: "inventory", group: "primary", label: "PTA.Tab.Inventory" },
        pokebox: { id: "pokebox", group: "primary", label: "PTA.Tab.Pokemon" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details" },
    }

    tabGroups = {
        primary: "features"
    }

    //=======================================================================================
    // Data preperation
    //=======================================================================================

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
            if (!pkmn) continue;
            let _p = { ...pkmn };
            _p.img = poke.img;
            _p.data = poke.getRollData();
            context.pokemon.push(_p);
        }

        return context;
    }

    //=======================================================================================
    // Drag and Drop
    //=======================================================================================

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    async _onDropActor(event, actor) {
        try {
            if (actor.type != 'pokemon' && !game.settings.get(game.system.id, 'palworld')) throw new Error("That's not a Pokémon!");
            if (this.document.type == 'pokemon') throw new Error("Pokemon can be added to a Trainer sheet!");
            let mons = this.document.system.pokemon;

            for (const p of mons) if (p.uuid == actor.uuid) throw new Error('Actor already owns this pokémon!')

            mons.push({
                uuid: actor.uuid,
                name: actor.name
            });

            await this.document.update({ system: { pokemon: mons } });
            if (actor.type == 'pokemon') await actor.update({ system: { trainer: this.document.uuid } });
            await this.render(false);
        } catch (err) {
            pta.utils.warn(err.message)
        }
    }

    //=======================================================================================
    // Sheet Actions
    //=======================================================================================

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
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

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onUnboxPokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset?.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        let c = 0;
        for (const pokemon of this.document.system.pokemon) if (pokemon.active) c += 1;
        let limit = game.settings.get(game.system.id, 'partyLimit');
        // sees if htis puts us over the party limit, a party limit of 0 or less
        if (c >= limit && limit > 0) return void pta.utils.warn('PTA.Warn.ExceedsPartyLimit');

        let list = [];
        for (const p of this.document.system.pokemon) {
            if (p.uuid == uuid) p.active = !p.active;
            list.push(p);
        }

        await this.document.update({ system: { pokemon: list } });
        await this.render(false);
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onBoxPokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');

        let list = [];
        for (const p of this.document.system.pokemon) {
            if (p.uuid == uuid) p.active = !p.active;
            list.push(p);
        }

        await this.document.update({ system: { pokemon: list } });
        await this.render(false);
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
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
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onLinkPokemon(event, target) {
        pta.utils.info('PTA.Info.LinkingPokemonTokens')
        for (const entry of this.document.system.pokemon) {
            let uuid = entry.uuid;
            let pokemon = await fromUuid(uuid);
            if (!pokemon.isOwner) {
                pta.utils.warn(pta.utils.localize('PTA.Warn.UnownedPokemon') + ' ' + pokemon.name);
                continue;
            }
            await pokemon.update({ prototypeToken: { actorLink: true } });
        }
        pta.utils.info('PTA.Info.Complete');
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onSelectElement(event, target) {
        target.classList.toggle('selected');
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onChangePcLayout(event, target) {
        let l = target.dataset.layout;
        let s = game.user.getFlag(game.system.id, 'settings');
        if (!s) s = { pcLayout: l }
        else s.pcLayout = l;
        await game.user.setFlag(game.system.id, 'settings', s);
        this.render(false);
    }
}