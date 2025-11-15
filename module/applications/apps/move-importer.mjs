import PtaActor from "../../documents/actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";

export default class MoveImporter extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: ['importer'],
        window: {
            title: "PTA.App.PokemonImporter",
            icon: "fa-solid fa-download",
            minimizable: false,
            resizeable: false,
        },
        position: {
            width: 600,
            height: 800
        },
        actions: {
            search: this._onSearch,
            select: this._onSelect,
            submit: this._onSubmit,
            remove: this._onRemove,
        }
    }

    move_selections = [];

    static get PARTS() {
        let p = {};
        p.main = { template: PTA.templates.app.importMoves }
        return p;
    }

    async _prepareContext() {
        let context = super._prepareContext();
        context.id = this.id;
        return context;
    }

    actor = undefined;

    async linkActor(actor) {
        if (typeof actor == 'string') actor = await fromUuid(actor);
        if (!actor || !actor instanceof PtaActor) return false

        this.actor = actor;
        return true;
    }

    static async _onSearch(event, target) {
        utils.info('PTA.Info.LoadingPleaseWait');
        const content = this.element.querySelector('section.window-content');
        const searchInput = content.querySelector('.search-input');
        const query = searchInput.value.toLowerCase().replace(' ', '-')

        const search_list = [];
        // compile a list of valid pokemon
        for (const move of PTA.Pokedex.Moves) if (move.startsWith(query)) search_list.push(move);

        const wrapper = this.element.querySelector('.search-results');
        while (wrapper.lastChild) wrapper.removeChild(wrapper.lastChild);

        // goes through and comppiles a list of the pokemon available
        for (const move of search_list) {
            // add the pokemon to the element search results
            let ele = document.createElement('LI');
            ele.setAttribute('data-action', 'select');
            ele.setAttribute('data-move', move);
            ele.setAttribute('style', 'margin: 8px 0; font-size: 1.2em;');
            ele.innerHTML = `
                ${utils.toTitleCase(move)}
            `
            wrapper.appendChild(ele);
        }

        return void utils.info('PTA.Info.FinishedLoading');;
    }

    static async _onSelect(event, target) {
        // get the relevant data ready to use
        const selection_list = this.element.querySelector('.pta-selection-list .wrapper');
        const move_name = target.closest('[data-move]').dataset.move;

        if (this.move_selections.includes(move_name)) return;

        this.move_selections.push(move_name);// add result to selections

        // add an element to the selection list so theu can be tracked / removed
        let ele = document.createElement('DIV');
        ele.setAttribute('data-move', move_name);
        ele.setAttribute('style', 'flex: 0');
        selection_list.appendChild(ele);
        ele.innerHTML = `
            <a class="content-link flexrow nowrap" data-action="remove">${move_name} <i class="fas fa-trash"></i></a>
        `;
    }

    static async _onRemove(event, target) {
        let element = target.closest('[data-move]');
        let move_name = element.dataset.move;
        let index = this.move_selections.findIndex((i) => i == move_name);
        this.move_selections.splice(index, 1);
        element.remove();
    }

    static async _onSubmit(event, target) {
        const create_data = [];
        utils.info('PTA.Info.SubmittingPleaseWait');
        this.close();
        for (const move of this.move_selections) {
            let data = utils.parseMoveData(await pokeapi.move(move));
            if (!data) continue;
            create_data.push({
                name: utils.toTitleCase(move.replace('-', ' ')),
                type: 'move',
                system: data,
            })
        }

        // if this importer instance was linked to an actor, moves are imported as theirs
        let create_config = {};
        if (this.actor) {
            create_config.parent = this.actor;
        }

        Item.create(create_data, create_config);
        utils.info('PTA.Info.ImportComplete');
        this.move_selections = [];
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Add event listeners for making everything work
        const content = this.element.querySelector('section.window-content');
        if (!content) return;

        const searchData = content.querySelector('form.search-data');
        const searchList = content.querySelector('datalist');
        const searchInput = content.querySelector('.search-input');

        searchData.addEventListener('submit', (event) => {
            if (event.preventDefault) event.preventDefault();
            this.options.actions.search.call(this, event, searchInput);
            return false;
        })

        // add the auto complete search results
        searchInput.addEventListener('input', (event) => {
            const query = searchInput.value.toLowerCase().replaceAll(" ", "-");
            const sorted = utils.duplicate(PTA.Pokedex.Moves).sort();
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return;

            //Go through the sorted array to get the proper results
            for (const entry of sorted) {
                if (entry.startsWith(query)) matches.push(entry);
                if (matches.length >= 5) break;
            }

            // create new elements
            while (searchList.lastChild) searchList.removeChild(searchList.lastChild);

            for (const m of matches) {
                const e = document.createElement('option');
                e.value = m;
                searchList.appendChild(e);
            }
        });
    }
}