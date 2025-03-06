export default function registerSystemSettings() {
    const options = {
        multiVitamins: {
            name: "PTA.Settings.MultiVitamins", // settings displayed name
            hint: "",// settings displayed description / instructions
            scope: "world",// where the setting is stored, for everyone or for just a user
            config: true, // does this setting appear in the settings menu
            type: Boolean, // what type of data is this setting
            default: false,// what does this setting start as
            onChange: () => {// callback for when the setting is changed in any way 

            }

        },
        neutralNatures: {
            name: "PTA.Settings.NeutralNatures.label",
            hint: "PTA.Settings.NeutralNatures.hint",// settings displayed description / instructions
            scope: "world",// where the setting is stored, for everyone or for just a user
            config: true, // does this setting appear in the settings menu
            type: Boolean, // what type of data is this setting
            default: false,// what does this setting start as
            onChange: () => {// callback for when the setting is changed in any way 

            }
        },
        abilityEv: {// Pokemon spawn in with a random assignment of a few extra stat points equal to this setting
            name: "PTA.Settings.AbilityEv.label",
            hint: "PTA.Settings.AbilityEv.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 0,
            onChange: () => {}
        },
        shinyRate: {
            name: "PTA.Settings.ShinyRate.label",
            hint: "PTA.Settings.ShinyRate.hint",
            scope: "world",
            config: true,
            type: Number,
            default: 4096,
            onChange: () => {}
        }
    }

    for (const [key, value] of Object.entries(options)) {
        game.settings.register(game.system.id, key, value);
    }
}