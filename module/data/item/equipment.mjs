import ItemData from "../item.mjs";

export default class EquipmentData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.equipped = new this.fields.BooleanField({ initial: false, nullable: false, required: true });

        return schema;
    }
}