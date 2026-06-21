import utils from "../helpers/utils.mjs";
import DataModel from "./abstract.mjs";
import { PTA } from "../helpers/config.mjs";

const { SchemaField, NumberField, BooleanField, StringField, ArrayField, DataField, ObjectField, HTMLField } = foundry.data.fields;

export default class ActorData extends DataModel {

  static defineSchema() {

    const requiredInteger = { required: true, nullable: false, integer: true };
    const isRequired = { required: true, nullable: false };
    const schema = super.defineSchema();

    schema.hp = new SchemaField({
      value: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      base: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      min: new NumberField({ ...requiredInteger, initial: 0, min: 0, max: 0 }),
    })

    // Iterate over stats names and create a new SchemaField for each.
    schema.stats = new SchemaField(Object.keys(CONFIG.PTA.stats).reduce((obj, stat) => {
      obj[stat] = new SchemaField({
        value: new NumberField({ ...requiredInteger, initial: 3, min: 0 }),
        bonus: new NumberField({ ...requiredInteger, initial: 0 }),
        boost: new NumberField({ ...requiredInteger, initial: 0 }),
      });
      return obj;
    }, {}));

    //================================================================================================================
    //> Actors typing, even trainers require a typing of normal for abilities to work right
    //================================================================================================================
    const TypeChoices = {};
    for (const a in PTA.pokemonTypes) TypeChoices[a] = utils.localize(PTA.pokemonTypes[a]);

    schema.types = new SchemaField({
      primary: new StringField({ ...isRequired, initial: 'normal', label: PTA.generic.primary, choices: { ...TypeChoices } }),
      secondary: new StringField({ ...isRequired, initial: 'none', label: PTA.generic.secondary, choices: { ...TypeChoices, none: utils.localize(PTA.generic.none) } }),
    }, { label: PTA.generic.types })

    // manually set a characters resistance to a certain element
    schema.resistance_override = new ArrayField(
      new SchemaField({
        value: new StringField({
          initial: 'none', blank: false, required: true, nullable: false, choices: () => {
            let options = { none: PTA.generic.none, ...PTA.typeEffectivenessValues };
            for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
            return options;
          }
        }),
        type: new StringField({
          initial: 'normal', blank: false, required: true, nullable: false, choices: () => {
            let options = { ...PTA.pokemonTypes };
            for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
            return options;
          }
        }),
      }),
      { initial: [], nullable: false }
    );

    //====================================================================================
    //> Skill fields
    //====================================================================================
    const _getSkillFields = () => {
      let _field = {};
      // loop through list of skills
      for (const [skill, stat] of Object.entries(PTA.skillAbilities)) {
        // grab the stats that matches this skill
        for (const [key, value] of Object.entries(PTA.stats)) {
          if (stat === value) _field[skill] = new SchemaField({
            talent: new NumberField({ ...requiredInteger, max: 2, min: 0, initial: 0 }),
            stat: new StringField({ required: true, nullable: false, initial: key }),
            value: new NumberField({ ...requiredInteger, initial: 0 }),
            bonus: new NumberField({ ...requiredInteger, initial: 0 })
          })
        }
      }
      return new SchemaField(_field);
    }

    schema.skills = _getSkillFields();

    //====================================================================================
    //> Bonus fields
    //====================================================================================
    schema.bonuses = new SchemaField({
      attack: new NumberField({ initial: 0, required: true, nullable: false }),
      hpMax: new NumberField({ initial: 0, ...requiredInteger })
    })

    schema.money = new NumberField({ initial: 0, label: "Money" });
    return schema;
  }

  static migrateData(source, options) {
    //migrates previous max hp value to the new base value so that the max one can be used 
    //to show total hp on resource bars with tokens
    if (source?.hp?.max) {
      source.hp.base = source.hp.max;
      delete source.hp.max;
    }

    return super.migrateData(source, options);
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.stats) this.stats[key].total = this.stats[key].value;
    for (const key in this.skills) this.skills[key].total = this.skills[key].value + this.skills[key].bonus + Math.floor(this.skills[key].talent * 2.5);

    this.hp.max = this.hp.base;
    this.moveSpeed = 0;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    //====================================================================================
    //> Prepare derived values from item based modifiers
    //====================================================================================

    // sort items by their priority, then their importance
    const itemsList = this.parent.items.contents.sort((a, b) => {
      const _prioA = a.system.priority;
      const _prioB = b.system.priority;
      // if item isnt assigned a priority, it needs to be pushed to the end
      if (_prioA == undefined || _prioB == undefined) {
        if (_prioA != undefined && _prioB == undefined) return -1;
        if (_prioB != undefined && _prioA == undefined) return 1;
        return 0;
      }

      // if both items have the same priority derived a level of importance from its factors
      if (_prioA == _prioB) {
        const powerA = a.system.importance;
        const powerB = b.system.importance;

        return powerB - powerA;
      }

      // if they both have a priority, the higher number should go further ahead
      return b.system.priority - a.system.priority;
    });

    for (const item of itemsList) item.prepareActorData(this);

    // calculate max hp
    this.hp.max += this.bonuses.hpMax;

    // after status modifiers are applied, we can total up the final value of the stats
    for (const key in this.stats) {
      this.stats[key].total += (this.stats[key].bonus) * utils.AbilityStage(this.stats[key].boost);
      this.stats[key].mod = Math.floor(this.stats[key].total / 2);
    }

    // calculate skill totals
    for (const key in this.skills) {
      const stat = this.stats[this.skills[key].stat];
      this.skills[key].total += stat.mod + this.skills[key].bonus;
    }

    // applys conditions relevant to token statuses
    for (const status of this.parent.statuses) {
      switch (status) {
        case 'burn':
          this.stats.atk.total -= 2;
          break;
        case 'paralyzed':
          this.stats.spd.total -= 2;
          break;
        case 'poison':
        case 'toxic':// deliberate fall through
          this.stats.satk.total -= 2;
          break;
        default: break;
      }
    }

    // calculates total movement speed
    this.moveSpeed += this.stats.spd.total * 5;
  }

  getRollData() {
    const data = super.getRollData();

    for (let [k, v] of Object.entries(this.stats)) {
      data[k] = v.mod;
      data[PTA.statKeyLong[k]] = v.total;
    }

    return data;
  }

  get isFainted() { return this.hp.value <= 0 };
  get fainted() { return this.isFainted };
  get isDead() { return this.isFainted };
  get isAlive() { return !this.isFainted };
  get getTypes() { return [this.types.primary, this.types.secondary] }
}