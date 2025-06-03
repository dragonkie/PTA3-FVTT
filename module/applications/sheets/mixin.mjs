import ServerBrowser from "../apps/server-browser.mjs";
import PtaDialog from "../dialog.mjs";

export default function PtaSheetMixin(Base) {
    const mixin = foundry.applications.api.HandlebarsApplicationMixin;
    return class PtaDocumentSheet extends mixin(Base) {

        static DEFAULT_OPTIONS = {
            classes: ['pta', 'sheet'],
            window: { resizable: true },
            form: {
                submitOnChange: true,
                submitOnClose: true,
                closeOnSubmit: false,
            },
            actions: {// Default actions must be static functions
                // generic controls
                delete: this._onDelete,
                edit: this._onEdit,
                toggle: this._onToggle,

                collapse: this._onCollapse,
                copyToClipboard: this._onCopyToClipboard,
                editImage: this._onEditImage,
                // effect controls
                effectCreate: this._onCreateEffect,
                effectToggle: this._onToggleEffect,

                toggleDescription: this._onToggleDescription,
                toggleEffect: this._onToggleEffect,
                toggleMode: this._onToggleMode,
                toggleOpacity: this._onToggleOpacity,
                toggleSheet: this._onToggleSheet,
            }
        };

        static get PARTS() {
            return {};
        }

        static SHEET_MODES = { PLAY: 1, EDIT: 2 };
        _sheetMode = this.constructor.SHEET_MODES.PLAY;
        get sheetMode() { return this._sheetMode; };
        get isPlayMode() { return this._sheetMode == this.constructor.SHEET_MODES.PLAY; };
        get isEditMode() { return this._sheetMode == this.constructor.SHEET_MODES.EDIT; };

        async _prepareContext() {
            const context = await super._prepareContext();

            context.document = this.document;
            context.actor = this.document.actor;
            context.config = pta.config;
            context.system = this.document.system;
            context.tabs = this._getTabs();
            context.schema = this.document.system.schema;
            context.isEditMode = this.isEditMode;
            context.isPlayMode = this.isPlayMode;
            context.isEditable = this.isEditable;

            context.flags = { ...this.document.flags, ...game.user.flags.pta3 }

            const enrichmentOptions = { rollData: context.rollData }
            context.gmNotes = {
                field: this.document.system.schema.getField('gmNotes'),
                value: this.document.system.gmNotes,
                enriched: await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.gmNotes, enrichmentOptions)
            }

            context.description = {
                field: this.document.system.schema.getField('description'),
                value: this.document.system.description,
                enriched: await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.description, enrichmentOptions)
            }

            return context;
        }

        tabGroups = {};

        static TABS = {};

        _getTabs() {
            return Object.values(this.constructor.TABS).reduce((acc, v) => {
                const isActive = this.tabGroups[v.group] === v.id;
                acc[v.id] = {
                    ...v,
                    active: isActive,
                    cssClass: isActive ? "item active" : "item",
                    tabCssClass: isActive ? "tab active" : "tab"
                };
                return acc;
            }, {});
        }

        getRollData() {
            return this.document.getRollData();
        }

        //============================================================================================
        // Sheet Actions
        //============================================================================================

        /**
         * Generic delete event, destroying the nearest prompting the deletion for the neareset valid UUID
         * @param {Event} event 
         * @param {HTMLElement} target 
         */
        static async _onDelete(event, target) {
            let uuid = target.closest('[data-uuid]')?.dataset.uuid;
            let doc = await fromUuid(uuid);
            if (!doc) return void console.error('Couldnt find UUID to delete from', uuid);

            let confirmed = true;
            if (!event.shiftKey) confirmed = await PtaDialog.confirm();
            if (!confirmed) return;
            else doc.delete();
        }

        /**
         * Generic delete event, destroying the nearest prompting the deletion for the neareset valid UUID
         * @param {Event} event 
         * @param {HTMLElement} target 
         */
        static async _onEdit(event, target) {
            let uuid = target.closest('[data-uuid]')?.dataset.uuid;
            let doc = await fromUuid(uuid);
            if (!doc) return void console.error('Couldnt find UUID to delete from', uuid);
            let sheet = doc.sheet;
            if (!sheet) return void console.error('Given uuid doesnt have a sheet');
            sheet.render(true);
        }

        static async _onEditImage(event, target) {
            if (!this.isEditable) return;

            const selection = await new Promise(async (resolve, reject) => {
                const app = await new PtaDialog({
                    window: { title: "PTA.Dialog.FileLocation" },
                    content: await renderTemplate('systems/pta3/templates/dialog/file-server-selector.hbs'),
                    buttons: [{
                        label: "Cancel",
                        action: "cancel",
                        callback: () => { reject('User cancel') }
                    }],
                    close: () => { },
                    actions: {
                        local: () => { resolve('local'); app.close() },
                        online: () => { resolve('online'); app.close() },
                    }
                }).render(true);
            })

            if (selection === 'local') {
                const current = this.document.img;
                const fp = new FilePicker({
                    type: "image",
                    current: current,
                    callback: path => this.document.update({ 'img': path }),
                    top: this.position.top + 40,
                    left: this.position.left + 10
                });
                fp.browse();
            } else if (selection === 'online') {
                const app = new ServerBrowser({ uuid: this.document.uuid, path: 'img' }).render(true);
            }
        }

        static _onCopyToClipboard(event, target) {
            const ele = target.closest('[data-copy]');

            if (!ele) return;
            if (ele.dataset.copy) navigator.clipboard.writeText(ele.dataset.copy);
            else if (ele.value) navigator.clipboard.writeText(ele.value);
        }

        static _onToggleMode() {
            if (this.isPlayMode) this._sheetMode = this.constructor.SHEET_MODES.EDIT;
            else this._sheetMode = this.constructor.SHEET_MODES.PLAY;
            const lock = this.window.header.querySelector('.fa-lock, .fa-lock-open');
            lock.classList.toggle('fa-lock');
            lock.classList.toggle('fa-lock-open');
            this.render(true);
        }

        static _onCollapse(event, target) {
            let ele = target.closest('.collapsible');
            ele.classList.toggle('collapsed')
        }

        static async _onCreateEffect(event, target) {
            let effect = await ActiveEffect.create({
                name: 'New Effect',
                type: 'base',
                img: 'icons/svg/aura.svg'
            }, { parent: this.document, renderSheet: true });
        }

        static async _onToggleEffect(event, target) {
            const uuid = target.closest('[data-uuid]').dataset.uuid;
            const doc = await fromUuid(uuid);
            await doc.update({ disabled: !doc.disabled });
            this.render(false);

        }

        //============================================================================================
        // Rendering
        //============================================================================================
        async render(options, _options) {
            return super.render(options, _options);
        }

        _onFirstRender(context, options) {
            let r = super._onFirstRender(context, options);
            this._setupContextMenu();
            return r;
        }

        _onRender(context, options) {
            let r = super._onRender(context, options);
            if (!this.isEditable) this.element.querySelectorAll("input, select, textarea, multi-select").forEach(n => { n.disabled = true; });
            this._setupDragAndDrop();
            return r;
        }

        async _renderFrame(options) {
            const frame = super._renderFrame(options);
            // Insert additional buttons into the window header
            // In this scenario we want to add a lock button
            if (this.isEditable && !this.document.getFlag("core", "sheetLock")) {
                const label = game.i18n.localize("PTA.Generic.LockToggle");
                const icon = this.isEditMode ? 'fa-lock-open' : 'fa-lock';
                const sheetConfig = `<button type="button" class="header-control fa-solid ${icon}" data-action="toggleMode" data-tooltip="${label}" aria-label="${label}"></button>`;
                this.window.close.insertAdjacentHTML("beforebegin", sheetConfig);
            }

            return frame;
        }

        //============================================================================================
        // Drag n Drop
        //============================================================================================
        _setupDragAndDrop() {
            const dd = new foundry.applications.ux.DragDrop({
                dragSelector: "[data-item-uuid]",
                dropSelector: ".application",
                permissions: {
                    dragstart: this._canDragStart.bind(this),
                    drop: this._canDragDrop.bind(this)
                },
                callbacks: {
                    dragstart: this._onDragStart.bind(this),
                    drop: this._onDrop.bind(this)
                }
            });
            dd.bind(this.element);
        }

        _canDragStart(selector) { return this.isEditable };

        _canDragDrop(selector) { return this.isEditable && this.document.isOwner };

        async _onDragStart(event) {
            const uuid = event.currentTarget.closest("[data-item-uuid]").dataset.itemUuid;
            const item = await fromUuid(uuid);
            const data = item.toDragData();
            event.dataTransfer.setData("text/plain", JSON.stringify(data));
        }

        // useful for things like highlighting when your on a drop target
        _onDragOver(event) {

        }

        async _onDrop(event) {
            event.preventDefault();
            const target = event.target;
            const { type, uuid } = foundry.applications.ux.TextEditor.getDragEventData(event);
            if (!this.isEditable) return;
            const item = await fromUuid(uuid);

            // If dropped onto self, perform sorting.
            if (item.parent === this.document) return this._onSortItem(item, target);

            switch (type) {
                case "ActiveEffect": return this._onDropActiveEffect(event, item);
                case "Item": return this._onDropItem(event, item);
                case "Actor": return this._onDropActor(event, item);
                default: return;
            }
        }

        // To be overriden by subclasses to handle specific drops
        async _onDropActiveEffect(event, effect) { }
        async _onDropActor(event, actor) { }
        async _onDropItem(event, item) { }
        async _onSortItem(item, target) { }

        //============================================================================================
        // Context Menu
        //============================================================================================

        _setupContextMenu() {

        }

        _preapreSubmitData(event, form, formData) {
            return super._preapreSubmitData(event, form, formData);
        }
    }
}