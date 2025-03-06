globalThis.pta = {
    id: 'pta3',
    paths: {
        template: 'systems/pta3/templates'
    }
}

import PtaActor from './documents/actor.mjs';
import PtaItem from './documents/item.mjs';
// Import sheet classes.
import { ptaItemSheet } from './sheets/item-sheet.mjs';
import applications from "./applications/_module.mjs";
// Import helper/utility classes and constants.
import PtaUtils from './helpers/utils.mjs'
import { PTA } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
import registerPtaHandlebars from './helpers/handlebars.mjs';
import registerSystemSettings from './helpers/settings.mjs';
import registerHooks from './helpers/hooks.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    pta.utils = Object.assign(PtaUtils, foundry.utils);
    pta.data = models;

    PTA.loadPokedex();
    pta.config = PTA;
    CONFIG.PTA = PTA;

    CONFIG.statusEffects = PTA.statusEffects;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '1d20 + @abilities.dex.mod + (1d100 / 10)',
        decimals: 2,
    };

    // Active Effects are never copied to the Actor,
    // but will still apply to the Actor from within the Item
    // if the transfer property on the Active Effect is true.
    CONFIG.ActiveEffect.legacyTransferral = false;

    // Define custom Document and DataModel classes
    CONFIG.Actor.documentClass = PtaActor;
    CONFIG.Item.documentClass = PtaItem;
    CONFIG.Actor.dataModels = models.ActorConfig;
    CONFIG.Item.dataModels = models.ItemConfig;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Items.unregisterSheet('core', ItemSheet);

    for (const sheet of applications.sheets.actor.config) {
        if (!sheet.application) continue;
        Actors.registerSheet('pta3', sheet.application, sheet.options);
    }

    for (const sheet of applications.sheets.item.config) {
        if (!sheet.application) continue;
        Items.registerSheet('pta3', sheet.application, sheet.options);
    }

    /* -------------------------------------------- */
    /*  Handlebars Helpers                          */
    /* -------------------------------------------- */
    registerPtaHandlebars();

    /* -------------------------------------------- */
    /*  system settings                             */
    /* -------------------------------------------- */
    registerSystemSettings();

    /* -------------------------------------------- */
    /*  system hooks                                */
    /* -------------------------------------------- */
    registerHooks();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once('ready', function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== 'Item') return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn(
            'You can only create macro buttons for owned Items'
        );
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.pta3.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(
        (m) => m.name === item.name && m.command === command
    );
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: 'script',
            img: item.img,
            command: command,
            flags: { 'pta3.itemMacro': true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid,
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then((item) => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(
                `Could not find item ${itemName}. You may need to delete and recreate this macro.`
            );
        }

        // Trigger the item roll
        item.roll();
    });
}
