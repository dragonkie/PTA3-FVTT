import ItemData from "../item.mjs";
const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class MoveData extends ItemData {
    static defineSchema() {
        const isRequired = { required: true, nullable: false };
        const schema = super.defineSchema();

        schema.drain = new NumberField({ ...isRequired, initial: 0 });

        return schema;
    }

    async use(event, options) {
        // gather relevant data
        const attacker = this.actor;
        if (!attacker) return void pta.utils.warn('PTA.Warn.NoUser');

        const targets = pta.utils.getTargets();

        // make the attack / accuracy roll
        if (targets) {
            for (const trgt of targets) {

            }
            let r_accuracy = null;
            if (game.settings.get(game.system.id, 'pokesim')) {
                r_accuracy = new this.getRollData('1d100');

                let accuracy_tn = this.accuracy * (pta.utils.AccuracyStage(attacker));

                await r_accuracy.evaluate();

                if (r_accuracy.total >= 96) {
                    // critical fails are an option

                } else if (r_accuracy.total > this.accuracy) {
                    // regular fail

                }
            } else {

            }
        }

        // on hit, roll damage


    }
}