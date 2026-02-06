import { PTA } from "../../../helpers/config.mjs";
import pokeapi from "../../../helpers/pokeapi.mjs";
import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaActorSheet from "../actor.mjs";

export default class PtaPokemonSheet extends PtaActorSheet {
    static DEFAULT_OPTIONS = {
        window: {
            controls: [{
                icon: 'fas fa-rotate',
                label: PTA.generic.sync,
                action: 'syncData',
                ownership: 3
            }, {
                icon: 'fas fa-download',
                label: PTA.generic.import,
                action: 'importData',
                ownership: 3
            }, {
                icon: 'fas fa-upload',
                label: PTA.generic.export,
                action: 'exportData',
                ownership: 3
            }]
        },
        actions: {
            importData: this._onImportData,
            exportData: this._onExportData,
            syncData: this._onSyncData
        }
    }

    static get PARTS() {
        const p = super.PARTS;
        // Load in the main body
        p.body = { template: `${this.TEMPLATE_PATH}/actor/pokemon/body.hbs` };

        // Load in the template tabs
        p.features = { template: `${this.TEMPLATE_PATH}/actor/pokemon/features.hbs` };
        p.skills = { template: `${this.TEMPLATE_PATH}/actor/pokemon/skills.hbs` };
        p.effects = { template: `${this.TEMPLATE_PATH}/actor/parts/actor-effects.hbs` };
        p.pokedex = { template: `${this.TEMPLATE_PATH}/actor/pokemon/pokedex.hbs` };
        p.details = { template: `${this.TEMPLATE_PATH}/actor/pokemon/details.hbs` };

        return p;
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features", icon: "fa-user" },
        skills: { id: "skills", group: "primary", label: "PTA.Tab.Skills", icon: "fa-hand" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects", icon: "fa-sparkles" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details", icon: "fa-book" },
        pokedex: { id: "pokedex", group: "primary", label: "PTA.Tab.Pokedex", icon: "fa-circle-info" },
    }

    tabGroups = {
        primary: "features"
    }

    //============================================================================================================
    //> Sheet Actions
    //============================================================================================================
    static async _onImportData() {
        let pokemon = await utils.importPokemonData({ all: true });
    }

    /**
     * 
     */
    static _onExportData() {
        // function for creating a downloadable element to store the data
        function download(content, fileName, contentType) {
            const a = document.createElement("a");
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
        }

        // gather and prepare needed actor data
        const doc = this.document;
        const data = doc.toObject();
        var json = JSON.stringify(data);

        // filter out uneccessary fields
        json = json.replaceAll(/,"_stats":{(.*?)}/gm, "");

        download(json, `${doc.name}.json`, 'text/plain');
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

        update_data.hp.value = Math.min(this.document.system.hp.value, update_data.hp.max);

        await this.document.update({ system: update_data })
        this.render(false);
    }

    async _renderFrame(options) {
        const frame = await super._renderFrame(options);

        frame.appendChild(await this._renderBookmarks(options));

        // send back the final frame
        return frame;
    }

    //============================================================================================================
    //> Sheet rendering
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