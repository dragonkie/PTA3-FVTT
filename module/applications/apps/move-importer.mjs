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
        p.main = { template: 'systems/pta3/templates/apps/move-importer.hbs' }
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
        const selection_list = this.element.querySelector('.selection-list .wrapper');
        const move_name = target.closest('[data-move]').dataset.move;

        if (this.move_selections.includes(move_name)) return;

        this.move_selections.push(move_name);// add result to selections

        // add an element to the selection list so theu can be tracked / removed
        let ele = document.createElement('DIV');
        ele.setAttribute('data-move', move_name);
        ele.setAttribute('style', 'flex: 0');
        selection_list.appendChild(ele);
        ele.innerHTML = `
            <a class="content-link" data-action="remove">${move_name} <i class="fas fa-trash"></i></a>
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
            const query = searchInput.value.toLowerCase();
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return;

            // select the right data array to search in
            const sArray = utils.duplicate(PTA.Pokedex.Moves).sort();
            if (!sArray) return void console.error('didnt find an array');

            // prepare the search indexing
            let dist = Math.floor(sArray.length - 1) / 2;
            let index = dist;
            let done = false;
            let final = false;

            //compare the strings and get five results
            while (!done) {
                if (final) return void console.error('failed to find result');
                // halves the distance the jump can be, if it hits 0 we fucked up and break the loop
                dist = dist / 2;
                if (dist <= 0.5) final = true; // if the jump distance makes it to less than one, we try one more time then quit
                dist = Math.round(dist);
                index = Math.min(Math.max(Math.round(index), 0), sArray.length - 1); // constrain the index to the array
                let dir = query.localeCompare(sArray[index].substring(0, query.length))
                if (dir > 0) {// positive means search is farther ahead
                    index += dist;
                } else if (dir < 0) { // negative Means the search query is before
                    index -= dist;
                } else { // the two are equal
                    //this means an exact match, we can work backwards from here until we no longer match then return the first five results
                    done = true;
                    // we need to loop backwards from this index until it no longer matches, as soon as it doesnt, we can leave the loop and pass the matching results from there
                    let backtracking = true;
                    let offset = 0;
                    while (backtracking) {
                        if (index - offset < 0) {
                            index = 0;
                            offset = 0;
                            backtracking = false;
                        } else if (query.localeCompare(sArray[index - offset].substring(0, query.length)) != 0) {
                            offset -= 1;
                            backtracking = false;
                        }

                        if (!backtracking) {
                            for (let i = 0; i < 5; i++) {
                                if (query.localeCompare(sArray[index - offset + i].substring(0, query.length) == 0)) matches.push(sArray[index - offset + i]);
                            }
                        } else offset += 1;
                    }
                }
                // insurance to make sure the index can't go out of scope
                index = Math.min(Math.max(Math.round(index), 0), sArray.length - 1);
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