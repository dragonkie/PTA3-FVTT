import ItemData from "../item.mjs";
import PtaDialog from "../../applications/dialog.mjs";
import utils from "../../helpers/utils.mjs";
import { PTA } from "../../helpers/config.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class PokeballData extends ItemData {
    static defineSchema() {
        const isRequired = { required: true, nullable: false };
        const schema = super.defineSchema();

        schema.capture = new SchemaField({
            base: new NumberField({ ...isRequired, initial: 5 }),// the standard catch rate
            conditional: new NumberField({ ...isRequired, initial: 0 })//added to roll if the capture conditions are met
        })

        // if true, all conditions must be met to use the conditional bonus
        schema.fullConditions = new BooleanField({ initial: true });
        schema.conditions = new SchemaField({
            dive: new SchemaField({// catch em well their wet
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            night: new SchemaField({// for when you got shaders turned on
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            day: new SchemaField({// What am I supposed to fight the sun?
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            enviroment: new SchemaField({// right place, wrong time
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            fast: new SchemaField({// for those high dex mfs always at the top
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            lure: new SchemaField({// tell em theres puppies in the van
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            quick: new SchemaField({//throw first, scan later
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            repeat: new SchemaField({// gets better when more balls are used
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            timer: new SchemaField({// longer fight raises catch rate
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            affliction: new SchemaField({// if the pokemon has an affliciton
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            heavy: new SchemaField({// if the pokemon is heavy class or more
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            unevolved: new SchemaField({// stealing literal babies, diddy would be proud
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            evoStone: new SchemaField({// give em flinstones gummies
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            love: new SchemaField({// use if they wanna smash
                active: new BooleanField({ ...isRequired, initial: false }),
            }),
            type: new SchemaField({// now with fire proof interior!
                active: new BooleanField({ ...isRequired, initial: false }),
                options: new ArrayField(new StringField(), { initial: [] })
            }),
            /* || Homebrew pokeball conditions */
            weather: new SchemaField({// Riley will love this one
                active: new BooleanField({ ...isRequired, initial: false }),
                options: new ArrayField(new StringField(), { initial: [] })
            }),
            egg: new SchemaField({// imagine having something made just to work on you
                active: new BooleanField({ ...isRequired, initial: false }),
                options: new ArrayField(new StringField(), { initial: [] })
            }),

        })
        schema.effects = new SchemaField({
            heal: new SchemaField({// heals the pokemon
                active: new BooleanField({ ...isRequired, initial: false }),
                value: new NumberField({ initial: 0, min: 0 })
            }),
            friendship: new SchemaField({// helps pokemon gain friendship
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            save: new SchemaField({// no penalty for use on K.O'd pokemon
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            terra: new SchemaField({// allows pokemon to terrastalize 1/day
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            /* || Homebrew pokeball conditions */
            affliction: new SchemaField({// cures all afflictions, like burn and poison
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            enemy: new SchemaField({// Pokemon hates the trainer with these balls
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            trans: new SchemaField({// Change the pokemons gender to the opposite
                active: new BooleanField({ ...isRequired, initial: false })
            }),
            shiny: new SchemaField({// makes the caught pokemon shiny
                active: new BooleanField({ ...isRequired, initial: false })
            }),

        })

        return schema;
    }

    async use(event, options) {
        if (!this.actor) return void pta.utils.warn("Can't throw a pokeball without a trainer!");
        if (this.quantity <= 0) return void pta.utils.warn("PTA.Warn.MissingItem");

        const rollData = this.getRollData();

        var acc = 0;
        var chn = 0;
        await new Promise(async (resolve, reject) => {
            const template = await utils.renderTemplate(PTA.templates.dialog.rollCaptureSphere, { item: this.parent });
            const app = new PtaDialog({
                content: template,
                classes: ['pta'],
                window: {
                    title: "PTA.Title.UseCaptureSphere"
                },
                buttons: [{
                    label: "Confirm",
                    action: "confirm",
                    callback: () => {
                        const ele = app.element;

                        var a = ele.querySelector('input[name=accuracy]').value;
                        var c = ele.querySelector('input[name=capture]').value;

                        if (a != '') acc += Number(a);
                        if (c != '') chn += Number(c);

                        resolve(true);
                    }
                }, {
                    label: "Cancel",
                    action: "cancel",
                    callback: () => reject()
                }]
            })
            await app.render({ force: true });
        })

        const hitRoll = new Roll(`1d20x + @spd${acc != 0 ? ` + ${acc}` : ``}`, rollData, {});
        await hitRoll.evaluate();

        const captureRoll = new Roll(`1d100 + (${this.capture.base} + ${this.capture.conditional})${chn != 0 ? ` + ${chn}` : ``}`);
        await captureRoll.evaluate();

        let messageData = {
            content: `
                <b>Accuracy</b>
                ${await hitRoll.render()}
                <b>Capture Roll</b>
                ${await captureRoll.render()}
            `,
            flavor: `${this.actor.name} threw a ${this.parent.name}!`,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            sound: `systems/${game.system.id}/assets/sfx/pokeball-throw.mp3`,
            rolls: [hitRoll, captureRoll]
        }

        const msg = await ChatMessage.create(messageData);
        await this.parent.update({ system: { quantity: this.quantity - 1 } });
    }
}