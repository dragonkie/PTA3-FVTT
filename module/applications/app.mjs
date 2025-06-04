let { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class PtaApplication extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: 'pta-app-{id}',
        tag: 'form',
        classes: ['pta'],
        window: {
            frame: true,
            title: "New Window",
            icon: "fa-solid fa-note-sticky",
            minimizable: true,
            resizeable: true,
            positioned: true,
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
        },
        actions: {
            copyToClipboard: this._onCopyToClipboard
        }
    }

    static get PARTS() {
        return {}
    };

    async _prepareContext(options) { return {} };
    //==========================================================================================
    //> Sheet actions
    //==========================================================================================
    async _onClickAction() {

    }

    static _onCopyToClipboard(event, target) {
        const ele = target.closest('[data-copy]');

        if (!ele) return;
        if (ele.dataset.copy) navigator.clipboard.writeText(ele.dataset.copy);
        else if (ele.value) navigator.clipboard.writeText(ele.value);
    }

    //==========================================================================================
    //> Rendering
    //==========================================================================================
    async _preRender(context, options) {
        return super._preRender(context, options);
    }

    /** @inheritdoc */
    _onFirstRender(context, options) {
        let r = super._onFirstRender(context, options);
        return r;
    }

    /** @inheritdoc */
    _onRender(context, options) {
        super._onRender(context, options);
        this._setupDragAndDrop();
    }


    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
    }

    async _renderHTML(context, options) {
        return super._renderHTML(context, options);
    }

    async _renderFrame(options) {
        const frame = super._renderFrame(options);
        return frame;
    }
    //==========================================================================================
    //> Closing application
    //==========================================================================================
    async _preClose(options) {
        return super._preClose(options);
    }

    /** @inheritdoc */
    _onClose(options) {
        super._onClose(options);
    }
    //==========================================================================================
    //> Drag & Drop
    //==========================================================================================
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
        const EventData = foundry.applications.ux.TextEditor.getDragEventData(event);
        const { type, uuid } = EventData
        console.log(EventData);
        if (!this.isEditable) return;
        const item = await fromUuid(uuid);

        // Removes these values from the data, preppoing the drop to be added to the reciever
        const modification = {
            "-=_id": null,
            "-=ownership": null,
            "-=folder": null,
            "-=sort": null
        };

        switch (type) {
            case "ActiveEffect":
                return this._onDropActiveEffect(event, item);
            case "Item":
                return this._onDropItem(event, item);
            case "Actor":
                return this._onDropActor(event, item);
        }
    }

    async _onDropActiveEffect(event, effect) {

    }

    async _onDropItem(event, item) {

    }

    async _onDropActor(event, actor) {

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

        let updates = SortingHelpers.performIntegerSort(item, { target: sibling, siblings: siblings, sortKey: "sort" });
        updates = updates.map(({ target, update }) => ({ _id: target.id, sort: update.sort }));
        this.document.updateEmbeddedDocuments("Item", updates);
    }

}