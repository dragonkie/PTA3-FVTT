import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaActorSheet, { PtaTrainerMixin } from "../actor.mjs";

export default class PtaCharacterSheet extends PtaTrainerMixin(PtaActorSheet) {
    static DEFAULT_OPTIONS = {
        classes: ["character"],
        position: { width: 600 },
        window: {
            controls: [{
                icon: 'fas fa-link',
                label: '*Link Pokemon*',
                action: 'pokemonLink',
                ownership: 3
            }]
        },
        actions: {
            trainTalent: this._onTrainTalent,
            pokemonRemove: this._onRemovePokemon,
            pokemonBox: this._onBoxPokemon,
            pokemonLink: this._onLinkPokemon,
            selectElement: this._onSelectElement,
            pcLayout: this._onChangePcLayout,
        }
    }

    static PARTS = {
        body: { template: "systems/rpta3/templates/actor/character/body.hbs" },
        // Tab bodies
        features: { template: "systems/rpta3/templates/actor/character/features.hbs" },
        inventory: { template: "systems/rpta3/templates/actor/character/inventory.hbs" },
        pokebox: { template: "systems/rpta3/templates/actor/character/pokemon.hbs" },
        effects: { template: "systems/rpta3/templates/actor/parts/actor-effects.hbs" },
        details: { template: "systems/rpta3/templates/actor/character/details.hbs" },
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features", icon: "fa-user" },
        inventory: { id: "inventory", group: "primary", label: "PTA.Tab.Inventory", icon: "fa-backpack" },
        pokebox: { id: "pokebox", group: "primary", label: "PTA.Tab.Pokemon", icon: "fa-computer" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects", icon: "fa-sparkles" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details", icon: "fa-book" },
    }

    tabGroups = {
        primary: "features"
    }

    //=======================================================================================
    //> Rendering
    //=======================================================================================
    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        frame.appendChild(await this._renderBookmarks(options));

        // send back the final frame
        return frame;
    }

    //=======================================================================================
    //> Data preperation
    //=======================================================================================

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        context.pokemon = [];
        for (const pkmn of this.document.system.pokemon) {
            const poke = await fromUuid(pkmn.uuid);
            if (!poke) {
                context.pokemon.push({ ...pkmn, missing: true })
                continue;
            } else {
                context.pokemon.push({
                    ...pkmn,
                    uuid: poke.uuid,
                    name: poke.name,
                    img: poke.img,
                    data: poke.getRollData(),
                    missing: false,
                });
            }
        }

        return context;
    }

    //=======================================================================================
    //> Drag and Drop
    //=======================================================================================
    _setupDragAndDrop() {
        super._setupDragAndDrop();

        const dd = new foundry.applications.ux.DragDrop({
            dragSelector: "[data-pokemon-uuid]",
            dropSelector: "#fuck",
            permissions: {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this)
            },
            callbacks: {
                dragstart: this._onDragPokemon.bind(this),
                drop: this._onSummonPokemon.bind(this)
            }
        });
        dd.bind(this.element);
    }

    /**
     * @param {DragEvent} event 
     */
    async _onDragPokemon(event) {
        // Prepare pokemon data for transfer
        const uuid = event.target.closest('[data-pokemon-uuid]').dataset.pokemonUuid;
        const pokemon = await fromUuid(uuid);
        const data = pokemon.toDragData();
        event.dataTransfer.setData("text/plain", JSON.stringify(data));

        // Create snapshot image for drag and drop event
        const container = document.createElement('DIV');
        const s = 80
        container.style.minWidth = `${s}px`;
        container.style.minHeight = `${s}px`;
        container.style.left = '100%';
        container.style.position = 'fixed';
        const source = 'url(' + pokemon.img + ')';
        container.style.backgroundImage = source
        container.style.backgroundSize = `${s}px ${s}px`;

        await document.body.appendChild(container);
        await event.dataTransfer.setDragImage(container, s / 2, s / 2);
        setTimeout(() => { container.remove(); }, 10)
    }

    async _onSummonPokemon(event) {
        console.log('Dropping pokemon');
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    async _onDropActor(event, actor) {
        try {
            if (actor.type != 'pokemon' && !game.settings.get(game.system.id, 'palworld')) throw new Error("That's not a Pokémon!");
            if (this.document.type == 'pokemon') throw new Error("Pokemon can only be added to a Trainer sheet!");
            let mons = this.document.system.pokemon;

            for (const p of mons) if (p.uuid == actor.uuid) {
                let state = false;
                if (event.target.closest('.pta-pokebox') === null) state = true;

                if (p.active == state) {
                    // Sorting pokemon
                    const targetUuid = event.target.closest('[data-pokemon-uuid]').dataset.pokemonUuid;
                    if (targetUuid == p.uuid) return;

                    if (targetUuid) {
                        const list = utils.duplicate(this.document.system.pokemon);
                        const pClone = utils.duplicate(p);

                        // remove the initial target
                        for (let a = 0; a < list.length; a++) {
                            if (list[a].uuid == p.uuid) {
                                list.splice(a, 1);
                                break;
                            }
                        }

                        // add it back to the new lcoation
                        for (let a = 0; a < list.length; a++) {
                            if (list[a].uuid == targetUuid) {
                                list.splice(a, 0, pClone);
                                break;
                            }
                        }

                        await this.document.update({ system: { pokemon: list } });
                    }
                } else this._boxPokemon(actor.uuid, state); // box the pokemon
                return;
            }

            // Adding new pokemon
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
    //> Sheet Actions
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
        await this.render({force: false, parts: ['features']}); /**EDITING THIS RANDOM LINE HERE TO TRY AND OPTIMIZE THE LEVEL OF LAYERS BEING EDITED AND PREPARED TO MAKE THIGNS RENDER BETTER AND FASTER */
    }

    /**
     * 
     * @param {Event} event 
     * @param {Element} target 
     */
    static async _onBoxPokemon(event, target) {
        const uuid = target.closest('[data-pokemon-uuid]')?.dataset.pokemonUuid;
        if (!uuid) return void console.error('Couldnt find pokemon uuid');
        this._boxPokemon(uuid);
    }

    /**
     * 
     * @param {*} uuid 
     * @param {Boolean|Undefined} state - Force the pokemon to be in a specific state
     * @returns 
     */
    async _boxPokemon(uuid, state) {
        if (!uuid) throw new Error('No UUID to box');
        let list = [];

        // Find the target and toggle its state
        for (const p of utils.duplicate(this.document.system.pokemon)) {
            if (p.uuid == uuid) p.active = state === undefined ? !p.active : state;
            list.push(p);
        }

        // Validate that activating / deactivating them wont violate any rules
        let c = 0;
        for (const pokemon of list) if (pokemon.active) c += 1;
        let limit = game.settings.get(game.system.id, 'partyLimit');
        if (c > limit && limit > 0) return void pta.utils.warn('PTA.Warn.ExceedsPartyLimit');

        // Push the update
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