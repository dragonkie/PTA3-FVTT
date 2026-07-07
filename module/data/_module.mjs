// Export Actors
import ActorData from "./actor.mjs";
import CharacterData from "./actor/character.mjs";
import NpcData from "./actor/npc.mjs";
import PokemonData from "./actor/pokemon.mjs";

// Export Items
import ItemData from "./item.mjs";
import CareerData from "./item/career.mjs";
import ConsumableData from "./item/consumable.mjs";
import EquipmentData from "./item/equipment.mjs";
import FeatureData from "./item/feature.mjs";
import MoveData from "./item/move.mjs";
import PokeballData from "./item/pokeball.mjs";

export default {
    Actor: {
        character: CharacterData,
        npc: NpcData,
        pokemon: PokemonData
    },
    Item: {
        pokeball: PokeballData,
        consumable: ConsumableData,
        feature: FeatureData,
        move: MoveData,
        equipment: EquipmentData,
        career: CareerData,
    }
}