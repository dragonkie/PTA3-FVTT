import pokeapi from "../../helpers/pokeapi.mjs";
import ActorData from "../actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, ObjectField
} = foundry.data.fields;

export default class PokemonData extends ActorData {
  static type = 'pokemon';
  static defineSchema() {

    const isRequired = { required: true, nullable: false };
    const schema = super.defineSchema();

    schema.trainer = new StringField({ ...isRequired, initial: '', blank: true });

    // List of user defined tags, used for sorting and searching through pc
    schema.tags = new ArrayField(new StringField({
      blank: false,
      nullable: false,
      initial: "",
    }), { initial: [] })

    schema.nature = new StringField({
      initial: utils.randomNature(),
      ...isRequired,
      blank: false,
      label: PTA.generic.nature,
      choices: () => {
        let data = {};
        if (game.settings.get(game.system.id, 'neutralNatures')) {
          data = { ...PTA.natures };
        } else data = { ...PTA.naturesNoNeutral }

        for (const a in data) data[a] = utils.localize(data[a]);
        return data;
      }
    });

    schema.species = new StringField({ initial: "", label: PTA.generic.species })

    schema.size = new StringField({
      ...isRequired,
      initial: 'medium',
      blank: false,
      label: PTA.generic.size,
      choices: () => {
        let data = { ...PTA.pokemonSizes };
        for (const a in data) data[a] = utils.localize(data[a]);
        return data;
      }
    });

    schema.weight = new StringField({
      ...isRequired,
      initial: 'medium',
      blank: false,
      label: PTA.generic.weight,
      choices: () => {
        let data = { ...PTA.pokemonWeights };
        for (const a in data) data[a] = utils.localize(data[a]);
        return data;
      }
    });

    // some pokemon split evoloutions based on different factors
    schema.evoloution = new SchemaField({

    });

    schema.gender = new StringField({ ...isRequired, initial: 'male', label: PTA.generic.gender });
    schema.shiny = new BooleanField({ ...isRequired, initial: false, label: PTA.generic.shiny });
    schema.contest = new SchemaField({

    });

    // Holds the base API ref that this pokemon is generated from
    schema.api_ref = new ObjectField({ initial: {} });

    return schema
  }

  getTypes() {
    return [this.types.primary, this.types.secondary];
  }

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    // When updating source material we need to update the created document
    // we can update data models directly using _preUpdate and _onUpdate though
    this.parent.updateSource({
      system: {
        nature: utils.randomNature(),
        gender: (Math.floor(Math.random() * 2) > 0) ? "Male" : "Female",
        shiny: (Math.floor(Math.random() * game.settings.get(game.system.id, 'shinyRate')) <= 1) ? true : false
      }
    });

    return allowed;
  }

  prepareBaseData() {
    super.prepareBaseData();
  }

  // Changes made to the sheet here are temporary and do not persist
  prepareDerivedData() {
    // add bonus stat changes from nature, apply this before the super so the MOD is calculated properly
    for (const [key, value] of Object.entries(PTA.stats)) {
      // if the bonuses match, that means the key var is the stat we want to bump
      if (PTA.natureIncreases[this.nature] == value) this.stats[key].total += 1;
      if (PTA.natureDecreases[this.nature] == value) this.stats[key].total -= 1;
    }

    super.prepareDerivedData();
  }
}