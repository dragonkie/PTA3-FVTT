import PtaDialog from "../../applications/dialog.mjs";
import ActorData from "../actor.mjs";
const { SchemaField, NumberField, BooleanField, StringField, ArrayField, DataField, ObjectField, HTMLField } = foundry.data.fields;

export default class TrainerData extends ActorData {

    static defineSchema() {
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.credits = new NumberField({ ...requiredInteger, initial: 0 });

        // ######## REWOR COMPANION LIST TO USE TYPED OBJECT FIELD AND STORE THEIR PRIORITY INSIDE THE SCHEMA INSTEAD OF DYNAMICALY VIA ORDERING ########
        // list of owned pokemon
        schema.pokemon = new ArrayField(new SchemaField({
            uuid: new StringField({ initial: '', required: true, nullable: false }),
            name: new StringField({ initial: '', required: true, nullable: false }),
            active: new BooleanField({ initial: false, required: true, nullable: false }),
            sorting: new NumberField()
        }), { initial: [] });

        return schema;
    }

    /**
     * @override
     * 
     * Adds a popup to allow confirming active companion team, or full roster, to recieve a rest
     */
    async _onRest(data = []) {

        const app = new PtaDialog({
            id: `${this.parent.uuid}-team_rest`,
            classes: ['pta'],
            buttons: [{
                label: "##Confirm",
                action: "confirm",
            }],
            content: `
                    <p>##Would you like any of your team to take a rest with you?</p>
                    <select>
                        <option value="some" selected>##Yes my current team</option>
                        <option value="all">##All of my companions!</option>
                        <option value="none">##Not this time</option>
                    </select>
                `,
            submit: (result, dialog) => {
                const opt = dialog.element.querySelector("select").value;

                // get list of targets to update
                const targets = [];
                if (opt == "some") for (const companion of this.pokemon) if (companion.active) targets.push(companion);
                if (opt == "all") for (const companion of this.pokemon) targets.push(companion);

                // if the update is ready, perform it
                if (opt != "none" && targets.length > 0) game.actors.updateAll(
                    (doc) => { // function to configure update data
                        for (const status of doc.statuses) doc.toggleStatusEffect(status, { active: false });
                        if (doc.system.hp.value < doc.system.hp.max) return { "system.hp.value": doc.system.hp.max };
                        return {};
                    },
                    (doc) => { // Conditional function to see who to update
                        for (const t of targets) if (t.uuid == doc.uuid) return true;
                        return false;
                    },
                    { recursive: true }
                );

                super._onRest(data);
            },
        }).render(true);
    }
}