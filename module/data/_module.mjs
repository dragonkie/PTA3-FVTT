// Export Actors
import ActorData from "./actor.mjs";
import CharacterData from "./actor/character.mjs";
import NpcData from "./actor/npc.mjs";
import PokemonData from "./actor/pokemon.mjs";

// Export Items
import ItemData from "./item.mjs";
import ConsumableData from "./item/consumable.mjs";
import EquipmentData from "./item/equipment.mjs";
import FeatureData from "./item/feature.mjs";
import MoveData from "./item/move.mjs";
import PokeballData from "./item/pokeball.mjs";

export const ActorModels = {
    ActorData,
    CharacterData,
    NpcData,
    PokemonData,
}

export const ActorConfig = {
    character: CharacterData,
    npc: NpcData,
    pokemon: PokemonData
}

export const ItemModels = {
    ItemData,
    FeatureData,
    ConsumableData,
    MoveData,
    EquipmentData,
    PokeballData
}

export const ItemConfig = {
    pokeball: PokeballData,
    consumable: ConsumableData,
    feature: FeatureData,
    move: MoveData,
    equipment: EquipmentData
}