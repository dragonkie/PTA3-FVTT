import PtaActorSheet from "../actor.mjs";

export default class PtaPokemonSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ["character"]
    }

    static get PARTS() {
        const p = super.PARTS;
        // Load in the main body
        p.body = { template: 'systems/pta3/templates/actor/pokemon/body.hbs' };
        // Load in the template tabs
        p.features = { template: 'systems/pta3/templates/actor/pokemon/features.hbs' };
        p.inventory = { template: 'systems/pta3/templates/actor/pokemon/inventory.hbs' };
        p.effects = { template: 'systems/pta3/templates/actor/parts/actor-effects.hbs' };
        p.pokedex = { template: 'systems/pta3/templates/actor/pokemon/pokedex.hbs' };
        p.details = { template: 'systems/pta3/templates/actor/pokemon/details.hbs'}
        // Populate the tabs with further parts
        p.abilities = { template: 'systems/pta3/templates/actor/parts/abilities.hbs' };
        return p;
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features" },
        inventory: { id: "inventory", group: "primary", label: "PTA.Tab.Inventory" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects" },
        pokedex: { id: "pokedex", group: "primary", label: "PTA.Tab.Pokedex" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details"}
    }

    tabGroups = {
        primary: "features"
    }


}