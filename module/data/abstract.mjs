import { PTA } from "../helpers/config.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, HTMLField
} = foundry.data.fields;

export default class DataModel extends foundry.abstract.TypeDataModel {
  /**
   * Convert the schema to a plain object.
   * 
   * The built in `toObject()` method will ignore derived data when using Data Models.
   * This additional method will instead use the spread operator to return a simplified
   * version of the data.
   * 
   * @returns {object} Plain object either via deepClone or the spread operator.
   */
  toPlainObject() {
    return { ...this };
  }


  static defineSchema() {
    const schema = {};
    schema.gmNotes = new HTMLField({ required: true, gmOnly: true, initial: "" });
    schema.description = new HTMLField({ required: true, initial: "" });
    return schema;
  }

  get name() {
    return this.parent.name;
  }

  /**@override*/
  prepareBaseData() {
    return {};
  }

  prepareDerivedData() {
    return {};
  }

  getRollData() {
    //grabs the roll data based on what type of document this is, item or actor
    return { ...this };
  }

  static BonusField() {
    return new SchemaField({
      source: new StringField({ initial: 'none', required: true, nullable: false }),
      value: new NumberField({ initial: 0, required: true, nullable: false }),
      type: new StringField({
        initial: 'add',
        required: true,
        nullable: false,
        blank: false,
        label: PTA.generic.type,
        options: () => {
          let options = {
            add: "Add",
            subtract: "Subtract",
            multiply: "Multiply",
            divide: "Divide",
          };
          return options
        }
      })
    })
  }
}