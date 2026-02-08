import PtaActor from "../../documents/actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";

/**
 * Application to manage
 */
export default class TrainerBrowser extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: [],
        window: {
            title: PTA.windowTitle.trainerBrowser,
            resizeable: true,
            minimizeable: true,
        },
        position: {
            width: 600,
            height: 600
        },
        actions: {

        }
    }

    static PARTS = {
        main: { template: PTA.templates.app.trainerBrowser }
    }

    async _prepareContext() {
        const context = {};

        context.actors = [...game.actors.contents];

        console.log("Application context", context);
        return context;
    }
}