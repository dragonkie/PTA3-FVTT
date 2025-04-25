import { PTA } from "./config.mjs";

function registerTemplates() {
    const path = `systems/pta3/templates`;
    const partials = [
        `shared/tabs-nav`,
        `shared/tabs-content`,
        // actor partials
        `actor/parts/list-item`,
        `actor/parts/trainer-pc-cards`,
        `actor/parts/trainer-pc-grid`,
        `actor/parts/trainer-pc-list`,
        `actor/parts/trainer-pokemon-box`,
        `actor/parts/trainer-pokemon-team`,
    ];

    const paths = {};
    for (let p of partials) {
        p = path + '/' + p + '.hbs';
        paths[p.replace(".hbs", ".html")] = p;
        paths[`pta.${p.split("/").pop().replace(".hbs", "")}`] = p;
    }

    return loadTemplates(paths);
};

function registerHelpers() {
    const helpers = [
        //=================================================================================================
        //  Data Management
        //=================================================================================================
        { tag: 'JSON', fn: (str) => JSON.parse(str) },
        //=======================================================================
        //  Strings and Text
        //=======================================================================
        { tag: 'toLowerCase', fn: (str) => str.toLowerCase() },
        { tag: 'toTitleCase', fn: (str) => str.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()) },
        //=======================================================================
        //  Math                              
        //=======================================================================
        { tag: 'addition', fn: (a, b) => a + b },
        { tag: 'ceil', fn: (a) => Math.ceil(a) },
        { tag: 'divide', fn: (a, b) => a / b },
        { tag: 'floor', fn: (a) => Math.floor(a) },
        { tag: 'max', fn: (...num) => Math.max(...num) },
        { tag: 'min', fn: (...num) => Math.min(...num) },
        { tag: 'multiply', fn: (a, b) => a * b },
        { tag: 'percent', fn: (a, b) => a / b * 100 },
        { tag: 'round', fn: (a) => Math.ceil(a) },
        { tag: 'subtraction', fn: (a, b) => a - b },
        //=================================================================================================
        //  Settings
        //=================================================================================================
        { tag: 'isGM', fn: () => game.user.isGM },
        { tag: 'gameSetting', fn: (scope, id) => game.settings.get(scope, id) },
        { tag: 'ptaSetting', fn: (id) => game.settings.get(game.system.id, id) },
        //=================================================================================================
        //  Data Fields                              
        //=================================================================================================
        { tag: 'getField', fn: (schema, path) => schema.getField(path) },
        {
            tag: 'toFieldGroup',
            fn: (schema, path, options) => {
                let field = schema.getField(path);
                const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
                const groupConfig = {
                    label, hint, rootId, stacked, widget, localize: true, units,
                    classes: typeof classes === "string" ? classes.split(" ") : []
                }
                const group = field.toFormGroup(groupConfig, inputConfig);
                return new Handlebars.SafeString(group.outerHTML);
            }
        },
        {
            tag: 'toFieldInput',
            fn: (schema, path, options) => {
                let field = schema.getField(path);
                const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
                const groupConfig = {
                    label, hint, rootId, stacked, widget, localize: true, units,
                    classes: typeof classes === "string" ? classes.split(" ") : []
                }
                const group = field.toInput(inputConfig);
                return new Handlebars.SafeString(group.outerHTML);
            }
        },
        //=================================================================================================
        // Data Validation
        //=================================================================================================
        { tag: 'objectIsEmpty', fn: (obj) => Object.keys(obj).length <= 0 },
        {
            tag: 'listItem',
            fn: (item) => {
                let html = ``;
                return new Handlebars.SafeString(html);
            }
        },
        //=================================================================================================
        // Elements
        //=================================================================================================
        {
            tag: 'pokemonTypeSelector',
            fn: (none = false) => {
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
            }
        },
        {// wraps a set of elements in a collapsible wrapper
            tag: 'collapsible',
            fn: (options) => {
                let config = {
                    label: "MISSING_LABEL",
                    collapsed: false,
                    cssClass: ''
                }

                Object.assign(config, options.hash);

                return new Handlebars.SafeString(`
                    <div class="collapsible ${config.collapsed ? 'collapsed' : ''} ${config.cssClass}">
                        <div class="flexrow" data-action="collapse">
                            <a style="flex: 0;"><i class="fas fa-caret-down"></i></a>
                            <label>${config.label}</label>
                        </div>
                        <div class="collapsible-content">
                            <div class="wrapper">
                                ${options.fn(this)}
                            </div>
                        </div>
                    </div>`
                );
            }
        },
        //=================================================================================================
        // Iterators
        //=================================================================================================
        {
            tag: 'repeat',
            fn: (context, options) => {
                for (var i = 0, ret = ''; i < context; i++) ret = ret + options.fn(context[i]);
                return ret;
            }
        }
    ];
    for (const h of helpers) Handlebars.registerHelper(h.tag, h.fn);
}

export default function registerPtaHandlebars() {
    console.log('registering handlebars templates');
    registerTemplates();
    console.log('registering handlebars helpers');
    registerHelpers();
}