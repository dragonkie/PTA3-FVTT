import PtaActor from "../../documents/actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";
import PtaDialog from "../dialog.mjs";

export default class MoveImporter extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: ['importer'],
        window: {
            title: PTA.windowTitle.moveImporter,
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

    static PARTS = {
        main: { template: PTA.templates.app.importMoves }
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

    static importAllMoves() {
        importAllMovesFromCSV();
    }
}

async function importAllMovesFromCSV() {
    if (!await PtaDialog.confirm({
        content: `
        <p>Are you sure you'd like to import all of the moves?</p>\n
        <p>This feature relies on the <a href="https://pokeapi.co">pokeapi</a> service. Part of this is that pokeapi asks you don't use this feature often.</p>
        <p>Please only run the importer if <i>absolutely neccessary</i> to help keep costs low for the ones hosting this amazing tool and service, free of charge!</p>
        <p><b>Pokémon(c) and Pokémon(c) character names are trademarks of Nintendo.</b></p>`,
        modal: true
    })) return;

    var csv = null;
    var xmlhttp = new XMLHttpRequest();
    await xmlhttp.open("GET", 'systems/pta3/lib/moves.csv', false);
    await xmlhttp.send();
    if (xmlhttp.status == 200) {
        csv = xmlhttp.responseText;
    }

    const rows = csv.split(/\n/);
    const headerRow = rows.shift();

    // group all pieces into their proper data sets
    const sets = [];
    for (const row of rows) {
        const pieces = row.split("|");

        let uses = pieces[4];
        if (uses == "3/day") uses = 3;
        else if (uses == "1/day" || uses == "1/GMAX") uses = 1;
        else uses = 0;

        sets.push({
            name: pieces[0],
            type: 'move',
            img: '',
            system: {
                range: {
                    value: Number(pieces[15]),
                    type: Number(pieces[15]) > 5 ? "ranged" : "melee"
                },
                type: pieces[2],
                category: pieces[3]?.toLowerCase(),
                //frequency: pieces[i + 4],
                damage: {
                    formula: `${pieces[5]}${pieces[6]}`
                },
                accuracy: pieces[7],
                description: pieces[8],
                uses: {
                    value: uses,
                    max: uses
                }
            }
        });
    }

    // filter and adjust the data to match the schema
    for (const move of sets) {
        if (typeof move.system.type == 'string') move.system.type = move.system.type.toLowerCase();
        if (!Object.keys(PTA.pokemonTypes).includes(move.system.type)) move.system.type = "normal";
        if (!move.system.type) move.system.type = "normal";
        if (move.name == "") move.name = "New Move";

        if (typeof move.system.range.value != 'number') move.system.range.value = move.system.range.type == "melee" ? 5 : 30;

        if (move.system.category == 'special') move.img = 'icons/svg/daze.svg';
        else if (move.system.category == 'attack') move.img = 'icons/svg/explosion.svg';
        else move.img = 'icons/svg/acid.svg';
    }

    console.log(sets);

    // gather the moves from the pokeapi reference, everything should be checked against
    console.log(PTA.Pokedex.Moves);
    for (const move of sets) {
        try {
            if (!PTA.Pokedex.Moves.includes(utils.sluggify(move.name))) {
                console.log("Invalid name, skipping api call...", utils.sluggify(move.name));
                continue;
            }
            const apiData = await pokeapi.move(utils.sluggify(move.name));
            if (!apiData) {
                console.log("Failed to retrieve api, skipping...", utils.sluggify(move.name));
                continue;
            }

            // prepare initial api data pass, needs to be parsed further along
            move.system.api = {
                id: apiData.id,
                name: apiData.name,
                accuracy: apiData.accuracy,
                effect_chance: apiData.effect_chance,
                pp: apiData.pp,
                priority: apiData.priority,
                power: apiData.power,
                contest_combos: {
                    normal: {
                        use_before: apiData.contest_combos?.normal?.use_before?.map(e => e.name),
                        use_after: apiData.contest_combos?.normal?.use_after?.map(e => e.name)
                    },
                    super: {
                        use_before: apiData.contest_combos?.super?.use_before?.map(e => e.name),
                        use_after: apiData.contest_combos?.super?.use_after?.map(e => e.name)
                    }
                },
                contest_type: apiData?.contest_type?.name,
                contest_effect: {
                    appeal: 0,
                    id: 0,
                    jam: 0,
                },
                damage_class: apiData.damage_class?.name,
                effect_chance: apiData.effect_chance,
                effect_entries: apiData?.effect_entries.map(e => { return { effect: e.effect, short_effect: e.short_effect, language: e.language.name } }),
                flavour_text_entries: apiData?.flavor_text_entries?.map(e => { return { flavour_text: e.flavor_text, language: e.language.name, version_group: e.version_group.name } }),
                generation: apiData.generation?.name,
                meta: {
                    ailment: apiData.meta?.ailment?.name,
                    ailment_chance: apiData?.meta?.ailment_chance,
                    category: apiData.meta?.category.name,
                    crit_rate: apiData.meta?.crit_rate,
                    drain: apiData.meta?.drain,
                    flinch_chance: apiData.meta?.flinch_chance,
                    healing: apiData.meta?.healing,
                    max_hits: apiData.meta?.max_hits,
                    max_turns: apiData.meta?.max_turns,
                    min_hits: apiData.meta?.min_hits,
                    min_turns: apiData.meta?.min_turns,
                    stat_chance: apiData.meta?.stat_chance
                },
                names: apiData?.names?.map(e => { return { name: e.name, language: e.language.name } }),
                stat_changes: apiData?.stat_changes?.map(e => { return { change: e.change, stat: e.stat.name } }),
                super_contest_effect: {
                    appeal: 0,
                    id: 0
                },
                target: apiData.target.name,
                type: apiData.type.name,
            }

            // use the api data to populate the moves regular data fields
            move.system.drain = move.system.api.meta.drain;
            move.system.priority = move.system.api.priority;
            if (move.system.api.meta.ailment) move.system.ailment = {
                type: move.system.api.meta.ailment,
                chance: move.system.api.meta.ailment_chance
            }
            move.system.multi_hit = {
                max: move.system.api.meta.max_hits,
                min: move.system.api.meta.min_hits,
            }

            console.log("Api enriched move data", move);
        } catch (err) {
            console.error(err);
        }
    }

    ui.notifications.notify("Creating documents, please wait");
    await Item.implementation.createDocuments(sets, { pack: 'pta3.moves' });
    ui.notifications.clear();
    ui.notifications.notify("Finished creating documents!");
}