import ItemData from "../item.mjs";
import { PTA } from "../../helpers/config.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class MoveData extends ItemData {
    static defineSchema() {
        const isRequired = { required: true, nullable: false };
        const schema = super.defineSchema();

        // is this a physical, special, or effect move
        // moves that deal damage are still classified as physical / effect, such as ember
        const MoveClasses = {};
        for (const a in PTA.moveClass) MoveClasses[a] = pta.utils.localize(PTA.moveClass[a]);
        schema.class = new StringField({
            ...isRequired,
            blank: false,
            choices: { ...MoveClasses },
            initial: 'physical'
        })

        // Move typing
        const TypeChoices = {};
        for (const a in PTA.pokemonTypes) TypeChoices[a] = pta.utils.localize(PTA.pokemonTypes[a]);
        schema.type = new StringField({ ...isRequired, initial: 'normal', label: PTA.generic.type, choices: { ...TypeChoices } });

        // move damage
        schema.damage = new SchemaField({
            // normal data
            formula: new StringField({ ...isRequired, blank: false, initial: '2d6 + @atk', validate: (value) => Roll.validate(value), validationError: 'PTA.Error.InvalidFormula' }),
            // simulator data
            pokesim: new SchemaField({
                dice: new NumberField({ initial: 2 })
            })
        })

        schema.range = new NumberField({ initial: 5 })

        // how many times can this move be used, set max to 0 for unlimited uses
        schema.uses = new SchemaField({
            value: new NumberField({ initial: 0 }),
            max: new NumberField({ initial: 0 }),
        })

        // Accuracy, a number added to accuracy roll, or if in sim, the strict percentile hit chance
        schema.accuracy = new NumberField({ ...isRequired, initial: 100 });

        // does this move heal the user for damage dealt
        schema.drain = new NumberField({ ...isRequired, initial: 0 });

        schema.aoe = new SchemaField({
            width: new NumberField({ initial: 0 }),
            length: new NumberField({ initial: 0 }),
            type: new StringField({
                initial: 'none',
                choices: { ...PTA.aoeTypes }
            })
        })

        return schema;
    }

    get isRanged() { return this.range > 5 };

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

                } else if (r_accuracy.total <= 5) {
                    // critical hit
                } else {
                    // regular hit
                }
            } else {

            }
        }

        // on hit, roll damage


    }
}