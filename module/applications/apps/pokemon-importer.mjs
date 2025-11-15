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
        p.main = { template: PTA.templates.app.importPokemon }
        return p;
    }

    async _prepareContext() {
        let context = super._prepareContext();
        context.id = this.id;
        return context;
    }

    static async _onSelect(event, target) {
        // get the relevant data ready to use
        const selection_list = this.element.querySelector('.pta-selection-list .wrapper');
        const pokemon_name = target.closest('[data-pokemon]').dataset.pokemon;

        // add the pokemon to our list of selections
        if (this.pokemon_selections.find((p) => p.name == pokemon_name)) return; // cancel if its already in lsit
        const pokemon = PTA.Pokedex.getPokemon(pokemon_name);
        if (!pokemon) return void utils.error(`PTA.Error.PokemonNotFound`);// validate we got a result
        this.pokemon_selections.push(pokemon);// add result to selections

        // add an element to the selection list so theu can be tracked / removed
        let ele = document.createElement('DIV');
        ele.setAttribute('data-pokemon', pokemon.name);
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
        function getFlavorText(entries) {
            for (const entry of entries) {
                if (entry.language.name == game.i18n.lang) return entry.flavor_text
            }
            return '';
        }

        const create_data = [];
        this.close();
        for (const pokemon of this.pokemon_selections) {
            const api_pokemon = await pokeapi.pokemon(pokemon.name);
            const api_speices = await pokeapi.species(api_pokemon.species.name);
            const data = utils.parsePokemonData(api_pokemon);
            data.description = getFlavorText(api_speices.flavor_text_entries);

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
        this.pokemon_selections = [];
    }

    static async _onSearch(event, target) {
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
            ele.setAttribute('style', 'min-width: 100px; min-height: 100px; flex: 0');
            ele.classList.add('pta-grid-item')
            ele.classList.add('flexcol')
            ele.innerHTML = `
                <div style="text-align: center; text-overflow: ellipsis; text-wrap: nowrap; width: 100%; overflow: hidden;">${p.name}</div>
                <img src=${pokeapi.Sprite.Official(p.id)} style="min-width: 100px; min-height: 100px; max-width: 100px; max-height: 100px; border: 0;">
            `
            wrapper.appendChild(ele);
        }
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Add event listeners for making everything work
        const content = this.element.querySelector('section.window-content');
        if (!content) return;

        const searchData = content.querySelector('form.search-data')
        const searchList = content.querySelector('datalist');
        const searchInput = content.querySelector('.search-input');

        searchData.addEventListener('submit', (event) => {
            if (event.preventDefault) event.preventDefault();
            this.options.actions.search.call(this, event, searchInput);
            return false;
        })

        // add the auto complete search results
        searchInput.addEventListener('input', (event) => {
            const query = searchInput.value.toLowerCase().replace(' ', '-');
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return;

            // select the right data array to search in
            const sorted = utils.duplicate(PTA.Pokedex.Pokemon).sort((a, b) => a.name.localeCompare(b.name));

            // prepare the search indexing
            let dist = Math.floor(sorted.length - 1) / 2;

            //compare the names and id and get at most five results to populate the field with
            for (const entry of sorted) {
                const { name, id } = entry;
                if (name.startsWith(query) || Number(id) == Number(query)) matches.push(entry);
                if (matches.length >= 5) break;
            }

            // Empty the old list
            while (searchList.lastChild) searchList.removeChild(searchList.lastChild);

            // populate it with new options
            for (const m of matches) {
                const e = document.createElement('option');
                e.value = m.name;
                searchList.appendChild(e);
            }
        });
    }
}