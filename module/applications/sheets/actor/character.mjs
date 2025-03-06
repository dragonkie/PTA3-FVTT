import PtaActorSheet from "../actor.mjs";

export default class PtaCharacterSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ["character"],
        actions: {
            trainTalent: this._onTrainTalent
        }
    }

    static PARTS = {
        body: { template: "systems/pta3/templates/actor/character/body.hbs" },
        // Tab bodies
        features: { template: "systems/pta3/templates/actor/character/features.hbs" },
        inventory: { template: "systems/pta3/templates/actor/character/inventory.hbs" },
        // components
        abilities: { template: "systems/pta3/templates/actor/parts/abilities.hbs" }
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features" },
        inventory: { id: "inventory", group: "primary", label: "PTA.Tab.Inventory" },
        pokemon: { id: "pokemon", group: "primary", label: "PTA.Tab.Pokemon" },
    }

    tabGroups = {
        primary: "features"
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   DATA PREPERATION                                     */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        context.skills = {};
        for (const [key, value] of Object.entries(this.document.system.skills)) {
            context.skills[key] = value;
            context.skills[key].label = {
                long: pta.utils.localize(CONFIG.PTA.skills[key]),
                abbr: pta.utils.localize(CONFIG.PTA.skillsAbbr[key])
            }
        }
        console.log(context)
        return context;
    }

    /* -------------------------------------------------------------------------------------- */
    /*                                                                                        */
    /*                                   SHEET ACTIONS                                        */
    /*                                                                                        */
    /* -------------------------------------------------------------------------------------- */
    static async _onTrainTalent(event, target) {
        const key = target.closest('[data-skill]')?.dataset.skill;
        if (!key) return;
        const skill = this.document.system.skills[key];

        if (event.shiftKey) skill.talent -= 1;
        else skill.talent += 1;

        if (skill.talent > 2) skill.talent = 0;
        if (skill.talent < 0) skill.talent = 2;

        this.document.update({ [`system.skills.${key}`]: skill });
    }
}