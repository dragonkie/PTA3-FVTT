import { PTA } from "../../../helpers/config.mjs";
import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaItemSheet from "../item.mjs";

export default class PtaCareerSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        actions: {
            edit: this._onOpenfeature,
            delete: this._onDelete,
            feature: this._onCreateFeature
        }
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: `${this.TEMPLATE_PATH}/item/settings/career.hbs` };
        return p;
    }

    static async _onCreateFeature(event, target) {
        const id = foundry.utils.randomID();
        await this.document.update({
            system: {
                features: {
                    [id]: {
                        name: "New Feature",
                        img: "icons/svg/heal.svg",
                        level: 1,
                        description: "",
                        choices: 0,
                        type: "item",
                        items: {}
                    }
                }
            }
        });

        return this._onEditFeature(id);
    }

    static _onOpenfeature(event, target) {
        const featureId = target.closest('[data-feature-id]').dataset.featureId;
        return this._onEditFeature(featureId);
    }

    async _onEditFeature(index) {
        const context = {
            name: this.document.system.features[index].name,
            level: this.document.system.features[index].level,
            description: this.document.system.features[index].description,
            document: this.document,
        };
        const content = await utils.renderTemplate(PTA.templates.app.featureEditor, context);
        const document = this.document;

        const form = await new Promise(async (resolve, reject) => {
            const dialog = await new PtaDialog({
                position: { width: 400, height: 'auto' },
                classes: ['pta'],
                id: `Item.Career.${this.document.uuid}.feature.${index}`,
                content,
                buttons: [{
                    label: "Submit",
                    action: "submit"
                }],
                submit: action => {
                    const data = {};
                    for (const ele of dialog.element.querySelectorAll('input')) data[ele.name] = ele.value;
                    data.description = dialog.element.querySelector('.editor-content.ProseMirror').innerHTML;
                    document.update({ [`system.features.${index}`]: data });
                    resolve(dialog);
                }
            }).render(true);
        });

        await this.render(false);
        //return new PtaFeatureEditor().render(doc, index, true);
    }

    static async _onDelete(event, target) {
        const featureId = target.closest('[data-feature-id]').dataset.featureId;
        console.log('deleting', this.document.system.features[featureId]);
        await this.document.update({
            system: {
                features: {
                    [featureId]: _del // reference to instance of foundry.data.operators.ForcedDeletion
                }
            }
        }, { applyOperators: true });
    }
}