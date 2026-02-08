import TrainerData from "./trainer.mjs";
const { SchemaField, NumberField, BooleanField, StringField, ArrayField, DataField, ObjectField, HTMLField } = foundry.data.fields;

export default class NpcData extends TrainerData {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    // should this actors team use linked or unlinked references
    schema.linkedTeam = new BooleanField();

    // idk what else to put in here ngl, I guess these usually go???
    schema.cr = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    schema.xp = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

    return schema
  }

  prepareDerivedData() {

  }
}