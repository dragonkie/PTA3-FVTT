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
        neutralNatures: {
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
        shinyRate: {
            name: "PTA.Settings.ShinyRate.label",
            hint: "PTA.Settings.ShinyRate.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 4096,
            onChange: () => { }
        },
        automation: {
            name: "PTA.Settings.Automation.label",
            hint: "PTA.Settings.Automation.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => { }
        },
        playerImport: {
            name: "PTA.Settings.PlayerImport.label",
            hint: "PTA.Settings.PlayerImport.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        healthMult: {
            name: "PTA.Settings.HealthMult.label",
            hint: "PTA.Settings.HealthMult.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 6,
        },
        pokesim: {// Automation is always true with this rule, brings the tabletop closer to the actual pokemon games
            name: "PTA.Settings.Pokesim.label",
            hint: "PTA.Settings.Pokesim.hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        simMinAccuracy: {
            name: "PTA.Settings.SimMinEvasion.label",
            hint: "PTA.Settings.SimMinEvasion.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 33,
        },
        simMaxAccuracy: {
            name: "PTA.Settings.SimMaxEvasion.label",
            hint: "PTA.Settings.SimMaxEvasion.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 95,
        },
        palworld: {
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