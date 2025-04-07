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

    getRollData() {
        const data = super.getRollData();
        let stat_key = 'atk'
        switch (this.class) {
            case 'special':
                stat_key = 'satk';
                break;
            case 'effect':
                stat_key = 'spd'
                break;
        }
        data.stat = {
            key: stat_key,
            ...data.actor.system.stats[stat_key]
        };

        return data;
    }

    async use(event, options) {
        // gather relevant data
        const attacker = this.actor;
        if (!attacker) return void pta.utils.warn('PTA.Warn.NoUser');

        const targets = pta.utils.getTargets();
        const rolldata = this.getRollData();
        if (!rolldata) return void pta.utils.error('PTA.Error.RolldataMissing');

        // make the attack / accuracy roll
        if (game.settings.get(game.system.id, 'pokesim')) {
            if (!targets) return void pta.utils.warn('PTA.Warn.EnforceTargeting');
            // loop through targets to attack
            for (const target of targets) {
                let r_accuracy = new Roll('1d100', rolldata);

                let accuracy_tn = this.accuracy * (pta.utils.AccuracyStage(attacker));
                await r_accuracy.evaluate();
                let critical = false;
                let missed = false;
                let dodged = false;

                // validate what happened with the attack
                if (r_accuracy.total >= 96) missed = true; // crit miss
                else if (r_accuracy.total > accuracy_tn) missed = true; // regular miss
                else if (r_accuracy.total <= 5) critical = true; // critical hit

                // prepare message data
                const atk_msg_data = {};
                const message_config = { user: attacker.name, move: this.parent.name, target: "NULL" }
                // the user missed due to an evasion buff or accuracy debuff
                if (r_accuracy.total <= this.accuracy && r_accuracy.total > accuracy_tn) {
                    atk_msg_data.flavor = pta.utils.format('PTA.Chat.Attack.Dodge', message_config);
                    dodged = true;
                } else if (missed) atk_msg_data.flavor = pta.utils.format(PTA.chat.attack.miss, message_config)
                else atk_msg_data.flavor = pta.utils.format(critical ? PTA.chat.attack.crit : PTA.chat.attack.hit, message_config)

                const msg_attack = await r_accuracy.toMessage(atk_msg_data);
                if (missed) continue;
                // roll damage

                let effectiveness = { value: 0, percent: 1, immune: false };
                if (target.actor.type == 'pokemon') effectiveness = pta.utils.typeEffectiveness(this.type, target.actor.system.getTypes());
                console.log(target.actor.type);
                console.log(target.actor.system.getTypes());
                console.log(this.type);
                console.log(effectiveness);
            }
        } else {
            let r_accuracy = new Roll('1d20 + @stat.mod', rolldata);
            await r_accuracy.evaluate();
        }
    }
}