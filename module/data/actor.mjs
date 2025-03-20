import DataModel from "./abstract.mjs";

export default class ActorData extends DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hp = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      min: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 0 }),
    })

    // Iterate over ability names and create a new SchemaField for each.
    schema.abilities = new fields.SchemaField(Object.keys(CONFIG.PTA.abilities).reduce((obj, ability) => {
      obj[ability] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 }),
      });
      return obj;
    }, {}));

    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.abilities) this.abilities[key].total = this.abilities[key].value;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const key in this.abilities) this.abilities[key].mod = Math.floor(this.abilities[key].total / 2);
  }

  get isDead() { return this.hp <= 0 };
  get isAlive() { return this.hp > 0 };
  get isFainted() {
    return this.hp.value <= 0;
  }
}