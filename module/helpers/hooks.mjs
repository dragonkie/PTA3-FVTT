import PokemonImporter from "../applications/apps/pokemon-importer.mjs";
import MoveImporter from "../applications/apps/move-importer.mjs";
import utils from "./utils.mjs";
import CompendiumBrowser from "../applications/apps/compendium-browser.mjs";
import { PTA } from "./config.mjs";
import PtaDialog from "../applications/dialog.mjs";

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

        // limited importer tool
        let button = document.createElement('BUTTON');
        button.innerHTML = utils.localize(`PTA.Button.ImportMove`);
        ele.appendChild(button);

        button.addEventListener('click', async () => {
            move_importer.render(true);
        })

        // bulk import everything tool
        button = document.createElement('BUTTON');
        button.innerHTML = `Import <b>ALL</b> moves`;
        ele.appendChild(button);

        button.addEventListener('click', async () => {
            MoveImporter.importAllMoves();
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
            console.error('Failed to append PokeApi footer in actor directory', err);
        }

        // CURRENTLY DISABLED DUE TO ERRORS
        //==============================================================================
        //> Render comepndium browser button
        //==============================================================================
        /*
        try {
            const compendium_browser = document.createElement('BUTTON');
            compendium_browser.innerHTML = utils.localize('PTA.Button.CompendiumBrowser');
            let header = element.querySelector('header.directory-header');
            let search = header.querySelector('search');
            header.insertBefore(compendium_browser, search);

            compendium_browser.addEventListener('click', async () => {
                compendium_browser.render(true);
            })
        } catch (err) {
            console.error('Failed to append compendium browser header in actor directory', err);
        }
        */
    });

    //==========================================================================================================
    //> Developer links
    //==========================================================================================================
    Hooks.on('renderSettings', async (settings, html, context, options) => {
        try {
            const section = document.createElement('section');
            section.classList.add('flexcol');

            // create the divider header
            const divider = document.createElement('h4');
            divider.classList.add('divider');
            divider.textContent = 'System Developers';

            // System github
            const git = document.createElement('a');
            git.href = 'https://github.com/dragonkie/PTA3-FVTT';
            git.classList.add('button');
            git.innerHTML = `<i class="fa-brands fa-github"></i> Github`;

            // Ko-fi link
            const kofi = document.createElement('a');
            kofi.href = 'https://ko-fi.com/dragonkie';
            kofi.classList.add('button');
            kofi.innerHTML = `<i class="fas fa-coffee"></i> Ko-Fi`;

            // add everything together
            section.appendChild(divider);
            section.appendChild(git);
            section.appendChild(kofi);

            // append it to the settings tab
            html.appendChild(section);
        } catch (err) {
            console.error('Failed to append developer support links');
        }
    })

    // Asking community for help because I want my patreon account back but they don't believe me :<
    Hooks.once('ready', async (settings, html, context, options) => {
        var banned = game.user.getFlag(game.system.id, 'ban_support');
        if (banned === undefined) {
            game.user.setFlag(game.system.id, 'ban_support', false);
            banned = false;
        } else if (banned) return;

        new PtaDialog({
            classes: ['pta'],
            id: "PTA.Developer.SupportMeGettingMyAccountBackQ_Q",
            modal: true,
            buttons: [{
                action: "finish",
                label: "Okay, now let me play!"
            }, {
                action: "ban",
                label: "Don't show again"
            }],
            content: `
                <div style="max-width: 500px;">
                    <p><b>Hello everyone!</b> You may not know me, but I'm <b>&#0193;sta</b>, the developer + maintainer of the PTA3 foundry system!</p>
                    <p>I hope you've been having fun and the system hasn't had toooo many bugs ^_^ (Yeah, I know there's a lot... I fixed like 60+ in this update alone)</p>
                    <p><b>Unfortunately, today I'm here to ask for help.</b></p>
                    <p>I've dedicated hundreds of hours over many years to developing multiple different foundry systems such as NewEdo, Tales from Myriad, and PTA3.</p>
                    <p>Trying and get more time to work on these projects and amke a career from my passion, I made a Patreon account like many developers do.</p>
                    <p>Shortly after opening the page a common scam on Patreon happened to me. Scammers with stolen credit cards used my account to make payments, then get refunds to collect the money.</p>
                    <p>My accounts authenticity came into question, since then I've been trying to get reinstated to no avail.</p>
                    <p>I didn't ever want to have to ask this of the community, but now it's gotten to the point where my account will go from deactivated to deleted if I can't prove my legitimacy.</p>
                    <p>I'm not a very social person and with no social media backing, so unfortunately my last chance is to ask the community to help tell Patreon that I'm a real person and not a scammer.</p>
                    <p>I'm <b>NOT</b> asking for money, but if you have the time and like what I do, please <b>email Patreon</b> and tell them my page <b>"Ásta's Armoury"</b> is legitimate, I'm just bad at marketing. :< </p>
                    <b><a href="https://support.patreon.com/hc/en-us/requests/new">Patreon Support Email</a></b>
                    <p>Again, I'm so sorry to be asking this, I wish beyond anything else that I didn't have to, and I appreciate all of your support!</p>
                    <p>Happy gaming! - &#0193;sta</p>
                </div>
            `,
            submit: (result, dialog) => {
                if (result == "ban") game.user.setFlag(game.system.id, 'ban_support', true);
            }
        }).render(true)
    })
}