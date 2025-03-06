import PtaItemSheet from "../item.mjs";

export default class PtaConsumableSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["consumable"],
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/pta3/templates/item/settings/consumable.hbs" };
        return p;
    }
}