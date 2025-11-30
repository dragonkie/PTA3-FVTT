import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
import MoveImporter from "../apps/move-importer.mjs";
import PtaDialog from "../dialog.mjs";
import PtaSheetMixin from "./mixin.mjs";

export default class PtaActorSheet extends PtaSheetMixin(foundry.applications.sheets.ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["actor"],
        position: { height: 'auto', width: 600, left: 120, top: 60 },
        actions: {
            itemDelete: this._onDeleteItem,
            itemEdit: this._onEditItem,
            itemQuantity: this._onChangeItemQuantity,
            itemUse: this._onUseItem,
            itemSort: this._onSortItemMethod,
            trainTalent: this._onTrainTalent,
            use: this._onUseItem,
            editResistance: this._onEditResistance,
            roll: this._onRoll,
            importMoves: this._onImportMoves,
        }
    }

    static PARTS = {

    };

    static TABS = {

    };

    tabGroups = {
        primary: "traits"
    };

    //====================================================================================================
    //> Data prep
    //====================================================================================================

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        // Add the actor's data to cfontext.data for easier access, as well as flags.
        context.items = this.document.items.contents.sort((a, b) => {
            return a.sort - b.sort;
        });
        context.itemTypes = this.document.itemTypes;
        context.editable = this.isEditable && (this._mode === this.constructor.SHEET_MODES.EDIT);
        context.userSettings = game.user.getFlag(game.system.id, 'settings');

        context.stats = {};
        for (const [key, value] of Object.entries(this.document.system.stats)) {
            context.stats[key] = { ...value };
            context.stats[key].label = {
                long: pta.utils.localize(CONFIG.PTA.stats[key]),
                abbr: pta.utils.localize(CONFIG.PTA.statsAbbr[key])
            }
            context.stats[key].field_path = `system.stats.${key}`;
            context.stats[key].field = this.document.system.schema.getField(`stats.${key}`);
        }

        context.skills = {};
        for (const [key, value] of Object.entries(this.document.system.skills).sort((a, b) => {
            let val = a[1].stat.localeCompare(b[1].stat);
            return val;
        })) {
            context.skills[key] = value;
            context.skills[key].label = {
                long: pta.utils.localize(CONFIG.PTA.skills[key]),
                abbr: pta.utils.localize(CONFIG.PTA.skillsAbbr[key])
            }
        }

        context.effects = {
            passive: {
                label: "PTA.Effect.Passive",
                effects: []
            },
            temporary: {
                label: "PTA.Effect.Temporary",
                effects: []
            },
            disabled: {
                label: "PTA.Effect.Disabled",
                effects: []
            }
        }

        for (const effect of this.document.effects.contents) {
            if (effect.disabled) context.effects.disabled.effects.push(effect);
            else if (effect.duration.type == 'none') context.effects.passive.effects.push(effect);
            else context.effects.temporary.effects.push(effect);
        }

        return context;
    }

    //====================================================================================================
    //> Actions
    //====================================================================================================
    static async _onEditItem(event, target) {
        const uuid = target.closest(".item[data-item-uuid]").dataset.itemUuid;
        const item = await fromUuid(uuid);
        if (!item.sheet.rendered) item.sheet.render(true);
        else item.sheet.bringToFront();
    };

    static async _onUseItem(event, target) {
        // Get the item were actually targeting
        const uuid = target.closest(".item[data-item-uuid]").dataset.itemUuid;
        const item = await fromUuid(uuid);
        const action = target.closest("[data-use]")?.dataset.use;

        return item.use(event, target, action);
    };

    static async _onDeleteItem(event, target) {
        const uuid = target.closest(".item[data-item-uuid]")?.dataset.itemUuid;
        if (!uuid) return;
        const item = await fromUuid(uuid);
        const confirm = await foundry.applications.api.DialogV2.confirm({
            content: `${pta.utils.localize('PTA.confirm.deleteItem')}: ${item.name}`,
            rejectClose: false,
            modal: true
        });
        if (confirm) return item.delete();
    }

    static SORTING_METHODS = {
        NAME: 1,
        TYPE: 2,
    }

    static async _onSortItemMethod(event, target) {
        var method = this.document.getFlag("world", "item-sorting");
        if (method != 1) method = 1;
        else method = 2;

        var updates = [];

        if (method == this.constructor.SORTING_METHODS.NAME) {
            var sorted = this.document.items.contents.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            var c = 100;
            sorted.forEach(item => {
                updates.push({ _id: item.id, sort: c });
                c += 100;
            });

        } else if (method == this.constructor.SORTING_METHODS.TYPE) {
            var sorted = this.document.items.contents.sort((a, b) => {
                return a.type.localeCompare(b.type);
            });

            var c = 100;
            sorted.forEach(item => {
                updates.push({ _id: item.id, sort: c });
                c += 100;
            });
        }

        this.document.setFlag("world", "item-sorting", method);
        this.document.updateEmbeddedDocuments("Item", updates);
    }

    static async _onChangeItemQuantity(event, target) {
        const item = await fromUuid(target.closest('[data-item-uuid]').dataset.itemUuid);
        if (!item) return void console.error('Couldnt find item to update');

        let value = Number(target.dataset.value);
        if (event.shiftKey) value = value * 5;
        value += item.system.quantity;

        item.update({ system: { quantity: value } });
    }

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
        await this.render({ force: false, parts: ['features'] }); /**EDITING THIS RANDOM LINE HERE TO TRY AND OPTIMIZE THE LEVEL OF LAYERS BEING EDITED AND PREPARED TO MAKE THIGNS RENDER BETTER AND FASTER */
    }

    /**
     * Generic roll event, prompts user to spend legend and confirm the roll formula
     * @param {Event} event 
     * @param {HTMLElement} target 
     */
    static async _onRoll(event, target) {
        let formula = target.closest('[data-roll')?.dataset.roll;
        let msg_content = target.closest('[data-roll-msg]')?.dataset.rollMsg;
        if (!formula) return void console.error('Couldnt find roll formula');


        let rolldata = this.getRollData();

        let roll = new Roll(formula, rolldata);
        await roll.evaluate();

        let msg_data = {
            flavor: msg_content,
            speaker: ChatMessage.getSpeaker({ actor: this.document })
        }
        let msg = await roll.toMessage(msg_data);
    }

    static async _onEditResistance(event, target) {
        let content = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">`;
        let resists = this.document.system.resistance_override;

        for (const type of Object.keys(PTA.pokemonTypes)) {
            let label = utils.localize(PTA.pokemonTypes[type]);
            let value = 'none';
            for (const resist of resists) if (resist.type == type) value = resist.value;

            let ele = new foundry.data.fields.StringField({
                name: type,
                label: label,
                initial: value,
                required: true,
                blank: false,
                choices: () => {
                    let options = { none: PTA.generic.none, ...PTA.typeEffectivenessLabels };
                    for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
                    return options;
                }
            }).toFormGroup();

            ele.setAttribute('data-type', type);

            content += ele.outerHTML;
        }
        content += '</div>';

        let app = await new PtaDialog({
            window: { title: 'PTA.Title.ConfigResist' },
            id: `Actor.${this.document.id}.resist-config`,
            content: content,
            classes: ['pta'],
            buttons: [{
                action: 'cancel',
                label: 'Cancel'
            }, {
                action: 'confirm',
                label: 'Confirm'
            }],
            submit: result => {
                if (result != 'confirm') return;
                const list = [];
                let inputs = app.element.querySelectorAll('[data-type]');

                for (const input of inputs) {
                    let t = input.dataset.type;
                    let v = input.querySelector('select').value;
                    if (v == 'none') continue;
                    list.push({ type: t, value: v });
                }

                this.document.update({ system: { resistance_override: list } });
            }
        }).render(true);
    }

    /**@type {MoveImporter|null} */
    move_importer = null;
    static async _onImportMoves(event, target) {
        if (!this.move_importer) this.move_importer = new MoveImporter();
        await this.move_importer.linkActor(this.document);
        await this.move_importer.render(true);
    }

    //====================================================================================================
    //> Drag & Drop
    //====================================================================================================

    async _onDropActiveEffect(event, effect) {
        const { type, uuid } = foundry.applications.ux.TextEditor.getDragEventData(event);
        if (!Object.keys(this.document.constructor.metadata.embedded).includes(type)) return;

        const effectData = effect.toObject();
        const modification = {
            "-=_id": null,
            "-=ownership": null,
            "-=folder": null,
            "-=sort": null,
            "duration.-=combat": null,
            "duration.-=startRound": null,
            "duration.-=startTime": null,
            "duration.-=startTurn": null,
            "system.source": null
        };

        foundry.utils.mergeObject(effectData, modification, { performDeletions: true });
        getDocumentClass(type).create(itemData, { parent: this.document });
    }

    async _onDropItem(event, item) {
        const { type, uuid } = foundry.applications.ux.TextEditor.getDragEventData(event);
        if (!Object.keys(this.document.constructor.metadata.embedded).includes(type)) return;
        const itemData = item.toObject();
        const modification = {
            "-=_id": null,
            "-=ownership": null,
            "-=folder": null,
            "-=sort": null
        };
        foundry.utils.mergeObject(itemData, modification, { performDeletions: true });
        getDocumentClass(type).create(itemData, { parent: this.document });
    }

    async _onSortItem(item, target) {
        if (item.documentName !== "Item") return;

        const self = target.closest("[data-tab]")?.querySelector(`[data-item-uuid="${item.uuid}"]`);
        if (!self || !target.closest("[data-item-uuid]")) return;

        let sibling = target.closest("[data-item-uuid]") ?? null;
        if (sibling?.dataset.itemUuid === item.uuid) return;
        if (sibling) sibling = await fromUuid(sibling.dataset.itemUuid);

        let siblings = target.closest("[data-tab]").querySelectorAll("[data-item-uuid]");
        siblings = await Promise.all(Array.from(siblings).map(s => fromUuid(s.dataset.itemUuid)));
        siblings.findSplice(i => i === item);

        let updates = foundry.utils.performIntegerSort(item, { target: sibling, siblings: siblings, sortKey: "sort" });
        updates = updates.map(({ target, update }) => ({ _id: target.id, sort: update.sort }));
        this.document.updateEmbeddedDocuments("Item", updates);
    }
}

