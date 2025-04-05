export default class PtaDialog extends foundry.applications.api.DialogV2 {
    static async create(options) {
        return new Promise(async (resolve, reject) => {
            const app = await new PtaDialog({
                window: { title: "PTA.Dialog.FileLocation" },
                content: `
                    <input type="text" class="species-url" placeholder="species">
                `,
                buttons: [{
                    label: "Confirm",
                    action: "confirm",
                }, {
                    label: "Cancel",
                    action: "cancel",
                }],
                close: () => { },
                actions: {
                    confirm: () => { resolve('local'); app.close() },
                    cancel: () => { resolve('online'); app.close() },
                }
            }).render(true);
        })
    }
}