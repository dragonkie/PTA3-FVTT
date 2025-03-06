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
                percent: new NumberField({ initial: 0 }),
                full: new BooleanField({ initial: false })
            }),
            revive: new SchemaField({// can cure the fainted condition from a pokemon
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            cure: new StringField({// cures some or all afflictions
                ...isSelector,
                label: 'PTA.Cures.long',
                choices: () => {
                    const data = {
                        none: pta.utils.localize('PTA.Generic.None'),
                        ...pta.utils.duplicate(pta.config.ailments),
                        all: pta.utils.localize('PTA.Generic.All')
                    }
                    delete data.dead;
                    delete data.fainted;

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
            repel: new SchemaField({// for the duration, pokemon avoid you
                active: new BooleanField({ ...isRequired, initial: false }),
                duration: new NumberField({ initial: 1 }) // in hours
            }),
            vitamin: new SchemaField({// permanent stat boost, only allowed two boosts at any given time
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
            booster: new SchemaField({// temporary combat booster, same type effec
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
                beauty: new NumberField({ initial: 0 }),
                clever: new NumberField({ initial: 0 }),
                cool: new NumberField({ initial: 0 }),
                cute: new NumberField({ initial: 0 }),
                tough: new NumberField({ initial: 0 }),
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
}