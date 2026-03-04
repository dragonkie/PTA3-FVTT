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
}