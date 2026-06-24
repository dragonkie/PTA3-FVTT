import { PTA } from "../../helpers/config.mjs";
import PtaApplication from "../app.mjs";
import PtaItem from "../../documents/item.mjs";

export default class PtaFeatureEditor extends PtaApplication {
    static DEFAULT_OPTIONS = {
        position: {
            width: 500,
            height: 'auto'
        },
        window: {
            frame: true,
            title: "Feature Editor",
            icon: "fa-solid fa-note-sticky",
            minimizable: true,
            resizeable: true,
            positioned: true,
        },
        actions: {
            save: this._onSave
        },
    }

    static PARTS = {
        main: { template: PTA.templates.app.featureEditor }
    }

    // the career item this feature is associated with
    _item = undefined;
    _featureId = undefined;

    linkItem(item, index) {
        if (!item || !item instanceof PtaItem) return false;
        console.log('linking', { item, index })
        this._item = item;
        this._featureId = index;
        return true;
    }

    async render(item, index, options) {
        this.linkItem(item, index);
        return super.render(options);
    }

    _onRender(context, options) {

    }

    async _prepareContext() {
        const context = await super._prepareContext();
        console.log('preparing context', { doc: this._item, id: this._featureId });
        if (this._item != undefined) {
            console.log('set data')
            context.name = this._item.system.features[this._featureId].name;
            context.level = this._item.system.features[this._featureId].level;
            context.description = this._item.system.features[this._featureId].description;
            context.document = this._item;
        }
        else console.log('failed setting data')

        return context;
    }

    static async _onSave(event, target) {

    }
}