import PtaSheetMixin from "./sheets/mixin.mjs";

import PtaActorSheet from "./sheets/actor.mjs";
import PtaCharacterSheet from "./sheets/actor/character.mjs";
import PtaPokemonSheet from "./sheets/actor/pokemon.mjs";
import PtaNpcSheet from "./sheets/actor/npc.mjs";
import PtaPokeballSheet from "./sheets/item/pokeball.mjs";
import PtaConsumableSheet from "./sheets/item/consumable.mjs";
import PtaMoveSheet from "./sheets/item/move.mjs";

import PokemonImporter from "./apps/pokemon-importer.mjs";
import ServerBrowser from "./apps/server-browser.mjs";
import MoveImporter from "./apps/move-importer.mjs";



export default {
    sheets: {
        mixin: PtaSheetMixin,
        actor: {
            PtaActorSheet,
            PtaCharacterSheet,
            PtaPokemonSheet,
            PtaNpcSheet,
            config: [
                {
                    application: PtaCharacterSheet,
                    options: {
                        label: 'TYPES.Actor.character',
                        types: ['character']
                    }
                }, {
                    application: PtaPokemonSheet,
                    options: {
                        label: 'TYPES.Actor.pokemon',
                        types: ['pokemon']
                    }
                }, {
                    application: PtaNpcSheet,
                    options: {
                        label: 'TYPES.Actor.npc',
                        types: ['npc']
                    }
                }
            ]
        },
        item: {
            config: [
                {
                    application: PtaPokeballSheet,
                    options: {
                        label: 'TYPES.Item.pokeball',
                        types: ['pokeball']
                    }
                }, {
                    application: PtaConsumableSheet,
                    options: {
                        label: 'TYPES.Item.consumable',
                        types: ['consumable']
                    }
                }, {
                    application: null,
                    options: {
                        label: 'TYPES.Item.class',
                        types: ['class']
                    }
                }, {
                    application: null,
                    options: {
                        label: 'TYPES.Item.subclass',
                        types: ['subclass']
                    }
                }, {
                    application: PtaMoveSheet,
                    options: {
                        label: 'TYPES.Item.move',
                        types: ['move']
                    }
                }, {
                    application: null,
                    options: {
                        label: 'TYPES.Item.feature',
                        types: ['feature']
                    }
                }, {
                    application: null,
                    options: {
                        label: 'TYPES.Item.equipment',
                        types: ['equipment']
                    }
                }
            ]

        }
    },
    apps: {
        PokemonImporter,
        MoveImporter,
        ServerBrowser
    }
}