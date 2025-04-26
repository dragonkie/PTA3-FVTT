import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";

export default class PokemonImporter extends PtaApplication {
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

    pokemon_selections = [];

    static get PARTS() {
        let p = {};
        p.main = { template: 'systems/pta3/templates/apps/pokemon-importer.hbs' }
        return p;
    }

    async _prepareContext() {
        let context = super._prepareContext();
        context.id = this.id;
        return context;
    }

    static async _onSearch(event, target) {
        utils.info('PTA.Info.LoadingPleaseWait');
        const content = this.element.querySelector('section.window-content');
        const searchInput = content.querySelector('.search-input');
        const query = searchInput.value.toLowerCase().replace(' ', '-')

        const search_list = [];
        // compile a list of valid pokemon
        for (const i of PTA.Pokedex.Pokemon) if (i.name.startsWith(query)) search_list.push(i);

        const wrapper = this.element.querySelector('.search-results');
        while (wrapper.lastChild) wrapper.removeChild(wrapper.lastChild);

        // goes through and comppiles a list of the pokemon available
        for (const p of search_list) {
            // add the pokemon to the element search results
            let ele = document.createElement('DIV');
            ele.setAttribute('data-action', 'select');
            ele.setAttribute('data-pokemon', p.name);
            ele.setAttribute('style', 'flex: 0; border: 1px solid white;')
            ele.innerHTML = `
                <div style="text-align: center;">${p.name}</div>
                <img src=${pokeapi.Sprite.Official(p.id)} style="min-width: 100px; min-height: 100px; border: 0;">
            `
            wrapper.appendChild(ele);
        }

        return void utils.info('PTA.Info.FinishedLoading');;
    }

    static async _onSelect(event, target) {
        // get the relevant data ready to use
        const selection_list = this.element.querySelector('.selection-list .wrapper');
        const pokemon_name = target.closest('[data-pokemon]').dataset.pokemon;

        // add the pokemon to our list of selections
        if (this.pokemon_selections.find((p) => p.name == pokemon_name)) return; // cancel if its already in lsit
        const pokemon = PTA.Pokedex.getPokemon(pokemon_name);
        if (!pokemon) return void utils.error(`PTA.Error.PokemonNotFound`);// validate we got a result
        this.pokemon_selections.push(pokemon);// add result to selections

        // add an element to the selection list so theu can be tracked / removed
        let ele = document.createElement('DIV');
        ele.setAttribute('data-pokemon', pokemon.name);
        ele.setAttribute('style', 'flex: 0');
        selection_list.appendChild(ele);
        ele.innerHTML = `
            <a class="content-link" data-action="remove">${pokemon.name} <i class="fas fa-trash"></i></a>
        `;
    }

    static async _onRemove(event, target) {
        let element = target.closest('[data-pokemon]');
        let pokemon_name = element.dataset.pokemon;
        let index = this.pokemon_selections.findIndex((i) => i.name == pokemon_name);
        this.pokemon_selections.splice(index, 1);
        element.remove();
    }

    static async _onSubmit(event, target) {
        const create_data = [];
        utils.info('PTA.Info.SubmittingPleaseWait');
        this.close();
        for (const pokemon of this.pokemon_selections) {
            let data = utils.parsePokemonData(await pokeapi.pokemon(pokemon.name));
            if (!data) continue;
            data.hp.value = data.hp.max;
            create_data.push({
                name: utils.toTitleCase(pokemon.name),
                type: 'pokemon',
                system: data,
                img: pokeapi.Sprite.Official(pokemon.id),
                prototypeToken: {
                    texture: {
                        src: pokeapi.Sprite.Official(pokemon.id)
                    }
                }
            })
        }
        Actor.create(create_data);
        utils.info('PTA.Info.ImportComplete');
        this.pokemon_selections = [];
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Add event listeners for making everything work
        const content = this.element.querySelector('section.window-content');
        if (!content) return;

        const searchList = content.querySelector('datalist');
        const searchInput = content.querySelector('.search-input');

        // add the auto complete search results
        searchInput.addEventListener('input', (event) => {
            const query = searchInput.value.toLowerCase();
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return;

            // select the right data array to search in
            const sArray = utils.duplicate(PTA.Pokedex.Pokemon).sort((a, b) => a.name - b.name);
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
                let dir = query.localeCompare(sArray[index].name.substring(0, query.length))
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
                        } else if (query.localeCompare(sArray[index - offset].name.substring(0, query.length)) != 0) {
                            offset -= 1;
                            backtracking = false;
                        }

                        if (!backtracking) {
                            for (let i = 0; i < 5; i++) {
                                if (query.localeCompare(sArray[index - offset + i].name.substring(0, query.length) == 0)) matches.push(sArray[index - offset + i]);
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
                e.value = m.name;
                searchList.appendChild(e);
            }
        });
    }
}