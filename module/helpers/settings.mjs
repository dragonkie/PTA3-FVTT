export default function registerSystemSettings() {
    const options = {
        multiVitamins: {
            name: "PTA.Settings.MultiVitamins", // settings displayed name
            hint: "",// settings displayed description / instructions
            scope: "world",// where the setting is stored, for everyone or for just a user
            config: true, // does this setting appear in the settings menu
            type: Boolean, // what type of data is this setting
            default: false,// what does this setting start as
            onChange: () => { }
        },
        partyLimit: {// how many pokemon can be equipped by a trainer
            name: "PTA.Settings.PartyLimit.label", // settings displayed name
            hint: "PTA.Settings.PartyLimit.hint",// settings displayed description / instructions
            scope: "world",// where the setting is stored, for everyone or for just a user
            config: true, // does this setting appear in the settings menu
            type: Number, // what type of data is this setting
            default: 6,// what does this setting start as
            onChange: () => { }
        },
        neutralNatures: {// are neutral natures selectable and allowed?
            name: "PTA.Settings.NeutralNatures.label",
            hint: "PTA.Settings.NeutralNatures.hint",// settings displayed description / instructions
            scope: "world",// where the setting is stored, for everyone or for just a user
            config: true, // does this setting appear in the settings menu
            type: Boolean, // what type of data is this setting
            default: false,// what does this setting start as
            onChange: () => { }
        },
        statEv: {// Pokemon spawn in with a random assignment of a few extra stat points equal to this setting
            name: "PTA.Settings.AbilityEv.label",
            hint: "PTA.Settings.AbilityEv.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 0,
            onChange: () => { }
        },
        baseAc: {// additional flat value for regular play added to defence to offset higher hit chances, doesnt effect sim mode
            name: "PTA.Settings.BaseAc.label",
            hint: "PTA.Settings.BaseAc.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 0,
            onChange: () => { }
        },
        shinyRate: {// newly made pokemon can spawn as shiny, this affects that chance
            name: "PTA.Settings.ShinyRate.label",
            hint: "PTA.Settings.ShinyRate.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 4096,
            onChange: () => { }
        },
        automation: {// should automation features be enabled, such as automatic damage application
            name: "PTA.Settings.Automation.label",
            hint: "PTA.Settings.Automation.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => { }
        },
        playerImport: {// are non-GM players allowed to use importers?
            name: "PTA.Settings.PlayerImport.label",
            hint: "PTA.Settings.PlayerImport.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        healthMult: {// multiplier to a pokemons health when imported to set its base value
            name: "PTA.Settings.HealthMult.label",
            hint: "PTA.Settings.HealthMult.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 6,
        },
        palworld: {// You know what this does, and if you dont...
            name: "PTA.Settings.Palworld.label",
            hint: "PTA.Settings.Palworld.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
    }

    for (const [key, value] of Object.entries(options)) {
        game.settings.register(game.system.id, key, value);
    }
}