//===================================================================================================
//> Trainer mixin
//===================================================================================================
export function PtaTrainerMixin(BaseApplication) {
    return class TrainerSheet extends BaseApplication {
        _onRender(context, options) {
            let r = super._onRender(context, options);
            if (!this.isEditable) return;

            // Set up pokebox search bar functionality
            const pokebox = this.element.querySelector('.pta-pokebox-entries');
            const searchElement = this.element.querySelector('.pta-trainer-pc-search');
            const inputs = this.element.querySelectorAll('[data-query]');

            const cb = async () => {
                for (const ele of pokebox.querySelectorAll('[data-pokemon-uuid]')) {
                    ele.classList.remove('obliterated');
                    const pokemon = await fromUuid(ele.dataset.pokemonUuid);

                    for (const input of inputs) {
                        if (input.dataset.query == 'name') {
                            let query = input.value.toLowerCase();
                            if (query == "") continue;
                            if (!pokemon.name.toLowerCase().startsWith(query) && !pokemon.system.species.toLowerCase().startsWith(query)) ele.classList.add('obliterated');
                        }

                        if (input.dataset.query == 'female' && input.checked && pokemon.system.gender.toLowerCase() != "female") ele.classList.add('obliterated');
                        if (input.dataset.query == 'male' && input.checked && pokemon.system.gender.toLowerCase() != "male") ele.classList.add('obliterated');
                        if (input.dataset.query == 'shiny' && !pokemon.system.shiny == input.checked) ele.classList.add('obliterated');
                    }
                }
            }

            for (const input of inputs) input.addEventListener('input', cb);
            return r;
        }
    }
}