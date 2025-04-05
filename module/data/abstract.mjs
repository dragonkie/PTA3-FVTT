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
    schema.gmNotes = new HTMLField({ required: true, nullable: false, gmOnly: true, initial: "" });
    return schema;
  }

  get name() {
    return this.parent.name;
  }

  prepareBaseData() {
    const data = super.prepareBaseData();
    console.log('baseData', data);
    return data;
  }

  prepareDerivedData() {
    const data = super.prepareDerivedData();
    console.log('derivedData', data);
    return data;
  }

}