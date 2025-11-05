import DataModel from "./abstract.mjs";
import ActorData from "./actor.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, HTMLField
} = foundry.data.fields;

/**
 * @typedef {Object} UseOptions
 * @prop {String} action
 */

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
  //============================================================
  //> Custom item schema mixins
  //============================================================

  //============================================================
  //> General item fucntions
  //============================================================

  /**
   * @returns {PtaActor|null}
   */
  get actor() {
    return this.parent.actor;
  }

  getRollData() {
    let actor = this.actor;
    if (actor) {
      return { ...actor.getRollData(), ...super.getRollData(), actor: actor };
    }
    return super.getRollData();
  }

  /**
   * 
   * @param {*} event 
   * @param {*} action 
   */
  async use(event, action) {
    console.warn('No uses defined for this object!');
  }

  /**
   * Takes a given actor data model and will attempt to modify its data
   * This can included changes to stats, attack rolls, etc
   * @param {ActorData} actorData - The data model to augment
   */
  prepareActorData(actorData) {
    
  }

  /**
   * Returns a value derived from whatever an item deems neccesary to break tiebreakers in priority
   * used when applying modifiers through prepareActorData
   * @returns {Number}
   */
  get importance() {
    return 0;
  }
}