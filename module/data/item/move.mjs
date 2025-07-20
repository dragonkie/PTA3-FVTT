import ItemData from "../item.mjs";
import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";

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

        // additional crit chance
        schema.critical_chance = new NumberField({ initial: 0, ...isRequired, min: 0, max: 100 });

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

        schema.ailment = new SchemaField({
            type: new StringField({ initial: '' }),
            chance: new NumberField({ initial: 0 })
        })

        // if max or min hits is set to 0, the move isnt treated as a multi hit
        schema.multi_hit = new SchemaField({
            max: new NumberField({ initial: 0 }),
            min: new NumberField({ initial: 0 })
        })

        schema.priority = new NumberField({ initial: 0, ...isRequired });

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

    //=====================================================================================================
    //> Actions 
    //=====================================================================================================
    async use(event, target, action) {
        if (action == 'reload') return this._onUseReload(event, target);
        if (action == 'attack') return this._onUseAttack(event, target);
        return this._onUseAttack(event, target);
    }

    //=====================================================================================================
    //>- Attack 
    //=====================================================================================================
    async _onUseAttack(event, target) {
        if (this.uses.max > 0 && this.uses.value <= 0) return void utils.warn('PTA.Warn.NoUses');

        // gather relevant data
        const attacker = this.actor;
        if (!attacker) return void utils.warn('PTA.Warn.NoUser');

        const targets = utils.getTargets();
        const rolldata = this.getRollData();
        if (!rolldata) return void utils.error('PTA.Error.RolldataMissing');

        //=====================================================================================================
        //>-- POKESIM 
        //=====================================================================================================
        if (game.settings.get(game.system.id, 'pokesim')) {
            // Targeting in simulation mode is ALWAYS enforced
            if (!targets) return void utils.warn('PTA.Warn.EnforceTargeting');
            // loop through targets to attack
            for (const target of targets) {
                let target_stat = {};
                // get the defending stats
                if (this.class == 'physical') target_stat = target.actor.system.stats.def;
                if (this.class == 'special') target_stat = target.actor.system.stats.sdef;
                if (this.class == 'effect') target_stat = target.actor.system.stats.spd;

                //============================================================================
                //>--- Accuracy Roll
                //============================================================================
                const r_accuracy = new Roll('1d100', rolldata);
                let accuracy_tn = this.accuracy * (utils.AccuracyStage(attacker));
                await r_accuracy.evaluate();
                let critical = false;
                let missed = false;
                let dodged = false;

                if (r_accuracy.total >= (game.settings.get(game.system.id, 'simMaxAccuracy') || 96)) missed = true; // crit miss
                else if (r_accuracy.total > Math.max(accuracy_tn, game.settings.get(game.system.id, 'simMinAccuracy') || 33)) missed = true; // regular miss
                else if (r_accuracy.total <= utils.CriticalStage(this.critical_chance)) critical = true; // critical hit

                // prepare message data
                const message_data = {};
                const message_config = { ...rolldata, user: attacker.name, move: this.parent.name, target: target.token.name };

                // the user missed due to an evasion buff or accuracy debuff
                message_data.content = `<p><b>Accuracy</b></p>`
                if (r_accuracy.total <= this.accuracy && r_accuracy.total > accuracy_tn) {
                    message_data.content += utils.format('PTA.Chat.Attack.Dodge', message_config);
                    dodged = true;
                } else if (missed) message_data.content += utils.format(PTA.chat.attack.miss, message_config)
                else message_data.content += utils.format(critical ? PTA.chat.attack.crit : PTA.chat.attack.hit, message_config)
                message_data.content += await r_accuracy.render();
                // send the attack chat card
                if (missed) {
                    await r_accuracy.toMessage(message_data);
                    continue;
                }
                //============================================================================
                //>--- Damage Roll
                //============================================================================
                let effectiveness = { value: 0, percent: 1, immune: false };
                if (target.actor.type == 'pokemon') {
                    let overriden = false
                    for (const override of target.actor.system.resistance_override) {
                        if (override.type == this.type) {
                            overriden = true;
                            switch (override.value) {
                                case 'immune':
                                    effectiveness = { value: 0, percent: 0, immune: true }
                                    break;
                                case 'double':
                                    effectiveness = { value: 1, percent: 2, immune: false }
                                    break;
                                case 'quadruple':
                                    effectiveness = { value: 2, percent: 4, immune: false }
                                    break;
                                case 'half':
                                    effectiveness = { value: -1, percent: 0.5, immune: false }
                                    break;
                                case 'quarter':
                                    effectiveness = { value: -2, percent: 0.25, immune: false }
                                    break;
                            }
                        }
                    }
                    if (!overriden) effectiveness = utils.typeEffectiveness(this.type, target.actor.system.getTypes());
                }
                let damage_scale = ` * ${Math.round(rolldata.stat.total / target_stat.total * 100) / 100}[stats]`;
                let stab = attacker.system.getTypes().includes(this.type) ? ` * 1.5[stab]` : '';
                let crit = critical ? ` * 1.5[crit]` : ``;
                let burn = attacker.statuses.has('burn') && this.class == 'physical' ? ' * 0.5[burn]' : ''
                let formula = `round((${this.damage.formula})[base]${burn}${damage_scale}*${effectiveness.percent}[type]${stab}${crit})`;

                message_data.content += `<p><b>Damage</b></p>`
                // configure the damage chat card
                if (effectiveness.immune) message_data.content += utils.format(PTA.chat.damage.immune, message_config);
                else switch (effectiveness.value) {
                    case -2:
                        message_data.content += utils.format(PTA.chat.damage.quarter, message_config);
                        break;
                    case -1:
                        message_data.content += utils.format(PTA.chat.damage.half, message_config);
                        break;
                    case 0:
                        message_data.content += utils.format(PTA.chat.damage.normal, message_config);
                        break;
                    case 1:
                        message_data.content += utils.format(PTA.chat.damage.double, message_config);
                        break;
                    case 2:
                        message_data.content += utils.format(PTA.chat.damage.quadruple, message_config);
                        break;
                }

                const r_damage = new Roll(formula, rolldata);
                await r_damage.evaluate();

                message_data.content += await r_damage.render();
                message_data.content += await foundry.applications.ux.TextEditor.enrichHTML(this.description);
                if (this.actor.type == 'pokemon' && this.actor.system.trainer != '') {
                    // validate that theres a real trainer attached to this pokemon
                    let trainer = await fromUuid(this.actor.system.trainer);
                    if (!trainer) message_data.speaker = ChatMessage.getSpeaker({ actor: this.actor })
                    else message_data.speaker = ChatMessage.getSpeaker({ actor: trainer })
                }

                let msg_damage = await r_damage.toMessage(message_data, message_config);
            }
        }
        //=====================================================================================================
        //>-- REGULAR 
        //=====================================================================================================
        else {
            //============================================================================
            //>--- Targeting data
            //============================================================================
            if (!targets) {

            } else for (const target of targets) {
                //========================================================================
                //>--- Data prep
                //========================================================================
                let damage_formula = this.damage.formula;

                let target_stat = {};
                if (this.class == 'physical') target_stat = target.actor.system.stats.def;
                if (this.class == 'special') target_stat = target.actor.system.stats.sdef;
                if (this.class == 'effect') target_stat = target.actor.system.stats.spd;

                const message_config = { ...rolldata, user: attacker.name, move: this.parent.name, target: target.token.name };
                const message_data = { content: '', speaker: null }

                if (this.actor.type == 'pokemon' && this.actor.system.trainer != '') {
                    // validate that theres a real trainer attached to this pokemon
                    let trainer = await fromUuid(this.actor.system.trainer);
                    if (!trainer) message_data.speaker = ChatMessage.getSpeaker({ actor: this.actor })
                    else message_data.speaker = ChatMessage.getSpeaker({ actor: trainer })
                }

                //========================================================================
                //>--- Accuracy Roll
                //========================================================================
                let r_accuracy = new Roll('1d20 + @stat.mod + @accuracy', rolldata);
                await r_accuracy.evaluate();

                let missed = false;
                let critical = false;

                if (r_accuracy.dice.find(a => a.faces == 20).results[0].result >= 20 - this.critical_chance) critical = true;
                else if (r_accuracy.total < game.settings.get(game.system.id, 'baseAc') + target_stat.total) missed = true;

                // attack roll content
                message_data.content += `<p><b>${utils.localize(PTA.generic.accuracy)}</b></p>`
                if (missed) message_data.content += utils.format(PTA.chat.attack.miss, message_config);
                else if (critical) message_data.content += utils.format(PTA.chat.attack.crit, message_config);
                else message_data.content += utils.format(PTA.chat.attack.hit, message_config);
                message_data.content += await r_accuracy.render();

                //========================================================================
                //>--- Damage Roll
                //========================================================================
                // Add stab damage bonus
                for (const key of Object.keys(attacker.system.types)) {
                    if (attacker.system.types[key] == this.type) {
                        damage_formula += '+4';
                        break;
                    }
                }

                let r_damage = new Roll(damage_formula, rolldata);

                // get the move effectiveness values
                let effectiveness = { value: 0, percent: 1, immune: false };;
                if (!missed) {
                    if (target.actor.type == 'pokemon') {
                        let overriden = false
                        for (const override of target.actor.system.resistance_override) {
                            if (override.type == this.type) {
                                overriden = true;
                                switch (override.value) {
                                    case 'immune':
                                        effectiveness = { value: 0, percent: 0, immune: true }
                                        break;
                                    case 'double':
                                        effectiveness = { value: 1, percent: 2, immune: false }
                                        break;
                                    case 'quadruple':
                                        effectiveness = { value: 2, percent: 4, immune: false }
                                        break;
                                    case 'half':
                                        effectiveness = { value: -1, percent: 0.5, immune: false }
                                        break;
                                    case 'quarter':
                                        effectiveness = { value: -2, percent: 0.25, immune: false }
                                        break;
                                }
                            }
                        }
                        if (!overriden) effectiveness = utils.typeEffectiveness(this.type, target.actor.system.getTypes());
                    }

                    // add or remove dice from the formula to match effectiveness, then resert formula to match new terms
                    r_damage.dice[0].number = Math.max(r_damage.dice[0].number + effectiveness.value, 0);
                    r_damage.resetFormula();

                    // critical hits maximize dice
                    await r_damage.evaluate({ maximize: critical });

                    message_data.content += `<p><b>${utils.localize(PTA.generic.damage)}</b></p>`

                    if (effectiveness.immune) message_data.content += utils.format(PTA.chat.damage.immune, message_config);
                    else switch (effectiveness.value) {
                        case -2:
                            message_data.content += utils.format(PTA.chat.damage.quarter, message_config);
                            break;
                        case -1:
                            message_data.content += utils.format(PTA.chat.damage.half, message_config);
                            break;
                        case 0:
                            message_data.content += utils.format(PTA.chat.damage.normal, message_config);
                            break;
                        case 1:
                            message_data.content += utils.format(PTA.chat.damage.double, message_config);
                            break;
                        case 2:
                            message_data.content += utils.format(PTA.chat.damage.quadruple, message_config);
                            break;
                    }

                    message_data.content += await r_damage.render();

                    // Lifesteal value
                    if (this.drain > 0) {
                        message_config.drain = Math.floor(r_damage.total * (this.drain / 100));
                        message_data.content += `<p>${utils.format(PTA.chat.lifesteal, message_config)}</p>`;
                    }
                }



                //========================================================================
                //>--- Chat Message
                //========================================================================
                message_data.content = await foundry.applications.ux.TextEditor.enrichHTML(message_data.content);
                let message = await r_accuracy.toMessage(message_data, message_config);
            }


        }

        if (this.uses.max > 0) this.parent.update({ 'system.uses.value': this.uses.value - 1 });
    }

    async _onUseReload(event, target) {
        if (this.uses.max > 0 && this.uses.value < this.uses.max) {
            this.parent.update({ system: { uses: { value: this.uses.max } } });
        }
    }
}