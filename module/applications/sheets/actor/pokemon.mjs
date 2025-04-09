import { PTA } from "../../../helpers/config.mjs";
import pokeapi from "../../../helpers/pokeapi.mjs";
import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaActorSheet from "../actor.mjs";

export default class PtaPokemonSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        window: {
            controls: [{
                icon: 'fas fa-user-circle',
                label: 'TOKEN.TitlePrototype',
                action: 'configurePrototypeToken',
                ownership: 3
            }, {
                icon: 'fas fa-image',
                label: 'SIDEBAR.CharArt',
                action: 'showPortraitArtwork',
                ownership: 3
            }, {
                icon: 'fas fa-image',
                label: 'SIDEBAR.TokenArt',
                action: 'showTokenArtwork',
                ownership: 3
            }, {
                icon: 'fas fa-rotate',
                label: PTA.generic.sync,
                action: 'syncData',
                ownership: 3
            }, {
                icon: 'fas fa-download',
                label: PTA.generic.import,
                action: 'importData',
                ownership: 3
            }]
        },
        actions: {
            importData: this._onImportData,
            syncData: this._onSyncData
        }
    }

    static get PARTS() {
        const p = super.PARTS;
        // Load in the main body
        p.body = { template: 'systems/pta3/templates/actor/pokemon/body.hbs' };
        // Load in the template tabs
        p.features = { template: 'systems/pta3/templates/actor/pokemon/features.hbs' };
        p.effects = { template: 'systems/pta3/templates/actor/parts/actor-effects.hbs' };
        p.pokedex = { template: 'systems/pta3/templates/actor/pokemon/pokedex.hbs' };
        p.details = { template: 'systems/pta3/templates/actor/pokemon/details.hbs' }
        // Populate the tabs with further parts
        p.abilities = { template: 'systems/pta3/templates/actor/parts/abilities.hbs' };
        return p;
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details" },
        pokedex: { id: "pokedex", group: "primary", label: "PTA.Tab.Pokedex" },
    }

    tabGroups = {
        primary: "features"
    }

    //============================================================================================================
    // Sheet Actions
    //============================================================================================================
    static async _onImportData() {
        let pokemon = await utils.importPokemonData({ all: true });
        console.log('pokemon', pokemon)
    }

    static async _onSyncData() {
        // get the pokemons name / species, check against our downlaoded pokedex
        let search = this.document.system.species.toLowerCase().replace(' ', '-');
        let set_species = false;

        // check for pokemon by it's lsited species first
        if (!PTA.Pokedex.getPokemon(search)) {
            search = this.document.name.toLowerCase().replace(' ', '-');
            set_species = true;
            // if we cant find one, then we check it by name
            if (!PTA.Pokedex.getPokemon(search)) return void utils.error('PTA.Error.SyncFailedUnknownPokemon');
        }

        // obtain and parse the pokemon data
        let pokemon = await utils.importPokemonData({ species: true, forms: true, name: search });
        let update_data = utils.parsePokemonData(pokemon);

        if (!set_species) delete update_data.species;

        console.log(pokemon);
        console.log(update_data);

        update_data.hp.value = Math.min(this.document.system.hp.value, update_data.hp.max);

        await this.document.update({ system: update_data })
        this.render(false);
    }

    //============================================================================================================
    // Sheet rendering
    //============================================================================================================
    async render(options = {}) {
        // register trainers sheet application as a dependency to be re rendered
        if (this.document.system.trainer != '') {
            let trainer = await fromUuid(this.document.system.trainer);
            if (trainer) this.document.apps[trainer.sheet.id] = trainer.sheet;
        }

        super.render(options);
    }

}