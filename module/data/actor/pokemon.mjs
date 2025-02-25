import ptaActorBase from "../base-actor.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class PokemonData extends ptaActorBase {

  static defineSchema() {

    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.types = new ArrayField(new StringField(), {nullable: false, required: true, initial: ['normal']});
    
    return schema
  }

  prepareDerivedData() {
    this.xp = this.cr * this.cr * 100;
  }
}