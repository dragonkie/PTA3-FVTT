import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaItemSheet from "../item.mjs";
import { PTA } from "../../../helpers/config.mjs";

export default class PtaEquipmentSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["equipment"],
        actions: {
            createModifier: this._onCreateRule,
            remove: this._onRemoveRule
        }
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: `${this.TEMPLATE_PATH}/item/settings/equipment.hbs` };
        return p;
    }

    static async _onCreateRule() {
        const id = foundry.utils.randomID();
        const init = this.document.system.schema.fields.rules.element.getInitialValue();

        this.document.update({
            system: {
                rules: { [id]: init }
            }
        }, { recursive: true })
    }

    static async _onRemoveRule(event, target) {
        const index = target.closest('[data-rule-index').dataset?.ruleIndex;

        if (!index) throw new Error("Failed to find rule to delete");

        const copy = this.document.system.toObject().rules;
        const modification = {
            [index]: new foundry.data.operators.ForcedDeletion()
        }
        const merge = foundry.utils.mergeObject(copy, modification, { applyOperators: true });

        this.document.update({
            system: {
                rules: merge
            }
        }, { recursive: false })
    }
}