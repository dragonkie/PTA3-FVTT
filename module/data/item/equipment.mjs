import { PTA } from "../../helpers/config.mjs";
import ItemData from "../item.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, HTMLField
} = foundry.data.fields;


export default class EquipmentData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.equipped = new BooleanField({ initial: false, nullable: false, required: true });

        return schema;
    }

    getMenuActions() {
        const group = "equipment";
        return [
            ...super.getMenuActions(),
            {
                label: PTA.contextMenu.equip,
                visible: !this.equipped,
                group: group,
                icon: "",
                onClick: () => this.parent.update({ system: { equipped: true } })
            }, {
                label: PTA.contextMenu.unequip,
                visible: this.equipped,
                group: group,
                icon: "",
                onClick: () => this.parent.update({ system: { equipped: false } })
            }
        ];
    }
}