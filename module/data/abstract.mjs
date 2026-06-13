import { PTA } from "../helpers/config.mjs";

const fields = foundry.data.fields
const fieldList = {
  ArrayField: fields.ArrayField,
  BooleanField: fields.BooleanField,
  IntegerSortField: fields.IntegerSortField,
  NumberField: fields.NumberField,
  SchemaField: fields.SchemaField,
  SetField: fields.SetField,
  StringField: fields.StringField,
  HTMLField: fields.HTMLField
};

const { ArrayField,
  BooleanField,
  IntegerSortField,
  NumberField,
  SchemaField,
  SetField,
  StringField,
  HTMLField,
} = fields;

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

  static fields = { ...fieldList };


  static defineSchema() {
    const schema = {};
    schema.gmNotes = new HTMLField({ required: true, gmOnly: true, initial: "" });
    schema.description = new HTMLField({ required: true, initial: "" });
    return schema;
  }

  /**
   * Corrects the data used to construct this data model to match newer standards
   * if any breaking changes are made to data structures,  they are premptivly corrected here
   * any breaking changes in versions should be documented and maintained in their respective migration
   * that way even versions from years past can be brought to a modern standard even fi the data is lossy
   * @param {Object} source 
   * @returns 
   */
  static migrateData(source) {
    return source;
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

  /**
   * Returns a list of available actions to be rendered by the PtaContextMenu class
   * @returns {Object[]}
   */
  getMenuActions() {
    const document = this.parent;
    const isOwner = document.isOwner;
    const isActor = document.documentName == 'Actor';
    const isItem = document.documentName == 'Item';

    return [{
      label: "PTA.ContextMenu.Edit",
      icon: "<i class='fa-solid fa-fw fa-edit'></i>",
      visible: isOwner,
      onClick: () => document.sheet.render(true),
      group: "manage"
    }, {
      label: "PTA.ContextMenu.Delete",
      icon: "<i class='fa-solid fa-fw fa-trash'></i>",
      visible: isOwner && isItem,
      onClick: () => document.deleteDialog(),
      group: "manage"
    }];
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