import PokemonImporter from "../applications/apps/pokemon-importer.mjs";
import MoveImporter from "../applications/apps/move-importer.mjs";
import utils from "./utils.mjs";
import CompendiumBrowser from "../applications/apps/compendium-browser.mjs";
import { PTA } from "./config.mjs";

/**
 * @callback HooksOn
 * @param {String} hook - the event to be called on
 * @param {Function} fn - the function to be triggered
 * @param {Object} options - options to customize the registered hook
 * @returns {Number} Id number of the registered hook
 */

/**
 * @callback HookOnce
 * @param {String} hook - the hook to be called on
 * @param {Function} fn - the function to be triggered
 */

/**
 * @callback HookOff
 * @param {String} hook - the event to unregister from
 * @param {Function|Number} fn - the function, or it's id number, to be disabled
 */

/**
 * @typedef {Object} Hooks
 * @prop {HooksOn} on - register a hook to be called
 * @prop {HookOnce} once - register a single use hook
 * @prop {HookOff} off - delist a hook from active duty
 */

export default function registerHooks() {
    const move_importer = new MoveImporter();
    Hooks.on('renderItemDirectory', async (directory, element, data) => {
        /**@type {Element} */
        let ele = element.querySelector('.directory-footer.action-buttons');

        let button = document.createElement('BUTTON');
        button.innerHTML = utils.localize(`PTA.Button.ImportMove`);
        ele.appendChild(button);

        button.addEventListener('click', async () => {
            move_importer.render(true);
        })
    })

    const pokemon_importer = new PokemonImporter();
    const compendium_browser = new CompendiumBrowser();
    Hooks.on('renderActorDirectory', async (directory, element, data) => {

        //==============================================================================
        //> Render API import wizard
        //==============================================================================
        try {
            /**@type {Element} */
            let ele = element.querySelector('.directory-footer.action-buttons');

            const button = document.createElement('BUTTON');
            button.innerHTML = utils.localize(`PTA.Button.ImportPokemon`);
            ele.appendChild(button);

            button.addEventListener('click', async () => {
                pokemon_importer.render(true);
            })
        } catch (err) {
            console.error('Failed to append PokéApi footer in actor directory', err);
        }

        // CURRENTLY DISABLED DUE TO ERRORS
        //==============================================================================
        //> Render comepndium browser button
        //==============================================================================
        /*
        try {
            const cp_browser = document.createElement('BUTTON');
            cp_browser.innerHTML = utils.localize('PTA.Button.CompendiumBrowser');
            let header = element.querySelector('header.directory-header');
            let search = header.querySelector('search');
            header.insertBefore(cp_browser, search);

            cp_browser.addEventListener('click', async () => {
                compendium_browser.render(true);
            })
        } catch (err) {
            console.error('Failed to append compendium browser header in actor directory', err);
        }
            */
    });
}