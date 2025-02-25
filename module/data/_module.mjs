import { ptaNPC } from "./_module.mjs";
import { ptaCharacter } from "./_module.mjs";

// Export Actors
export {default as ptaActorBase} from "./base-actor.mjs";
export {default as ptaCharacter} from "./actor/character.mjs";
export {default as ptaNPC} from "./actor/npc.mjs";

// Export Items
export {default as ptaItemBase} from "./base-item.mjs";
export {default as ptaItem} from "./item/item.mjs";
export {default as ptaFeature} from "./item/feature.mjs";

const PtaItemModels = {

}

const PtaActorModels = {

}

export const PtaModels = {
    Actor: {
        character: ptaCharacter,
        npc: ptaNPC,
        
    }
};