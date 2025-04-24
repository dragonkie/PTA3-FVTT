import PtaSheetMixin from "./mixin.mjs";

export default class PtaActorSheet extends PtaSheetMixin(foundry.applications.sheets.ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["actor"],
        position: { height: 800, width: 700 },
        actions: {
            itemUse: this._onUseItem,
            itemEdit: this._onEditItem,
            itemDelete: this._onDeleteItem,
            itemQuantity: this._onChangeItemQuantity,
            roll: this._onRoll,
            createEffect: this._onCreateEffect,
            disableEffect: this._onDisableEffect
        }
    }

    static PARTS = {

    };

    static TABS = {

    };

    tabGroups = {
        primary: "traits"
    };

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   DATA PREPERATION                                     */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        // Add the actor's data to cfontext.data for easier access, as well as flags.
        context.items = this.document.items.contents.sort((a, b) => {
            return a.sort - b.sort;
        });
        context.itemTypes = this.document.itemTypes;
        context.editable = this.isEditable && (this._mode === this.constructor.SHEET_MODES.EDIT);
        context.userSettings = game.user.getFlag('pta3', 'userSettings');

        context.stats = {};
        for (const [key, value] of Object.entries(this.document.system.stats)) {
            context.stats[key] = value;
            context.stats[key].label = {
                long: pta.utils.localize(CONFIG.PTA.stats[key]),
                abbr: pta.utils.localize(CONFIG.PTA.statsAbbr[key])
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

        return context;
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   SHEET ACTIONS                                        */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */
    static async _onEditItem(event, target) {
        const uuid = target.closest(".item[data-item-uuid]").dataset.itemUuid;
        const item = await fromUuid(uuid);
        console.log('opening sheet')
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
        if (!uuid) return console.log('couldnt find item id');
        const item = await fromUuid(uuid);
        const confirm = await foundry.applications.api.DialogV2.confirm({
            content: `${pta.utils.localize('PTA.confirm.deleteItem')}: ${item.name}`,
            rejectClose: false,
            modal: true
        });
        if (confirm) return item.delete();
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

    static async _onCreateEffect(event, target) {
        let effect = await ActiveEffect.create({
            name: 'New Effect',
            type: 'base'
        }, { parent: this.document });

        effect.sheet.render(true);
    }

    static async _onDisableEffect(event, target) {
        const _id = target.closest('.item[data-item-uuid]').dataset.itemUuid;
        const item = await fromUuid(_id);
        item.update({ disabled: !item.disabled });
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   DRAG N DROP                                          */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */

    async _onDropActiveEffect(event, effect) {
        const { type, uuid } = TextEditor.getDragEventData(event);
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
        const { type, uuid } = TextEditor.getDragEventData(event);
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
        if (item.documentName !== "Item") return void console.log('isnt an item');

        const self = target.closest("[data-tab]")?.querySelector(`[data-item-uuid="${item.uuid}"]`);
        if (!self || !target.closest("[data-item-uuid]")) return void console.log('Didnt find myself');

        let sibling = target.closest("[data-item-uuid]") ?? null;
        if (sibling?.dataset.itemUuid === item.uuid) return void console.log('Didnt find sibling');
        if (sibling) sibling = await fromUuid(sibling.dataset.itemUuid);

        let siblings = target.closest("[data-tab]").querySelectorAll("[data-item-uuid]");
        siblings = await Promise.all(Array.from(siblings).map(s => fromUuid(s.dataset.itemUuid)));
        siblings.findSplice(i => i === item);

        let updates = SortingHelpers.performIntegerSort(item, { target: sibling, siblings: siblings, sortKey: "sort" });
        updates = updates.map(({ target, update }) => ({ _id: target.id, sort: update.sort }));
        this.document.updateEmbeddedDocuments("Item", updates);
        console.log('item sorted', updates, siblings)
    }
}


// Special mixin for making pokemon trainer options available, rather than declaring and extending a whole new seperate class
export function PtaTrainerMixin(BaseApplication) {
    return class TrainerSheet extends BaseApplication {

    }
}