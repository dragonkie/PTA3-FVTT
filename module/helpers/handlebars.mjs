import { PTA } from "./config.mjs";

function registerTemplates() {
    const path = `systems/${game.system.id}/templates`;
    const partials = [
        `shared/tabs-nav`,
        `shared/tabs-content`,
        // actor partials
        `actor/parts/actor-skills`,
        `actor/parts/list-item`,
        `actor/parts/trainer-pc-cards`,
        `actor/parts/trainer-pc-grid`,
        `actor/parts/trainer-pc-list`,
        `actor/parts/trainer-pokemon-box`,
        `actor/parts/trainer-pokemon-team`,
        `actor/parts/actor-ability-scores`,
    ];

    const paths = {};
    for (let p of partials) {
        p = path + '/' + p + '.hbs';
        paths[p.replace(".hbs", ".html")] = p;
        paths[`pta.${p.split("/").pop().replace(".hbs", "")}`] = p;
    }

    return foundry.applications.handlebars.loadTemplates(paths);
};

function registerHelpers() {
    const helpers = {
        //=================================================================================================
        //>  Data Management
        //=================================================================================================
        JSON: (str) => JSON.parse(str),
        //=======================================================================
        //>  Strings and Text
        //=======================================================================
        toLowerCase: (str) => str.toLowerCase(),
        toTitleCase: (str) => str.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()),
        selected: (val) => {
            if (val) return new Handlebars.SafeString('selected');
            return ''; 
        },
        //=======================================================================
        //>  Math                              
        //=======================================================================
        addition: (a, b) => a + b,
        ceil: (a) => Math.ceil(a),
        divide: (a, b) => a / b,
        floor: (a) => Math.floor(a),
        max: (...num) => Math.max(...num),
        min: (...num) => Math.min(...num),
        multiply: (a, b) => a * b,
        percent: (a, b) => a / b * 100,
        round: (a) => Math.ceil(a),
        subtraction: (a, b) => a - b,
        //=================================================================================================
        //>  Settings
        //=================================================================================================
        isGM: () => game.user.isGM,
        gameSetting: (scope, id) => { return game.settings.get(scope, id) },
        ptaSetting: (id) => { return game.settings.get(game.system.id, id) },
        //=================================================================================================
        //>  Data Fields                              
        //=================================================================================================
        getField(schema, path) { return schema.getField(path) },
        toFieldGroup(schema, path, options) {
            let field = schema.getField(path);
            const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
            const groupConfig = {
                label, hint, rootId, stacked, widget, localize: true, units,
                classes: typeof classes === "string" ? classes.split(" ") : []
            }
            const group = field.toFormGroup(groupConfig, inputConfig);
            return new Handlebars.SafeString(group.outerHTML);
        },
        toFieldInput(schema, path, options) {
            let field = schema.getField(path);
            const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
            const groupConfig = {
                label, hint, rootId, stacked, widget, localize: true, units,
                classes: typeof classes === "string" ? classes.split(" ") : []
            }
            const group = field.toInput(inputConfig);
            return new Handlebars.SafeString(group.outerHTML);
        },
        systemFieldInput(system, path, options) {
            // auto fills in the details to the input using the provided path from the system data
            // the system needs to define a schema path as well
            const field = system?.schema.getField(path);
            if (!system.schema) throw new Error("Missing system schema to reference");
            if (!field) throw new Error("Couldn't find field path for system schema, was it included?" + `${path}`);

            const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
            const input = path.split(".");
            var value = system;
            input.forEach(p => {
                value = value[p];
            });

            inputConfig.value = value;

            const group = field.toInput(inputConfig);
            return new Handlebars.SafeString(group.outerHTML);
        },
        systemFieldGroup(system, path, options) {
            // auto fills in the details to the input using the provided path from the system data
            // the system needs to define a schema path as well
            const field = system?.schema.getField(path);
            if (!system.schema) throw new Error("Missing system schema to reference");
            if (!field) throw new Error("Couldn't find field path for system schema, was it included?" + `${path}`);

            const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
            const groupConfig = {
                label, hint, rootId, stacked, widget, localize: true, units,
                classes: typeof classes === "string" ? classes.split(" ") : []
            };

            const input = path.split(".");
            var value = system;
            input.forEach(p => {
                value = value[p];
            });

            inputConfig.value = value;

            const group = field.toFormGroup(groupConfig, inputConfig);
            return new Handlebars.SafeString(group.outerHTML);
        },
        //=================================================================================================
        //> Data Validation
        //=================================================================================================
        arrayLength: (arr) => {
            if (Array.isArray(arr)) return arr.length;
            else throw new Error("Can't get length of non array value");
        },
        objectIsEmpty: (obj) => Object.keys(obj).length <= 0,
        listItem: (item) => {
            let html = ``;
            return new Handlebars.SafeString(html);
        },
        //=================================================================================================
        //> Elements
        //=================================================================================================
        pokemonTypeSelector(none = false) {
            const field = new foundry.data.fields.StringField({
                label: PTA.generic.type,
                name: "",
                choices: () => {
                    let opt = {};
                    for (const [k, v] of Object.entries(PTA.pokemonTypes)) opt[k] = pta.utils.localize(v);
                    if (none) opt.none = pta.utils.localize(PTA.generic.none);
                    return opt;
                }
            });
            //if (group) return new Handlebars.SafeString(field.toFormGroup());
            return new Handlebars.SafeString(field.toInput().outerHTML);
        },
        //=================================================================================================
        //> Iterators
        //=================================================================================================
        repeat(context, options) {
            for (var i = 0, ret = ''; i < context; i++) ret = ret + options.fn(context[i]);
            return ret;

        }
    };
    for (const [k, v] of Object.entries(helpers)) Handlebars.registerHelper(k, v);
}

export default function registerPtaHandlebars() {
    console.log('registering handlebars templates');
    registerTemplates();
    console.log('registering handlebars helpers');
    registerHelpers();
}