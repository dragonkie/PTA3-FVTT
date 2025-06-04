import utils from "../helpers/utils.mjs";
import DataModel from "./abstract.mjs";
import { PTA } from "../helpers/config.mjs";

const { SchemaField, NumberField, BooleanField, StringField, ArrayField, DataField, ObjectField, HTMLField } = foundry.data.fields;

export default class ActorData extends DataModel {

  static defineSchema() {

    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hp = new SchemaField({
      value: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
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

    // manually set a pokemons resistance to a certain element
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
      }), { initial: [], nullable: false });

    //====================================================================================
    //> Bonus fields
    //====================================================================================
    schema.bonuses = new SchemaField({
      attack: new NumberField({ initial: 0, required: true, nullable: false }),
    })

    return schema;
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.stats) this.stats[key].total = 0;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // applys conditions relevant to token statuses
    if (!game.settings.get(game.system.id, 'pokesim')) {
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
    }

    // after status modifiers are applied, we can total up the final value of the stats
    for (const key in this.stats) {
      this.stats[key].total += (this.stats[key].value + this.stats[key].bonus) * utils.AbilityStage(this.stats[key].boost);
      this.stats[key].mod = Math.floor(this.stats[key].total / 2);
    }

    if (game.settings.get(game.system.id, 'pokesim')) {
      for (const status of this.parent.statuses) {
        if (status == 'paralyzed') {
          this.stats.spd.total = Math.floor(this.stats.spd.total * 0.5);
          this.stats.spd.mod = Math.floor(this.stats.spd.total / 2);
        }
      }
    }
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
}