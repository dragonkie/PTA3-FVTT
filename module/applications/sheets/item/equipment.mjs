import PtaItemSheet from "../item.mjs";

export default class PtaEquipmentSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["equipment"],
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: `${this.TEMPLATE_PATH}/item/settings/equipment.hbs` };
        return p;
    }
}