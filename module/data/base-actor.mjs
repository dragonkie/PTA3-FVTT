import PtaDataModel from "./base-model.mjs";

export default class ActorData extends PtaDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.hp = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      min: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 0 }),
    })
    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

}