import DataModel from "./abstract.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, HTMLField
} = foundry.data.fields;

export default class ItemData extends DataModel {

  static defineSchema() {
    const schema = super.defineSchema();
    const isRequired = { required: true, nullable: false };

    schema.description = new HTMLField({ required: true, blank: true });
    schema.quantity = new NumberField({ ...isRequired, min: 0, initial: 1 });
    schema.rarity = new NumberField({ ...isRequired, min: 1, initial: 1, max: 3 });
    schema.price = new NumberField({ ...isRequired, min: 1, initial: 1, max: 3 });

    return schema;
  }

}