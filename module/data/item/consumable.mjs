import PtaDialog from "../../applications/dialog.mjs";
import PtaChatMessage from "../../documents/message.mjs";
import { PTA } from "../../helpers/config.mjs";
import ItemData from "../item.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class ConsumableData extends ItemData {
    static defineSchema() {
        const fields = foundry.data.fields;
        const isRequired = { required: true, nullable: false };
        const isSelector = { blank: false, initial: "none", nullable: false, required: true };
        const schema = super.defineSchema();

        schema.target = new StringField(Object.assign({
            ...isSelector,
            label: 'PTA.Generic.Target',
            choices: {
                trainer: pta.utils.localize("PTA.Generic.Trainer"),
                pokemon: pta.utils.localize("PTA.Generic.Pokemon"),
                all: pta.utils.localize("PTA.Generic.All")
            }
        }, { initial: "pokemon" }));

        // Can this item be held + used by a pokemon
        schema.canHold = new BooleanField({ initial: false });
        // if every single condition needs to be met, or just one, to trigger the item consumption
        schema.fullTrigger = new BooleanField({ ...isRequired, initial: true });
        // triggers that make a pokemon use this item
        schema.triggers = new SchemaField({
            onHpLower: new SchemaField({//if the pokemons hp is within this range
                active: new BooleanField({ initial: false }),
                flat: new NumberField({ ...isRequired, initial: 5, integer: false }),
                percent: new NumberField({ ...isRequired, initial: 0, integer: false })
            }),
            onAilment: new SchemaField({ // when the pokemon recieves an ailment
                active: new BooleanField({ initial: false }),
                options: new ArrayField(new StringField(), { initial: [] }),
                any: new BooleanField({ initial: false }) // triggers on recieving ANY status ailment
            }),
            onUsesEmpty: new SchemaField({//when you cant use your PP anymore
                one: new BooleanField({ initial: false }),//only for moves with one use
                three: new BooleanField({ initial: false }),//only for moves with three uses
                any: new BooleanField({ initial: false }),
            }),
            onHit: new SchemaField({// when the user hits a target
                melee: new BooleanField({ initial: false }),
                physical: new BooleanField({ initial: false }),
                ranged: new BooleanField({ initial: false }),
                special: new BooleanField({ initial: false }),
                effective: new BooleanField({ initial: false }),// of move is effective at all
                superEffective: new BooleanField({ initial: false }),// only at +1 effective
                veryEffective: new BooleanField({ initial: false }),// only at +2 effective
                type: new StringField({ initial: "none" }),// if the move matches the type
            }),
            onDamage: new SchemaField({ // when user deals damage
                melee: new BooleanField({ initial: false }),
                physical: new BooleanField({ initial: false }),
                ranged: new BooleanField({ initial: false }),
                special: new BooleanField({ initial: false }),
                effective: new BooleanField({ initial: false }),// of move is effective at all
                superEffective: new BooleanField({ initial: false }),// only at +1 effective
                veryEffective: new BooleanField({ initial: false }),// only at +2 effective
                type: new StringField({ initial: "none" }),// if the move matches the type
            }),
            whenHit: new SchemaField({ // when user is hit
                melee: new BooleanField({ initial: false }),
                physical: new BooleanField({ initial: false }),
                ranged: new BooleanField({ initial: false }),
                special: new BooleanField({ initial: false }),
                effective: new BooleanField({ initial: false }),// of move is effective at all
                superEffective: new BooleanField({ initial: false }),// only at +1 effective
                veryEffective: new BooleanField({ initial: false }),// only at +2 effective
                type: new StringField({ initial: "none" }),// if the move matches the type
            }),
            whenDamaged: new SchemaField({ // when user is damaged
                melee: new BooleanField({ initial: false }),
                physical: new BooleanField({ initial: false }),
                ranged: new BooleanField({ initial: false }),
                special: new BooleanField({ initial: false }),
                effective: new BooleanField({ initial: false }),// of move is effective at all
                superEffective: new BooleanField({ initial: false }),// only at +1 effective
                veryEffective: new BooleanField({ initial: false }),// only at +2 effective
                type: new StringField({ initial: "none" }),// if the move matches the type
            })
        })

        // Effects a consumable item can have
        schema.effects = new SchemaField({
            heal: new SchemaField({// heals the target a flat ammount
                active: new BooleanField({ ...isRequired, initial: false }),
                value: new NumberField({ initial: 10 }),
                percent: new NumberField({ initial: 0, min: 0 }),
                full: new BooleanField({ initial: false })
            }),
            revive: new BooleanField({ ...isRequired, initial: false }),
            cure: new StringField({// cures some or all afflictions
                ...isSelector,
                label: 'PTA.Cures.long',
                choices: () => {
                    const data = {
                        none: pta.utils.localize('PTA.Generic.None'),
                        ...pta.utils.duplicate(pta.config.ailments),
                        all: pta.utils.localize('PTA.Generic.All')
                    }

                    for (const [key, value] of Object.entries(data)) data[key] = pta.utils.localize(value);

                    return data;
                }
            }),
            afflicts: new SchemaField({// causes one or more status ailments
                active: new BooleanField({ ...isRequired, initial: false }),
                options: new ArrayField(new StringField(), { initial: [] }),
            }),
            restoration: new SchemaField({// restores use of one, or all, limited use moves
                active: new BooleanField({ ...isRequired, initial: false }),
                full: new BooleanField({ initial: false })
            }),
            repel: new SchemaField({// for the duration, pokemon avoid you, trainer use only
                active: new BooleanField({ ...isRequired, initial: false }),
                duration: new NumberField({ initial: 1 }) // in hours
            }),
            vitamin: new SchemaField({// permanent stat boost, only allowed two boosts at any given time, pokemon only
                active: new BooleanField({ ...isRequired, initial: false }),
                atk: new NumberField({ initial: 0 }),
                def: new NumberField({ initial: 0 }),
                hp: new NumberField({ initial: 0 }),
                satk: new NumberField({ initial: 0 }),
                sdef: new NumberField({ initial: 0 }),
                spd: new NumberField({ initial: 0 }),
                random: new SchemaField({
                    value: new NumberField({ initial: 0 }),// value raised by
                    count: new NumberField({ initial: 0 }),// # stats to be affected
                })
            }),
            counterVitamin: new SchemaField({// permanent stat boost, only allowed two boosts at any given time
                active: new BooleanField({ ...isRequired, initial: false }),
                atk: new NumberField({ initial: 0 }),
                def: new NumberField({ initial: 0 }),
                hp: new NumberField({ initial: 0 }),
                satk: new NumberField({ initial: 0 }),
                sdef: new NumberField({ initial: 0 }),
                spd: new NumberField({ initial: 0 }),
            }),
            booster: new SchemaField({// temporary combat booster, doesn't stack
                active: new BooleanField({ ...isRequired, initial: false }),
                duration: new SchemaField({
                    value: new NumberField({ ...isRequired, initial: 1 }),
                    incriment: new StringField({ ...isRequired, initial: "round" })
                }),
                acc: new NumberField({ initial: 0 }),
                atk: new NumberField({ initial: 0 }),
                def: new NumberField({ initial: 0 }),
                satk: new NumberField({ initial: 0 }),
                sdef: new NumberField({ initial: 0 }),
                spd: new NumberField({ initial: 0 }),
                random: new SchemaField({
                    value: new NumberField({ initial: 0 }),// value raised by
                    count: new NumberField({ initial: 0 }),// # stats to be affected
                })
            }),
            contest: new SchemaField({// permanent boost to contest stats, combined total cannot exceed 10
                active: new BooleanField({ ...isRequired, initial: false }),
                beauty: new NumberField({ initial: 0, max: 10, min: 0 }),
                clever: new NumberField({ initial: 0, max: 10, min: 0 }),
                cool: new NumberField({ initial: 0, max: 10, min: 0 }),
                cute: new NumberField({ initial: 0, max: 10, min: 0 }),
                tough: new NumberField({ initial: 0, max: 10, min: 0 }),
                random: new SchemaField({
                    value: new NumberField({ initial: 0 }),// value raised by
                    count: new NumberField({ initial: 0 }),// # stats to be affected
                })
            }),
            retaliate: new SchemaField({// deals damage back against the triggering entity
                active: new BooleanField({ ...isRequired, initial: false }),
                value: new NumberField({ initial: 0 }),
                percent: new NumberField({ initial: 25 })
            })
        });

        schema.flavour = new StringField({
            ...isSelector,
            label: 'PTA.Flavour.long',
            choices: () => {
                const data = {
                    none: pta.utils.localize('PTA.Generic.None'),
                    ...pta.utils.duplicate(pta.config.flavours)
                }
                for (const [key, value] of Object.entries(data)) data[key] = pta.utils.localize(value);
                return data;
            }
        })

        return schema;
    }

    /**
     * Use action for consumables is complex and delegated based on its affects
     * Initial split is determined by whether the item can affect humans or just pokemon
     * Use seperate targeting functions to retrive the person we should be affecting
     * @param {Event} event 
     * @param {Element} target 
     * @param {String} action 
     */
    async use(event, target, action) {
        // the target user is in the document
        let target_actor = null;
        switch (this.target) {
            case 'trainer': target_actor = await this._getUserTrainer(event, target); break;
            case 'pokemon': target_actor = await this._getUserPokemon(event, target); break;
            case 'all': break;
        }

        // if we didn't manage to find a target for automation, simply put the update into the chat
        // or use this step if automation for this is disabled
        if (!target_actor || !game.settings.get(pta.id, 'automation')) {

        } else if (game.settings.get(game.system.id, 'automation')) { // begin the automation proccess
            // Converts the target actor into a data object to manipulate
            // if something fails along the way, we can abandon changes then
            const _uDoc = target_actor.toObject();
            const message_data= {content: "", flavor: "", speaker: this.actor};
            try {
                if (this.actor.uuid == target_actor.uuid) message_data.content += `${this.actor.name} used a ${this.parent.name} on themself!`;
                else message_data.content += `${this.actor.name} used a ${this.parent.name} on ${target_actor.name}`;

                // verify that the pokemon isn't fainted, or that this item is a revive in that case
                if (target_actor.system.fainted && !this.effects.revive) throw new Error("This item can't be used on a fainted Pokémon!");

                // Apply user healing if possible
                this._onHeal(_uDoc);

                // cure status effects, needs a reference to the actor to function
                // effects are a nested document embed and require an async handler
                await this._onCure(target_actor);

                // Apply the update to the target
                await target_actor.update(_uDoc);
                await this.parent.update({ system: { quantity: this.quantity - 1 } });

                // Re-render the affected actor sheets to reflect any changes
                target_actor.sheet.render(false);
                this.parent.sheet.render(false);

                // Generate the chat message
                const msg = PtaChatMessage.create(message_data);
            } catch (err) {
                pta.utils.error(err.message)
            }
        }

    }

    async _getUserPokemon(event, target) {
        let opts = {};
        for (const p of this.actor.system.pokemon) if (p.active) opts[p.uuid] = p.name;

        if (Object.keys(opts).length < 1) return null;
        let selector = new foundry.data.fields.StringField({
            required: true,
            nullable: false,
            choices: opts,
            label: 'Select a pokemon',
        }).toFormGroup({}, { value: opts[Object.keys(opts)[0]].value }).outerHTML

        try {
            const uuid = await new Promise(async (resolve, reject) => {
                const app = await new PtaDialog({
                    window: { title: "PTA.Dialog.PokemonSelect" },
                    content: selector,
                    buttons: [{
                        label: "Cancel",
                        action: "cancel",
                        callback: () => { reject('User canceled') }
                    }, {
                        label: "Confirm",
                        action: "confirm",
                        callback: () => {
                            let _s = app.element.querySelector('select');
                            resolve(_s.options[_s.selectedIndex].value);
                        }
                    }],
                    close: () => { reject('User closed popup') },
                }).render(true);
            });

            const pokemon = await fromUuid(uuid);
            if (!pokemon) throw new Error('Pokemon with UUID doesnt exist?');

            return pokemon;
        } catch (err) {
            console.error(err)
            return null;
        }
    }

    /* -------------------------------------------------------------- */
    /*                                                                */
    /*                        Item use effects                        */
    /*                                                                */
    /* -------------------------------------------------------------- */
    /**
     * Following functions should be passed two data points, the document, and its update data
     * to minimize update calls, and by extension overhead, no update should be called 
     * in these functions, and modifications should exclusivly be made to cloned document
     */

    _onHeal(actor) {
        const heal = this.effects.heal;
        if (heal.percent > 0) actor.system.hp.value += actor.system.hp.total * (heal.percent / 100)
        if (heal.value > 0) actor.system.hp.value += heal.value;
        if (heal.full) actor.system.hp.value = actor.system.hp.total;

        // clamp to the max hp possible
        actor.system.hp.value = Math.min(actor.system.hp.total, actor.system.hp.value);
    }

    async _onCure(actor) {
        // loop through and eliminate all negative status ailments on a pokemon
        if (this.effects.cure == 'all') {
            for (const effect of actor.effects.contents) {
                const ailments = Object.keys(PTA.ailments)
                for (const status of effect.statuses) if (ailments.includes(status)) effect.delete();
            }
        } else {
            for (const effect of actor.effects.contents) {
                // if the effect contains the purged effect, continue on
                if (effect.statuses.has(this.effects.cure)) effect.delete();
            }
        }
    }

    _onRestore(doc, data) {

    }
}