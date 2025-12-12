import PtaSheetMixin from "./mixin.mjs";

export default class PtaItemSheet extends PtaSheetMixin(foundry.applications.sheets.ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["item"],
        position: { height: 'auto', width: 550 },
        actions: {
            
        }
    };

    static get PARTS() {
        return {
            body: { template: `${this.TEMPLATE_PATH}/item/body.hbs` },
            description: { template: `${this.TEMPLATE_PATH}/item/description.hbs` }
        }
    }

    static TABS = {
        description: { id: "description", group: "primary", label: "PTA.Tab.Description" },
        settings: { id: "settings", group: "primary", label: "PTA.Tab.Settings" },
    };

    tabGroups = {
        primary: "description"
    };

    async _prepareContext() {
        const context = await super._prepareContext();

        const enrichmentOptions = {rollData: context.rollData}
        context.description = {
            field: this.document.system.schema.getField('description'),
            value: this.document.system.description,
            enriched: await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.description, enrichmentOptions)
        }

        return context;
    }
}