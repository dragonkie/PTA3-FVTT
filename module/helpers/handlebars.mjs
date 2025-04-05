function registerTemplates() {
    const path = `systems/pta3/templates`;
    const partials = [
        `${path}/shared/tabs-nav.hbs`,
        `${path}/shared/tabs-content.hbs`,

        `${path}/actor/parts/list-item.hbs`
    ];

    const paths = {};
    for (const path of partials) {
        paths[path.replace(".hbs", ".html")] = path;
        paths[`pta.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }

    return loadTemplates(paths);
};

function registerHelpers() {
    Handlebars.registerHelper('toLowerCase', (str) => str.toLowerCase());
    Handlebars.registerHelper('toTitleCase', (str) => str.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()));
    Handlebars.registerHelper('isGM', () => game.user.isGM);
    /* -------------------------------------------- */
    /*  FIELD HELPERS                               */
    /* -------------------------------------------- */
    Handlebars.registerHelper('getField', (schema, path) => schema.getField(path));
    Handlebars.registerHelper('toFieldGroup', (schema, path, options) => {
        let field = schema.getField(path);
        const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
        const groupConfig = {
            label, hint, rootId, stacked, widget, localize: true, units,
            classes: typeof classes === "string" ? classes.split(" ") : []
        };
        console.log(path, inputConfig);
        const group = field.toFormGroup(groupConfig, inputConfig);
        return new Handlebars.SafeString(group.outerHTML);
    });
    Handlebars.registerHelper('toFieldInput', (schema, path, options) => {
        let field = schema.getField(path);
        const { classes, label, hint, rootId, stacked, units, widget, ...inputConfig } = options.hash;
        const groupConfig = {
            label, hint, rootId, stacked, widget, localize: true, units,
            classes: typeof classes === "string" ? classes.split(" ") : []
        };
        console.log(path, inputConfig);
        const group = field.toInput(inputConfig);
        return new Handlebars.SafeString(group.outerHTML);
    })
    Handlebars.registerHelper('objectIsEmpty', (obj) => Object.keys(obj).length <= 0);
    Handlebars.registerHelper('listItem', (item) => {
        let html = `
        
        `;
        return new Handlebars.SafeString(html);
    });
    /* -------------------------------------------- */
    /*  Math helpers                                */
    /* -------------------------------------------- */
    Handlebars.registerHelper('addition', (a, b) => a + b);
    Handlebars.registerHelper('ceil', (a) => Math.ceil(a));
    Handlebars.registerHelper('divide', (a, b) => a / b);
    Handlebars.registerHelper('floor', (a) => Math.floor(a));
    Handlebars.registerHelper('max', (...num) => Math.max(...num));
    Handlebars.registerHelper('min', (...num) => Math.min(...num));
    Handlebars.registerHelper('multiply', (a, b) => a * b);
    Handlebars.registerHelper('percent', (a, b) => a / b * 100);
    Handlebars.registerHelper('round', (a) => Math.ceil(a));
    Handlebars.registerHelper('subtraction', (a, b) => a - b);

    /* -------------------------------------------- */
    /*  Iterators                                   */
    /* -------------------------------------------- */
    Handlebars.registerHelper('repeat', (context, options) => {
        for (var i = 0, ret = ''; i < context; i++) ret = ret + options.fn(context[i]);
        return ret;
    });
}

export default function registerPtaHandlebars() {
    console.log('registering templates');
    registerTemplates();
    console.log('registering helpers');
    registerHelpers();
}