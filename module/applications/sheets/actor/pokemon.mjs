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
            syncData: this._onSyncData,
            editEggGroups: this._onEditEggGroups,
        }
    }

    static PARTS = {
        body: { template: `${this.TEMPLATE_PATH}/actor/pokemon/body.hbs` },
        features: { template: `${this.TEMPLATE_PATH}/actor/shared/features.hbs` },
        combat: { template: `${this.TEMPLATE_PATH}/actor/shared/combat.hbs` },
        effects: { template: `${this.TEMPLATE_PATH}/actor/parts/actor-effects.hbs` },
        pokedex: { template: `${this.TEMPLATE_PATH}/actor/pokemon/pokedex.hbs` },
        details: { template: `${this.TEMPLATE_PATH}/actor/pokemon/details.hbs` }
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features", icon: "fa-user" },
        combat: { id: "combat", group: "primary", label: "PTA.Tab.Combat", icon: "fa-sword" },
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
        let update_data = utils.parseCompanionData(pokemon);

        await this.document.update({ system: update_data })
        this.render(false);
    }

    static async _onEditEggGroups() {
        const context = {};
        context.fields = {}
        context.actor = this.document;
        context.system = context.actor.system;

        // outline base values for the fields
        for (const [key, value] of Object.entries(PTA.eggTypes)) {
            context.fields[key] = {
                label: utils.localize(value),
                active: false,
                element: null
            }
        }

        // check the lsit and activate any that require it
        for (const egg of context.system.eggTypes) context.fields[egg].active = true;

        // generate the inputs in the fields
        for (const [key, value] of Object.entries(context.fields)) {
            value.element = new foundry.data.fields.BooleanField({
                name: key,
                label: value.label,
                initial: value.active,
            }).toFormGroup();

            value.element.setAttribute('data-egg', key);

            value.element = value.element.outerHTML;
        }

        console.log('egg config context', context)


        const appContent = await utils.renderTemplate(PTA.templates.dialog.configEggGroups, context);
        const app = await new PtaDialog({
            window: {
                title: PTA.windowTitle.configEggGroups
            },
            id: `Actor.${this.document.id}.egg-config`,
            content: appContent,
            buttons: [{
                action: 'cancel',
                label: 'Cancel'
            }, {
                action: 'confirm',
                label: 'Confirm'
            }],
            submit: (result) => {
                if (result != 'confirm') return;

                const list = [];
                const inputs = app.element.querySelectorAll('[data-egg]');

                for (const input of inputs) {
                    let egg = input.dataset.egg;
                    let active = input.querySelector('input').checked;
                    if (active) list.push(egg);
                }

                this.document.update({ system: { eggTypes: list } })
            }
        }).render(true);
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
    async _preRender(context, options) {

        console.log(this);
        console.log({ context, options });
        return super._preRender(context, options);
    }

    async render(options = {}) {
        // register trainers sheet application as a dependency to be re rendered
        if (this.document.system.trainer != '') {
            let trainer = await fromUuid(this.document.system.trainer);
            if (trainer) this.document.apps[trainer.sheet.id] = trainer.sheet;
        }

        super.render(options);
    }

}