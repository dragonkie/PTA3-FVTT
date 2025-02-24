import ptaActorBase from "../base-actor.mjs";

export default class ptaCharacter extends ptaActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 1 })
      }),
    });

    // Iterate over ability names and create a new SchemaField for each.
    schema.abilities = new fields.SchemaField(Object.keys(CONFIG.PTA.abilities).reduce((obj, ability) => {
      obj[ability] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 }),
      });
      return obj;
    }, {}));

    schema.honors = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.hp = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      min: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 0 }),
    })

    // helper function for defining skills
    const _getSkillField = () => {
      let _field = {};
      // loop through the different groups
      for (const [key, skills] of Object.entries(CONFIG.PTA.skillGroups)) {
        // assign the new fields to the skills group data
        Object.assign(_field,
          // loop through the keys available to create the entries
          Object.keys(skills).reduce((obj, skill) => {
            // add the new skill to the obj data to then assign
            obj[skill] = new fields.SchemaField({
              talent: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 2 }),
              ability: new fields.StringField({ required: true, initial: key, nullable: false })
            })
            return obj;
          }, {})// must supply empty object as starting value
        )
      }
      return _field;
    }

    schema.skills = new fields.SchemaField(_getSkillField());
    schema.credits = new fields.NumberField({ ...requiredInteger, initial: 0 })

    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const key in this.abilities) {
      // Calculate the modifier using d20 rules.
      this.abilities[key].mod = Math.floor(this.abilities[key].value / 2);
      // Handle ability label localization.
      this.abilities[key].label = game.i18n.localize(CONFIG.PTA.abilities[key]) ?? key;
    }
  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.lvl = this.attributes.level.value;

    return data
  }
}