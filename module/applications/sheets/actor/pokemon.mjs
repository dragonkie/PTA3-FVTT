import { PTA } from "../../../helpers/config.mjs";
import pokeapi from "../../../helpers/pokeapi.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaActorSheet from "../actor.mjs";

export default class PtaPokemonSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        window: {
            controls: [{
                icon: 'fas fa-user-circle',
                label: 'TitlePrototype',
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

    //=============================================================
    // Sheet Actions
    //=============================================================
    static async _onImportData() {
        let pokemon = await pta.utils.importPokemonData({ all: true });
        console.log('pokemon', pokemon)
    }

    static async _onSyncData() {
        let pokemon = await pta.utils.importPokemonData({ species: true, forms: true, name: this.document.name });
        console.log('pokemon', pokemon)
        console.log(this.document.system);

        console.log(pokemon.stats.find((e) => { return e.stat.name == 'hp' }))
        console.log(pokemon.stats[0])

        let update_data = {
            hp: { max: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'hp' }).base_stat / 10) * game.settings.get(game.system.id, 'healthMult') },
            stats: {
                atk: { value: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'attack' }).base_stat / 10) },
                def: { value: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'defense' }).base_stat / 10) },
                spd: { value: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'speed' }).base_stat / 10) },
                satk: { value: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'special-attack' }).base_stat / 10) },
                sdef: { value: Math.round(pokemon.stats.find((s) => { return s.stat.name == 'special-defense' }).base_stat / 10) },
            },
            types: {
                primary: pokemon.types[0].type.name,
                secondary: pokemon.types[1] ? pokemon.types[1].type.name : 'none'
            }
        };

        update_data.hp.value = Math.min(this.document.system.hp.value, update_data.hp.max);



        await this.document.update({ system: update_data })
        this.render(false);
    }

    //=============================================================
    // Sheet rendering
    //=============================================================

}