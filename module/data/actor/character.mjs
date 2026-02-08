import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
import ActorData from "../actor.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, ObjectField
} = foundry.data.fields;

export default class CharacterData extends ActorData {

  static defineSchema() {
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.honours = new NumberField({ ...requiredInteger, initial: 0, min: 0, label: PTA.generic.honours });
    schema.origin = new StringField({ initial: "", label: PTA.generic.origin });

    schema.credits = new NumberField({ ...requiredInteger, initial: 0 });

    // list of owned pokemon
    schema.pokemon = new ArrayField(new SchemaField({
      uuid: new StringField({ initial: '', required: true, nullable: false }),
      name: new StringField({ initial: '', required: true, nullable: false }),
      active: new BooleanField({ initial: false, required: true, nullable: false })
    }), { initial: [] });

    // Character classes
    schema.class_1 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_2 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_3 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_4 = new SchemaField({ label: new StringField({ initial: '' }) });

    // Character descriptions
    schema.details = new SchemaField({
      age: new StringField({ label: PTA.generic.age, initial: '' }),
      gender: new StringField({ label: PTA.generic.gender, initial: '' }),
      height: new StringField({ label: PTA.generic.height, initial: '' }),
      weight: new StringField({ label: PTA.generic.weight, initial: '' }),
      hair: new StringField({ label: PTA.generic.hair, initial: '' }),
      eyes: new StringField({ label: PTA.generic.eyes, initial: '' })
    })

    //===================================================================================
    //> Pokemon player specific options
    //===================================================================================
    schema.isPokemon = new BooleanField({ initial: false, nullable: false, required: true });

    return schema;
  }

  static type = 'character';

  prepareDerivedData() {
    super.prepareDerivedData();

    this.level = this.class_1.level = utils.HonourLevel(this.honours);

    this.class_2.level = this.class_1.level >= 3 ? this.class_1.level - 2 : 0;
    this.class_3.level = this.class_1.level >= 7 ? this.class_1.level - 6 : 0;
    this.class_4.level = this.class_1.level >= 11 ? this.class_1.level - 10 : 0;
  }

  getRollData() {
    const data = super.getRollData();

    return data;
  }

  async _preUpdate(changed, options, userId) {
    return await super._preUpdate(changed, options, userId);
  }

  _onUpdate(changed, options, userId) {
    return super._onUpdate(changed, options, userId);
  }
}