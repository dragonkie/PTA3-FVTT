import ActorData from "../actor.mjs";

export default class CharacterData extends ActorData {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.honours = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

    // helper function for defining skills
    const _getSkillField = () => {
      let _field = {};
      // loop through list of skills
      for (const [skill, ability] of Object.entries(CONFIG.PTA.skillAbilities)) {
        // grab the ability that matches this skill
        for (const [key, value] of Object.entries(CONFIG.PTA.abilities)) {
          if (ability === value) _field[skill] = new fields.SchemaField({
            talent: new fields.NumberField({ ...requiredInteger, max: 2, min: 0, initial: 0 }),
            ability: new fields.StringField({ required: true, nullable: false, initial: key }),
            value: new fields.NumberField({ ...requiredInteger, initial: 0 })
          })
        }
      }
      return new fields.SchemaField(_field);
    }

    schema.skills = _getSkillField();
    schema.credits = new fields.NumberField({ ...requiredInteger, initial: 0 });

    schema.pokemon = new fields.SchemaField({

    })

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const key in this.skills) {
      let skill = this.skills[key]
      let ability = this.abilities[skill.ability];
      skill.total = skill.value + ability.mod + Math.floor(skill.talent * 2.5);
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

    return data
  }
}