import PtaActor from "../../documents/actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";

/**
 * Application to manage
 */
export default class CompendiumBrowser extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: ['pta', 'pta-compendium-browser'],
        actions: {},
        window: {
            title: PTA.windowTitle.compendiumBrowser,
            resizable: true,
            minimizable: true,
            controls: [{
                action: '',
                icon: '',
                label: '',
                onClick: () => { return false },
                visible: () => { return true }
            }]
        },
        position: {
            width: 600,
            height: 600
        },
        actions: {

        }
    }

    static PARTS = {
        main: { template: PTA.templates.app.compendiumBrowser },
    }

    static TABS = {
        trainers: { id: 'trainers', group: 'primary', label: 'TAB.ITEM.I18N', icon: '' },
        items: { id: 'items', group: 'primary', label: 'TAB.ITEM.I18N', icon: '' },
        pokemon: { id: 'pokemon', group: 'primary', label: 'TAB.POKEMON.I18N', icon: '' }
    }

    tabGroups = {
        primary: "trainers"
    }

    async _prepareContext() {
        const context = {};

        context.actors = [...game.actors.contents];
        context.config = PTA;
        context.tabs = this._getTabs();
        context.activeTab = 'trainers';
        for (const [key, value] of Object.entries(context.tabs)) {
            if (value.active) context.activeTab = key;
        }

        console.log("Application context", context);
        return context;
    }

    /** @override */
    async _onRender() {
        const rendered = await super._onRender();

        return rendered;
    }
}