import pokeapi from "../../helpers/pokeapi.mjs";
import { PTA } from "../../helpers/config.mjs";
import PtaApplication from "../app.mjs";

export default class ServerBrowser extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: ['browser'],
        window: {
            title: "PTA.App.ServerBrowser",
            icon: "fa-solid fa-wifi",
            minimizable: false,
            resizeable: false,
        },
        position: {
            width: 600,
            height: 600
        },
        actions: {
            search: this._onSearch,
            select: this._onSelect,
            submit: this._onSubmit
        }
    }

    static get PARTS() {
        let p = {};
        p.main = { template: PTA.templates.app.remoteAssetBrowser }
        return p;
    }

    constructor(options = {}) {
        super(options);

        if (!options.uuid || !options.path) throw new Error('Server resource browse needs a target destination');
        this.target = {
            uuid: options.uuid,
            path: options.path
        }
    }

    async _prepareContext() {
        let context = super._prepareContext();
        context.id = this.id;
        return context;
    }

    static async _onSearch(event, target) {
        const content = this.element.querySelector('section.window-content');
        const searchType = content.querySelector('select[name=query-type]');
        const searchKey = content.querySelector(`option[value=${searchType.value}]`);
        const searchInput = content.querySelector('.search-input');

        // Get the pokemon if its possible
        let data = await pokeapi.request(`${pokeapi.url}${searchKey.dataset.api}/${searchInput.value}`);
        if (!data) return;

        // create the grid of sprites to choose from
        const gallery = content.querySelector('.sprite-gallery');
        while (gallery.lastChild) gallery.removeChild(gallery.lastChild);

        // gather the list of img sources
        const sprites = [];
        const groups = [data.sprites];
        for (const g of groups) {
            if (!g) continue;
            for (const [key, value] of Object.entries(g)) {
                if (typeof value === 'object') groups.push(value);
                else if (typeof value === 'string') sprites.push(value)
            }
        }

        for (const s of sprites) {
            const w = document.createElement('div');
            w.classList.add('sprite-wrapper');
            w.setAttribute("data-action", "select");
            const e = document.createElement('img');
            e.classList.add("sprite");
            e.src = s;
            e.styles = "object-fit: contain;"
            w.appendChild(e);
            gallery.appendChild(w);
        }
    }

    static async _onSelect(event, target) {
        const content = this.element.querySelector('section.window-content');
        const img = target.querySelector('.sprite');
        const url = img.src;
        const submit = content.querySelector('[name=image-url]');
        submit.value = url;
    }

    static async _onSubmit(event, target) {
        const content = this.element.querySelector('section.window-content');
        const url = content.querySelector('input[name=image-url]').value;
        const doc = await fromUuid(this.target.uuid);
        if (!doc || !url) return void console.error('Missing data to submit image', { url: url, doc: doc, uuid: this.uuid });

        doc.update({ [this.target.path]: url });
        this.close();
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Add event listeners for making everything work
        const content = this.element.querySelector('section.window-content');
        if (!content) return;

        const searchList = content.querySelector('datalist');
        const searchInput = content.querySelector('.search-input');
        const searchSubmit = content.querySelector('button[data-action=search]');
        const searchType = content.querySelector('select[name=query-type]');

        // add the auto complete search results
        searchInput.addEventListener('input', (event) => {
            const query = searchInput.value.toLowerCase();
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return void console.error('search query to small');

            // select the right data array to search in
            const sArray = pta.utils.duplicate(pta.config.Pokedex[searchType.value]).sort();
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