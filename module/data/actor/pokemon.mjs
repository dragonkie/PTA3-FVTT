import pokeapi from "../../helpers/pokeapi.mjs";
import ActorData from "../actor.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, ObjectField
} = foundry.data.fields;

export default class PokemonData extends ActorData {

  static defineSchema() {

    const isRequired = { required: true, nullable: false };
    const schema = super.defineSchema();

    schema.types = new ArrayField(new StringField(), { ...isRequired, initial: ['normal'] });
    schema.nature = new StringField({
      initial: pta.utils.randomNature(),
      ...isRequired,
      blank: false,
      choices: () => {
        let data = {};
        if (game.settings.get(game.system.id, 'neutralNatures')) {
          data = { ...pta.config.natures };
        } else data = { ...pta.config.naturesNoNeutral }

        for (const a in data) data[a] = pta.utils.localize(data[a]);
        return data;
      }
    });

    schema.species = new StringField({ initial: "" })

    schema.size = new StringField({
      ...isRequired,
      initial: 'medium',
      blank: false,
      label: "PTA.Generic.Size",
      choices: () => {
        let data = { ...pta.config.pokemonSizes };
        for (const a in data) data[a] = pta.utils.localize(data[a]);
        return data;
      }
    })

    schema.weight = new StringField({
      ...isRequired,
      initial: 'medium',
      blank: false,
      label: "PTA.Generic.Weight",
      choices: () => {
        let data = { ...pta.config.pokemonWeights };
        for (const a in data) data[a] = pta.utils.localize(data[a]);
        return data;
      }
    })


    // some pokemon split evoloutions based on different factors
    schema.evoloution = new SchemaField({

    })

    let gender = ['male', 'female'];
    schema.gender = new StringField({ ...isRequired, initial: gender[Math.floor(Math.random() * gender.length)] });

    // list of things the pokemon can do
    schema.skills = new SchemaField({

    })

    schema.shiny = new BooleanField({ ...isRequired, initial: false });

    schema.contest = new SchemaField({

    })

    // Holds the base API ref that this pokemon is generated from
    schema.api_ref = new ObjectField({ initial: {} });

    return schema
  }

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    // When updating source material we need to update the created document
    // we can update data models directly using _preUpdate and _onUpdate though
    this.parent.updateSource({
      system: {
        nature: pta.utils.randomNature(),
        gender: (Math.floor(Math.random() * 2) > 0) ? "Male" : "Female",
        shiny: (Math.floor(Math.random() * game.settings.get('pta3', 'shinyRate')) <= 1) ? true : false
      }
    });

    return allowed;
  }

  prepareBaseData() {
    super.prepareBaseData();
  }

  // Changes made to the sheet here are temporary and do not persist
  prepareDerivedData() {
    // add bonus stat changes from nature
    for (const [key, value] of Object.entries(pta.config.abilities)) {
      // if the bonuses match, that means the key var is the stat we want to bump
      if (pta.config.natureIncreases[this.nature] === value) this.abilities[key].total += 1;
      if (pta.config.natureDecreases[this.nature] === value) this.abilities[key].total -= 1;
    }

    // Calls the stat mod check, needs to happen after all other calculations are done
    super.prepareDerivedData();


  }

  async _getApiReference() {
    let data = await pokeapi.pokemon(this.parent.name);
    if (!data) return void console.log('Failed to update');
    else console.log('data', data);
  }
}