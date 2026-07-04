import { PTA } from "./config.mjs";
import utils from "./utils.mjs";

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

//=========================================================================================================
//> Helper functions
//=========================================================================================================
/**
 * @param {SystemDataModel} system - the system data model containg a valid schema
 * @param {String|Object} path - dot delimited path for the field
 * @param {Object} options 
 * @param {String[]} options.ids - Id / array of field ids for dynamic fields such as arrays or TypedObjectFields
 * @returns 
 */
function getSystemField(system, path, options) {
    const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;

    if (typeof path == "object") path = path.string; // account for concat handlebars helper
    if (!system.schema) throw new Error("Missing system schema to reference");
    var field = system?.schema.getField(path);

    // if we didn't find the field, check for dynamic elements, such as TypedObjectField | ArrayField
    if (!field) {
        console.log("Path", { path })
        const path_pieces = path.split(".");
        var ref = system.schema;
        for (const piece of path_pieces) {
            // if theres a container reference element, this part of the path can be discarded
            if (Object.hasOwn(ref, "element")) {
                ref = ref.element;
            } else ref = ref.getField(piece);
        }
        field = ref;

        // if a specific name wasn't provided, set it to the working path
        if (!inputConfig.name) inputConfig.name = path;
    }

    if (!field) throw new Error("Couldn't find specified path on included schema, is it correct?");

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
    return { field, config: { group: groupConfig, input: inputConfig } }
}

//=========================================================================================================
//> Register new handlebars helpers
//=========================================================================================================
function registerHelpers() {
    const helpers = {
        //=================================================================================================
        //>  Data Management
        //=================================================================================================
        JSON: (str) => JSON.parse(str),
        isArray: (arr) => Array.isArray(arr),
        arrayLength: (arr) => {
            if (Array.isArray(arr)) return arr.length;
            else throw new Error("Can't get length of non array value");
        },
        objectIsEmpty: (obj) => Object.keys(obj).length <= 0,
        objectValue: (obj, key) => obj[key],
        systemConfig: () => PTA,
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
            const data = getSystemField(system, path, options);
            console.log(data)
            const group = data.field.toInput(data.config.input);
            return new Handlebars.SafeString(group.outerHTML);
        },
        systemFieldGroup(system, path, options) {
            const data = getSystemField(system, path, options);
            const group = data.field.toFormGroup(data.config.group, data.config.input);
            return new Handlebars.SafeString(group.outerHTML);
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
                    for (const [k, v] of Object.entries(PTA.pokemonTypes)) opt[k] = utils.localize(v);
                    if (none) opt.none = utils.localize(PTA.generic.none);
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