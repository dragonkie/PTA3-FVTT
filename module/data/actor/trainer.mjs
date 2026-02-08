export default class TrainerData extends ActorData {

    static defineSchema() {
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.credits = new NumberField({ ...requiredInteger, initial: 0 });

        // list of owned pokemon
        schema.pokemon = new ArrayField(new SchemaField({
            uuid: new StringField({ initial: '', required: true, nullable: false }),
            name: new StringField({ initial: '', required: true, nullable: false }),
            active: new BooleanField({ initial: false, required: true, nullable: false })
        }), { initial: [] });

        return schema;
    }

}