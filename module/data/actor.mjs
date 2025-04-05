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

    // Iterate over stats names and create a new SchemaField for each.
    schema.stats = new fields.SchemaField(Object.keys(CONFIG.PTA.stats).reduce((obj, stat) => {
      obj[stat] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 }),
      });
      return obj;
    }, {}));

    schema.biography = new fields.HTMLField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.stats) this.stats[key].total = this.stats[key].value;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const key in this.stats) this.stats[key].mod = Math.floor(this.stats[key].total / 2);
  }

  get isFainted() { return this.hp.value <= 0 };
  get fainted() { return this.isFainted };
  get isDead() { return this.isFainted };
  get isAlive() { return !this.isFainted };
}