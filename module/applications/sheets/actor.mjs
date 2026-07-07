import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
import MoveImporter from "../apps/move-importer.mjs";
import PtaDialog from "../dialog.mjs";
import PtaSheetMixin from "./mixin.mjs";

export default class PtaActorSheet extends PtaSheetMixin(foundry.applications.sheets.ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["actor"],
        position: { height: 'auto', width: 700, left: 120, top: 60 },
        actions: {
            use: this._onUseItem,
            itemQuantity: this._onChangeItemQuantity,
            itemSort: this._onSortItemMethod,
            trainTalent: this._onTrainTalent,
            editResistance: this._onEditResistance,
            importMoves: this._onImportMoves,
        }
    }

    static PARTS = {

    };

    static TABS = {

    };

    tabGroups = {

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

        context.stats = {};
        for (const [key, value] of Object.entries(this.document.system.stats)) {
            context.stats[key] = { ...value };
            context.stats[key].label = {
                long: utils.localize(CONFIG.PTA.stats[key]),
                abbr: utils.localize(CONFIG.PTA.statsAbbr[key])
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
                long: utils.localize(CONFIG.PTA.skills[key]),
                abbr: utils.localize(CONFIG.PTA.skillsAbbr[key])
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
            },
            expired: {
                label: "PTA.Effect.Expired",
                effects: [],
            }
        }

        for (const effect of this.document.effects.contents) {
            if (effect.disabled) context.effects.disabled.effects.push(effect);
            else if (effect.duration.expired) context.effects.expired.effects.push(effect);
            else if (!effect.isTemporary) context.effects.passive.effects.push(effect);
            else if (effect.isTemporary) context.effects.temporary.effects.push(effect);
        }

        return context;
    }

    //====================================================================================================
    //> Actions
    //====================================================================================================
    static async _onUseItem(event, target) {
        // Get the item were actually targeting
        const uuid = target.closest("[data-uuid]").dataset.uuid;
        const item = await fromUuid(uuid);
        const action = target.closest("[data-use]")?.dataset.use;

        return item.use(event, target, action);
    };

    /**
     * Allows an actor to rest, clearing status effects and fully healing hp
     * @param {Event} event - Triggering event
     * @param {HTMLElement} target - the element that the action originates from
     */
    static async _onRest(event, target) {

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
        const item = await fromUuid(target.closest('[data-uuid]').dataset.uuid);
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

        await this.document.update({ [`system.skills.${key}.talent`]: skill.talent });
        await this.render({ force: false, parts: ['features'] }); /**EDITING THIS RANDOM LINE HERE TO TRY AND OPTIMIZE THE LEVEL OF LAYERS BEING EDITED AND PREPARED TO MAKE THIGNS RENDER BETTER AND FASTER */
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
            window: { title: PTA.windowTitle.configResist },
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
            _id: _del,
            ownership: _del,
            folder: _del,
            sort: _del,
            duration: {
                combat: _del,
                startRound: _del,
                startTime: _del,
                startTurn: _del,
            },
            system: { source: _del }
        };

        foundry.utils.applyDataOperators(effectData, modification, { performDeletions: true });
        getDocumentClass(type).create(itemData, { parent: this.document });
    }

    async _onDropItem(event, item) {
        const { type, uuid } = foundry.applications.ux.TextEditor.getDragEventData(event);
        if (!Object.keys(this.document.constructor.metadata.embedded).includes(type)) return;
        const itemData = item.toObject();
        const modification = {
            _id: _del,
            ownership: _del,
            folder: _del,
            sort: _del
        };
        foundry.utils.applyDataOperators(itemData, modification, { performDeletions: true });
        getDocumentClass(type).create(itemData, { parent: this.document });
    }

    async _onSortItem(item, target) {
        if (item.documentName !== "Item") return;

        const self = target.closest("[data-tab]")?.querySelector(`[data-uuid="${item.uuid}"]`);
        if (!self || !target.closest("[data-uuid]")) return;

        let sibling = target.closest("[data-uuid]") ?? null;
        if (sibling?.dataset.uuid === item.uuid) return;
        if (sibling) sibling = await fromUuid(sibling.dataset.uuid);

        let siblings = target.closest("[data-tab]").querySelectorAll("[data-uuid]");
        siblings = await Promise.all(Array.from(siblings).map(s => fromUuid(s.dataset.uuid)));
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
        _pcSearchQuery = {}
        _itemSearchQuery = "";

        /**
         * Each search is wrapped in an elemented with a [data-search] attribute specifying what search type it is
         * ex. data-search="items" is used to filter items
         * 
         * All inputs inside the search wrapper are applied to elements matching the search tag
         * A search container can have many different contexts or filters to search throguh
         * in this system that usually includes a name, type, gender, etc.
         * 
         * Searchable elements are indicated with the class [data-searchable] attribute to select which group reveals or hides them
         * an item entry with data-searchable="item" will be filtered to match those standards
         * 
         * All searchable elements need to have, or be contained by am element with, a [data-uuid] attribute
         * The uuid search allows us to pull up which item is which and access item or creature data
         * with creature data available the [data-search] group and [data-query] value checks can run
         * against the internal data model for that document
         * 
         * Search data is compared against DOCUMENT data, not the system data model
         * Adding a search query for system data values means including system in the query,
         * search inputs without a specified [data-path] compare against document name by default
         * eg. [data-query="system.hp.value"], [data-query="name"], [data-query="system.type.primary"]
         * 
         * ----SEARCHABLE GROUPS----
         * companion
         * item
         * move
         * feature
         * 
         * -------SEARCH TAGS-------
         * all elemental types
         * all item document types
         * item
         * creature
         * male
         * female
         * shiny
         */
        _setupSearchQuery() {
            // get a list of input elements
            const containers = this.element.querySelectorAll('[data-search]');

            // convert the elements to actual search queries
            for (const container of containers) {
                const inputs = container.querySelectorAll(".pta-search-input");
                for (const input of inputs) input.addEventListener('input', this._performSearch.bind(this));
            }
        }

        /**
         * Take given search queries and filter searchable items from the sheet
         * @param {Event} event 
         */
        async _performSearch(event) {
            // Gather filter details and list of targets to search through
            const target = event.target;
            const container = event.target.closest('[data-search]');
            const group = container.dataset.search;
            const elements = this.element.querySelectorAll(`[data-searchable=${group}]`);
            const search = utils.sluggify(target.value);

            // remove the obliterate class from all of them
            for (const e of elements) e.classList.remove("obliterated");

            // check through list against items to hide them
            for (const ele of elements) {

                // get the item to filter agaisnt
                const uuid = ele.closest('[data-uuid]').dataset.uuid;
                const item = await fromUuid(uuid);

                if (!utils.sluggify(item.name).includes(search)) ele.classList.add("obliterated");
            }
        }



        _saveSearchQuery() {
            /*
            if (!this.rendered) return;
            const search = this.element.querySelector('.pta-trainer-pc-search');
            if (!search) return false;

            for (const ele of search.querySelectorAll('[data-query]')) {
                if (ele.type == 'checkbox') this._pcSearchQuery[ele.dataset.query] = ele.checked;
                else this._pcSearchQuery[ele.dataset.query] = ele.value;
            }

            // save inventory search query
            this._itemSearchQuery = this.element.querySelector('input.pta-inventory-search').value;
            */
        }

        _loadSearchQuery() {
            /*
            const search = this.element.querySelector('.pta-trainer-pc-search');
            if (!search) return false;

            for (const ele of search.querySelectorAll('[data-query]')) {
                for (const [key, value] of Object.entries(this._pcSearchQuery)) {
                    if (ele.dataset.query == key) {
                        if (ele.type == 'checkbox') ele.checked = value;
                        else ele.value = value;
                    }
                }
            }

            this.element.querySelector('input.pta-inventory-search').value = this._itemSearchQuery;
            */
        }

        //=========================================================================================
        //>- Render function overrides
        //=========================================================================================
        _onRender(context, options) {
            let r = super._onRender(context, options);
            this._setupSearchQuery();
            this._loadSearchQuery();
            return r;
        }

        async _preRender(context, options) {
            this._saveSearchQuery();
            return super._preRender(context, options);
        }

        async _preClose(options) {
            this._saveSearchQuery();
        }
    }
}